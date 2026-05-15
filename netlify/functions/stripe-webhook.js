// Handles Stripe webhook events and updates client payment status in Supabase.
// Stripe sends events here after each payment action.
// Netlify env vars required: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

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

    case "customer.subscription.deleted": {
      const sub = stripeEvent.data.object;
      await updateBySubscriptionId(sub.id, { payment_status: "canceled" });
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
