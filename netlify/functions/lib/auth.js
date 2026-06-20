// Verifies a Supabase access token the SECURE way: by resolving it against the
// Supabase auth server (which checks the signature + expiry), instead of just
// base64-decoding the payload and trusting it. A forged or expired token
// returns null. Returns the verified user object ({ id, email, ... }) or null.
//
// Bundled-on-require, not a published endpoint (lives in functions/lib/).

const { createClient } = require("@supabase/supabase-js");

async function getVerifiedUser(token) {
  if (!token || typeof token !== "string") return null;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data || !data.user || !data.user.email) return null;
    return data.user;
  } catch {
    return null;
  }
}

module.exports = { getVerifiedUser };
