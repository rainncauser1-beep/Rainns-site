// Retell post-call webhook handler.
//
// Retell sends an event here after every call lifecycle change. We only act
// on `call_analyzed` (fires ~30s after a call ends, includes summary +
// sentiment) and `call_ended` (fallback, no summary yet).
//
// For each handled event we:
//   1. Look up the client by agent_id in Supabase
//   2. Insert/upsert a row into call_logs (powers admin + client portal)
//   3. Email the client's owner_email with the lead info via Resend
//
// Required Netlify env vars: SUPABASE_SERVICE_ROLE_KEY
// Optional: RESEND_API_KEY (email step gracefully no-ops if unset)

const { createClient } = require("@supabase/supabase-js");

const DEFAULT_FROM = "Koemori <hello@koemori.ai>";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const eventType = body.event;
  const call = body.call;

  // Only act on terminal events
  const HANDLED = new Set(["call_analyzed", "call_ended"]);
  if (!HANDLED.has(eventType)) {
    return ok({ skipped: `event ${eventType || "(none)"}` });
  }
  if (!call || !call.agent_id) {
    return ok({ skipped: "missing call.agent_id" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Look up the client this agent belongs to
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, business_name, owner_name, owner_email, owner_phone, retell_phone_number, monthly_call_limit, calls_this_month, calls_reset_at")
    .eq("retell_agent_id", call.agent_id)
    .maybeSingle();

  if (clientErr) {
    console.error("Supabase client lookup error:", clientErr.message);
  }
  if (!client) {
    console.log("No client found for agent_id:", call.agent_id);
    return ok({ skipped: "client not found" });
  }

  // Increment call counter (server-side, idempotent via call_id check below)
  // Only count calls that actually connected (duration > 0)
  const callDurationMs = (call.start_timestamp && call.end_timestamp)
    ? call.end_timestamp - call.start_timestamp : 0;

  if (callDurationMs > 5000) { // only count calls longer than 5 seconds
    const newCount = (client.calls_this_month ?? 0) + 1;
    await supabase
      .from("clients")
      .update({ calls_this_month: newCount })
      .eq("id", client.id);
    console.log(`[call-counter] Client ${client.id} (${client.business_name}): ${newCount}/${client.monthly_call_limit ?? "unlimited"} calls this month`);
  }

  // Build the call_logs row
  const durationSec = (call.start_timestamp && call.end_timestamp)
    ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
    : null;

  const row = {
    client_id: client.id,
    agent_id: call.agent_id,
    call_id: call.call_id || null,
    from_number: call.from_number || null,
    to_number: call.to_number || null,
    duration_seconds: durationSec,
    transcript: call.transcript || null,
    summary: call.call_analysis?.call_summary || null,
    sentiment: call.call_analysis?.user_sentiment || null,
    started_at: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
    raw: call,
  };

  // Upsert on call_id so re-deliveries from Retell don't dupe rows
  if (call.call_id) {
    const { error: upsertErr } = await supabase
      .from("call_logs")
      .upsert(row, { onConflict: "call_id" });
    if (upsertErr) console.error("call_logs upsert error:", upsertErr.message);
  } else {
    const { error: insertErr } = await supabase.from("call_logs").insert(row);
    if (insertErr) console.error("call_logs insert error:", insertErr.message);
  }

  // Only alert on the analyzed event (has summary). For call_ended without
  // analysis we just save the row and wait for the analyzed event.
  // Email + SMS both fire best-effort; one failing never blocks the other.
  if (eventType === "call_analyzed") {
    const alerts = [];
    if (client.owner_email) {
      alerts.push(sendLeadEmail(client, call, row).catch((e) => console.error("Lead email failed:", e.message)));
    }
    if (client.owner_phone) {
      alerts.push(sendLeadSMS(client, call, row).catch((e) => console.error("Lead SMS failed:", e.message)));
    }
    await Promise.all(alerts);
  }

  return ok({ received: true, client_id: client.id });
};

function ok(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

async function sendLeadEmail(client, call, row) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("RESEND_API_KEY not set — skipping lead email");
    return;
  }

  const callerPhone = call.from_number || "Unknown number";
  const summary = row.summary || "(Call ended without summary — check transcript)";
  const sentiment = row.sentiment || null;
  const duration = row.duration_seconds
    ? `${Math.floor(row.duration_seconds / 60)}m ${row.duration_seconds % 60}s`
    : "—";
  const businessName = client.business_name || "your business";

  // Retell extracts structured fields per the post_call_analysis_data config
  const cd = call.call_analysis?.custom_analysis_data || {};

  const sentimentBadge = sentiment
    ? `<span style="display:inline-block; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; background:${sentimentColor(sentiment).bg}; color:${sentimentColor(sentiment).fg};">${escapeHtml(sentiment)}</span>`
    : "";

  // Build the "Captured details" block (only fields that were actually filled)
  const detailRow = (label, val) =>
    val ? `<tr><td style="padding:4px 12px 4px 0; color:#6b7280; font-size:13px; vertical-align:top; white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0; font-size:14px; color:#0b1220;">${escapeHtml(val)}</td></tr>` : "";
  const urgencyDisplay = cd.urgency ? `${cd.urgency}${String(cd.urgency).toLowerCase() === "emergency" ? " 🚨" : ""}` : "";
  const detailsBlock =
    (cd.caller_name || cd.address || cd.service_requested || cd.urgency || cd.preferred_time || cd.is_insurance_claim || cd.appointment_booked)
      ? `
      <p style="margin:20px 0 6px;"><strong style="font-size:13px; color:#6b7280; letter-spacing:0.05em; text-transform:uppercase;">Captured Details</strong></p>
      <table style="border-collapse:collapse; width:100%; margin:0 0 8px;">
        ${detailRow("Name", cd.caller_name)}
        ${detailRow("Address", cd.address)}
        ${detailRow("Service", cd.service_requested)}
        ${detailRow("Urgency", urgencyDisplay)}
        ${detailRow("Preferred time", cd.preferred_time)}
        ${cd.is_insurance_claim ? detailRow("Insurance claim", "Yes") : ""}
        ${detailRow("✅ Booked", cd.appointment_booked)}
      </table>`
      : "";

  const transcriptSnippet = call.transcript
    ? `<details style="margin-top:20px;"><summary style="cursor:pointer; color:#15325a; font-weight:600; font-size:14px;">Show full transcript</summary><pre style="margin-top:12px; padding:16px; background:#f8f7f3; border-radius:8px; font-size:12px; line-height:1.6; white-space:pre-wrap; font-family:ui-monospace, Menlo, Monaco, monospace; color:#0b1220; overflow-x:auto;">${escapeHtml(call.transcript)}</pre></details>`
    : "";

  const html = `
    <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width:560px; margin:0 auto; color:#0b1220; line-height:1.55;">
      <p style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 4px;">🔔 New lead · ${escapeHtml(businessName)}</p>
      <h2 style="margin:0 0 16px; font-size:20px;">Your AI just took a call</h2>

      <div style="background:#f8f7f3; border-left:3px solid #15325a; border-radius:4px; padding:18px 20px; margin:20px 0;">
        <p style="margin:0 0 8px;"><strong style="font-size:13px; color:#6b7280; letter-spacing:0.05em; text-transform:uppercase;">Caller</strong></p>
        <p style="margin:0; font-size:20px; font-weight:600; color:#15325a;">${escapeHtml(callerPhone)}</p>
      </div>

      ${detailsBlock}

      <p style="margin:20px 0 6px;"><strong style="font-size:13px; color:#6b7280; letter-spacing:0.05em; text-transform:uppercase;">Summary</strong> ${sentimentBadge}</p>
      <p style="margin:0; font-size:15px;">${escapeHtml(summary)}</p>

      <p style="margin:24px 0 6px;"><strong style="font-size:13px; color:#6b7280; letter-spacing:0.05em; text-transform:uppercase;">Duration</strong></p>
      <p style="margin:0; font-size:15px;">${escapeHtml(duration)}</p>

      <div style="margin:28px 0; padding:14px 18px; background:#15325a; border-radius:8px; text-align:center;">
        <a href="tel:${escapeHtml(callerPhone.replace(/[^0-9+]/g, ""))}" style="color:#fff; text-decoration:none; font-weight:600; font-size:15px;">Call them back →</a>
      </div>

      ${transcriptSnippet}

      <p style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
        Sent by Koemori · Reply to this email if anything looks off
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [client.owner_email],
      subject: `🔔 New lead from ${callerPhone} — ${businessName}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend send error:", res.status, errText);
  }
}

// ---------------------------------------------------------------------------
// SMS (Twilio). No-ops cleanly if Twilio env vars are unset.
// One Twilio number (TWILIO_FROM_NUMBER) texts every client their own leads.
// ---------------------------------------------------------------------------

async function sendLeadSMS(client, call, row) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.log("Twilio env vars not set — skipping lead SMS");
    return;
  }

  const to = toE164(client.owner_phone);
  if (!to) {
    console.log("Client owner_phone not a valid US number — skipping SMS");
    return;
  }

  const caller = call.from_number || "Unknown";
  const businessName = client.business_name || "your business";
  const cd = call.call_analysis?.custom_analysis_data || {};

  // Build a tight, useful SMS: the name/where/what the roofer needs to act on,
  // not the whole summary.
  const parts = [];
  parts.push(`🔔 ${businessName} lead`);
  if (cd.caller_name) parts.push(`${cd.caller_name} (${caller})`);
  else parts.push(caller);
  if (cd.address) parts.push(`@ ${cd.address}`);
  if (cd.service_requested) parts.push(cd.service_requested);
  if (cd.urgency && String(cd.urgency).toLowerCase() === "emergency") parts.push("🚨 URGENT");
  if (cd.appointment_booked) parts.push(`✅ Booked ${cd.appointment_booked}`);
  if (!cd.caller_name && !cd.address && !cd.service_requested && row.summary) {
    parts.push(row.summary);
  }
  parts.push(`Call back: ${caller}`);
  let body = parts.join(" · ");
  if (body.length > 480) body = body.slice(0, 477) + "…";

  const params = new URLSearchParams({ From: from, To: to, Body: body });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("Twilio send error:", res.status, errText);
  }
}

// Normalize a US phone to E.164 (+1XXXXXXXXXX). Returns null if unusable.
function toE164(phoneStr) {
  if (!phoneStr) return null;
  const d = String(phoneStr).replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (String(phoneStr).trim().startsWith("+")) return String(phoneStr).trim();
  return null;
}

function sentimentColor(s) {
  const key = String(s).toLowerCase();
  if (key.includes("positive")) return { bg: "#d1fae5", fg: "#065f46" };
  if (key.includes("negative")) return { bg: "#fee2e2", fg: "#991b1b" };
  return { bg: "#f3f4f6", fg: "#374151" };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
