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
  // --- TEMPORARY DIAGNOSTIC (remove after calibration) ---
  // GET ?diag_user=rainn&slug=...  -> finds the event type id, then tries
  // several slot API variants and returns the raw responses so we can see
  // exactly what Cal.com returns.
  if (event.httpMethod === "GET" && event.queryStringParameters?.diag_user) {
    const calKey = process.env.CALCOM_API_KEY;
    if (!calKey) return { statusCode: 200, body: JSON.stringify({ error: "CALCOM_API_KEY not set" }) };
    const username = event.queryStringParameters.diag_user;
    const wantSlug = event.queryStringParameters.slug || "";
    const out = { eventTypes: null, matchedId: null, slotAttempts: [] };
    try {
      const etRes = await fetch(`${CAL_BASE}/event-types?username=${encodeURIComponent(username)}`, {
        headers: { Authorization: `Bearer ${calKey}`, "cal-api-version": "2024-06-14" },
      });
      const etText = await etRes.text();
      let etJson = {};
      try { etJson = JSON.parse(etText); } catch {}
      const list = etJson?.data || etJson?.event_types || [];
      out.eventTypes = Array.isArray(list) ? list.map((e) => ({ id: e.id, slug: e.slug, title: e.title })) : etText.slice(0, 400);
      const match = Array.isArray(list) ? list.find((e) => e.slug === wantSlug) || list[0] : null;
      out.matchedId = match?.id || null;

      if (out.matchedId) {
        const start = new Date().toISOString().slice(0, 10);
        const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        const variants = [
          { label: "v2024-09-04 /slots start&end", v: "2024-09-04", url: `${CAL_BASE}/slots?eventTypeId=${out.matchedId}&start=${start}&end=${end}&timeZone=America/Chicago` },
          { label: "v2024-09-04 /slots startTime&endTime", v: "2024-09-04", url: `${CAL_BASE}/slots?eventTypeId=${out.matchedId}&startTime=${start}&endTime=${end}&timeZone=America/Chicago` },
          { label: "v2024-08-13 /slots/available", v: "2024-08-13", url: `${CAL_BASE}/slots/available?eventTypeId=${out.matchedId}&startTime=${start}T00:00:00Z&endTime=${end}T00:00:00Z` },
        ];
        for (const a of variants) {
          try {
            const r = await fetch(a.url, { headers: { Authorization: `Bearer ${calKey}`, "cal-api-version": a.v } });
            const t = await r.text();
            out.slotAttempts.push({ label: a.label, status: r.status, body: t.slice(0, 700) });
          } catch (e) {
            out.slotAttempts.push({ label: a.label, error: e.message });
          }
        }
      }
    } catch (e) {
      out.error = e.message;
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(out, null, 2) };
  }
  // --- END DIAGNOSTIC ---

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
    .select("id, business_name, cal_event_type_id, cal_timezone")
    .eq("retell_agent_id", agentId)
    .maybeSingle();

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
  const startDate = args.date ? new Date(args.date) : new Date();
  if (isNaN(startDate.getTime())) return reply("What day works best for you?");
  const start = startDate.toISOString().slice(0, 10);
  const endDate = new Date(startDate.getTime() + 7 * 86400000);
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
  const offered = flat.slice(0, 3).map((iso) => friendlyTime(iso, timeZone));
  return reply(
    `These times are open: ${offered.join("; ")}. Offer these to the caller. When they pick one, call this function again with action="book", the exact start_time (ISO 8601), caller_name, caller_phone, and caller_email if given.`,
    { open_slots_iso: flat.slice(0, 3) }
  );
}

async function bookSlot({ calKey, eventTypeId, timeZone, args, client }) {
  const start = args.start_time || args.start;
  if (!start) return reply("I need the exact time to book — ask the caller to pick one of the open times first.");

  const name = args.caller_name || "Caller";
  const phoneDigits = String(args.caller_phone || "").replace(/\D/g, "");
  const email = args.caller_email && /\S+@\S+\.\S+/.test(args.caller_email)
    ? args.caller_email
    : `lead${phoneDigits || Date.now()}@koemori.ai`;

  const payload = {
    start: new Date(start).toISOString(),
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
    `Booked! Confirm to the caller: "${friendlyTime(start, timeZone)}". Tell them they'll get a confirmation and the team will see them then.`
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

function reply(result, extra = {}) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, ...extra }),
  };
}
