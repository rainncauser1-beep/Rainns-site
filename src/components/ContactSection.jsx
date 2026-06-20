import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check, Calendar } from "lucide-react";
import { saveContactSubmission } from "../lib/supabase";

const CAL_LINK = "https://cal.com/rainn/15-min-meeting";

const EASE = [0.22, 1, 0.36, 1];

export default function ContactSection() {
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", business_name: "", email: "", phone: "", website: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // SMS consent is OPTIONAL (TCPA / 10DLC: not a condition of purchase).
    // We record whether they actually checked the box so we only text the
    // ones who opted in.
    await saveContactSubmission({ ...form, sms_consent: consent });
    // Fire auto-reply — best effort, never block the success state
    fetch("/.netlify/functions/help-autoreply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email }),
    }).catch(() => {});
    setSubmitted(true);
    setLoading(false);
  };

  const inputCls =
    "bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400 text-slate-800 w-full";

  return (
    <section id="contact" className="relative px-6 py-28 bg-cream-50 border-t border-slate-900/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
            Get Started
          </div>
          <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] mb-5 text-balance">
            Get your <span className="italic text-rain-700">free AI Visibility Audit.</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            We'll show you exactly how invisible your business is to ChatGPT, Perplexity, and
            Gemini — and how many leads you're losing this week. No pitch. Just numbers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="bg-cream-100 border border-slate-900/8 rounded-3xl p-8 md:p-12"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10"
              >
                <div className="w-14 h-14 rounded-full bg-rain-700 text-cream-100 mx-auto flex items-center justify-center mb-6">
                  <Check className="w-7 h-7" />
                </div>
                <div className="font-display text-3xl text-slate-900 mb-3 tracking-tight">
                  You're in.
                </div>
                <p className="text-slate-600">
                  Your audit lands in your inbox within 24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="grid sm:grid-cols-2 gap-4"
              >
                <input required placeholder="Your name" value={form.name} onChange={set("name")} className={inputCls} />
                <input required placeholder="Business name" value={form.business_name} onChange={set("business_name")} className={inputCls} />
                <input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className={inputCls} />
                <input required type="tel" placeholder="Mobile number" value={form.phone} onChange={set("phone")} className={inputCls} />
                <input type="url" placeholder="Website (optional)" value={form.website} onChange={set("website")} className={`${inputCls} sm:col-span-2`} />

                <label className="sm:col-span-2 flex items-start gap-3 text-[13px] text-slate-600 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 text-rain-700 focus:ring-rain-500 flex-shrink-0"
                  />
                  <span>
                    By checking this box, I consent to receive text messages from Koemori.
                    Message/data rates apply. Consent is not a condition of purchase. Reply
                    STOP to cancel.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 group inline-flex items-center justify-center gap-2 bg-slate-900 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-cream-100/40 border-t-cream-100 rounded-full animate-spin" />
                  ) : (
                    <>
                      Run my audit
                      <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Report in &lt;24 hours · No credit card · 10DLC compliant
        </p>

        {/* Cal.com alternative path */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-10 bg-cream-100 border border-slate-900/8 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-rain-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-rain-700" />
            </div>
            <div>
              <div className="font-display text-xl text-slate-900 mb-1 tracking-tight">
                Or skip the form &mdash; book a 15-min call.
              </div>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                See exactly how the system works, get your questions answered, and decide if it's a fit. No pressure.
              </p>
            </div>
          </div>
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            Book 15-min call
          </a>
        </motion.div>
      </div>
    </section>
  );
}
