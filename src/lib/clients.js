import { supabase } from "./supabase";

export const PAYMENT_STATUSES = {
  unpaid:     { label: "Unpaid",     tone: "slate" },
  active:     { label: "Active",     tone: "emerald" },
  trialing:   { label: "Trialing",   tone: "rain" },
  paused:     { label: "Paused",     tone: "amber" },
  past_due:   { label: "Past Due",   tone: "amber" },
  canceling:  { label: "Canceling",  tone: "rose" },
  canceled:   { label: "Canceled",   tone: "rose" },
};

export const STATUSES = [
  { id: "lead", label: "Lead", tone: "slate" },
  { id: "booked", label: "Call Booked", tone: "rain" },
  { id: "onboarding", label: "Onboarding", tone: "amber" },
  { id: "live", label: "Live", tone: "emerald" },
  { id: "paused", label: "Paused", tone: "rose" },
];

export const CHECKLIST_STEPS = [
  { key: "step_intake_done", label: "Intake call completed" },
  { key: "step_agent_built", label: "Retell agent built & customized" },
  { key: "step_tested", label: "Test calls successful" },
  { key: "step_number_forwarded", label: "Customer's number forwarded" },
  { key: "step_sms_zap_live", label: "Lead alerts confirmed (email + SMS)" },
  { key: "step_calendar_synced", label: "Calendar integration tested" },
  { key: "step_client_trained", label: "Client trained on what to expect" },
  { key: "step_marked_live", label: "Marked live & monitoring" },
];

export function emptyClient() {
  return {
    business_name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    business_phone: "",
    industry: "",
    website: "",
    business_hours: "",
    services: "",
    top_objections: "",
    brand_voice_notes: "",
    crm: "",
    agent_display_name: "",
    retell_agent_id: "",
    retell_phone_number: "",
    cal_event_type_id: "",
    cal_timezone: "America/Chicago",
    zapier_webhook_url: "",
    status: "lead",
    notes: "",
    setup_fee: "",
    monthly_recurring: "",
    payment_status: "unpaid",
    stripe_customer_id: "",
    stripe_subscription_id: "",
    monthly_call_limit: 0,
    calls_this_month: 0,
    calls_reset_at: null,
    ...Object.fromEntries(CHECKLIST_STEPS.map((s) => [s.key, false])),
  };
}

export async function listClients() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listClients error:", error);
    return [];
  }
  return data ?? [];
}

export async function saveClient(client) {
  if (!supabase) throw new Error("Supabase not configured");
  // Normalize numeric fields
  const payload = {
    ...client,
    monthly_recurring:
      client.monthly_recurring === "" || client.monthly_recurring == null
        ? null
        : Number(client.monthly_recurring),
    setup_fee:
      client.setup_fee === "" || client.setup_fee == null
        ? null
        : Number(client.setup_fee),
    monthly_call_limit:
      client.monthly_call_limit === "" || client.monthly_call_limit == null
        ? 0
        : Number(client.monthly_call_limit),
  };
  // Strip id if not present, and timestamps (managed by db)
  delete payload.created_at;
  delete payload.updated_at;

  if (payload.id) {
    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    delete payload.id;
    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteClient(id) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export function checklistProgress(client) {
  const done = CHECKLIST_STEPS.filter((s) => client[s.key]).length;
  return { done, total: CHECKLIST_STEPS.length, pct: (done / CHECKLIST_STEPS.length) * 100 };
}
