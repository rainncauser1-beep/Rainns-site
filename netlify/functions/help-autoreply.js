// Sends an auto-reply when someone submits the contact/help form.
// Called client-side after a successful form submission.

const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, email } = body;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "email required" }) };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "Email not configured" }) };
  }

  const firstName = (name || "there").split(" ")[0];

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#0b1220;padding:28px 36px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Koemori</p>
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">AI receptionist for home-service businesses</p>
    </div>
    <div style="padding:36px;">
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0b1220;letter-spacing:-0.02em;">We're on it, ${firstName}.</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
        Thanks for reaching out — we got your message and will get back to you within one business day.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
        If it's urgent, reply directly to this email and we'll prioritize it.
      </p>
      <div style="padding:18px 20px;background:#f0f6ff;border:1px solid #dbeafe;border-radius:10px;margin-top:8px;">
        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
          Already a Koemori client? Log in at <a href="https://koemori.ai/portal" style="color:#1e40af;font-weight:600;">koemori.ai/portal</a> to manage your AI, view calls, and update your settings.
        </p>
      </div>
    </div>
    <div style="padding:18px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Koemori · <a href="https://koemori.ai" style="color:#9ca3af;">koemori.ai</a> · <a href="mailto:help@koemori.ai" style="color:#9ca3af;">help@koemori.ai</a>
      </p>
    </div>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [email],
        reply_to: "help@koemori.ai",
        subject: "We got your message — we're on it",
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, body: JSON.stringify({ error: err }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
