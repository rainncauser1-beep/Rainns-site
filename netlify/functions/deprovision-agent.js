// Cleans up all Retell resources for a client: phone number, agent, LLM.
// Called before deleting a client row so we never leak billing resources.
// Body: { retell_agent_id, retell_phone_number }
// Auth: Supabase bearer token whose email is ADMIN_EMAIL

const crypto = require("crypto");
const ADMIN_EMAIL = "rainn.causer1@gmail.com";

function verifySupabaseJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  if (secret) {
    const expected = crypto.createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    if (expected !== sig) return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);
  const payload = verifySupabaseJwt(token);
  if (!payload) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (payload.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { retell_agent_id, retell_phone_number } = body;
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "RETELL_API_KEY not configured" }) };
  }

  const h = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const results = {};

  // 1. Release the phone number (keyed by E.164 string)
  if (retell_phone_number) {
    try {
      const r = await fetch(`https://api.retellai.com/delete-phone-number/${encodeURIComponent(retell_phone_number)}`, {
        method: "DELETE", headers: h,
      });
      results.phone = r.ok ? "released" : `error ${r.status}`;
    } catch (e) {
      results.phone = `exception: ${e.message}`;
    }
  } else {
    results.phone = "skipped (no number)";
  }

  // 2. Look up the agent to get its LLM id, then delete both
  let llm_id = null;
  if (retell_agent_id) {
    try {
      const getR = await fetch(`https://api.retellai.com/get-agent/${retell_agent_id}`, { headers: h });
      if (getR.ok) {
        const agentData = await getR.json();
        llm_id = agentData?.response_engine?.llm_id || null;
      }
    } catch {}

    try {
      const r = await fetch(`https://api.retellai.com/delete-agent/${retell_agent_id}`, {
        method: "DELETE", headers: h,
      });
      results.agent = r.ok ? "deleted" : `error ${r.status}`;
    } catch (e) {
      results.agent = `exception: ${e.message}`;
    }
  } else {
    results.agent = "skipped (no agent_id)";
  }

  // 3. Delete the LLM
  if (llm_id) {
    try {
      const r = await fetch(`https://api.retellai.com/delete-retell-llm/${llm_id}`, {
        method: "DELETE", headers: h,
      });
      results.llm = r.ok ? "deleted" : `error ${r.status}`;
    } catch (e) {
      results.llm = `exception: ${e.message}`;
    }
  } else {
    results.llm = "skipped (no llm_id found)";
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, results }),
  };
};
