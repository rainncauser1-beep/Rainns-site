// Starts a Retell WEB call for the public "Try the AI" demo.
//
// Routes the call to the right per-trade demo agent (demo_agents table,
// populated by provision-demo-agents). Falls back to the generic 'default'
// agent, then to a hardcoded agent, so the demo always works even before the
// per-trade agents are provisioned.

const FALLBACK_AGENT = process.env.DEMO_AGENT_ID || "agent_d5de35910a5d71b79710fb5d8b";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "RETELL_API_KEY not configured" }) };
  }

  // Optional personalization from the landing/trade page demo.
  let dynamicVars = {};
  let email = null;
  let vertical = null;
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.email && typeof body.email === "string") email = body.email.trim().toLowerCase();
    if (body.vertical && typeof body.vertical === "string") vertical = body.vertical.trim().toLowerCase();
    if (body.business_name && typeof body.business_name === "string") {
      dynamicVars.business_name = body.business_name.slice(0, 80);
    }
    if (body.trade && typeof body.trade === "string") {
      dynamicVars.trade = body.trade.slice(0, 40);
    }
  } catch {
    // No/invalid body — fall back to the generic demo
  }

  // Require a real email. The demo UI always collects one before calling; this
  // closes the "omit email to skip the per-email cap" bypass.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "A valid email is required" }) };
  }
  const ip = String(event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "")
    .split(",")[0].trim();

  // Single Supabase client for the demo-limit check + agent routing (best-effort).
  let sb = null;
  try {
    const { createClient } = require("@supabase/supabase-js");
    if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
  } catch {
    sb = null;
  }

  // Backend-enforce the 5-call demo limit
  if (email && sb) {
    try {
      const { data: trial } = await sb.from("demo_trials").select("tries_used").eq("email", email).maybeSingle();
      if (trial && trial.tries_used >= 5) {
        return { statusCode: 429, body: JSON.stringify({ error: "Demo limit reached" }) };
      }
    } catch {
      // Supabase unavailable — allow the call rather than block legitimate users
    }
  }

  // Per-IP daily backstop — catches email-cycling abuse from one machine.
  // Graceful: if the demo_ip_usage table isn't created yet, skip IP limiting.
  const IP_DAILY_CAP = 20;
  if (ip && sb) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: ipRow } = await sb.from("demo_ip_usage").select("count").eq("ip", ip).eq("day", today).maybeSingle();
      if (ipRow && ipRow.count >= IP_DAILY_CAP) {
        return { statusCode: 429, body: JSON.stringify({ error: "Daily demo limit reached for your network. Try again tomorrow." }) };
      }
      await sb.from("demo_ip_usage").upsert(
        { ip, day: today, count: (ipRow?.count || 0) + 1, updated_at: new Date().toISOString() },
        { onConflict: "ip,day" }
      );
    } catch {
      // demo_ip_usage table not created yet — skip IP limiting
    }
  }

  // Pick the demo agent: this trade -> generic default -> hardcoded fallback.
  let agentId = FALLBACK_AGENT;
  if (sb) {
    try {
      const wanted = [vertical, "default"].filter(Boolean);
      const { data } = await sb.from("demo_agents").select("vertical, agent_id").in("vertical", wanted);
      if (data && data.length) {
        const bySlug = Object.fromEntries(data.map((r) => [r.vertical, r.agent_id]));
        agentId = (vertical && bySlug[vertical]) || bySlug.default || agentId;
      }
    } catch {
      // demo_agents table not created yet — keep the fallback agent
    }
  }

  try {
    const callBody = { agent_id: agentId };
    if (Object.keys(dynamicVars).length > 0) {
      callBody.retell_llm_dynamic_variables = dynamicVars;
    }

    const res = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callBody),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: data.access_token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
