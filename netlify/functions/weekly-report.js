// Sends a weekly recap email to every active Koemori client.
// Scheduled via netlify.toml: runs every Monday at 8am EST (13:00 UTC).
// Only sends if the client had at least 1 call in the past 7 days.

const { createClient } = require("@supabase/supabase-js");

const DEFAULT_FROM = "Koemori <hello@koemori.ai>";
const PORTAL_URL = "https://koemori.ai/portal";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || DEFAULT_FROM;

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, business_name, owner_name, owner_email, payment_status")
    .in("payment_status", ["active", "trialing"])
    .not("owner_email", "is", null);

  if (error) {
    console.error("Failed to fetch clients:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  if (!clients?.length) {
    console.log("No active clients found");
    return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  let sent = 0;

  for (const client of clients) {
    try {
      const { data: thisWeekCalls } = await supabase
        .from("call_logs")
        .select("*")
        .eq("client_id", client.id)
        .gte("started_at", weekStart.toISOString())
        .order("started_at", { ascending: false });

      if (!thisWeekCalls?.length) continue;

      const { data: lastWeekCalls } = await supabase
        .from("call_logs")
        .select("id, duration_seconds")
        .eq("client_id", client.id)
        .gte("started_at", prevWeekStart.toISOString())
        .lt("started_at", weekStart.toISOString());

      const thisCount = thisWeekCalls.length;
      const lastCount = lastWeekCalls?.length || 0;

      const durCalls = thisWeekCalls.filter(c => c.duration_seconds);
      const avgDur = durCalls.length > 0
        ? Math.round(durCalls.reduce((s, c) => s + c.duration_seconds, 0) / durCalls.length)
        : 0;

      const top3 = thisWeekCalls.slice(0, 3).map(c => ({
        phone: c.from_number,
        name: c.raw?.call_analysis?.custom_analysis_data?.caller_name || null,
        service: c.raw?.call_analysis?.custom_analysis_data?.service_requested || null,
        booked: c.raw?.call_analysis?.custom_analysis_data?.appointment_booked || null,
        summary: c.summary,
      }));

      if (!resendKey || !client.owner_email) {
        console.log(`Skipping email for ${client.business_name} — RESEND_API_KEY or owner_email missing`);
        continue;
      }

      const html = buildWeeklyEmail(client, { thisCount, lastCount, avgDur, top3 });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [client.owner_email],
          subject: `Your Koemori weekly recap — ${thisCount} lead${thisCount !== 1 ? "s" : ""} this week`,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Email failed for ${client.owner_email}:`, err);
      } else {
        sent++;
        console.log(`Sent weekly report to ${client.owner_email} (${client.business_name})`);
      }
    } catch (e) {
      console.error(`Error processing client ${client.id}:`, e.message);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sent, total: clients.length }),
  };
};

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------

function buildWeeklyEmail(client, { thisCount, lastCount, avgDur, top3 }) {
  const firstName = (client.owner_name || "").split(" ")[0] || "there";
  const biz = escapeHtml(client.business_name || "your business");
  const weekOf = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  let trendLine;
  if (lastCount === 0) {
    trendLine = `First week with call data — great start for ${biz}.`;
  } else {
    const delta = thisCount - lastCount;
    if (delta > 0) trendLine = `That's ${delta} more than last week (${lastCount}). Up and to the right.`;
    else if (delta < 0) trendLine = `That's ${Math.abs(delta)} fewer than last week (${lastCount}).`;
    else trendLine = `Same count as last week (${lastCount}).`;
  }

  const top3Rows = top3.map(lead => `
    <tr>
      <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; vertical-align:top;">
        <div style="font-weight:600; color:#0b1220; font-size:14px; line-height:1.4;">${escapeHtml(lead.name || fmtPhone(lead.phone))}</div>
        ${lead.name ? `<div style="font-size:11px; color:#94a3b8; font-family:ui-monospace,monospace; margin-top:2px;">${escapeHtml(fmtPhone(lead.phone))}</div>` : ""}
      </td>
      <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; vertical-align:top; font-size:13px; color:#374151; line-height:1.5;">
        ${escapeHtml(lead.service || lead.summary?.slice(0, 80) || "—")}
      </td>
      <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; vertical-align:top; font-size:13px; white-space:nowrap;">
        ${lead.booked
          ? `<span style="color:#059669; font-weight:600;">✓ ${escapeHtml(lead.booked)}</span>`
          : `<span style="color:#94a3b8;">—</span>`}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Koemori Weekly Recap</title>
</head>
<body style="margin:0; padding:0; background:#f8f7f3; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:580px; margin:0 auto; padding:28px 16px;">

  <!-- Header -->
  <div style="background:#0b1220; border-radius:18px; padding:32px; margin-bottom:14px;">
    <div style="font-size:10px; color:#64748b; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:8px; font-family:ui-monospace,monospace;">
      Weekly recap · ${weekOf}
    </div>
    <h1 style="margin:0 0 10px; font-size:22px; color:#f8f7f3; font-weight:700; line-height:1.35;">
      Hey ${escapeHtml(firstName)}, your AI caught ${thisCount} lead${thisCount !== 1 ? "s" : ""} this week.
    </h1>
    <p style="margin:0; font-size:14px; color:#94a3b8; line-height:1.6;">${escapeHtml(trendLine)}</p>
  </div>

  <!-- Stats row -->
  <table style="width:100%; border-collapse:separate; border-spacing:10px 0; margin-bottom:14px;">
    <tr>
      <td style="background:#ffffff; border-radius:14px; padding:20px 16px; text-align:center; width:33%;">
        <div style="font-size:30px; font-weight:700; color:#0b1220; line-height:1;">${thisCount}</div>
        <div style="font-size:10px; color:#94a3b8; margin-top:5px; text-transform:uppercase; letter-spacing:0.1em; font-family:ui-monospace,monospace;">This week</div>
      </td>
      <td style="background:#ffffff; border-radius:14px; padding:20px 16px; text-align:center; width:33%;">
        <div style="font-size:30px; font-weight:700; color:#0b1220; line-height:1;">${lastCount}</div>
        <div style="font-size:10px; color:#94a3b8; margin-top:5px; text-transform:uppercase; letter-spacing:0.1em; font-family:ui-monospace,monospace;">Last week</div>
      </td>
      <td style="background:#ffffff; border-radius:14px; padding:20px 16px; text-align:center; width:33%;">
        <div style="font-size:30px; font-weight:700; color:#0b1220; line-height:1;">${fmtDuration(avgDur)}</div>
        <div style="font-size:10px; color:#94a3b8; margin-top:5px; text-transform:uppercase; letter-spacing:0.1em; font-family:ui-monospace,monospace;">Avg duration</div>
      </td>
    </tr>
  </table>

  <!-- AI saved you callout -->
  <div style="background:#e8f0f8; border-left:4px solid #15325a; border-radius:10px; padding:16px 20px; margin-bottom:14px;">
    <p style="margin:0; font-size:14px; color:#0b1220; line-height:1.65;">
      <strong>Your AI saved you ${thisCount} call${thisCount !== 1 ? "s" : ""} from going to voicemail</strong> this week — that's ${thisCount} potential roofing job${thisCount !== 1 ? "s" : ""} captured instead of missed while you were on site.
    </p>
  </div>

  ${top3.length > 0 ? `
  <!-- Top leads -->
  <div style="background:#ffffff; border-radius:14px; overflow:hidden; margin-bottom:14px;">
    <div style="padding:18px 20px; border-bottom:1px solid #f1f5f9;">
      <div style="font-size:10px; color:#94a3b8; letter-spacing:0.1em; text-transform:uppercase; font-family:ui-monospace,monospace; margin-bottom:3px;">Top leads this week</div>
      <div style="font-size:16px; font-weight:700; color:#0b1220;">Who called and what they need</div>
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#fafaf9;">
          <th style="padding:8px 16px; text-align:left; font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; font-family:ui-monospace,monospace; font-weight:500; border-bottom:1px solid #f1f5f9;">Caller</th>
          <th style="padding:8px 16px; text-align:left; font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; font-family:ui-monospace,monospace; font-weight:500; border-bottom:1px solid #f1f5f9;">What they need</th>
          <th style="padding:8px 16px; text-align:left; font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; font-family:ui-monospace,monospace; font-weight:500; border-bottom:1px solid #f1f5f9;">Booked</th>
        </tr>
      </thead>
      <tbody>${top3Rows}</tbody>
    </table>
  </div>
  ` : ""}

  <!-- CTA -->
  <div style="text-align:center; margin-bottom:28px;">
    <a href="${PORTAL_URL}" style="display:inline-block; background:#0b1220; color:#f8f7f3; text-decoration:none; padding:15px 32px; border-radius:100px; font-weight:600; font-size:15px; letter-spacing:0.01em;">
      View full dashboard →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center; padding-top:16px; border-top:1px solid #e2e8f0;">
    <p style="font-size:12px; color:#94a3b8; margin:0; line-height:1.7;">
      Sent every Monday by <strong style="color:#0b1220;">Koemori</strong> · AI receptionist for roofers<br>
      <a href="mailto:help@koemori.ai" style="color:#94a3b8; text-decoration:underline;">Reply to unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDuration(sec) {
  if (!sec || sec < 1) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtPhone(p) {
  if (!p) return "Unknown";
  const d = String(p).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
