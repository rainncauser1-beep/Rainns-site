import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trash2, Check, Save, AlertCircle, Building2, Phone, Wrench,
  Wifi, ListChecks, StickyNote, Loader2,
} from "lucide-react";
import { STATUSES, CHECKLIST_STEPS, emptyClient, saveClient, deleteClient } from "../lib/clients";

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

  const isEdit = Boolean(client?.id);

  useEffect(() => {
    if (open) {
      setForm(client ? { ...emptyClient(), ...client } : emptyClient());
      setError("");
      setConfirmDelete(false);
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
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <Field label="Retell agent ID" full>
                    <input className={inputCls + " font-mono text-[12px]"} value={form.retell_agent_id} onChange={update("retell_agent_id")} placeholder="agent_xxxxxxxxxxxx" />
                  </Field>
                  <Field label="Retell phone number">
                    <input className={inputCls} value={form.retell_phone_number} onChange={update("retell_phone_number")} placeholder="+1 (615) 555-..." />
                  </Field>
                  <Field label="Monthly recurring ($)">
                    <input type="number" step="0.01" className={inputCls} value={form.monthly_recurring} onChange={update("monthly_recurring")} placeholder="497" />
                  </Field>
                  <Field label="Zapier webhook URL" full hint="For SMS lead notifications">
                    <input className={inputCls + " font-mono text-[12px]"} value={form.zapier_webhook_url} onChange={update("zapier_webhook_url")} placeholder="https://hooks.zapier.com/..." />
                  </Field>
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
