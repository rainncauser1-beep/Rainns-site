// Creates a Stripe Checkout session for a client with CUSTOM pricing.
// Each client gets quoted individually — the admin types in the setup fee and
// monthly amount, and Stripe creates ad-hoc prices on the fly. No pre-made
// Stripe products needed.
//
// Auth: caller must send a Supabase access token in `Authorization: Bearer <jwt>`.
// Body: { client_id, client_email, client_name, setup_amount, monthly_amount }
// Returns: { url } — the Stripe-hosted checkout URL to share with the client.

const Stripe = require("stripe");

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Auth: verify caller is admin
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  let jwtPayload;
  try {
    const part = token.split(".")[1];
    jwtPayload = JSON.parse(Buffer.from(part, "base64").toString("utf8"));
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (jwtPayload.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }
  if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { client_id, client_email, client_name, setup_amount, monthly_amount, trial_days } = body;
  if (!client_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "client_id is required" }) };
  }

  const trialDays = Number(trial_days);
  const hasTrial = Number.isFinite(trialDays) && trialDays > 0;

  const setupDollars = Number(setup_amount);
  const monthlyDollars = Number(monthly_amount);
  if (!Number.isFinite(monthlyDollars) || monthlyDollars <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "monthly_amount must be a positive number" }) };
  }
  if (!Number.isFinite(setupDollars) || setupDollars < 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "setup_amount must be a non-negative number" }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }) };
  }

  const appUrl = process.env.URL || "https://rainndropai.netlify.app";
  const businessLabel = client_name || "Koemori Client";

  try {
    const stripe = Stripe(stripeKey);

    // In Checkout subscription mode you can mix one-time and recurring line
    // items. The one-time ones (no `recurring`) are charged on the first
    // invoice automatically — that's how we collect the setup fee.
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Koemori — Monthly Service (${businessLabel})` },
          unit_amount: Math.round(monthlyDollars * 100),
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ];
    if (setupDollars > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Koemori — Setup & Onboarding (${businessLabel})` },
          unit_amount: Math.round(setupDollars * 100),
        },
        quantity: 1,
      });
    }

    const subscriptionData = {
      metadata: { client_id, client_name: businessLabel },
    };
    // A free trial delays the first MONTHLY charge by N days. The setup fee
    // (a one-time line item) still bills immediately at checkout.
    if (hasTrial) {
      subscriptionData.trial_period_days = Math.round(trialDays);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(client_email ? { customer_email: client_email } : {}),
      line_items: lineItems,
      subscription_data: subscriptionData,
      metadata: {
        client_id,
        client_name: businessLabel,
        setup_amount: String(setupDollars),
        monthly_amount: String(monthlyDollars),
        trial_days: hasTrial ? String(Math.round(trialDays)) : "0",
      },
      success_url: `${appUrl}/?paid=1`,
      cancel_url: `${appUrl}/get-started`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url, session_id: session.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
