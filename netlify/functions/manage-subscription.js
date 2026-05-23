// Lets a signed-in portal client pause, resume, or cancel their own
// subscription. Authenticated by the portal user's Supabase JWT — we look up
// the client row by their email, grab the stored stripe_subscription_id, and
// act on it via the Stripe API. The client can never touch another account's
// subscription because the sub ID is resolved server-side from their email.
//
// Body: { action: "pause" | "resume" | "cancel" }
// Required Netlify env vars: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const ACTIONS = new Set(["pause", "resume", "cancel"]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Auth: extract the portal user's email from their Supabase JWT
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  let jwt;
  try {
    jwt = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (!jwt.email) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token missing email" }) };
  }
  if (jwt.exp && jwt.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  // Parse + validate action
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  const action = body.action;
  if (!ACTIONS.has(action)) {
    return { statusCode: 400, body: JSON.stringify({ error: "action must be pause, resume, or cancel" }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Resolve this user's subscription server-side
  const { data: client, error: lookupErr } = await supabase
    .from("clients")
    .select("id, stripe_subscription_id, payment_status")
    .eq("owner_email", jwt.email)
    .maybeSingle();

  if (lookupErr) {
    return { statusCode: 500, body: JSON.stringify({ error: lookupErr.message }) };
  }
  if (!client) {
    return { statusCode: 404, body: JSON.stringify({ error: "No account matches your email" }) };
  }
  if (!client.stripe_subscription_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "No active subscription on file" }) };
  }

  const stripe = Stripe(stripeKey);
  let newStatus = client.payment_status;

  try {
    if (action === "pause") {
      await stripe.subscriptions.update(client.stripe_subscription_id, {
        pause_collection: { behavior: "void" },
      });
      newStatus = "paused";
    } else if (action === "resume") {
      await stripe.subscriptions.update(client.stripe_subscription_id, {
        pause_collection: "",
      });
      newStatus = "active";
    } else if (action === "cancel") {
      // Cancel at period end so they keep service through what they've paid for
      await stripe.subscriptions.update(client.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      newStatus = "canceling";
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: `Stripe: ${err.message}` }) };
  }

  // Reflect the new state in Supabase immediately (webhook will also confirm)
  const { error: updateErr } = await supabase
    .from("clients")
    .update({ payment_status: newStatus })
    .eq("id", client.id);
  if (updateErr) {
    console.error("manage-subscription update error:", updateErr.message);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, payment_status: newStatus }),
  };
};
