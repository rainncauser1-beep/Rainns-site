// Creates a Stripe Checkout session for a client payment.
// Auth: caller must send a Supabase access token in `Authorization: Bearer <jwt>`.
// Body: { client_id, client_email, client_name, plan }
// Returns: { url } — the Stripe-hosted checkout URL to send to the client.

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

  const { client_id, client_email, client_name, plan } = body;
  if (!client_id || !plan) {
    return { statusCode: 400, body: JSON.stringify({ error: "client_id and plan are required" }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }) };
  }

  const PRICE_IDS = {
    starter: {
      setup: process.env.STRIPE_STARTER_SETUP_PRICE_ID,
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    },
    fullcycle: {
      setup: process.env.STRIPE_FULLCYCLE_SETUP_PRICE_ID,
      monthly: process.env.STRIPE_FULLCYCLE_MONTHLY_PRICE_ID,
    },
  };

  const prices = PRICE_IDS[plan];
  if (!prices || !prices.setup || !prices.monthly) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Stripe price IDs not configured for plan: ${plan}` }),
    };
  }

  const appUrl = process.env.URL || "https://rainndropai.netlify.app";

  try {
    const stripe = Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(client_email ? { customer_email: client_email } : {}),
      line_items: [{ price: prices.monthly, quantity: 1 }],
      subscription_data: {
        add_invoice_items: [{ price: prices.setup, quantity: 1 }],
        metadata: { client_id, plan, client_name: client_name || "" },
      },
      metadata: { client_id, plan, client_name: client_name || "" },
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
