import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, Calendar, Building2, Clock,
  MessageSquare, User, Loader2, Sparkles, Mic, ShieldCheck,
} from "lucide-react";
import CallDemoModal from "../components/CallDemoModal";

const EASE = [0.22, 1, 0.36, 1];
const CAL_LINK = "https://cal.com/rainn/15-min-meeting";

const INDUSTRIES = [
  "Residential roofing", "Commercial roofing", "Storm & restoration",
  "Repair & maintenance", "Mixed / full-service",
];

const inputCls =
  "w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-rain-500 transition placeholder:text-slate-400 text-slate-800";

const STEPS = [
  { id: "business", icon: Building2, title: "Your business", blurb: "The basics so we can brand your AI correctly." },
  { id: "ops", icon: Clock, title: "How you operate", blurb: "Hours and services your AI will speak to." },
  { id: "calls", icon: MessageSquare, title: "The calls you're missing", blurb: "What you want the AI to handle — and how it should sound." },
  { id: "contact", icon: User, title: "Where to reach you", blurb: "So we can confirm your call and send your AI details." },
];

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</div>}
    </label>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    business_name: "", industry: "", website: "", business_phone: "",
    business_hours: "", services: "",
    top_objections: "", brand_voice_notes: "", crm: "",
    owner_name: "", owner_email: "", owner_phone: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canAdvance = () => {
    if (step === 0) return form.business_name.trim().length > 0;
    if (step === 3) return form.owner_name.trim() && (form.owner_email.trim() || form.owner_phone.trim());
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      setError(step === 0 ? "Add your business name to continue." : "Add your name and an email or phone.");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    if (!canAdvance()) {
      setError("Add your name and an email or phone.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/submit-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Something went wrong (HTTP ${res.status})`);
      setDone(true);
    } catch (e) {
      setError(e.message || "Could not submit. Try again or just book a call below.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success screen ----
  if (done) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-lg text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-emerald-700" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight mb-4">
            You're in, {form.owner_name.split(" ")[0] || "let's go"}.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Everything about {form.business_name || "your business"} is saved. Last step —
            grab a 15-minute slot and we'll walk through your AI together, live.
          </p>
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-8 py-4 rounded-full text-lg font-medium hover:bg-rain-700 transition"
          >
            <Calendar className="w-5 h-5" />
            Book your 15-min call
          </a>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            No card needed · We build your AI before you pay a cent
          </p>
        </motion.div>
      </div>
    );
  }

  const ActiveStep = STEPS[step];
  const StepIcon = ActiveStep.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-cream-100 px-6 py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600">
            <Sparkles className="w-3 h-3 text-rain-500" />
            Set up your AI · Takes 3 minutes
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-slate-900 tracking-tight leading-tight">
            Let's build your receptionist.
          </h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: EASE }}
              className="h-full bg-gradient-to-r from-rain-500 to-rain-700 rounded-full"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-cream-50 border border-slate-900/8 rounded-3xl p-6 md:p-10">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-full bg-rain-100 flex items-center justify-center flex-shrink-0">
              <StepIcon className="w-4.5 h-4.5 text-rain-700" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-slate-900 tracking-tight leading-tight">
                {ActiveStep.title}
              </h2>
              <p className="text-[13px] text-slate-500">{ActiveStep.blurb}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={ActiveStep.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <Field label="Business name *">
                    <input className={inputCls} value={form.business_name} onChange={set("business_name")} placeholder="Apex Roofing" autoFocus />
                  </Field>
                  <Field label="Roofing focus">
                    <select className={inputCls} value={form.industry} onChange={set("industry")}>
                      <option value="">Select…</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Website">
                    <input className={inputCls} value={form.website} onChange={set("website")} placeholder="apexroofing.com" />
                  </Field>
                  <Field label="Business phone" hint="The number customers call today — the one we'll forward.">
                    <input type="tel" className={inputCls} value={form.business_phone} onChange={set("business_phone")} placeholder="(615) 555-0100" />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Field label="Business hours" hint="When you're open. The AI uses this to set expectations and book.">
                    <input className={inputCls} value={form.business_hours} onChange={set("business_hours")} placeholder="Mon–Fri 8am–6pm, Sat 9am–2pm" autoFocus />
                  </Field>
                  <Field label="Services you offer" hint="One per line or comma-separated. The more specific, the smarter the AI sounds.">
                    <textarea className={`${inputCls} min-h-[120px] resize-y`} value={form.services} onChange={set("services")} placeholder={"Roof repair\nFull replacement\nGutter installation\nStorm damage inspection"} />
                  </Field>
                  <Field label="CRM you use (optional)">
                    <input className={inputCls} value={form.crm} onChange={set("crm")} placeholder="GoHighLevel / HousecallPro / None" />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label="Common objections" hint="What do callers push back on? The AI will be ready with answers.">
                    <textarea className={`${inputCls} min-h-[100px] resize-y`} value={form.top_objections} onChange={set("top_objections")} placeholder={"Too expensive\nNeed to think about it\nGetting other quotes"} autoFocus />
                  </Field>
                  <Field label="Brand voice" hint="How should it sound? Friendly, direct, formal? Any words to use or avoid?">
                    <textarea className={`${inputCls} min-h-[100px] resize-y`} value={form.brand_voice_notes} onChange={set("brand_voice_notes")} placeholder="Warm and down-to-earth. Use 'y'all'. Never sound pushy or salesy." />
                  </Field>
                </>
              )}

              {step === 3 && (
                <>
                  <Field label="Your name *">
                    <input className={inputCls} value={form.owner_name} onChange={set("owner_name")} placeholder="Jane Smith" autoFocus />
                  </Field>
                  <Field label="Email" hint="We'll send your AI number + portal access here.">
                    <input type="email" className={inputCls} value={form.owner_email} onChange={set("owner_email")} placeholder="jane@apexroofing.com" />
                  </Field>
                  <Field label="Mobile" hint="Where we reach you about new leads.">
                    <input type="tel" className={inputCls} value={form.owner_phone} onChange={set("owner_phone")} placeholder="(615) 555-0123" />
                  </Field>
                  <div className="flex items-start gap-2.5 text-[12px] text-slate-500 bg-cream-100 border border-slate-900/8 rounded-xl px-4 py-3">
                    <ShieldCheck className="w-4 h-4 text-rain-600 mt-0.5 flex-shrink-0" />
                    We only use this to set up your AI and confirm your call. No spam, no sharing — ever.
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between gap-3 mt-8">
            {step > 0 ? (
              <button onClick={back} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-full text-sm font-medium transition">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button onClick={() => setCallOpen(true)} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-full text-sm font-medium transition">
                <Mic className="w-4 h-4" /> Try the demo first
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button onClick={next} className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {submitting ? "Saving…" : "Finish & book my call"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-[12px] text-slate-500">
          Prefer to just talk?{" "}
          <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="text-rain-700 hover:text-rain-600 font-medium transition">
            Skip ahead and book a call
          </a>
        </p>
      </div>

      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} />
    </div>
  );
}
