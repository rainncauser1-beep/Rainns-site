// Creates a Stripe Checkout session for a client with CUSTOM pricing.
// Each client gets quoted individually — the admin types in the setup fee and
// monthly amount, and Stripe creates ad-hoc prices on the fly. No pre-made
// Stripe products needed.
//
// Auth: caller must send a Supabase access token in `Authorization: Bearer <jwt>`.
// Body: { client_id, client_email, client_name, setup_amount, monthly_amount }
// Returns: { url } — the Stripe-hosted checkout URL to share with the client.

const crypto = require("crypto");
const Stripe = require("stripe");

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

const { getVerifiedUser } = require("./lib/auth");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Parse body first so we can check billing_interval during auth
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { client_id, client_email, client_name, setup_amount, monthly_amount, trial_days, billing_interval } = body;
  const isYearly = billing_interval === "year";

  // Auth: admin can generate any checkout; authenticated clients can only request their own yearly upgrade
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  const user = await getVerifiedUser(token);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  const isAdmin = user.email === ADMIN_EMAIL;
  const isClientYearlyUpgrade = isYearly && user.email && !isAdmin;
  if (!isAdmin && !isClientYearlyUpgrade) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }
  if (!client_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "client_id is required" }) };
  }

  const trialDays = Number(trial_days);
  const hasTrial = Number.isFinite(trialDays) && trialDays > 0;

  // Identity + price. Admin may quote any client/amount. A non-admin self-upgrade
  // is bound to the caller's OWN row with the price derived server-side, so a
  // signed-in client can't check out as another client or at an arbitrary price.
  let effClientId = client_id;
  let effEmail = client_email;
  let effName = client_name;
  let setupDollars = Number(setup_amount);
  let monthlyDollars = Number(monthly_amount);
  if (!isAdmin) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server not configured" }) };
    }
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: row } = await supabase
      .from("clients")
      .select("id, business_name, owner_email, monthly_recurring")
      .eq("owner_email", user.email)
      .maybeSingle();
    if (!row) {
      return { statusCode: 403, body: JSON.stringify({ error: "No client account for this user" }) };
    }
    if (!row.monthly_recurring || Number(row.monthly_recurring) <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No monthly price on file — contact support to upgrade." }) };
    }
    effClientId = row.id;
    effEmail = row.owner_email;
    effName = row.business_name;
    monthlyDollars = Number(row.monthly_recurring);
    setupDollars = 0; // no setup fee on a self-serve upgrade
  }

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

  const appUrl = process.env.URL || "https://koemori.ai";
  const businessLabel = effName || "Koemori Client";

  try {
    const stripe = Stripe(stripeKey);

    // In Checkout subscription mode you can mix one-time and recurring line
    // items. The one-time ones (no `recurring`) are charged on the first
    // invoice automatically — that's how we collect the setup fee.
    const yearlyAmount = Math.round(monthlyDollars * 12 * 0.8 * 100); // 20% off
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: isYearly
              ? `Koemori — Annual Service (${businessLabel}) · 20% off`
              : `Koemori — Monthly Service (${businessLabel})`,
          },
          unit_amount: isYearly ? yearlyAmount : Math.round(monthlyDollars * 100),
          recurring: { interval: isYearly ? "year" : "month" },
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
      metadata: { client_id: effClientId, client_name: businessLabel },
    };
    // A free trial delays the first MONTHLY charge by N days. The setup fee
    // (a one-time line item) still bills immediately at checkout.
    if (hasTrial) {
      subscriptionData.trial_period_days = Math.round(trialDays);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(effEmail ? { customer_email: effEmail } : {}),
      line_items: lineItems,
      subscription_data: subscriptionData,
      // Require the client to accept our Terms of Service before paying.
      // Stripe records the acceptance (with timestamp) on the session.
      // NOTE: this requires a Terms-of-service URL set in the Stripe Dashboard
      // (Settings → Public business details / Checkout) or the API will error.
      consent_collection: { terms_of_service: "required" },
      metadata: {
        client_id: effClientId,
        client_name: businessLabel,
        setup_amount: String(setupDollars),
        monthly_amount: String(monthlyDollars),
        billing_interval: isYearly ? "year" : "month",
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
