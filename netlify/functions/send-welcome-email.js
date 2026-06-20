// Manually send the welcome + setup guide email to a client.
// Called from the admin panel "Send Welcome Email" button.
// Auth: admin Supabase JWT required.

const { createClient } = require("@supabase/supabase-js");

const ADMIN_EMAIL = "rainn.causer1@gmail.com";
const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

function verifySupabaseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || DEFAULT_FROM, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

function buildWelcomeEmail(client) {
  const name = client.owner_name?.split(" ")[0] || "there";
  const businessName = client.business_name || "your business";
  const phone = client.retell_phone_number;
  const phoneDigits = phone ? phone.replace(/\D/g, "") : "";
  const phoneE164 = phoneDigits.length === 11 ? `+${phoneDigits}` : phoneDigits.length === 10 ? `+1${phoneDigits}` : phone || "";
  const phonePretty = phoneDigits.length >= 10
    ? `(${phoneDigits.slice(-10,-7)}) ${phoneDigits.slice(-7,-4)}-${phoneDigits.slice(-4)}`
    : phone || "";

  const s = (txt) => `<span style="font-family:ui-monospace,Menlo,monospace;background:#f0f4f8;padding:3px 8px;border-radius:5px;font-size:15px;letter-spacing:0.02em;color:#0b1220;">${escapeHtml(txt)}</span>`;

  const phoneBlock = phone ? `
    <div style="margin:28px 0;padding:24px;background:#f0f6ff;border:2px solid #15325a;border-radius:12px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#15325a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Your AI phone number</p>
      <p style="margin:0;font-size:34px;font-weight:700;color:#15325a;letter-spacing:0.04em;">${escapeHtml(phonePretty)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#4b6a8a;">Calls forward here when call forwarding is on</p>
    </div>

    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">1</div>
      <div style="flex:1;">
        <p style="margin:4px 0 6px;font-weight:700;font-size:16px;color:#0b1220;">Call your AI to hear how it sounds</p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">Dial ${escapeHtml(phonePretty)} right now. The AI answers as your business. No forwarding needed for this test.</p>
      </div>
    </div>

    <div style="display:flex;gap:14px;margin:24px 0;align-items:flex-start;">
      <div style="min-width:32px;height:32px;background:#15325a;border-radius:50%;color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:32px;">2</div>
      <div style="flex:1;">
        <p style="margin:4px 0 8px;font-weight:700;font-size:16px;color:#0b1220;">Forward your calls to the AI</p>
        <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">Open your phone's dialer and dial the code for your carrier. You'll hear a confirmation tone — done. Use the OFF code to turn it off anytime.</p>
        <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">AT&amp;T or T-Mobile</p>
          </div>
          <div style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI ON:</strong></p>
            <p style="margin:6px 0 8px;">${s(`**21*${phoneE164}#`)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI OFF:</strong></p>
            <p style="margin:6px 0 0;">${s("##21#")}</p>
          </div>
          <div style="padding:12px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Verizon</p>
          </div>
          <div style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI ON:</strong></p>
            <p style="margin:6px 0 8px;">${s(`*71${phoneE164}`)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#4b5563;"><strong>Turn AI OFF:</strong></p>
            <p style="margin:6px 0 0;">${s("*73")}</p>
          </div>
        </div>
      </div>
    </div>` : `<p style="font-size:14px;color:#4b5563;">Your AI phone number is being set up and will be sent in a follow-up email.</p>`;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0b1220;padding:32px 40px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Koemori</p>
      <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">AI receptionist for home-service businesses</p>
    </div>
    <div style="padding:40px;">
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#0b1220;letter-spacing:-0.02em;">You're live, ${escapeHtml(name)}.</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">Your AI receptionist for <strong>${escapeHtml(businessName)}</strong> is set up and ready to answer calls. Here's how to get it working.</p>
      ${phoneBlock}
      <div style="margin:32px 0 0;padding:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">Questions? Reply to this email anytime or reach us at <a href="mailto:help@koemori.ai" style="color:#166534;">help@koemori.ai</a>.</p>
      </div>
    </div>
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Koemori · AI Receptionist for Home-Service Businesses · <a href="https://koemori.ai" style="color:#9ca3af;">koemori.ai</a></p>
    </div>
  </div>
</body></html>`;

  return {
    to: client.owner_email,
    subject: `You're live — here's how to set up your AI for ${escapeHtml(businessName)}`,
    html,
  };
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
  if (!jwtPayload || jwtPayload.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Admin only" }) };
  }
  if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { client_id } = body;
  if (!client_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "client_id required" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", client_id)
    .maybeSingle();

  if (error || !client) {
    return { statusCode: 404, body: JSON.stringify({ error: "Client not found" }) };
  }
  if (!client.owner_email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Client has no email address on file" }) };
  }

  try {
    const email = buildWelcomeEmail(client);
    await sendEmail(email);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, sent_to: client.owner_email }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
