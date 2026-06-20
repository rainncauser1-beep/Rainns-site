import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, PhoneCall } from "lucide-react";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";
import { VERTICALS } from "../config/verticals";
import { accentVars } from "../lib/accent";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const SEO_TITLE = "Koemori — AI Receptionist for Every Home-Service Trade";
const SEO_DESC =
  "Koemori answers the phone, captures the lead, and books the job for roofing, HVAC, plumbing, lawn care, pressure washing, detailing, electrical, garage doors, pest control, and landscaping.";

export default function Services() {
  const [callOpen, setCallOpen] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = SEO_TITLE;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content");
    if (metaDesc) metaDesc.setAttribute("content", SEO_DESC);
    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc != null) metaDesc.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 right-[-15%] w-[600px] h-[600px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
          >
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            Every trade · One voice that guards it
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6 max-w-3xl"
          >
            Pick your trade.
            <br />
            <span className="italic text-rain-700">See it answer.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-xl leading-relaxed">
            Same engine, tuned to how your business actually runs. Each page is built around the jobs you
            run, the questions your customers ask, and the season that slams your phone.
          </motion.p>
        </motion.div>
      </section>

      {/* Directory grid */}
      <section className="px-6 pb-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {VERTICALS.map((v) => {
            const Icon = v.icon;
            const isLive = v.status === "live";
            const card = v.card || {};
            const inner = (
              <motion.div
                whileHover={isLive ? { y: -5 } : undefined}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                style={accentVars(v.accent)}
                className={`h-full bg-cream-50 border rounded-2xl p-7 flex flex-col transition-all ${
                  isLive ? "border-slate-900/8 hover:border-[color:var(--accent)] hover:shadow-soft" : "border-slate-900/8 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full text-cream-100 flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl text-slate-900 tracking-tight">{v.label}</h3>
                  {v.bespoke && (
                    <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
                      Flagship
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-[14px] leading-relaxed mb-5">{card.blurb}</p>

                {v.example && (
                  <div className="rounded-xl p-4 mb-5 mt-auto border" style={{ background: "var(--accent-soft)", borderColor: "var(--accent-border)" }}>
                    <div className="flex items-start gap-2.5">
                      <PhoneCall className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                      <p className="text-slate-700 text-[13px] italic leading-snug">"{v.example.caller}"</p>
                    </div>
                    <div className="mt-2.5 pl-[26px] flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent-strong)" }}>
                      <ArrowRight className="w-3.5 h-3.5" />
                      {v.example.outcome}
                    </div>
                  </div>
                )}

                <div
                  className={`flex items-center gap-1 text-sm font-medium ${v.example ? "" : "mt-auto"} ${isLive ? "" : "text-slate-400"}`}
                  style={isLive ? { color: "var(--accent)" } : undefined}
                >
                  {isLive ? (
                    <>
                      Explore the {v.label} page
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    "Coming soon"
                  )}
                </div>
              </motion.div>
            );
            return (
              <motion.div key={v.slug} variants={fadeUp} className="h-full">
                {isLive ? (
                  <Link to={v.to} target="_blank" rel="noopener noreferrer" className="group block h-full">{inner}</Link>
                ) : (
                  <div className="h-full">{inner}</div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto mt-8 text-slate-500 text-sm"
        >
          Don't see your trade?{" "}
          <a href="#contact" className="text-rain-700 font-medium hover:underline">Tell us what you do</a>{" "}
          — if you run on inbound calls, Koemori can answer them.
        </motion.p>
      </section>

      {/* Demo CTA band */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-rain-700/40 blur-[90px] pointer-events-none" />
            <div className="relative flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">Hear it yourself</div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight leading-tight text-balance mb-2">
                Whatever you run, hear how it answers.
              </h2>
              <p className="text-cream-100/70 text-[15px] max-w-xl">
                Five free calls to the live demo agent — no credit card, no sales call first.
              </p>
            </div>
            <button
              onClick={() => setCallOpen(true)}
              className="relative flex-shrink-0 inline-flex items-center gap-2 bg-cream-100 text-rain-900 px-6 py-4 rounded-full font-medium hover:bg-cream-50 transition"
            >
              <Phone className="w-4 h-4" />
              Try the AI free
            </button>
          </motion.div>
        </div>
      </section>

      <ContactSection />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} />
    </>
  );
}
