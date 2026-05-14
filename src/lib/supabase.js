import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Graceful no-op when env vars aren't set yet (local dev without Supabase)
export const supabase = url && key ? createClient(url, key) : null;

export async function logDemoTrial({ email }) {
  if (!supabase) return;
  await supabase
    .from("demo_trials")
    .upsert({ email, last_call_at: new Date().toISOString() }, { onConflict: "email" });
}

export async function incrementDemoTrial(email) {
  if (!supabase) return;
  await supabase.rpc("increment_trial", { p_email: email });
}

export async function saveContactSubmission(data) {
  if (!supabase) return;
  await supabase.from("contact_submissions").insert(data);
}

export async function saveWaitlistSignup({ email, service }) {
  if (!supabase) return;
  await supabase.from("waitlist_signups").insert({ email, service });
}
