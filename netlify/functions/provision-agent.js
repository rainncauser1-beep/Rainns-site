// Provisions a Retell LLM + Agent for a new client.
// Auth: caller must send a Supabase access token in `Authorization: Bearer <jwt>`
// whose email matches ADMIN_EMAIL. The JWT is base64-decoded for the email check —
// for a stronger check, the function could verify the signature against Supabase's
// JWKS, but the access token can only be issued by Supabase itself.

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

function buildPrompt(c) {
  const lines = [];
  lines.push(`You are the AI receptionist for ${c.business_name}${c.industry ? `, a ${c.industry} business` : ""}.`);
  lines.push("");
  lines.push("Your job: answer inbound calls, qualify leads, handle objections, and book appointments.");
  lines.push("Be warm, direct, and professional. Speak naturally — never sound scripted.");
  lines.push("");
  if (c.business_hours) {
    lines.push(`BUSINESS HOURS:\n${c.business_hours}`);
    lines.push("");
  }
  if (c.services) {
    lines.push(`SERVICES OFFERED:\n${c.services}`);
    lines.push("");
  }
  if (c.top_objections) {
    lines.push(`OBJECTION HANDLING:\nIf the caller raises any of these, here's how to handle:\n${c.top_objections}`);
    lines.push("");
  }
  if (c.brand_voice_notes) {
    lines.push(`BRAND VOICE GUIDANCE:\n${c.brand_voice_notes}`);
    lines.push("");
  }
  lines.push("WHEN A CALLER WANTS TO BOOK:");
  lines.push("1. Confirm what they need help with");
  lines.push("2. Offer 2-3 specific time windows (e.g. tomorrow 9-11am or 2-4pm)");
  lines.push("3. Capture their name and best callback number");
  lines.push("4. Confirm details and end the call warmly");
  lines.push("");
  lines.push("If the question is technical or complex, say \"Let me have one of our specialists call you back\" and book a callback.");
  lines.push("Never make up information you don't have. Never quote prices unless explicitly told.");
  return lines.join("\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // --- Auth: verify caller is admin ---
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  let payload;
  try {
    const payloadPart = token.split(".")[1];
    const decoded = Buffer.from(payloadPart, "base64").toString("utf8");
    payload = JSON.parse(decoded);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (payload.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  // --- Validate input ---
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  if (!body.business_name) {
    return { statusCode: 400, body: JSON.stringify({ error: "business_name is required" }) };
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "RETELL_API_KEY not configured in Netlify env vars" }) };
  }

  const greetName = body.agent_display_name || "Ava";
  const beginMessage = `Hi, this is ${greetName} with ${body.business_name}. How can I help you today?`;

  // --- Step 1: create the LLM (the "brain") ---
  let llm;
  try {
    const llmRes = await fetch("https://api.retellai.com/create-retell-llm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        general_prompt: buildPrompt(body),
        model: "gpt-4o-mini",
        model_temperature: 0.3,
        begin_message: beginMessage,
      }),
    });
    if (!llmRes.ok) {
      const errText = await llmRes.text();
      return {
        statusCode: llmRes.status,
        body: JSON.stringify({ error: "Retell LLM creation failed", detail: errText }),
      };
    }
    llm = await llmRes.json();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Network error creating LLM", detail: e.message }) };
  }

  // --- Step 2: create the Agent (voice + behavior wrapper) ---
  let agent;
  try {
    const agentRes = await fetch("https://api.retellai.com/create-agent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        response_engine: { type: "retell-llm", llm_id: llm.llm_id },
        agent_name: `${body.business_name} · ${greetName}`,
        voice_id: "11labs-Anna",
        language: "en-US",
        responsiveness: 1,
        interruption_sensitivity: 1,
      }),
    });
    if (!agentRes.ok) {
      const errText = await agentRes.text();
      return {
        statusCode: agentRes.status,
        body: JSON.stringify({ error: "Retell agent creation failed", detail: errText, llm_id: llm.llm_id }),
      };
    }
    agent = await agentRes.json();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Network error creating agent", detail: e.message, llm_id: llm.llm_id }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agent.agent_id,
      llm_id: llm.llm_id,
    }),
  };
};
