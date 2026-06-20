// Generates a Supabase magic link server-side (no email sent by Supabase)
// and delivers it via Resend. This bypasses Supabase's low free-tier email
// rate limit entirely.

const { createClient } = require("@supabase/supabase-js");

const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Email not configured" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const siteUrl = process.env.URL || "https://koemori.ai";

  // Generate the magic link without Supabase sending any email
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/portal` },
  });

  if (error || !data?.properties?.action_link) {
    console.error("generateLink error:", error?.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not generate sign-in link" }) };
  }

  const magicLink = data.properties.action_link;

  const html = `
    <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width:480px; margin:0 auto; color:#0b1220; line-height:1.6;">
      <p style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 4px;">Koemori · Sign in</p>
      <h2 style="margin:0 0 16px; font-size:22px;">Your sign-in link</h2>
      <p style="margin:0 0 20px; color:#374151;">Click the button below to sign in to your Koemori portal. This link expires in 1 hour and can only be used once.</p>
      <div style="margin:24px 0;">
        <a href="${magicLink}" style="display:inline-block; background:#0b1220; color:#fff; padding:14px 28px; border-radius:9999px; font-weight:600; font-size:15px; text-decoration:none;">Sign in to portal →</a>
      </div>
      <p style="font-size:12px; color:#9ca3af;">If you didn't request this, you can safely ignore it.</p>
      <p style="margin-top:28px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af;">Koemori · <a href="mailto:help@koemori.ai" style="color:#9ca3af;">help@koemori.ai</a></p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [email],
      subject: "Your Koemori sign-in link",
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend error:", res.status, errText);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not send email" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
