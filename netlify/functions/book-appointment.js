// Retell custom-function endpoint that lets the AI check availability and
// book estimates on a client's Cal.com calendar, live during the call.
//
// Retell invokes this with: { call: { agent_id, ... }, name, args: {...} }
// We look up the client by agent_id, read their cal_event_type_id, and call
// Cal.com v2. Returns { result: "<text for the AI to speak/use>" }.
//
// Required env: SUPABASE_SERVICE_ROLE_KEY, CALCOM_API_KEY
//
// NOTE: Cal.com's API version headers/paths occasionally change — the two
// CAL_API_VERSION_* constants below are the calibration points if a call 4xxs.

const { createClient } = require("@supabase/supabase-js");

const CAL_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION_SLOTS = "2024-09-04";
const CAL_API_VERSION_BOOKINGS = "2024-08-13";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return reply("This endpoint only accepts POST.");
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return reply("Sorry, I couldn't read that request.");
  }

  const agentId = body?.call?.agent_id || body?.agent_id;
  const args = body?.args || body?.arguments || {};
  const action = args.action || "check_availability";

  if (!agentId) return reply("I'm not able to access the calendar right now — let me take your details instead.");

  const calKey = process.env.CALCOM_API_KEY;
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, cal_event_type_id, cal_timezone, jobnimbus_api_key")
    .eq("retell_agent_id", agentId)
    .maybeSingle();

  // JobNimbus path — takes priority over Cal.com if connected
  if (client?.jobnimbus_api_key) {
    try {
      return await handleJobNimbus({ client, action, args });
    } catch (e) {
      console.error("JobNimbus booking error:", e.message);
      return reply("I had trouble adding this to JobNimbus — take their details and the team will follow up.");
    }
  }

  if (!client || !client.cal_event_type_id || !calKey) {
    // Booking not configured — tell the AI to fall back to capturing the request
    return reply(
      "Live booking isn't set up, so don't promise a time. Take the caller's name, number, and preferred day/time, and let them know the team will text to confirm."
    );
  }

  const eventTypeId = Number(client.cal_event_type_id);
  const timeZone = client.cal_timezone || "America/Chicago";

  try {
    if (action === "book") {
      return await bookSlot({ calKey, eventTypeId, timeZone, args, client });
    }
    return await checkAvailability({ calKey, eventTypeId, timeZone, args });
  } catch (e) {
    console.error("book-appointment error:", e.message);
    return reply("I had trouble reaching the calendar — let me take your details and the team will confirm your time by text.");
  }
};

async function checkAvailability({ calKey, eventTypeId, timeZone, args }) {
  // Default to a 7-day window starting from the requested date (or today)
  let startDate = args.date ? new Date(args.date) : new Date();
  if (isNaN(startDate.getTime())) return reply("What day works best for you?");
  // Defensive: LLMs often hallucinate dates from their training cutoff (e.g.,
  // sending 2023 when it's actually 2026). Clamp to today if in the past.
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (startDate < today) startDate = today;
  const start = startDate.toISOString().slice(0, 10);
  // Widen to 14 days so "next week" / "the week after" still find slots.
  const endDate = new Date(startDate.getTime() + 14 * 86400000);
  const end = endDate.toISOString().slice(0, 10);

  const url = `${CAL_BASE}/slots?eventTypeId=${eventTypeId}&start=${start}&end=${end}&timeZone=${encodeURIComponent(timeZone)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${calKey}`, "cal-api-version": CAL_API_VERSION_SLOTS },
  });
  if (!res.ok) {
    console.error("Cal slots error:", res.status, await res.text());
    return reply("I couldn't pull up open times just now — let me take your preferred day and the team will confirm.");
  }
  const data = await res.json();
  const slotsByDay = data?.data || data?.slots || {};
  const flat = [];
  for (const day of Object.keys(slotsByDay)) {
    for (const s of slotsByDay[day]) {
      flat.push(s.start || s.time || s);
    }
  }
  if (flat.length === 0) {
    return reply("There's nothing open in that window. Ask the caller for another day or a general preference, then we can try again.");
  }
  // Return up to 24 slots so the model sees the whole day(s) and can match
  // morning/afternoon/specific-time requests — not just the first 3.
  const available = flat.slice(0, 24);
  const friendlyList = available.map((iso) => friendlyTime(iso, timeZone));
  return reply(
    `These times are OPEN (already filtered to real availability): ${friendlyList.join("; ")}. ` +
    `Pick the 2–3 that best match what the caller asked for and offer those. ` +
    `If the caller asked for a specific time (e.g. "2 PM"), check whether it's in this list and confirm it if so. ` +
    `If not, tell them that exact time isn't open and offer the closest available time from the list. ` +
    `When the caller chooses, call this function again with action="book" and the EXACT start_time from open_slots_iso below.`,
    { open_slots_iso: available }
  );
}

async function bookSlot({ calKey, eventTypeId, timeZone, args, client }) {
  const rawStart = args.start_time || args.start;
  if (!rawStart) return reply("I need the exact time to book — ask the caller to pick one of the open times first.");

  // Defensive: if the LLM passed a past start_time (date hallucination),
  // recover by finding a real future slot with the matching time-of-day.
  let resolvedStartISO = new Date(rawStart).toISOString();
  const requestedDate = new Date(rawStart);
  const now = new Date();
  if (requestedDate < now) {
    const hhmm = String(rawStart).slice(11, 16); // "10:00" from "...T10:00:00..."
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    try {
      const sRes = await fetch(
        `${CAL_BASE}/slots?eventTypeId=${eventTypeId}&start=${start}&end=${end}&timeZone=${encodeURIComponent(timeZone)}`,
        { headers: { Authorization: `Bearer ${calKey}`, "cal-api-version": CAL_API_VERSION_SLOTS } }
      );
      if (sRes.ok) {
        const sData = await sRes.json();
        const byDay = sData?.data || {};
        const todayStr = today.toISOString().slice(0, 10);
        // Prefer the first FUTURE day (skip today, caller likely meant tomorrow)
        for (const day of Object.keys(byDay).sort()) {
          if (day === todayStr) continue;
          const slots = byDay[day] || [];
          const match = slots.find((s) => String(s.start || s).slice(11, 16) === hhmm);
          if (match) { resolvedStartISO = new Date(match.start || match).toISOString(); break; }
        }
      }
    } catch {}
  }

  const name = args.caller_name || "Caller";
  const phoneDigits = String(args.caller_phone || "").replace(/\D/g, "");
  const email = args.caller_email && /\S+@\S+\.\S+/.test(args.caller_email)
    ? args.caller_email
    : `lead${phoneDigits || Date.now()}@koemori.ai`;

  const payload = {
    start: resolvedStartISO,
    eventTypeId,
    attendee: {
      name,
      email,
      timeZone,
      ...(phoneDigits ? { phoneNumber: `+1${phoneDigits.slice(-10)}` } : {}),
      language: "en",
    },
    metadata: { source: "koemori-ai", business: client.business_name || "" },
  };

  const res = await fetch(`${CAL_BASE}/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${calKey}`,
      "cal-api-version": CAL_API_VERSION_BOOKINGS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Cal booking error:", res.status, errText);
    // Likely the slot was just taken — tell the AI to offer another
    return reply("That time didn't go through — it may have just been taken. Offer the caller another open time and try again.");
  }

  return reply(
    `Booked! Confirm to the caller: "${friendlyTime(resolvedStartISO, timeZone)}". Tell them they'll get a confirmation and the team will see them then.`
  );
}

function friendlyTime(iso, timeZone) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      timeZone,
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// JobNimbus: create contact + appointment task. No availability check exists
// in the JN API — the AI just asks for a preferred time and books directly.
async function handleJobNimbus({ client, action, args }) {
  const apiKey = client.jobnimbus_api_key;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const base = "https://app.jobnimbus.com/api1";

  // check_availability: tell the AI no check is needed, just ask for time
  if (action === "check_availability") {
    return reply(
      "JobNimbus is connected — no availability check needed. " +
      "Ask the caller what day and time works best for an estimate, then call this function again with action='book' and the time they give you."
    );
  }

  // book: create a contact then an appointment task
  const name = args.caller_name || "New Lead";
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";
  const phone = String(args.caller_phone || "").replace(/\D/g, "");
  const rawTime = args.start_time || args.preferred_time || "";

  // Create (or find) the contact
  const contactPayload = {
    record_type_name: "Customer",
    status_name: "New Lead",
    first_name: firstName,
    last_name: lastName,
    ...(phone ? { phone } : {}),
    ...(args.caller_email ? { email: args.caller_email } : {}),
    source_name: "Koemori AI",
  };

  let contactId = null;
  const contactRes = await fetch(`${base}/contacts`, {
    method: "POST",
    headers,
    body: JSON.stringify(contactPayload),
  });
  if (contactRes.ok) {
    const contactData = await contactRes.json().catch(() => ({}));
    contactId = contactData?.jnid || contactData?.id || null;
  } else {
    console.error("JN contact create failed:", contactRes.status, await contactRes.text());
  }

  // Parse the requested time into epoch seconds for JN
  let dateStart = null;
  let dateEnd = null;
  if (rawTime) {
    const d = new Date(rawTime);
    if (!isNaN(d.getTime())) {
      dateStart = Math.floor(d.getTime() / 1000);
      dateEnd = dateStart + 3600; // default 1 hour estimate
    }
  }
  if (!dateStart) {
    // No parseable time — still create the lead without a scheduled time
    const now = Math.floor(Date.now() / 1000);
    dateStart = now;
    dateEnd = now + 3600;
  }

  const taskPayload = {
    record_type_name: "Appointment",
    title: `Estimate — ${name}`,
    date_start: dateStart,
    date_end: dateEnd,
    ...(contactId ? { related: [{ id: contactId }] } : {}),
  };

  const taskRes = await fetch(`${base}/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify(taskPayload),
  });

  if (!taskRes.ok) {
    const errText = await taskRes.text();
    console.error("JN task create failed:", taskRes.status, errText);
    // Contact was created even if task failed — still a win
    return reply(
      contactId
        ? `Lead added to JobNimbus as ${name}. The appointment scheduling hit an issue — let the caller know the team will call to confirm the exact time.`
        : "I had trouble adding to JobNimbus — take their details and the team will follow up."
    );
  }

  const friendlyBooked = rawTime
    ? friendlyTime(rawTime, client.cal_timezone || "America/Chicago")
    : "the requested time";

  return reply(
    `Booked in JobNimbus. Confirm to the caller: "${name} is set for ${friendlyBooked}." ` +
    `Tell them the team will send a confirmation and they'll get a reminder before the appointment.`
  );
}

function reply(result, extra = {}) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, ...extra }),
  };
}
