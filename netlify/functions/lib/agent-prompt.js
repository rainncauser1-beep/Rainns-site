// SINGLE SOURCE OF TRUTH for the Retell agent prompt + post-call fields.
//
// Both provision-agent.js (create/update agent) and update-client-prefs.js
// (portal self-edits) require this module, so the prompt can never drift
// between them again. Everything is driven off the client's `vertical` slug
// (see src/config/verticals.js) — fall back to roofing for legacy rows.
//
// CommonJS, no frontend deps (this runs in Netlify functions). Files in
// functions/lib/ are bundled on require but NOT published as endpoints.

// Per-trade language. Only the lines that genuinely differ by trade live here;
// everything else in the prompt is trade-agnostic.
const BACKEND_VERTICALS = {
  roofing: {
    role: "a roofing company",
    qualify: "What's going on: leak, missing/damaged shingles, full replacement, new construction, inspection, or storm/hail damage",
    insuranceLine: "Is it an insurance or storm claim?",
    urgency: "an active leak is urgent",
    emergency: "active major leak, storm damage",
    serviceRequested: "What roofing work the caller wants — e.g. 'leak repair', 'full replacement', 'routine inspection', 'storm damage assessment', 'gutter repair'. Empty if unclear.",
  },
  lawncare: {
    role: "a lawn care company",
    qualify: "What they need (mowing, edging, fertilization/weed treatment, aeration, or a seasonal cleanup), roughly the property size, and whether it's one-time or a recurring plan",
    insuranceLine: null,
    urgency: "an overgrown yard before an event or sale is time-sensitive",
    emergency: "an urgent same-week request",
    serviceRequested: "What lawn-care service the caller wants — e.g. 'weekly mowing', 'fertilization', 'aeration', 'one-time cleanup', 'new recurring plan'. Empty if unclear.",
  },
  pressurewashing: {
    role: "a pressure washing company",
    qualify: "What surface they need cleaned (house/siding soft wash, driveway, deck, patio, or commercial flatwork), roughly the size, and one-time vs recurring",
    insuranceLine: null,
    urgency: "a clean needed before an event or home sale is time-sensitive",
    emergency: "an urgent same-week request",
    serviceRequested: "What cleaning the caller wants — e.g. 'house soft wash', 'driveway cleaning', 'deck/patio', 'commercial flatwork'. Empty if unclear.",
  },
  detailing: {
    role: "an auto detailing business",
    qualify: "The vehicle (year/make/model or type), what they want (interior detail, exterior wash/wax, paint correction, or ceramic coating), and mobile at their location vs drop-off at the shop",
    insuranceLine: null,
    urgency: "a detail needed before a sale or event is time-sensitive",
    emergency: "an urgent same-day request",
    serviceRequested: "What detailing the caller wants — e.g. 'interior detail', 'full interior + exterior', 'paint correction', 'ceramic coating', 'fleet detailing'. Empty if unclear.",
  },
  hvac: {
    role: "an HVAC company",
    qualify: "What's going on (no cooling, no heat, weak airflow, strange noise, a tune-up, or a system replacement) and the system type/age if they know it",
    insuranceLine: "Is this under a home warranty or insurance claim?",
    urgency: "no heat in a freeze or no cooling in a heat wave is an emergency",
    emergency: "no-cool in extreme heat, no-heat in a freeze",
    serviceRequested: "What HVAC work the caller wants — e.g. 'AC repair', 'no-cool diagnostic', 'furnace repair', 'system replacement', 'maintenance tune-up'. Empty if unclear.",
  },
  plumbing: {
    role: "a plumbing company",
    qualify: "What's going on (a leak, clog/drain backup, no hot water, running/overflowing toilet, water heater issue, or a repipe) and where in the home",
    insuranceLine: "Is this for an insurance claim (e.g. water damage)?",
    urgency: "an active leak, burst pipe, or sewage backup is an emergency",
    emergency: "burst pipe, major active leak, sewage backup, no water",
    serviceRequested: "What plumbing work the caller wants — e.g. 'leak repair', 'drain cleaning', 'water heater repair/replace', 'toilet repair', 'repipe'. Empty if unclear.",
  },
  electrical: {
    role: "an electrical company",
    qualify: "What's going on (tripping breaker, dead outlets, flickering lights, a panel upgrade, a generator, an EV charger, or new wiring) and any safety concern",
    insuranceLine: "Is this for an insurance claim?",
    urgency: "sparking, a burning smell, or a total power outage is an emergency",
    emergency: "sparking, burning smell, exposed/arcing wiring, full power loss",
    serviceRequested: "What electrical work the caller wants — e.g. 'breaker/outlet repair', 'panel upgrade', 'lighting install', 'EV charger', 'generator', 'troubleshooting'. Empty if unclear.",
  },
  garagedoors: {
    role: "a garage door company",
    qualify: "What's going on (a broken spring, door off track, opener not working, noisy operation, or a new door) and whether a vehicle is trapped inside",
    insuranceLine: null,
    urgency: "a door stuck shut with a car trapped inside is urgent",
    emergency: "broken spring with a car trapped, door stuck open or shut",
    serviceRequested: "What garage-door work the caller wants — e.g. 'broken spring repair', 'opener repair', 'off-track door', 'new door install', 'tune-up'. Empty if unclear.",
  },
  pestcontrol: {
    role: "a pest control company",
    qualify: "What pest they're dealing with (ants, roaches, rodents, wasps, termites, mosquitoes, bed bugs), how bad it is, whether they have kids or pets, and one-time vs a recurring plan",
    insuranceLine: null,
    urgency: "a wasp/hornet nest, heavy infestation, or bed bugs is urgent",
    emergency: "aggressive wasps/hornets, severe infestation",
    serviceRequested: "What pest-control service the caller wants — e.g. 'general pest treatment', 'rodent control', 'termite inspection', 'mosquito treatment', 'recurring plan'. Empty if unclear.",
  },
  landscaping: {
    role: "a landscaping company",
    qualify: "What the project is (design/install, sod, planting beds, hardscaping like patios/walls/pavers, drainage, mulch, irrigation, or a cleanup), the rough scope, and timeline",
    insuranceLine: null,
    urgency: "a project tied to an event or closing date is time-sensitive",
    emergency: "an urgent time-sensitive project",
    serviceRequested: "What landscaping work the caller wants — e.g. 'patio/hardscape', 'planting/beds', 'sod install', 'full design', 'cleanup', 'irrigation'. Empty if unclear.",
  },
};

function getBackendVertical(slug) {
  return BACKEND_VERTICALS[slug] || BACKEND_VERTICALS.roofing;
}

// Post-call analysis fields Retell extracts from every call. service_requested
// is trade-specific; the rest are trade-agnostic.
function postCallFields(c) {
  const V = getBackendVertical(c && c.vertical);
  return [
    { type: "string", name: "caller_name", description: "The caller's full name as they introduced themselves. Empty if not provided." },
    { type: "string", name: "address", description: "The full service address (street, city, state) the caller gave for the work. Empty if not provided." },
    { type: "string", name: "service_requested", description: V.serviceRequested },
    { type: "string", name: "urgency", description: "How urgent the work is: 'emergency' (immediate / active damage), 'soon' (within a week), 'routine' (general / no rush), or empty if unclear." },
    { type: "string", name: "preferred_time", description: "Caller's preferred day/time for the estimate or appointment, if they mentioned one. Empty if not provided." },
    { type: "boolean", name: "is_insurance_claim", description: "True if the caller mentioned this is an insurance or warranty claim." },
    { type: "string", name: "appointment_booked", description: "If an appointment was successfully booked through the manage_booking tool, the ISO 8601 start time of that booking. Empty if no booking was made." },
  ];
}

// Builds the full Retell general_prompt. opts: { websiteContext, bookingEnabled }.
function buildPrompt(c, opts = {}) {
  const { websiteContext = null, bookingEnabled = false } = opts;
  const V = getBackendVertical(c.vertical);
  const name = c.agent_display_name || "the AI receptionist";
  const tz = c.cal_timezone || "America/Chicago";
  const lines = [];
  lines.push(`You are ${name} for ${c.business_name}, ${V.role}. You answer the phone like a sharp, warm, capable front-office person.`);
  lines.push("");
  // Bake the actual current date into the prompt — Retell's dynamic variables
  // aren't reliably substituted, and the model's training cutoff makes it
  // hallucinate dates from years ago without an explicit anchor.
  const nowStr = new Date().toLocaleString("en-US", {
    timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const todayIso = new Date().toLocaleString("sv-SE", { timeZone: tz }).slice(0, 10);
  lines.push("# CURRENT DATE & TIME (CRITICAL)");
  lines.push(`Today is ${nowStr} (timezone ${tz}).`);
  lines.push(`In YYYY-MM-DD format, today is ${todayIso}.`);
  lines.push("Use THESE values for any date math. When the caller says 'tomorrow', 'next week', 'next Monday', etc., compute from the date above — NEVER from your training data. Your training data is years old; the date above is the truth.");
  lines.push(`When passing a date to the manage_booking tool, format it as YYYY-MM-DD with the YEAR being ${todayIso.slice(0, 4)} (or later — never an older year).`);
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
  if (websiteContext) {
    lines.push("# ABOUT THIS BUSINESS (pulled from their website — use it to answer accurately; do NOT read it out verbatim)");
    lines.push(websiteContext);
    lines.push("");
  }
  lines.push("# WHAT TO FIND OUT (qualify naturally — a conversation, not an interrogation)");
  lines.push("- Caller's name");
  lines.push("- Best callback number");
  lines.push("- Service address or area");
  lines.push(`- ${V.qualify}`);
  if (V.insuranceLine) lines.push(`- ${V.insuranceLine}`);
  lines.push(`- How urgent it is (${V.urgency})`);
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
      lines.push("3. When they pick one, call `manage_booking` with action=\"book\", the exact start_time it gave you (ISO 8601), the caller_name, caller_phone, and caller_email if you have it.");
      lines.push("4. Only confirm the appointment AFTER the tool says it booked. Read back the day and time.");
      lines.push("Never invent a time or say 'booked' before the tool confirms it. If the tool says a slot was taken, offer another.");
      lines.push("Always still capture name + callback number even if they don't book.");
      lines.push("");
    }
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
  lines.push("- Never quote exact prices or guarantee pricing unless explicitly given a price to share. If pushed, say pricing depends on the job and the team will give an exact quote.");
  lines.push("- Never make up details you don't have (warranties, materials, timelines). If unsure, say a specialist will follow up.");
  lines.push("- Never guarantee a specific appointment time (see BOOKING).");
  lines.push("- Always get a name and callback number before the call ends.");
  lines.push(`- For emergencies (${V.emergency}): reassure them, mark it urgent, and make clear the team will call back fast.`);
  lines.push("");
  lines.push("# CLOSING");
  lines.push("Recap what you captured, confirm the callback number, thank them by name, and let them know the team will be in touch shortly.");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// DEMO agents — the public "Try the AI" web-call agent, one per trade + a
// generic default. Greets the SAME trade-neutral way for every trade; the
// difference is what it knows to ask about. No booking, no real business.
// ---------------------------------------------------------------------------

const DEMO_GREETING = "Thanks for calling! How can I help you today?";
const GENERIC_QUALIFY = "what service they need, where they're located, and how soon they need it";

function buildDemoPrompt(verticalSlug) {
  const isGeneric = !verticalSlug || verticalSlug === "default" || !BACKEND_VERTICALS[verticalSlug];
  const qualify = isGeneric ? GENERIC_QUALIFY : BACKEND_VERTICALS[verticalSlug].qualify;
  const lines = [];
  lines.push("You are Ava, a friendly, sharp AI receptionist demonstrating Koemori — an AI phone receptionist for home-service businesses. This is a live demo call: the person calling is a business owner trying you out.");
  lines.push("");
  lines.push("# GREETING");
  lines.push(`You open every call with "${DEMO_GREETING}" Never name a specific trade or industry in your greeting.`);
  lines.push("");
  lines.push("# WHO YOU ARE");
  lines.push("If a business name is provided ({{business_name}}), answer as the front desk of that business. Otherwise be a warm, capable front desk for a home-service business. Never say the word 'demo' unless the caller asks whether you're an AI.");
  lines.push("");
  lines.push("# HOW YOU SOUND");
  lines.push("Warm, confident, down-to-earth, efficient. Short, natural sentences. Never robotic or scripted. Match the caller's pace.");
  lines.push("");
  lines.push("# WHAT TO DO");
  lines.push("Figure out what the caller needs and qualify naturally, like a great front desk would. For this kind of work that means asking about: " + qualify + ". Always get the caller's name and a callback number.");
  lines.push("If they want to book, capture their preferred day/time and tell them the team will confirm shortly — this is a demo, so don't claim a specific appointment is locked in.");
  lines.push("");
  lines.push("# HARD RULES");
  lines.push("- Never quote exact prices; say it depends on the job and the team will give a quote.");
  lines.push("- Never make up specific details (warranties, pricing, real availability).");
  lines.push("- Keep it short and impressive — this is a quick demo.");
  lines.push("- If the caller asks whether you're a real person, be honest: you're Koemori's AI receptionist.");
  return lines.join("\n");
}

module.exports = { BACKEND_VERTICALS, getBackendVertical, buildPrompt, postCallFields, buildDemoPrompt, DEMO_GREETING };
