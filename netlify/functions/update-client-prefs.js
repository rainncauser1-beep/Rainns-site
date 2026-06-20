// Lets a signed-in client portal user update their own business info
// (business_hours, services, top_objections, brand_voice_notes).
//
// After saving to Supabase it automatically rebuilds and pushes the new
// prompt to their Retell LLM so changes go live on the next call.
// Cal.com booking availability is driven by Supabase data read at call
// time, so no extra step needed there.

const { createClient } = require("@supabase/supabase-js");
const { buildPrompt } = require("./lib/agent-prompt");

function verifySupabaseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
  } catch {
    return null;
  }
}

// Fields a portal user is allowed to edit on their own row
const ALLOWED_FIELDS = new Set([
  "business_hours",
  "services",
  "top_objections",
  "brand_voice_notes",
  "jobnimbus_api_key",
]);

// The agent prompt + post-call fields live in ./lib/agent-prompt.js, shared
// with provision-agent.js so they can never drift. buildPrompt is vertical-aware.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  const jwt = verifySupabaseJwt(token);
  if (!jwt) return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  if (!jwt.email) return { statusCode: 401, body: JSON.stringify({ error: "Token missing email" }) };
  if (jwt.exp && jwt.exp * 1000 < Date.now()) return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // Whitelist-filter incoming fields
  const updates = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key) && typeof value === "string") {
      updates[key] = value;
    }
  }
  if (Object.keys(updates).length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "No allowed fields in request" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Save to Supabase
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("owner_email", jwt.email)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("update-client-prefs error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
  if (!data) {
    return { statusCode: 404, body: JSON.stringify({ error: "No client row matches your email" }) };
  }

  // Push updated prompt to Retell LLM (best-effort — never fail the save if this errors)
  const retellKey = process.env.RETELL_API_KEY;
  let agentUpdated = false;
  let agentError = null;

  if (retellKey && data.retell_agent_id) {
    try {
      // Get the LLM id from the agent
      const agentRes = await fetch(`https://api.retellai.com/get-agent/${data.retell_agent_id}`, {
        headers: { Authorization: `Bearer ${retellKey}` },
      });
      if (agentRes.ok) {
        const agentObj = await agentRes.json();
        const llmId = agentObj?.response_engine?.llm_id;
        if (llmId) {
          const bookingEnabled = Boolean(data.cal_event_type_id) || Boolean(data.jobnimbus_api_key);
          const newPrompt = buildPrompt(data, { bookingEnabled });
          const beginMessage = `Hi, this is ${data.agent_display_name || "Ava"} with ${data.business_name}. How can I help you today?`;

          const patchRes = await fetch(`https://api.retellai.com/update-retell-llm/${llmId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${retellKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              general_prompt: newPrompt,
              begin_message: beginMessage,
            }),
          });
          agentUpdated = patchRes.ok;
          if (!patchRes.ok) {
            agentError = `Retell PATCH ${patchRes.status}`;
            console.error("Retell LLM update failed:", agentError);
          }
        }
      }
    } catch (e) {
      agentError = e.message;
      console.error("Retell update error:", e.message);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      client: {
        business_hours: data.business_hours,
        services: data.services,
        top_objections: data.top_objections,
        brand_voice_notes: data.brand_voice_notes,
      },
      agent_updated: agentUpdated,
      agent_error: agentError,
    }),
  };
};
