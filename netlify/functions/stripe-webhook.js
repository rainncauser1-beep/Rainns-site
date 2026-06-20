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

        // Fire owner notification only — welcome email is sent manually
        // from the admin panel so you can test the agent first.
        try {
          const { data: client } = await supabase
            .from("clients")
            .select("*")
            .eq("id", client_id)
            .maybeSingle();
          if (client) {
            await sendOwnerNotification(client, setup_amount, monthly_amount);
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
  const phoneDigits = phone ? phone.replace(/\D/g, "") : "";
  const phoneE164 = phoneDigits.length === 11 ? `+${phoneDigits}` : phoneDigits.length === 10 ? `+1${phoneDigits}` : phone || "";
  const phonePretty = phoneDigits.length >= 10
    ? `(${phoneDigits.slice(-10,-7)}) ${phoneDigits.slice(-7,-4)}-${phoneDigits.slice(-4)}`
    : phone || "";

  const s = (txt) => `<span style="font-family:ui-monospace,Menlo,monospace;background:#f0f4f8;padding:3px 8px;border-radius:5px;font-size:15px;letter-spacing:0.02em;color:#0b1220;">${escapeHtml(txt)}</span>`;

  const setupSteps = phone ? `

    <!-- AI Number -->
    <div style="margin:28px 0;padding:24px;background:#f0f6ff;border:2px solid #15325a;border-radius:12px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#15325a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Your AI phone number</p>
      <p style="margin:0;font-size:34px;font-weight:700;color:#15325a;letter-spacing:0.04em;">${escapeHtml(phonePretty)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#4b6a8a;">Save this number — calls forward here when forwarding is on</p>
    </div>

    <!-- Step 1 -->
    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">1</div>
      <div style="flex:1;">
        <p style="margin:4px 0 6px;font-weight:700;font-size:16px;color:#0b1220;">Call your AI to hear how it sounds</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">Dial ${escapeHtml(phonePretty)} from any phone right now. The AI will answer as your business. This is just a test — no forwarding needed yet.</p>
      </div>
    </div>

    <!-- Step 2 -->
    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">2</div>
      <div style="flex:1;">
        <p style="margin:4px 0 8px;font-weight:700;font-size:16px;color:#0b1220;">Forward your calls to the AI</p>
        <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">Open your phone's dialer and type the code for your carrier, then press Call. You'll hear a quick confirmation tone — done. Use the OFF code anytime to go back to normal.</p>

        <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">AT&amp;T or T-Mobile</p>
          </div>
          <div style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI ON</strong> — open dialer and type:</p>
            <p style="margin:6px 0 8px;">${s(`**21*${phoneE164}#`)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI OFF</strong> — back to normal:</p>
            <p style="margin:6px 0 0;">${s("##21#")}</p>
          </div>

          <div style="padding:12px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Verizon</p>
          </div>
          <div style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI ON:</strong></p>
            <p style="margin:6px 0 8px;">${s(`*72${phoneE164}`)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI OFF:</strong></p>
            <p style="margin:6px 0 8px;">${s("*73")}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">If that doesn't work: <strong>Settings → Phone → Call Forwarding</strong> on your iPhone → enter ${escapeHtml(phonePretty)}.</p>
          </div>

          <div style="padding:12px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Other carriers</p>
          </div>
          <div style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI ON:</strong> ${s(`**21*${phoneE164}#`)} &nbsp; <strong>Turn AI OFF:</strong> ${s("##21#")}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">If it doesn't work, reply to this email and I'll get you the exact codes.</p>
          </div>
        </div>

        <p style="margin:12px 0 0;font-size:13px;color:#d1fae5;background:#065f46;padding:12px 16px;border-radius:8px;line-height:1.6;">
          💡 <strong>How roofers use this:</strong> Turn AI ON when you head to a job site. Turn it OFF when you're back in the office. Your customers always call your same number — the AI catches what you can't.
        </p>
      </div>
    </div>

    <!-- Step 3 -->
    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">3</div>
      <div style="flex:1;">
        <p style="margin:4px 0 6px;font-weight:700;font-size:16px;color:#0b1220;">Test that it's working</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">After dialing the ON code, ask a friend to call your regular number. The AI should answer within 2 rings. Within 30 seconds you'll get a text and email with the caller's name, what they need, and a summary of the conversation.</p>
      </div>
    </div>

    <!-- Step 4 -->
    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">4</div>
      <div style="flex:1;">
        <p style="margin:4px 0 6px;font-weight:700;font-size:16px;color:#0b1220;">Check your portal for every call</p>
        <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">Every call your AI takes shows up here with a full transcript, caller info, and a one-tap callback button.</p>
        <a href="https://koemori.ai/portal/login" style="display:inline-block;background:#15325a;color:#fff;padding:11px 22px;border-radius:9999px;font-weight:600;font-size:14px;text-decoration:none;">Open my portal →</a>
      </div>
    </div>

    <!-- Turn off if needed -->
    <div style="margin:28px 0;padding:16px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
      <p style="margin:0 0 6px;font-weight:700;font-size:14px;color:#0b1220;">Need to turn it off temporarily?</p>
      <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">
        AT&amp;T / T-Mobile: dial ${s("##61#")} &nbsp;·&nbsp; Verizon: dial ${s("*73")}
        <br>This cancels forwarding and your phone goes back to normal.
      </p>
    </div>

  ` : `
    <div style="margin:28px 0;padding:20px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">We're finalizing your dedicated AI phone number and will send a follow-up email within 24 hours with your number and setup instructions.</p>
    </div>
  `;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;max-width:580px;margin:0 auto;color:#0b1220;line-height:1.55;">

      <!-- Header -->
      <div style="background:#15325a;padding:28px 32px;border-radius:12px 12px 0 0;">
        <p style="margin:0;font-size:13px;color:#90b8d8;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Koemori AI Receptionist</p>
        <h1 style="margin:8px 0 0;font-size:26px;color:#fff;font-weight:700;">You're all set, ${escapeHtml(name)}.</h1>
      </div>

      <!-- Body -->
      <div style="padding:28px 32px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 6px;font-size:15px;color:#0b1220;">Your AI receptionist for <strong>${escapeHtml(businessName)}</strong> is live and ready to catch every call you miss — 24 hours a day, 7 days a week.</p>
        <p style="margin:12px 0 0;font-size:15px;color:#0b1220;">Follow the steps below and you'll be up and running in under 5 minutes.</p>

        ${setupSteps}

        <!-- Sign off -->
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:15px;">Any questions — just reply to this email. I personally read every one.</p>
          <p style="margin:16px 0 0;font-size:15px;">— Rainn<br><span style="color:#6b7280;font-size:13px;">Koemori · Nashville, TN</span></p>
        </div>

        <!-- Legal -->
        <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;line-height:1.6;">
          By using Koemori you agree to our <a href="https://koemori.ai/terms" style="color:#15325a;">Terms of Service</a> and <a href="https://koemori.ai/privacy" style="color:#15325a;">Privacy Policy</a>, including that calls to your forwarded line are answered, recorded, and transcribed.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: client.owner_email,
    subject: `Your Koemori AI is ready — 3 steps to go live`,
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
