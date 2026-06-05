// Handles Stripe webhook events and updates client payment status in Supabase.
// Stripe sends events here after each payment action.
//
// Required Netlify env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   SUPABASE_SERVICE_ROLE_KEY
// Optional (for email notifications): RESEND_API_KEY, MAIL_FROM, OWNER_EMAIL

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const DEFAULT_OWNER_EMAIL = "rainn.causer1@gmail.com";
const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return { statusCode: 500, body: "Stripe env vars not configured" };
  }

  const stripe = Stripe(stripeKey);
  const sig = event.headers["stripe-signature"];

  // Stripe requires the raw body string for signature verification
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Supabase service-role client (bypasses RLS for server-side writes)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const updateByClientId = async (client_id, updates) => {
    if (!client_id) return;
    const { error } = await supabase.from("clients").update(updates).eq("id", client_id);
    if (error) console.error("Supabase update error (by client_id):", error.message);
  };

  const updateBySubscriptionId = async (subscription_id, updates) => {
    if (!subscription_id) return;
    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("stripe_subscription_id", subscription_id)
      .maybeSingle();
    if (error) { console.error("Supabase lookup error:", error.message); return; }
    if (data?.id) {
      const { error: updateErr } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", data.id);
      if (updateErr) console.error("Supabase update error (by sub_id):", updateErr.message);
    }
  };

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      const { client_id, setup_amount, monthly_amount } = session.metadata || {};
      if (client_id) {
        const updates = {
          payment_status: "active",
          stripe_customer_id: session.customer || null,
          stripe_subscription_id: session.subscription || null,
        };
        // Persist the quoted amounts in case admin didn't save them before sending the link
        if (setup_amount && Number.isFinite(Number(setup_amount))) {
          updates.setup_fee = Number(setup_amount);
        }
        if (monthly_amount && Number.isFinite(Number(monthly_amount))) {
          updates.monthly_recurring = Number(monthly_amount);
        }
        await updateByClientId(client_id, updates);

        // After the update, fetch the full client record and fire welcome +
        // owner notification emails. Failures here don't break the webhook.
        try {
          const { data: client } = await supabase
            .from("clients")
            .select("*")
            .eq("id", client_id)
            .maybeSingle();
          if (client) {
            await Promise.all([
              sendWelcomeEmail(client),
              sendOwnerNotification(client, setup_amount, monthly_amount),
            ]);
          }
        } catch (e) {
          console.error("Post-payment email error:", e.message);
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = stripeEvent.data.object;
      if (invoice.subscription) {
        await updateBySubscriptionId(invoice.subscription, { payment_status: "active" });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = stripeEvent.data.object;
      if (invoice.subscription) {
        await updateBySubscriptionId(invoice.subscription, { payment_status: "past_due" });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = stripeEvent.data.object;
      if (!sub.id) break;
      let newStatus = null;
      if (sub.status === "active" && !sub.pause_collection) newStatus = "active";
      else if (sub.status === "active" && sub.pause_collection) newStatus = "paused";
      else if (sub.status === "past_due") newStatus = "past_due";
      else if (sub.cancel_at_period_end && sub.status === "active") newStatus = "canceling";
      if (newStatus) {
        await updateBySubscriptionId(sub.id, { payment_status: newStatus });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = stripeEvent.data.object;
      if (!sub.id) break;
      // Look up the client first so we can clean up Retell resources
      const { data: clientForCleanup } = await supabase
        .from("clients")
        .select("id, retell_agent_id, retell_phone_number")
        .eq("stripe_subscription_id", sub.id)
        .maybeSingle();

      // Update status in Supabase
      await updateBySubscriptionId(sub.id, { payment_status: "canceled" });

      // Release Retell phone + agent + LLM (best-effort, never block the webhook response)
      if (clientForCleanup?.retell_agent_id || clientForCleanup?.retell_phone_number) {
        deprovisionRetell({
          retell_agent_id: clientForCleanup.retell_agent_id,
          retell_phone_number: clientForCleanup.retell_phone_number,
          apiKey: process.env.RETELL_API_KEY,
        }).catch((e) => console.error("Retell cleanup error:", e.message));
      }
      break;
    }

    default:
      // Ignore other event types
      break;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received: true }),
  };
};

// ---------------------------------------------------------------------------
// Email helpers (Resend). All no-op cleanly if RESEND_API_KEY is unset.
// ---------------------------------------------------------------------------

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  if (!to) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend send error:", res.status, errText);
    }
  } catch (e) {
    console.error("Resend network error:", e.message);
  }
}

function sendWelcomeEmail(client) {
  if (!client.owner_email) return Promise.resolve();

  const name = client.owner_name?.split(" ")[0] || "there";
  const businessName = client.business_name || "your business";
  const phone = client.retell_phone_number;

  const phoneBlock = phone
    ? `
        <p style="margin: 24px 0; padding: 20px; background: #f8f7f3; border-left: 3px solid #15325a; border-radius: 4px;">
          <strong style="font-size: 13px; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase;">Your AI phone number</strong><br>
          <span style="font-size: 26px; font-weight: 600; color: #15325a; font-family: -apple-system, system-ui, sans-serif;">${phone}</span>
        </p>
        <p>Forward your missed calls to this number using your carrier code:</p>
        <ul style="line-height: 1.7;">
          <li><strong>AT&amp;T:</strong> dial <code>**61*${phone}#</code></li>
          <li><strong>Verizon:</strong> dial <code>*71</code> then ${phone}</li>
          <li><strong>T-Mobile:</strong> dial <code>**61*${phone}#</code></li>
          <li><strong>Other carriers:</strong> dial <code>*71</code> then your AI number</li>
        </ul>
        <p>This forwards <strong>only the calls you don't answer in 2 rings</strong> — your phone still rings first. The AI is just a safety net.</p>
      `
    : `<p>We're finalizing your dedicated AI phone number. You'll get a follow-up email within 24 hours with the number and forwarding instructions.</p>`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #0b1220; line-height: 1.55;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Welcome to Koemori — and thanks for trusting us with ${escapeHtml(businessName)}.</p>
      <p>Your custom AI receptionist is built and ready to start catching calls 24/7.</p>
      ${phoneBlock}
      <p><strong>What happens next:</strong></p>
      <ol style="line-height: 1.7;">
        <li>I'll personally reach out within 24 hours to run a live test call with you.</li>
        <li>We'll fine-tune the agent based on how it sounds in real-world use.</li>
        <li>Once you're happy, dial the forwarding code above and you're live.</li>
      </ol>
      <div style="margin: 28px 0; padding: 18px 20px; background: #15325a; border-radius: 10px; text-align: center;">
        <p style="margin: 0 0 4px; color: #cfe0f5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Your portal</p>
        <p style="margin: 0 0 10px; color: #fff; font-size: 14px;">View calls, transcripts, and toggle the AI on/off</p>
        <a href="https://koemori.ai/portal/login" style="display: inline-block; background: #fff; color: #15325a; padding: 10px 22px; border-radius: 9999px; font-weight: 600; font-size: 14px; text-decoration: none;">Sign in to portal →</a>
      </div>
      <p>Any questions before then, just reply to this email.</p>
      <p>— Rainn<br>
      <span style="color: #6b7280; font-size: 13px;">Koemori · Nashville</span></p>
      <p style="margin-top:20px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; line-height:1.6;">
        By forwarding your number and going live with Koemori, you agree to our
        <a href="https://koemori.ai/terms" style="color:#15325a;">Terms of Service</a> and
        <a href="https://koemori.ai/privacy" style="color:#15325a;">Privacy Policy</a> — including
        that calls to your line are answered, recorded, and transcribed to capture your leads.
      </p>
    </div>
  `;

  return sendEmail({
    to: client.owner_email,
    subject: `Welcome to Koemori — your AI is ready`,
    html,
  });
}

function sendOwnerNotification(client, setup_amount, monthly_amount) {
  const owner = process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL;
  const setup = Number(setup_amount) || client.setup_fee || 0;
  const monthly = Number(monthly_amount) || client.monthly_recurring || 0;
  const total = setup + monthly;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #0b1220; line-height: 1.55;">
      <h2 style="margin: 0 0 16px;">💧 New client paid</h2>
      <p style="font-size: 18px;"><strong>${escapeHtml(client.business_name || "(no name)")}</strong></p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Owner:</td><td><strong>${escapeHtml(client.owner_name || "—")}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Email:</td><td>${escapeHtml(client.owner_email || "—")}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Mobile:</td><td>${escapeHtml(client.owner_phone || "—")}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Industry:</td><td>${escapeHtml(client.industry || "—")}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Setup paid:</td><td>$${setup.toLocaleString()}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Monthly:</td><td>$${monthly.toLocaleString()}/mo</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">First charge:</td><td><strong>$${total.toLocaleString()}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Agent:</td><td><code>${escapeHtml(client.retell_agent_id || "not provisioned")}</code></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">AI number:</td><td>${escapeHtml(client.retell_phone_number || "not provisioned")}</td></tr>
      </table>
      <p><strong>Your move:</strong></p>
      <ul style="line-height: 1.7;">
        <li>Schedule the live test call</li>
        <li>Confirm forwarding works on their end</li>
        <li>Confirm SMS handoff works on their phone</li>
      </ul>
      <p><a href="https://koemori.ai/admin" style="color: #15325a; font-weight: 600;">Open in admin →</a></p>
    </div>
  `;

  return sendEmail({
    to: owner,
    subject: `💧 New client paid: ${client.business_name || client.id}`,
    html,
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function deprovisionRetell({ retell_agent_id, retell_phone_number, apiKey }) {
  if (!apiKey) return;
  const h = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  if (retell_phone_number) {
    await fetch(`https://api.retellai.com/delete-phone-number/${encodeURIComponent(retell_phone_number)}`, {
      method: "DELETE", headers: h,
    }).catch(() => {});
  }

  let llm_id = null;
  if (retell_agent_id) {
    try {
      const r = await fetch(`https://api.retellai.com/get-agent/${retell_agent_id}`, { headers: h });
      if (r.ok) llm_id = (await r.json())?.response_engine?.llm_id;
    } catch {}
    await fetch(`https://api.retellai.com/delete-agent/${retell_agent_id}`, {
      method: "DELETE", headers: h,
    }).catch(() => {});
  }

  if (llm_id) {
    await fetch(`https://api.retellai.com/delete-retell-llm/${llm_id}`, {
      method: "DELETE", headers: h,
    }).catch(() => {});
  }
}
