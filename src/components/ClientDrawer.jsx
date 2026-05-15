import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trash2, Check, Save, AlertCircle, Building2, Phone, Wrench,
  Wifi, ListChecks, StickyNote, Loader2, Sparkles, Copy, CreditCard,
  ExternalLink, CheckCircle2,
} from "lucide-react";
import { STATUSES, CHECKLIST_STEPS, PAYMENT_STATUSES, emptyClient, saveClient, deleteClient } from "../lib/clients";
import { supabase } from "../lib/supabase";

const EASE = [0.22, 1, 0.36, 1];

const INDUSTRIES = [
  "Roofing", "HVAC", "Plumbing", "Electrical", "Med Spa",
  "Auto Detailing", "Landscaping", "Pest Control", "Locksmith", "Other",
];

function Field({ label, children, hint, full = false }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-rain-600" />
        <h3 className="font-display text-lg text-slate-900 tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const inputCls =
  "bg-cream-100 border border-slate-900/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400 text-slate-800 w-full";

export default function ClientDrawer({ open, client, onClose, onSaved }) {
  const [form, setForm] = useState(emptyClient());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const isEdit = Boolean(client?.id);

  useEffect(() => {
    if (open) {
      setForm(client ? { ...emptyClient(), ...client } : emptyClient());
      setError("");
      setProvisionMsg("");
      setConfirmDelete(false);
      setCheckoutUrl("");
    }
  }, [open, client]);

  const update = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const toggleStep = (k) => setForm((f) => ({ ...f, [k]: !f[k] }));

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      setError("Business name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await saveClient(form);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(e.message ?? "Could not save client.");
    } finally {
      setSaving(false);
    }
  };

  const handleProvision = async () => {
    if (!form.business_name.trim()) {
      setError("Add a business name before provisioning.");
      return;
    }
    setProvisioning(true);
    setProvisionMsg("");
    setError("");
    try {
      // Get current Supabase session token to authorize the function call
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (!token) throw new Error("You need to be signed in to provision an agent.");

      const res = await fetch("/.netlify/functions/provision-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_name: form.business_name,
          industry: form.industry,
          business_hours: form.business_hours,
          services: form.services,
          top_objections: form.top_objections,
          brand_voice_notes: form.brand_voice_notes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || `Provisioning failed (HTTP ${res.status}).`);
      }

      // Persist returned IDs and auto-tick "agent built" checklist step
      setForm((f) => ({
        ...f,
        retell_agent_id: data.agent_id,
        retell_phone_number: data.phone_number || f.retell_phone_number,
        step_agent_built: true,
      }));
      if (data.phone_number) {
        setProvisionMsg(`Agent ${data.agent_id} · Number ${data.phone_number}`);
      } else if (data.phone_error) {
        setProvisionMsg(`Agent created · Phone failed: ${data.phone_error.slice(0, 80)}`);
      } else {
        setProvisionMsg(`Agent created: ${data.agent_id}`);
      }
    } catch (e) {
      setError(e.message ?? "Could not provision agent.");
    } finally {
      setProvisioning(false);
    }
  };

  const copyAgentId = async () => {
    if (!form.retell_agent_id) return;
    try {
      await navigator.clipboard.writeText(form.retell_agent_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleGenerateLink = async () => {
    const setupNum = Number(form.setup_fee);
    const monthlyNum = Number(form.monthly_recurring);
    if (!Number.isFinite(monthlyNum) || monthlyNum <= 0) {
      setError("Enter a monthly amount before generating the link.");
      return;
    }
    if (form.setup_fee !== "" && (!Number.isFinite(setupNum) || setupNum < 0)) {
      setError("Setup fee must be a positive number (or blank for $0).");
      return;
    }

    setGeneratingLink(true);
    setCheckoutUrl("");
    setError("");
    try {
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (!token) throw new Error("You need to be signed in to generate a payment link.");

      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: form.id,
          client_email: form.owner_email || undefined,
          client_name: form.business_name || undefined,
          setup_amount: form.setup_fee === "" ? 0 : setupNum,
          monthly_amount: monthlyNum,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (HTTP ${res.status})`);
      setCheckoutUrl(data.url);
    } catch (e) {
      setError(e.message ?? "Could not generate payment link.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyCheckoutUrl = async () => {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    setDeleting(true);
    try {
      await deleteClient(client.id);
      onSaved?.(null);
      onClose();
    } catch (e) {
      setError(e.message ?? "Could not delete.");
      setDeleting(false);
    }
  };

  const checklistDone = CHECKLIST_STEPS.filter((s) => form[s.key]).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[640px] bg-cream-100 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-900/8 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
                  {isEdit ? "Edit Client" : "New Client"}
                </div>
                <h2 className="font-display text-2xl text-slate-900 tracking-tight truncate">
                  {form.business_name || "Untitled client"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Status pill */}
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setForm((f) => ({ ...f, status: s.id }))}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition ${
                      form.status === s.id
                        ? "bg-slate-900 text-cream-100"
                        : "bg-cream-50 border border-slate-900/8 text-slate-600 hover:border-slate-900/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Business info */}
              <Section icon={Building2} title="Business info">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <Field label="Business name *">
                    <input className={inputCls} value={form.business_name} onChange={update("business_name")} placeholder="Apex Roofing" />
                  </Field>
                  <Field label="Industry">
                    <select className={inputCls} value={form.industry} onChange={update("industry")}>
                      <option value="">Select…</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Owner name">
                    <input className={inputCls} value={form.owner_name} onChange={update("owner_name")} placeholder="Jane Smith" />
                  </Field>
                  <Field label="Owner email">
                    <input type="email" className={inputCls} value={form.owner_email} onChange={update("owner_email")} placeholder="jane@apexroofing.com" />
                  </Field>
                  <Field label="Owner mobile" hint="For SMS lead notifications">
                    <input type="tel" className={inputCls} value={form.owner_phone} onChange={update("owner_phone")} placeholder="(615) 555-0123" />
                  </Field>
                  <Field label="Business phone" hint="Their current number to forward">
                    <input type="tel" className={inputCls} value={form.business_phone} onChange={update("business_phone")} placeholder="(615) 555-0100" />
                  </Field>
                  <Field label="Website" full>
                    <input type="url" className={inputCls} value={form.website} onChange={update("website")} placeholder="apexroofing.com" />
                  </Field>
                </div>
              </Section>

              {/* Agent setup */}
              <Section icon={Wrench} title="Agent configuration">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <Field label="Business hours" full hint="e.g. Mon–Fri 8am–6pm, Sat 9am–2pm">
                    <input className={inputCls} value={form.business_hours} onChange={update("business_hours")} />
                  </Field>
                  <Field label="Services offered" full hint="One per line or comma-separated">
                    <textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.services} onChange={update("services")} placeholder="Roofing&#10;Gutters&#10;Repairs" />
                  </Field>
                  <Field label="Top objections to handle" full hint="One per line">
                    <textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.top_objections} onChange={update("top_objections")} placeholder="Too expensive&#10;Need to think about it&#10;Already have someone" />
                  </Field>
                  <Field label="Brand voice notes" full hint="Tone, do's and don'ts">
                    <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.brand_voice_notes} onChange={update("brand_voice_notes")} placeholder="Friendly, direct, no fluff. Use 'y'all' but no other slang." />
                  </Field>
                  <Field label="CRM in use" full>
                    <input className={inputCls} value={form.crm} onChange={update("crm")} placeholder="GoHighLevel / HouseCallPro / None" />
                  </Field>
                </div>
              </Section>

              {/* Technical */}
              <Section icon={Wifi} title="Technical wiring">
                {/* Auto-provision card */}
                <div className="mb-5 p-4 bg-gradient-to-br from-rain-50 to-cream-50 border border-rain-200 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-rain-700" />
                        <span className="font-display text-sm text-slate-900 tracking-tight">
                          Auto-provision Retell agent
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">
                        Creates a fully-configured LLM + voice agent from this client's intake data. Pulls business name, hours, services, objections, and brand voice into the system prompt.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleProvision}
                      disabled={provisioning}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 bg-slate-900 text-cream-100 px-3 py-2 rounded-full text-[12px] font-medium hover:bg-rain-700 transition disabled:opacity-50"
                    >
                      {provisioning ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Provisioning…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          {form.retell_agent_id ? "Re-provision" : "Provision"}
                        </>
                      )}
                    </button>
                  </div>
                  {provisionMsg && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-mono truncate">{provisionMsg}</span>
                      <button onClick={copyAgentId} className="ml-auto flex-shrink-0 hover:text-emerald-900 transition">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <Field label="Retell agent ID" full>
                    <input className={inputCls + " font-mono text-[12px]"} value={form.retell_agent_id} onChange={update("retell_agent_id")} placeholder="agent_xxxxxxxxxxxx" />
                  </Field>
                  <Field label="Retell phone number" full>
                    <input className={inputCls} value={form.retell_phone_number} onChange={update("retell_phone_number")} placeholder="+1 (615) 555-..." />
                  </Field>
                  <Field label="Zapier webhook URL" full hint="For SMS lead notifications">
                    <input className={inputCls + " font-mono text-[12px]"} value={form.zapier_webhook_url} onChange={update("zapier_webhook_url")} placeholder="https://hooks.zapier.com/..." />
                  </Field>
                </div>
              </Section>

              {/* Payment */}
              <Section icon={CreditCard} title="Payment">
                {/* Custom price inputs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Field label="Setup fee ($)" hint="One-time, charged on first invoice">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        className={inputCls + " pl-7"}
                        value={form.setup_fee}
                        onChange={update("setup_fee")}
                        placeholder="500"
                      />
                    </div>
                  </Field>
                  <Field label="Monthly ($)" hint="Recurring subscription">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        className={inputCls + " pl-7"}
                        value={form.monthly_recurring}
                        onChange={update("monthly_recurring")}
                        placeholder="197"
                      />
                    </div>
                  </Field>
                </div>

                {/* First invoice preview */}
                {(Number(form.setup_fee) > 0 || Number(form.monthly_recurring) > 0) && (
                  <div className="mb-4 p-3 bg-cream-100 border border-slate-900/8 rounded-xl">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2">
                      First invoice
                    </div>
                    <div className="flex justify-between text-[13px] text-slate-700 mb-1">
                      <span>Setup fee</span>
                      <span className="font-mono tabular-nums">
                        ${Number(form.setup_fee || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] text-slate-700 mb-2 pb-2 border-b border-slate-900/8">
                      <span>First month</span>
                      <span className="font-mono tabular-nums">
                        ${Number(form.monthly_recurring || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[14px] font-medium text-slate-900">
                      <span>Due today</span>
                      <span className="font-mono tabular-nums">
                        ${(Number(form.setup_fee || 0) + Number(form.monthly_recurring || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Then ${Number(form.monthly_recurring || 0).toLocaleString()}/mo recurring
                    </div>
                  </div>
                )}

                {/* Payment status */}
                {form.payment_status && form.payment_status !== "unpaid" && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-4 ${
                    form.payment_status === "active"   ? "bg-emerald-100 text-emerald-800" :
                    form.payment_status === "past_due" ? "bg-amber-100 text-amber-800" :
                    form.payment_status === "canceled" ? "bg-rose-100 text-rose-800" :
                                                         "bg-slate-100 text-slate-700"
                  }`}>
                    {form.payment_status === "active" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {PAYMENT_STATUSES[form.payment_status]?.label ?? form.payment_status}
                    {form.payment_status === "active" && form.stripe_subscription_id && (
                      <span className="font-mono opacity-60 text-[10px]">
                        · sub_{form.stripe_subscription_id.slice(-6)}
                      </span>
                    )}
                  </div>
                )}

                {/* Generate link */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-cream-50 border border-slate-200 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 mb-0.5">Send payment link</div>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        Generates a Stripe Checkout link with the amounts above. Text or email it to the client.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      disabled={generatingLink || !form.id}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 bg-slate-900 text-cream-100 px-3 py-2 rounded-full text-[12px] font-medium hover:bg-rain-700 transition disabled:opacity-50"
                      title={!form.id ? "Save the client first to generate a link" : ""}
                    >
                      {generatingLink ? (
                        <><Loader2 className="w-3 h-3 animate-spin" />Generating…</>
                      ) : (
                        <><CreditCard className="w-3 h-3" />Generate</>
                      )}
                    </button>
                  </div>
                  {!form.id && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Save this client first, then generate the payment link.
                    </div>
                  )}
                  {checkoutUrl && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-1">
                      <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 font-mono text-[11px] text-emerald-800 truncate hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {checkoutUrl.replace("https://checkout.stripe.com/c/pay/", "stripe.com/…")}
                      </a>
                      <button
                        onClick={copyCheckoutUrl}
                        className="flex-shrink-0 text-emerald-700 hover:text-emerald-900 transition"
                        title="Copy link"
                      >
                        {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* Checklist */}
              <Section icon={ListChecks} title={`Go-Live Checklist · ${checklistDone}/${CHECKLIST_STEPS.length}`}>
                <div className="space-y-2">
                  {CHECKLIST_STEPS.map((step, i) => (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => toggleStep(step.key)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        form[step.key]
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-cream-100 border border-slate-900/8 hover:border-slate-900/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        form[step.key] ? "bg-emerald-600 text-white" : "bg-cream-200 text-slate-400"
                      }`}>
                        {form[step.key] ? <Check className="w-3 h-3" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                      </div>
                      <span className={`text-[14px] ${form[step.key] ? "text-emerald-900 line-through" : "text-slate-700"}`}>
                        {step.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Notes */}
              <Section icon={StickyNote} title="Notes">
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y`}
                  value={form.notes}
                  onChange={update("notes")}
                  placeholder="Internal notes about this client, custom asks, etc."
                />
              </Section>

              {/* Danger zone */}
              {isEdit && (
                <div className="pt-2">
                  {confirmDelete ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-rose-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Delete this client permanently?
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 rounded-full text-sm bg-white border border-slate-900/10 text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="px-3 py-1.5 rounded-full text-sm bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                        >
                          {deleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-2 text-sm text-rose-700 hover:text-rose-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete client
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-900/8 bg-cream-50 flex items-center justify-between gap-3 flex-shrink-0">
              {error ? (
                <span className="text-sm text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {error}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                  {isEdit ? "Saved changes auto-track" : "Will be added to your pipeline"}
                </span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full text-sm bg-cream-100 border border-slate-900/10 text-slate-700 hover:border-slate-900/30 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-slate-900 text-cream-100 hover:bg-rain-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEdit ? "Save changes" : "Add client"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
