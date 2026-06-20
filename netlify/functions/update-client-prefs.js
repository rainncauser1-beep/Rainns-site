// Lets a signed-in client portal user update their own business info
// (business_hours, services, top_objections, brand_voice_notes).
//
// After saving to Supabase it automatically rebuilds and pushes the new
// prompt to their Retell LLM so changes go live on the next call.
// Cal.com booking availability is driven by Supabase data read at call
// time, so no extra step needed there.

const { createClient } = require("@supabase/supabase-js");

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

// Rebuild the agent prompt — must stay in sync with provision-agent.js buildPrompt
function buildPrompt(c, bookingEnabled) {
  const name = c.agent_display_name || "the AI receptionist";
  const tz = c.cal_timezone || "America/Chicago";
  const lines = [];
  lines.push(`You are ${name} for ${c.business_name}, a roofing company. You answer the phone like a sharp, warm, capable front-office person.`);
  lines.push("");
  const nowStr = new Date().toLocaleString("en-US", {
    timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const todayIso = new Date().toLocaleString("sv-SE", { timeZone: tz }).slice(0, 10);
  lines.push("# CURRENT DATE & TIME (CRITICAL)");
  lines.push(`Today is ${nowStr} (timezone ${tz}).`);
  lines.push(`In YYYY-MM-DD format, today is ${todayIso}.`);
  lines.push("Use THESE values for any date math. When the caller says 'tomorrow', 'next week', 'next Monday', etc., compute from the date above — NEVER from your training data.");
  lines.push(`When passing a date to the manage_booking tool, format it as YYYY-MM-DD with the YEAR being ${todayIso.slice(0, 4)} (or later — never an older year).`);
  lines.push("");
  lines.push("# YOUR GOAL");
  lines.push("Answer warmly, figure out what the caller needs, capture their details, and line up an estimate or callback. NEVER let a potential customer hang up without getting their name and a callback number.");
  lines.push("");
  lines.push("# HOW YOU SOUND");
  lines.push("Warm, confident, down-to-earth, efficient. Short, natural sentences. Never robotic or scripted. Match the caller's pace.");
  if (c.brand_voice_notes) lines.push(`Brand voice notes: ${c.brand_voice_notes}`);
  lines.push("");
  if (c.business_hours) {
    lines.push("# BUSINESS HOURS");
    lines.push(c.business_hours);
    lines.push("IMPORTANT: Only offer, suggest, or confirm appointment times that fall within these business hours. If a caller asks about a time outside these hours, politely explain that the team isn't available then and redirect to the next available time within hours. Never promise or imply the team is available outside these hours.");
    lines.push("");
  } else {
    lines.push("# BUSINESS HOURS");
    lines.push("Business hours were not provided. Do not promise or confirm specific appointment times — just capture the caller's preferred day/time and let them know the team will follow up to confirm.");
    lines.push("");
  }
  if (c.services) {
    lines.push("# SERVICES OFFERED");
    lines.push(c.services);
    lines.push("");
  }
  lines.push("# WHAT TO FIND OUT");
  lines.push("- Caller's name");
  lines.push("- Best callback number");
  lines.push("- Service address or area");
  lines.push("- What's going on: leak, missing/damaged shingles, full replacement, new construction, inspection, or storm/hail damage");
  lines.push("- Is it an insurance or storm claim?");
  lines.push("- How urgent it is (an active leak is urgent)");
  lines.push("");
  if (bookingEnabled) {
    const jnMode = Boolean(c.jobnimbus_api_key);
    if (jnMode) {
      lines.push("# BOOKING — JOBNIMBUS CONNECTED");
      lines.push("You have a tool called `manage_booking` connected to the client's JobNimbus CRM. Use it to add the caller as a lead and schedule their estimate:");
      lines.push("1. When the caller is ready to book, ask what day and time works best for them.");
      lines.push("2. Call `manage_booking` with action=\"book\", start_time as an ISO 8601 datetime (e.g. \"2026-06-20T10:00:00\"), caller_name, caller_phone, and caller_email if you have it.");
      lines.push("3. The tool adds them to JobNimbus and confirms. Read back the day and time to the caller.");
      lines.push("No need to check availability first — just get their preferred time and book it directly.");
      lines.push("Always still capture name + callback number even if they don't book.");
      lines.push("");
    } else {
      lines.push("# BOOKING — YOU CAN BOOK REAL APPOINTMENTS");
      lines.push("You have a tool called `manage_booking` connected to the live calendar. Use it to book a real estimate:");
      lines.push("1. When the caller is ready to schedule, ask what day works. Call `manage_booking` with action=\"check_availability\" and that date.");
      lines.push("2. The tool returns real open times. Offer the caller 2-3 of them in plain language.");
      lines.push("3. When they pick one, call `manage_booking` with action=\"book\", the exact start_time, caller_name, caller_phone, and caller_email if you have it.");
      lines.push("4. Only confirm the appointment AFTER the tool says it booked.");
      lines.push("Never invent a time or say 'booked' before the tool confirms it.");
      lines.push("Always still capture name + callback number even if they don't book.");
      lines.push("");
    }
  } else {
    lines.push("# BOOKING — READ CAREFULLY");
    lines.push("You do NOT have live access to the calendar. Never promise or confirm a specific appointment time.");
    lines.push("Instead: ask what generally works for them and tell them the team will confirm the exact time by text or call shortly.");
    lines.push("");
  }
  if (c.top_objections) {
    lines.push("# COMMON OBJECTIONS & HOW TO HANDLE");
    lines.push(c.top_objections);
    lines.push("");
  }
  lines.push("# HARD RULES");
  lines.push("- Never quote exact prices or guarantee pricing unless explicitly given a price to share.");
  lines.push("- Never make up details you don't have (warranties, materials, timelines).");
  lines.push("- Always get a name and callback number before the call ends.");
  lines.push("- For emergencies (active major leak, storm damage): reassure them, mark it urgent.");
  lines.push("");
  lines.push("# CLOSING");
  lines.push("Recap what you captured, confirm the callback number, thank them by name, and let them know the team will be in touch shortly.");
  return lines.join("\n");
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
          const newPrompt = buildPrompt(data, bookingEnabled);
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
