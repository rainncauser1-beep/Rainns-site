// Lets a signed-in client portal user update their own business info
// (business_hours, services, top_objections, brand_voice_notes).
//
// Why a Netlify function instead of direct Supabase update from the browser?
// — RLS can restrict by row, but not cleanly by column. The function
// enforces that only safe fields can change, while sensitive fields
// (retell_*, stripe_*, payment_status, monthly_recurring, etc.) stay
// locked down even if someone bypasses the UI.

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

function verifySupabaseJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  if (secret) {
    const expected = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
    if (expected !== sig) return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
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
]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Auth: extract user email from the Supabase JWT
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing bearer token" }) };
  }
  const token = auth.slice(7);

  const jwt = verifySupabaseJwt(token);
  if (!jwt) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
  if (!jwt.email) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token missing email" }) };
  }
  if (jwt.exp && jwt.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // Whitelist-filter the incoming fields
  const updates = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key) && typeof value === "string") {
      updates[key] = value;
    }
  }
  if (Object.keys(updates).length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "No allowed fields in request" }) };
  }

  // Update the client row matching this user's email
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("owner_email", jwt.email)
    .select("id, business_hours, services, top_objections, brand_voice_notes")
    .maybeSingle();

  if (error) {
    console.error("update-client-prefs error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
  if (!data) {
    return { statusCode: 404, body: JSON.stringify({ error: "No client row matches your email" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, client: data }),
  };
};
