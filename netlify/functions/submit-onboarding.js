// Public onboarding-wizard submission handler.
//
// A prospect who just experienced the demo fills out the wizard. This drops
// them straight into the clients pipeline as a 'lead' with every intake field
// pre-filled, so when Rainn gets on the booked call everything's already
// there — he just closes and sends a payment link.
//
// No auth (it's a public form) but we whitelist fields, require a name +
// contact, and use the service-role key server-side so the public anon key
// never needs write access to the clients table.
//
// Required env: SUPABASE_SERVICE_ROLE_KEY
// Optional: RESEND_API_KEY, MAIL_FROM, OWNER_EMAIL

const { createClient } = require("@supabase/supabase-js");

const DEFAULT_OWNER_EMAIL = "rainn.causer1@gmail.com";
const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

// Only these fields are accepted from the public form
const ALLOWED = new Set([
  "business_name", "owner_name", "owner_email", "owner_phone",
  "business_phone", "vertical", "industry", "website", "business_hours",
  "services", "top_objections", "brand_voice_notes", "crm",
]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // Minimal validation
  if (!body.business_name || !String(body.business_name).trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Business name is required" }) };
  }
  if (!body.owner_email && !body.owner_phone) {
    return { statusCode: 400, body: JSON.stringify({ error: "An email or phone is required" }) };
  }

  // Whitelist-filter
  const record = { status: "lead", payment_status: "unpaid" };
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k) && typeof v === "string") {
      record[k] = v.trim();
    }
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("clients")
    .insert(record)
    .select("id, business_name")
    .maybeSingle();

  if (error) {
    console.error("submit-onboarding insert error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  // Send portal access magic link + notify Rainn (both best-effort)
  const siteUrl = process.env.URL || "https://koemori.ai";
  if (record.owner_email) {
    try {
      await sendPortalInvite(record, siteUrl);
    } catch (e) {
      console.error("Portal invite error:", e.message);
    }
  }
  try {
    await notifyOwner(record);
  } catch (e) {
    console.error("Onboarding notify error:", e.message);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, client_id: data?.id }),
  };
};

async function sendPortalInvite(record, siteUrl) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const firstName = (record.owner_name || "").split(" ")[0] || "there";
  // Direct them to portal login with email pre-filled — they click one button
  // and get their magic link on demand. Avoids Supabase auth rate limits entirely.
  const loginUrl = `${siteUrl}/portal/login?email=${encodeURIComponent(record.owner_email)}`;

  const html = `
    <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width:540px; margin:0 auto; color:#0b1220; line-height:1.6;">
      <p style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 4px;">Koemori · Your portal is ready</p>
      <h2 style="margin:0 0 12px; font-size:22px;">Hey ${esc(firstName)} 👋</h2>
      <p style="margin:0 0 16px;">Thanks for signing up. We've saved everything about <strong>${esc(record.business_name)}</strong> and your Koemori client portal is ready — sign in to see your dashboard and track your AI's performance once it's live.</p>
      <div style="margin:24px 0;">
        <a href="${loginUrl}" style="display:inline-block; background:#0b1220; color:#fff; padding:14px 28px; border-radius:9999px; font-weight:600; font-size:15px; text-decoration:none;">Access your portal →</a>
      </div>
      <p style="font-size:13px; color:#6b7280;">Click the button, hit "Email me a sign-in link," and you're in — no password needed. Takes 5 seconds.</p>
      <p style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af;">Sent by Koemori · <a href="mailto:help@koemori.ai" style="color:#9ca3af;">help@koemori.ai</a></p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [record.owner_email],
      subject: `Your Koemori portal is ready, ${firstName}`,
      html,
    }),
  });
}

async function notifyOwner(record) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const owner = process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL;

  const row = (label, val) =>
    val ? `<tr><td style="padding:5px 0;color:#6b7280;vertical-align:top;">${esc(label)}:</td><td style="padding:5px 0;">${esc(val)}</td></tr>` : "";

  const html = `
    <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width:560px; margin:0 auto; color:#0b1220; line-height:1.55;">
      <p style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 4px;">🚀 New onboarding application</p>
      <h2 style="margin:0 0 16px;">${esc(record.business_name)}</h2>
      <p>Someone just completed the onboarding wizard and is booking a call. They're already in your pipeline as a <strong>lead</strong> — open them in admin and everything's pre-filled.</p>
      <table style="border-collapse:collapse; width:100%; margin:16px 0; font-size:14px;">
        ${row("Owner", record.owner_name)}
        ${row("Email", record.owner_email)}
        ${row("Phone", record.owner_phone)}
        ${row("Trade", record.vertical)}
        ${row("Industry", record.industry)}
        ${row("Business phone", record.business_phone)}
        ${row("Website", record.website)}
        ${row("Hours", record.business_hours)}
        ${row("Services", record.services)}
        ${row("Objections", record.top_objections)}
        ${row("Brand voice", record.brand_voice_notes)}
        ${row("CRM", record.crm)}
      </table>
      <p><a href="https://koemori.ai/admin" style="color:#15325a; font-weight:600;">Open in admin →</a></p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [owner],
      subject: `🚀 New application: ${record.business_name}`,
      html,
    }),
  });
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
