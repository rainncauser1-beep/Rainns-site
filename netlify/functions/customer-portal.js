// Creates a Stripe Customer Portal session so clients can manage their
// own payment method, view invoices, and cancel/upgrade their plan.
// Auth: client's Supabase bearer token.

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

function verifySupabaseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };
  }

  const jwtPayload = verifySupabaseJwt(auth.slice(7));
  if (!jwtPayload) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Look up client by email (consistent with all other portal functions)
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, stripe_customer_id, business_name")
    .eq("owner_email", jwtPayload.email)
    .maybeSingle();

  if (error || !client) {
    return { statusCode: 404, body: JSON.stringify({ error: "Client not found" }) };
  }
  if (!client.stripe_customer_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "No billing account found. Contact support at hello@koemori.ai." }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Billing not configured" }) };
  }

  try {
    const stripe = Stripe(stripeKey);
    const appUrl = process.env.URL || "https://koemori.ai";

    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${appUrl}/portal`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
