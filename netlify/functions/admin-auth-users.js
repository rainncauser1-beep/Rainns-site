// Returns Supabase auth users that don't have a matching client row.
// These are people who received a magic link but aren't provisioned clients.
// Auth: admin bearer token only.

const { createClient } = require("@supabase/supabase-js");

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try { return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8")); }
  catch { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };
  }
  const jwt = verifyJwt(auth.slice(7));
  if (!jwt || jwt.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }
  if (jwt.exp && jwt.exp * 1000 < Date.now()) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token expired" }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch all auth users and client emails in parallel
  const [{ data: authData }, { data: clients }] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("clients").select("owner_email"),
  ]);

  const clientEmails = new Set((clients || []).map((c) => c.owner_email?.toLowerCase()).filter(Boolean));

  const unknown = (authData?.users || [])
    .filter((u) => u.email && u.email !== ADMIN_EMAIL && !clientEmails.has(u.email.toLowerCase()))
    .map((u) => ({
      email: u.email,
      last_sign_in: u.last_sign_in_at || null,
      created_at: u.created_at || null,
    }))
    .sort((a, b) => new Date(b.last_sign_in || b.created_at) - new Date(a.last_sign_in || a.created_at));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unknown }),
  };
};
