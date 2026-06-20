// Admin-only: creates/refreshes the public "Try the AI" demo agents — one
// Retell web-call agent per trade + a generic 'default'. Web calls need no
// phone number, so this is free to run. Idempotent: if a demo agent already
// exists for a vertical (in the demo_agents table), it updates that agent's
// prompt instead of creating a duplicate.
//
// Auth: Authorization: Bearer <supabase jwt> whose email === ADMIN_EMAIL.
// Required env: RETELL_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require("@supabase/supabase-js");
const { BACKEND_VERTICALS, buildDemoPrompt, DEMO_GREETING } = require("./lib/agent-prompt");

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

const { getVerifiedUser } = require("./lib/auth");

async function retell(path, apiKey, method, payload) {
  const res = await fetch(`https://api.retellai.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, json, text };
}

// Create or update a single demo agent for one vertical. Returns a result row.
async function upsertDemoAgent({ apiKey, supabase, slug, existing }) {
  const prompt = buildDemoPrompt(slug);

  // UPDATE in place if we already have an agent for this slug.
  if (existing && existing.agent_id) {
    const got = await retell(`/get-agent/${existing.agent_id}`, apiKey, "GET");
    const llmId = got.json?.response_engine?.llm_id || existing.llm_id;
    if (got.ok && llmId) {
      const upd = await retell(`/update-retell-llm/${llmId}`, apiKey, "PATCH", {
        general_prompt: prompt,
        begin_message: DEMO_GREETING,
      });
      if (!upd.ok) return { slug, action: "update", ok: false, error: `LLM ${upd.status}: ${upd.text.slice(0, 120)}` };
      await supabase.from("demo_agents").update({ llm_id: llmId, updated_at: new Date().toISOString() }).eq("vertical", slug);
      return { slug, action: "updated", ok: true, agent_id: existing.agent_id };
    }
    // Agent vanished on Retell's side — fall through to recreate.
  }

  // CREATE a fresh LLM + agent.
  const llmRes = await retell("/create-retell-llm", apiKey, "POST", {
    general_prompt: prompt,
    model: "gpt-4o-mini",
    model_temperature: 0.3,
    begin_message: DEMO_GREETING,
  });
  if (!llmRes.ok) return { slug, action: "create", ok: false, error: `LLM ${llmRes.status}: ${llmRes.text.slice(0, 120)}` };
  const llmId = llmRes.json?.llm_id;

  const agentRes = await retell("/create-agent", apiKey, "POST", {
    response_engine: { type: "retell-llm", llm_id: llmId },
    agent_name: `Koemori Demo · ${slug}`,
    voice_id: "11labs-Anna",
    language: "en-US",
    responsiveness: 1,
    interruption_sensitivity: 1,
  });
  if (!agentRes.ok) return { slug, action: "create", ok: false, error: `Agent ${agentRes.status}: ${agentRes.text.slice(0, 120)}`, llm_id: llmId };
  const agentId = agentRes.json?.agent_id;

  const { error: dbErr } = await supabase
    .from("demo_agents")
    .upsert({ vertical: slug, agent_id: agentId, llm_id: llmId, updated_at: new Date().toISOString() }, { onConflict: "vertical" });
  if (dbErr) return { slug, action: "create", ok: false, error: `DB: ${dbErr.message}`, agent_id: agentId };

  return { slug, action: "created", ok: true, agent_id: agentId };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Auth
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  const user = await getVerifiedUser(auth.slice(7));
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  if (user.email !== ADMIN_EMAIL) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "RETELL_API_KEY not configured" }) };

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Pull existing rows so we update in place rather than duplicate.
  let existingBySlug = {};
  try {
    const { data } = await supabase.from("demo_agents").select("vertical, agent_id, llm_id");
    if (data) existingBySlug = Object.fromEntries(data.map((r) => [r.vertical, r]));
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: `Could not read demo_agents — did you run the migration? ${e.message}` }) };
  }

  // One demo agent per trade, plus a generic 'default' for brand pages.
  const slugs = [...Object.keys(BACKEND_VERTICALS), "default"];
  const results = [];
  for (const slug of slugs) {
    try {
      results.push(await upsertDemoAgent({ apiKey, supabase, slug, existing: existingBySlug[slug] }));
    } catch (e) {
      results.push({ slug, ok: false, error: e.message });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, summary: `${okCount}/${slugs.length} demo agents ready`, results }),
  };
};
