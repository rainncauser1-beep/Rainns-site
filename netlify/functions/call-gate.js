// call-gate.js — Retell dynamic variable webhook
//
// Retell calls this URL at the START of every inbound call (before the agent speaks).
// We use it to enforce the client's monthly call limit.
//
// If the client is over their limit, we return a `call_limit_reached` flag
// and the Retell agent uses a conditional prompt to say:
//   "Hi, the Koemori answering service for [business] is currently at capacity
//    for this month. Please call back after [reset date] or leave a voicemail."
//   Then hangs up.
//
// If under the limit, we return the client's business info so the agent can
// personalize the greeting (business name, owner name, services, etc.)
//
// Retell docs: https://docs.retellai.com/features/dynamic-variables
//
// Required env var: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL

const { createClient } = require("@supabase/supabase-js");

function ok(body) {
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function deny(reason) {
  console.log("[call-gate] DENY:", reason);
  return ok({ call_limit_reached: true, deny_reason: reason });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const agentId = body.agent_id || body.call?.agent_id;
  if (!agentId) {
    return deny("no agent_id in request");
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch client by agent_id
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, business_name, owner_name, services, monthly_call_limit, calls_this_month, calls_reset_at, payment_status, status")
    .eq("retell_agent_id", agentId)
    .maybeSingle();

  if (error) {
    console.error("[call-gate] Supabase error:", error.message);
    // Fail open — don't block calls if DB is down
    return ok({ call_limit_reached: false, error: "db_error" });
  }

  if (!client) {
    return deny("client not found for agent_id");
  }

  // Block calls if client account is not active
  if (client.status === "paused" || client.payment_status === "paused" || client.payment_status === "past_due" || client.payment_status === "canceled") {
    return ok({
      call_limit_reached: true,
      business_name: client.business_name || "this business",
      deny_reason: "account_inactive",
    });
  }

  // Check if we need to reset the monthly counter
  const now = new Date();
  const resetAt = client.calls_reset_at ? new Date(client.calls_reset_at) : null;
  let callsThisMonth = client.calls_this_month ?? 0;

  if (!resetAt || now >= resetAt) {
    // Reset counter for new month
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month
    await supabase
      .from("clients")
      .update({ calls_this_month: 0, calls_reset_at: nextReset.toISOString() })
      .eq("id", client.id);
    callsThisMonth = 0;
    console.log(`[call-gate] Reset counter for client ${client.id}, next reset: ${nextReset.toISOString()}`);
  }

  // Enforce limit
  const limit = client.monthly_call_limit;
  if (limit && limit > 0 && callsThisMonth >= limit) {
    const resetDate = resetAt
      ? resetAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })
      : "the 1st of next month";

    console.log(`[call-gate] LIMIT HIT: client ${client.id} (${client.business_name}) — ${callsThisMonth}/${limit} calls used`);

    return ok({
      call_limit_reached: true,
      business_name: client.business_name || "this business",
      calls_used: callsThisMonth,
      calls_limit: limit,
      reset_date: resetDate,
      deny_reason: "monthly_limit_reached",
    });
  }

  // Allow — return dynamic variables for the agent
  console.log(`[call-gate] ALLOW: client ${client.id} (${client.business_name}) — ${callsThisMonth}/${limit ?? "unlimited"} calls`);

  return ok({
    call_limit_reached: false,
    business_name: client.business_name || "",
    owner_name: client.owner_name || "",
    services: client.services || "",
    calls_used: callsThisMonth,
    calls_limit: limit ?? 0,
  });
};
