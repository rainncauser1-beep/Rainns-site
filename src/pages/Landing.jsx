import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, TrendingUp, Globe, Clock, Database, ShieldCheck, Phone,
} from "lucide-react";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";
import GuaranteeBand from "../components/GuaranteeBand";
import { supabase } from "../lib/supabase";
import { FEATURED_VERTICALS } from "../config/verticals";
import { accentVars } from "../lib/accent";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const LOOP = [
  {
    title: "Answers Every Call",
    tagline: "The Guard",
    icon: Sparkles,
    desc: "On a job, after hours, or slammed during the busy season — Koemori picks up in under 3 seconds and talks like a real person. No more voicemail, no more lost jobs.",
    stat: { v: "<3s", l: "Pickup speed" },
  },
  {
    title: "Sends You the Lead",
    tagline: "The Handoff",
    icon: TrendingUp,
    desc: "The second a call ends, the customer's name, number, summary, and transcript land on your phone. You call back warm — never cold, never too late.",
    stat: { v: "Instant", l: "Lead alert" },
  },
  {
    title: "Books the Job",
    tagline: "The Booking",
    icon: Globe,
    desc: "Koemori walks the customer through your booking, locks in their preferred time, and hands you a ready-to-confirm appointment — while you're still on the last job.",
    stat: { v: "24/7", l: "On the clock" },
  },
];

const STEPS = [
  { n: "01", title: "Forward your missed calls", desc: "One simple dial code on your existing phone. Your number doesn't change — Koemori only answers when you can't pick up." },
  { n: "02", title: "Koemori answers in under 3 seconds", desc: "Natural voice, no robot tone. The caller thinks they reached your front desk — day, night, or mid-rush." },
  { n: "03", title: "Qualifies the lead", desc: "Asks the right questions for your trade — what they need, where, and how soon — and filters out spam and tire-kickers." },
  { n: "04", title: "Books the appointment", desc: "Syncs with your calendar, locks in a time, and confirms with the customer automatically before they hang up." },
  { n: "05", title: "You get the full report instantly", desc: "Name, number, summary, lead score (Hot/Warm/Cold), and recording land on your phone the second the call ends." },
];

const WHY = [
  { icon: Clock, stat: "62%", body: "of calls to home-service businesses go unanswered. Koemori answers 100% — day, night, weekends, and through every busy season." },
  { icon: Database, stat: "85%", body: "of callers who hit voicemail never call back. They just dial the next pro on the list who actually answered." },
  { icon: ShieldCheck, stat: "24/7", body: "coverage with zero overtime. The line is never busy, never closed, and never calls in sick." },
];

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

export default function Landing() {
  const navigate = useNavigate();
  const [callOpen, setCallOpen] = useState(false);

  // Signed-in clients (magic-link redirect) go straight to their portal.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email && email !== ADMIN_EMAIL) navigate("/portal", { replace: true });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const email = session?.user?.email;
      if (email && email !== ADMIN_EMAIL) navigate("/portal", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 right-[-15%] w-[600px] h-[600px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />

        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
          >
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            AI phone receptionist · For home-service pros · On the line 24/7
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6 max-w-4xl"
          >
            Every call answered.
            <br />
            Every job booked.
            <br />
            <span className="italic text-rain-700">While you work.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-6">
            Koemori is the AI phone receptionist for home-service businesses. It answers every call in
            under 3 seconds, texts you the lead, and books the appointment — so you never lose a job to
            a missed phone again. Pick your trade to see it in action.
          </motion.p>

          <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-10">
            Koemori · 声 + 守り · "the voice that guards"
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <button
              onClick={() => setCallOpen(true)}
              className="group inline-flex items-center gap-2 bg-rain-700 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-600 transition"
            >
              Try the AI free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#trades"
              className="inline-flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full hover:border-slate-900/30 transition"
            >
              Pick your trade
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Product loop */}
      <section className="px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12 max-w-xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">The loop</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance">
              One missed call is one job <span className="italic text-rain-700">gone.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-4"
          >
            {LOOP.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title} variants={fadeUp}>
                  <button onClick={() => setCallOpen(true)} className="block w-full text-left group h-full">
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="h-full bg-cream-50 border-2 border-rain-300 rounded-2xl p-8 relative overflow-hidden hover:border-rain-400 transition-colors"
                    >
                      <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-rain-700 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]">
                        <span className="w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" />
                        Live
                      </div>
                      <Icon className="w-6 h-6 mb-8 text-rain-700" />
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Active · Live Now</div>
                      <h3 className="font-display text-3xl text-slate-900 tracking-tight mb-1">{s.title}</h3>
                      <div className="font-display italic text-rain-500 mb-4">{s.tagline}</div>
                      <p className="text-slate-600 text-[15px] leading-relaxed mb-6">{s.desc}</p>
                      <div className="pt-4 border-t border-slate-900/6 flex items-center justify-between">
                        <div>
                          <div className="font-display text-2xl text-slate-900">{s.stat.v}</div>
                          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{s.stat.l}</div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-rain-700">
                          Hear it live
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Trade picker */}
      <section id="trades" className="px-6 py-24 bg-cream-50 border-y border-slate-900/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12 max-w-2xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">Built for your trade</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance mb-4">
              Same engine. <span className="italic text-rain-700">Tuned to your trade.</span>
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Every Koemori line speaks your business — the questions your customers ask, the jobs you
              run, the seasons that slam you. Here are a few; we build for ten trades and counting.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {FEATURED_VERTICALS.map((v) => {
              const Icon = v.icon;
              const card = v.card || {};
              const isLive = v.status === "live";
              const inner = (
                <motion.div
                  whileHover={isLive ? { y: -5 } : undefined}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  style={accentVars(v.accent)}
                  className={`h-full bg-cream-100 border rounded-2xl p-7 relative overflow-hidden transition-colors ${
                    isLive ? "border-slate-900/10 hover:border-[color:var(--accent)]" : "border-slate-900/8 opacity-70"
                  }`}
                >
                  {v.bespoke && (
                    <div className="absolute top-5 right-5 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]" style={{ background: "var(--accent)" }}>
                      Flagship
                    </div>
                  )}
                  <div className="w-11 h-11 rounded-full text-cream-100 flex items-center justify-center mb-6" style={{ background: "var(--accent)" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl text-slate-900 tracking-tight mb-2">{v.label}</h3>
                  <p className="text-slate-600 text-[14px] leading-relaxed mb-6 min-h-[60px]">{card.blurb}</p>
                  <div className="pt-4 border-t border-slate-900/6 flex items-center justify-between">
                    {card.statV ? (
                      <div>
                        <div className="font-display text-xl text-slate-900">{card.statV}</div>
                        <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{card.statL}</div>
                      </div>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1 text-sm font-medium" style={isLive ? { color: "var(--accent)" } : { color: "#94a3b8" }}>
                      {isLive ? "Explore" : "Coming soon"}
                      {isLive && <ArrowRight className="w-4 h-4" />}
                    </div>
                  </div>
                </motion.div>
              );
              return (
                <motion.div key={v.slug} variants={fadeUp} className="h-full">
                  {isLive ? (
                    <Link to={v.to} target="_blank" rel="noopener noreferrer" className="block h-full group">{inner}</Link>
                  ) : (
                    <div className="h-full cursor-default">{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-3.5 rounded-full font-medium hover:bg-rain-700 transition w-fit"
            >
              See all 10 trades
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-slate-500 text-sm">
              Don't see your trade?{" "}
              <a href="#contact" className="text-rain-700 font-medium hover:underline">Tell us what you do</a>{" "}
              — if you run on inbound calls, Koemori can answer them.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">How it works</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              Five steps. <span className="italic text-rain-700">Under five minutes.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-5 gap-4"
          >
            {STEPS.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 flex flex-col gap-4">
                <div className="font-display text-4xl text-rain-200 tracking-tight leading-none select-none">{s.n}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Koemori */}
      <section className="px-6 py-24 bg-cream-50 border-y border-slate-900/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">Why Koemori</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              The phone is still where the money is. <span className="italic text-rain-700">Answer it.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {WHY.map((w, i) => {
              const Icon = w.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="bg-cream-100 border border-slate-900/8 rounded-2xl p-8">
                  <Icon className="w-5 h-5 text-rain-600 mb-6" />
                  <div className="font-display text-5xl text-slate-900 tracking-tight mb-3">{w.stat}</div>
                  <div className="text-slate-600 text-[15px] leading-relaxed">{w.body}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ROI guarantee */}
      <GuaranteeBand />

      {/* Bottom CTA */}
      <section className="px-6 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="w-14 h-14 rounded-full bg-rain-100 mx-auto flex items-center justify-center mb-6">
              <Phone className="w-6 h-6 text-rain-700" />
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] mb-6 text-balance">
              Hear it before you buy it.
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">
              Five free calls to our demo agent — no credit card, no sales call first.
            </p>
            <button
              onClick={() => setCallOpen(true)}
              className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-8 py-4 rounded-full text-lg font-medium hover:bg-rain-700 transition"
            >
              Try it free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <ContactSection />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} />
    </>
  );
}
