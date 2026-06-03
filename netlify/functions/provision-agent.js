// Provisions OR updates a Retell LLM + Agent for a client.
// Auth: caller must send a Supabase access token in `Authorization: Bearer <jwt>`
// whose email matches ADMIN_EMAIL.
//
// If the request includes an existing `retell_agent_id`, we UPDATE that agent's
// prompt in place (keeping the same agent + phone number). Otherwise we CREATE
// a new LLM + Agent + phone number.
//
// When a `website` is provided we best-effort fetch and extract its text and
// feed it to the AI so the agent actually knows the business.

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

function buildPrompt(c, websiteContext, bookingEnabled) {
  const name = c.agent_display_name || "the AI receptionist";
  const lines = [];
  lines.push(`You are ${name} for ${c.business_name}, a roofing company. You answer the phone like a sharp, warm, capable front-office person.`);
  lines.push("");
  lines.push("# YOUR GOAL");
  lines.push("Answer warmly, figure out what the caller needs, capture their details, and line up an estimate or callback. NEVER let a potential customer hang up without getting their name and a callback number.");
  lines.push("");
  lines.push("# HOW YOU SOUND");
  lines.push("Warm, confident, down-to-earth, efficient. Short, natural sentences. Never robotic or scripted. Match the caller's pace. Brief small talk is fine, but keep things moving.");
  if (c.brand_voice_notes) lines.push(`Brand voice notes: ${c.brand_voice_notes}`);
  lines.push("");
  if (c.business_hours) {
    lines.push("# BUSINESS HOURS");
    lines.push(c.business_hours);
    lines.push("");
  }
  if (c.services) {
    lines.push("# SERVICES OFFERED");
    lines.push(c.services);
    lines.push("");
  }
  if (websiteContext) {
    lines.push("# ABOUT THIS BUSINESS (pulled from their website — use it to answer accurately; do NOT read it out verbatim)");
    lines.push(websiteContext);
    lines.push("");
  }
  lines.push("# WHAT TO FIND OUT (qualify naturally — a conversation, not an interrogation)");
  lines.push("- Caller's name");
  lines.push("- Best callback number");
  lines.push("- Service address or area");
  lines.push("- What's going on: leak, missing/damaged shingles, full replacement, new construction, inspection, or storm/hail damage");
  lines.push("- Is it an insurance or storm claim?");
  lines.push("- How urgent it is (an active leak is urgent)");
  lines.push("");
  if (bookingEnabled) {
    lines.push("# BOOKING — YOU CAN BOOK REAL APPOINTMENTS");
    lines.push("You have a tool called `manage_booking` connected to the live calendar. Use it to book a real estimate:");
    lines.push("1. When the caller is ready to schedule, ask what day works. Call `manage_booking` with action=\"check_availability\" and that date.");
    lines.push("2. The tool returns real open times. Offer the caller 2-3 of them in plain language.");
    lines.push("3. When they pick one, call `manage_booking` with action=\"book\", the exact start_time it gave you (ISO 8601), the caller_name, caller_phone, and caller_email if you have it.");
    lines.push("4. Only confirm the appointment AFTER the tool says it booked. Read back the day and time.");
    lines.push("Never invent a time or say 'booked' before the tool confirms it. If the tool says a slot was taken, offer another.");
    lines.push("Always still capture name + callback number even if they don't book.");
    lines.push("");
  } else {
    lines.push("# BOOKING — READ CAREFULLY");
    lines.push("You do NOT have live access to the calendar, so you must NEVER promise, confirm, or 'lock in' a specific appointment time, and never tell two callers the same slot is reserved.");
    lines.push("Instead: ask what generally works for them (mornings vs afternoons, which days), capture that preference, and tell them the team will confirm the exact time by text or call shortly.");
    lines.push('Example: "Perfect — I\'ve got your details and that mornings this week work best. The team will text you shortly to lock in the exact time. Sound good?"');
    lines.push("You are collecting a request, not committing the schedule.");
    lines.push("");
  }
  if (c.top_objections) {
    lines.push("# COMMON OBJECTIONS & HOW TO HANDLE");
    lines.push(c.top_objections);
    lines.push("");
  }
  lines.push("# HARD RULES");
  lines.push("- Never quote exact prices or guarantee pricing unless explicitly given a price to share. If pushed, say pricing depends on the inspection and the team will give an exact quote.");
  lines.push("- Never make up details you don't have (warranties, materials, timelines). If unsure, say a specialist will follow up.");
  lines.push("- Never guarantee a specific appointment time (see BOOKING).");
  lines.push("- Always get a name and callback number before the call ends.");
  lines.push("- For emergencies (active major leak, storm damage): reassure them, mark it urgent, and make clear the team will call back fast.");
  lines.push("");
  lines.push("# CLOSING");
  lines.push("Recap what you captured, confirm the callback number, thank them by name, and let them know the team will be in touch shortly.");
  return lines.join("\n");
}

// Best-effort: fetch a website and extract readable text for agent context.
async function fetchWebsiteContext(url) {
  if (!url) return null;
  let target = String(url).trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { "User-Agent": "KoemoriBot/1.0 (+https://koemori.ai)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
      .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    if (!text) return null;
    return text.length > 3000 ? text.slice(0, 3000) + "…" : text;
  } catch {
    return null;
  }
}

// Auto-creates a Cal.com event type for this client and returns its numeric ID.
// Uses the global Koemori Cal.com account (CALCOM_API_KEY). Availability comes
// from the account's default schedule; we set a per-day booking cap here.
// NOTE: cal-api-version is the calibration point if this 4xxs.
const CAL_EVENT_TYPES_VERSION = "2024-06-14";
async function createCalEventType({ apiKey, businessName, dailyCap, lengthMin }) {
  const slug = (slugify(businessName) || "estimate") + "-" + Math.random().toString(36).slice(2, 7);
  const res = await fetch("https://api.cal.com/v2/event-types", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": CAL_EVENT_TYPES_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Estimate – ${businessName}`,
      slug,
      lengthInMinutes: Number(lengthMin) || 30,
      description: `Free estimate with ${businessName}.`,
      bookingLimitsCount: { day: Number(dailyCap) || 6 },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cal.com event-type create failed (${res.status}): ${t.slice(0, 220)}`);
  }
  const data = await res.json().catch(() => ({}));
  const id = data?.data?.id ?? data?.event_type?.id ?? data?.id;
  if (!id) throw new Error("Cal.com created the event type but returned no id");
  return String(id);
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function extractAreaCode(phoneStr) {
  if (!phoneStr) return null;
  const digits = String(phoneStr).replace(/\D/g, "");
  if (digits.length >= 10) {
    return Number(digits.slice(-10, -7));
  }
  return null;
}

exports.handler = async (event) => {
  // --- TEMP DIAG: GET ?diag_agent=agent_xxx returns agent + LLM tools/prompt ---
  if (event.httpMethod === "GET" && event.queryStringParameters?.diag_agent) {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return { statusCode: 200, body: JSON.stringify({ error: "no RETELL_API_KEY" }) };
    const aid = event.queryStringParameters.diag_agent;
    const out = {};
    try {
      const aRes = await fetch(`https://api.retellai.com/get-agent/${aid}`, { headers: { Authorization: `Bearer ${apiKey}` } });
      const aJson = await aRes.json();
      out.agent = { agent_id: aJson.agent_id, webhook_url: aJson.webhook_url, response_engine: aJson.response_engine };
      const llmId = aJson?.response_engine?.llm_id;
      if (llmId) {
        const lRes = await fetch(`https://api.retellai.com/get-retell-llm/${llmId}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        const lJson = await lRes.json();
        out.llm = {
          llm_id: lJson.llm_id,
          model: lJson.model,
          begin_message: lJson.begin_message,
          general_tools: lJson.general_tools || [],
          tool_count: (lJson.general_tools || []).length,
          prompt_preview: (lJson.general_prompt || "").slice(0, 400),
          prompt_has_booking: (lJson.general_prompt || "").includes("manage_booking"),
        };
      }
    } catch (e) { out.error = e.message; }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(out, null, 2) };
  }
  // --- END DIAG ---

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
    payload = JSON.parse(Buffer.from(payloadPart, "base64").toString("utf8"));
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

  // Pull website context (best-effort) and build the prompt
  const websiteContext = await fetchWebsiteContext(body.website);

  // Resolve the effective Cal.com event type. If booking is requested and none
  // exists yet, auto-create one (best-effort — never blocks agent provisioning).
  let effectiveEventTypeId = body.cal_event_type_id || null;
  let booking_setup_error = null;
  if (!effectiveEventTypeId && body.enable_booking) {
    const calKey = process.env.CALCOM_API_KEY;
    if (!calKey) {
      booking_setup_error = "CALCOM_API_KEY is not set in Netlify, so the booking calendar couldn't be created.";
    } else {
      try {
        effectiveEventTypeId = await createCalEventType({
          apiKey: calKey,
          businessName: body.business_name,
          dailyCap: body.booking_daily_cap,
          lengthMin: body.booking_length,
        });
      } catch (e) {
        booking_setup_error = e.message;
      }
    }
  }

  const bookingEnabled = Boolean(effectiveEventTypeId);
  const generalPrompt = buildPrompt(body, websiteContext, bookingEnabled);

  // When booking is enabled, give the LLM a tool to check availability + book
  const siteUrlForTool = process.env.URL || "https://koemori.ai";
  const generalTools = bookingEnabled
    ? [
        {
          type: "custom",
          name: "manage_booking",
          description:
            "Check real calendar availability and book an estimate appointment. Use action='check_availability' with a date to get open times, then action='book' with the chosen ISO start_time to book it.",
          url: `${siteUrlForTool}/.netlify/functions/book-appointment`,
          speak_during_execution: true,
          speak_after_execution: true,
          execution_message_description: "Let me check the calendar real quick…",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["check_availability", "book"], description: "check_availability to list open times, book to reserve one" },
              date: { type: "string", description: "Date to check availability for, in YYYY-MM-DD" },
              start_time: { type: "string", description: "Exact ISO 8601 start time to book (from the open times returned)" },
              caller_name: { type: "string", description: "Caller's full name" },
              caller_phone: { type: "string", description: "Caller's callback number" },
              caller_email: { type: "string", description: "Caller's email if provided" },
            },
            required: ["action"],
          },
        },
      ]
    : undefined;

  // ============================================================
  // UPDATE PATH — client already has an agent: refresh its prompt
  // ============================================================
  if (body.retell_agent_id) {
    try {
      // Look up the agent to find its LLM id
      const getRes = await fetch(`https://api.retellai.com/get-agent/${body.retell_agent_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!getRes.ok) {
        const errText = await getRes.text();
        return { statusCode: getRes.status, body: JSON.stringify({ error: "Could not load existing agent", detail: errText }) };
      }
      const agentObj = await getRes.json();
      const llmId = agentObj?.response_engine?.llm_id;
      if (!llmId) {
        return { statusCode: 500, body: JSON.stringify({ error: "Existing agent has no LLM to update" }) };
      }

      const updRes = await fetch(`https://api.retellai.com/update-retell-llm/${llmId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          general_prompt: generalPrompt,
          begin_message: beginMessage,
          // Always send tools (empty array clears them if booking was turned off)
          general_tools: generalTools || [],
        }),
      });
      if (!updRes.ok) {
        const errText = await updRes.text();
        return { statusCode: updRes.status, body: JSON.stringify({ error: "Could not update agent prompt", detail: errText }) };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: body.retell_agent_id,
          llm_id: llmId,
          updated: true,
          website_used: Boolean(websiteContext),
          cal_event_type_id: effectiveEventTypeId,
          booking_setup_error,
        }),
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: "Network error updating agent", detail: e.message }) };
    }
  }

  // ============================================================
  // CREATE PATH — brand new LLM + Agent + phone number
  // ============================================================
  let llm;
  try {
    const llmRes = await fetch("https://api.retellai.com/create-retell-llm", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        general_prompt: generalPrompt,
        model: "gpt-4o-mini",
        model_temperature: 0.3,
        begin_message: beginMessage,
        ...(generalTools ? { general_tools: generalTools } : {}),
      }),
    });
    if (!llmRes.ok) {
      const errText = await llmRes.text();
      return { statusCode: llmRes.status, body: JSON.stringify({ error: "Retell LLM creation failed", detail: errText }) };
    }
    llm = await llmRes.json();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Network error creating LLM", detail: e.message }) };
  }

  const siteUrl = process.env.URL || "https://koemori.ai";
  const webhookUrl = `${siteUrl}/.netlify/functions/lead-handoff`;

  let agent;
  try {
    const agentRes = await fetch("https://api.retellai.com/create-agent", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        response_engine: { type: "retell-llm", llm_id: llm.llm_id },
        agent_name: `${body.business_name} · ${greetName}`,
        voice_id: "11labs-Anna",
        language: "en-US",
        responsiveness: 1,
        interruption_sensitivity: 1,
        webhook_url: webhookUrl,
      }),
    });
    if (!agentRes.ok) {
      const errText = await agentRes.text();
      return { statusCode: agentRes.status, body: JSON.stringify({ error: "Retell agent creation failed", detail: errText, llm_id: llm.llm_id }) };
    }
    agent = await agentRes.json();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Network error creating agent", detail: e.message, llm_id: llm.llm_id }) };
  }

  // Phone number (best-effort)
  let phone_number = null;
  let phone_error = null;
  try {
    const areaCode = extractAreaCode(body.business_phone) ?? 615;
    const phoneRes = await fetch("https://api.retellai.com/create-phone-number", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inbound_agent_id: agent.agent_id,
        area_code: areaCode,
        nickname: body.business_name,
      }),
    });
    if (phoneRes.ok) {
      const phoneData = await phoneRes.json();
      phone_number = phoneData.phone_number || phoneData.phone_number_pretty || null;
    } else {
      phone_error = await phoneRes.text();
    }
  } catch (e) {
    phone_error = e.message;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agent.agent_id,
      llm_id: llm.llm_id,
      phone_number,
      phone_error,
      website_used: Boolean(websiteContext),
      cal_event_type_id: effectiveEventTypeId,
      booking_setup_error,
    }),
  };
};
