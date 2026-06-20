import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, TrendingUp, Globe, ShieldCheck, Clock, Database, MapPin,
} from "lucide-react";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";
import RoiCalculator from "../components/RoiCalculator";
import GuaranteeBand from "../components/GuaranteeBand";
import TradeCallDemo from "../components/TradeCallDemo";
import { getVertical } from "../config/verticals";
import { accentVars } from "../lib/accent";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

// The product loop is identical for every trade — only the descriptions change.
const LOOP = [
  { title: "Answers Every Call", tagline: "The Guard", icon: Sparkles, stat: { v: "<3s", l: "Pickup speed" } },
  { title: "Sends You the Lead", tagline: "The Handoff", icon: TrendingUp, stat: { v: "Instant", l: "Lead alert" } },
  { title: "Lines Up the Appointment", tagline: "The Booking", icon: Globe, stat: { v: "24/7", l: "On the clock" } },
];

const WHY_ICONS = [Clock, Database, ShieldCheck];

const buildSteps = (qualifyDesc) => [
  { n: "01", title: "Forward your missed calls", desc: "One simple dial code on your existing phone. Your number doesn't change — Koemori only answers when you can't pick up." },
  { n: "02", title: "Koemori answers in under 3 seconds", desc: "Natural voice, no robot tone. The caller thinks they reached your front desk — day, night, or mid-rush." },
  { n: "03", title: "Qualifies the lead", desc: qualifyDesc },
  { n: "04", title: "Books the appointment", desc: "Syncs with your calendar, locks in a time, and confirms with the customer automatically before they hang up." },
  { n: "05", title: "You get the full report instantly", desc: "Name, number, summary, lead score (Hot/Warm/Cold), and recording land on your phone the second the call ends." },
];

const FLYWHEEL = [
  { step: "01", title: "Koemori answers every call", desc: "No missed calls, no voicemail. Every inbound lead gets a real conversation." },
  { step: "02", title: "Auto-sends a review request", desc: "90 minutes after the job, the customer gets a personalized SMS with your Google review link." },
  { step: "03", title: "Your Google Maps ranking rises", desc: "Google rewards recent review velocity. More reviews this month beats a competitor's 200 old ones." },
  { step: "04", title: "More calls. More reviews. Repeat.", desc: "After 12 months you have a local authority your competitors would need years to replicate." },
];

export default function Vertical() {
  const { slug } = useParams();
  const vertical = getVertical(slug);
  const [callOpen, setCallOpen] = useState(false);

  const content = vertical?.content;

  // Per-page SEO for the SPA: swap <title> + description while mounted.
  useEffect(() => {
    if (!content) return;
    const prevTitle = document.title;
    document.title = content.seo.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content");
    if (metaDesc) metaDesc.setAttribute("content", content.seo.description);
    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc != null) metaDesc.setAttribute("content", prevDesc);
    };
  }, [content]);

  if (!vertical) return <Navigate to="/" replace />;
  if (vertical.bespoke) return <Navigate to={vertical.to} replace />;
  if (!content) return <Navigate to="/" replace />;

  const steps = buildSteps(content.qualifyDesc);

  return (
    <div style={accentVars(vertical.accent)}>
      {/* Hero — two columns: pitch + live call */}
      <section className="relative px-6 pt-20 pb-20 overflow-hidden">
        <div
          className="absolute top-0 right-[-15%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "var(--accent-soft)" }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-12 items-center"
        >
          <div className="lg:col-span-7">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              <MapPin className="w-3 h-3" /> {content.badge}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[clamp(2.5rem,5.2vw,4.5rem)] leading-[0.96] tracking-[-0.02em] text-slate-900 text-balance mb-6"
            >
              {content.hero.h1Lead}{" "}
              <span className="italic" style={{ color: "var(--accent)" }}>{content.hero.h1Accent}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-xl leading-relaxed mb-6">
              {content.hero.sub}
            </motion.p>

            <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-6">
              Koemori · 声 + 守り · "the voice that guards"
            </motion.p>

            {/* Missed call math bar */}
            <motion.div
              variants={fadeUp}
              className="inline-flex flex-wrap items-center gap-3 text-cream-100 px-5 py-3 rounded-full text-sm font-medium mb-8"
              style={{ background: "var(--accent-strong)" }}
            >
              <span className="font-mono font-bold" style={{ color: "var(--accent-light)" }}>{content.missedCall.value}</span>
              <span className="text-cream-100/40">·</span>
              <span>{content.missedCall.label}</span>
              <span className="text-cream-100/40">·</span>
              <span className="font-mono font-bold" style={{ color: "var(--accent-light)" }}>{content.missedCall.yearLost}</span>
              <span>lost per year</span>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <button
                onClick={() => setCallOpen(true)}
                className="group inline-flex items-center gap-2 text-cream-100 px-6 py-4 rounded-full font-medium transition hover:brightness-110 bg-[var(--accent)]"
              >
                Try the AI free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#how"
                className="inline-flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full hover:border-slate-900/30 transition"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* Live call demo */}
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <TradeCallDemo demo={content.demo} />
          </motion.div>
        </motion.div>
      </section>

      {/* Google agentic booking signal bar */}
      <section className="px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-cream-50 border border-slate-900/8 rounded-2xl px-8 py-6 flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 flex-shrink-0" style={{ color: "var(--accent)" }} />
              <div>
                <div className="font-semibold text-slate-900 text-sm">Google's AI now books jobs directly for local businesses</div>
                <div className="text-slate-500 text-sm">Businesses that answer in under 3 seconds qualify for Google's agentic booking — Koemori answers in &lt;3s, putting you first before your competitors even pick up.</div>
              </div>
            </div>
            <div className="md:ml-auto flex-shrink-0">
              <button
                onClick={() => setCallOpen(true)}
                className="font-semibold text-sm border px-4 py-2 rounded-full transition whitespace-nowrap hover:bg-[var(--accent-softer)] text-[color:var(--accent)] border-[color:var(--accent-border)]"
              >
                Hear it in action →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product loop cards */}
      <section className="px-6 pb-28 pt-14">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-4"
          >
            {LOOP.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title} variants={fadeUp}>
                  <button onClick={() => setCallOpen(true)} className="block w-full text-left group h-full">
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="h-full bg-cream-50 border-2 rounded-2xl p-8 relative overflow-hidden transition-colors border-[color:var(--accent-border)] hover:border-[color:var(--accent)]"
                    >
                      <div
                        className="absolute top-5 right-5 flex items-center gap-1.5 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]"
                        style={{ background: "var(--accent)" }}
                      >
                        <span className="w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" />
                        Live
                      </div>
                      <Icon className="w-6 h-6 mb-8" style={{ color: "var(--accent)" }} />
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Active · Live Now</div>
                      <h3 className="font-display text-3xl text-slate-900 tracking-tight mb-1">{s.title}</h3>
                      <div className="font-display italic mb-4" style={{ color: "var(--accent)" }}>{s.tagline}</div>
                      <p className="text-slate-600 text-[15px] leading-relaxed mb-6">{content.loopDescs[i]}</p>
                      <div className="pt-4 border-t border-slate-900/6 flex items-center justify-between">
                        <div>
                          <div className="font-display text-2xl text-slate-900">{s.stat.v}</div>
                          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{s.stat.l}</div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
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

      {/* How It Works */}
      <section id="how" className="px-6 py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "var(--accent-strong)" }}>How it works</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              Five steps. <span className="italic" style={{ color: "var(--accent)" }}>Under five minutes.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-5 gap-4"
          >
            {steps.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 flex flex-col gap-4">
                <div className="font-display text-4xl tracking-tight leading-none select-none" style={{ color: "var(--accent-pale)" }}>{s.n}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why this trade */}
      <section className="px-6 py-24 bg-cream-50 border-y border-slate-900/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "var(--accent-strong)" }}>Why Koemori</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              {content.why.h2Lead} <span className="italic" style={{ color: "var(--accent)" }}>{content.why.h2Accent}</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {content.why.stats.map((w, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <motion.div key={i} variants={fadeUp} className="bg-cream-100 border border-slate-900/8 rounded-2xl p-8">
                  <Icon className="w-5 h-5 mb-6" style={{ color: "var(--accent)" }} />
                  <div className="font-display text-5xl text-slate-900 tracking-tight mb-3">{w.stat}</div>
                  <div className="text-slate-600 text-[15px] leading-relaxed">{w.body}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ROI calculator */}
      <RoiCalculator label={vertical.label} defaults={content.roi} blurb={content.roi.blurb} accentHex={vertical.accent} />

      {/* Surge / always-on */}
      <section className="px-6 py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div
                className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em]"
                style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent-light)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-light)" }} />
                {content.surge.badge}
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-cream-100 tracking-tight leading-tight text-balance mb-6">
                {content.surge.h2Lead} <span className="italic" style={{ color: "var(--accent-light)" }}>{content.surge.h2Accent}</span>
              </h2>
              <p className="text-cream-100/70 text-[15px] leading-relaxed mb-8">{content.surge.body}</p>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl" style={{ color: "var(--accent-light)" }}>{content.surge.bigStat}</span>
                <span className="text-cream-100/60 text-sm leading-snug max-w-[240px]">{content.surge.bigStatSub}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {content.surge.cards.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                  className="bg-cream-100/5 border border-cream-100/10 rounded-2xl p-6"
                >
                  <div className="font-display text-3xl text-cream-100 tracking-tight mb-1">{c.stat}</div>
                  <div className="text-cream-100/70 text-[13px] leading-snug mb-1">{c.label}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>{c.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compounding moat */}
      <section className="px-6 py-24 bg-cream-50 border-y border-slate-900/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12 max-w-2xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "var(--accent-strong)" }}>The compounding advantage</div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance mb-4">
              You're building a moat your competitors <span className="italic" style={{ color: "var(--accent)" }}>can never close.</span>
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Missed calls cost you money today. But Koemori does something more powerful than just answer the phone — it turns every answered call into a review, and every review into a permanent Google Maps ranking advantage that compounds for as long as you run it.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-4 gap-4 mb-12"
          >
            {FLYWHEEL.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="relative bg-cream-100 border border-slate-900/8 rounded-2xl p-8">
                {i < 3 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px z-10" style={{ background: "var(--accent-border)" }} />}
                <div className="font-display text-4xl tracking-tight leading-none mb-4" style={{ color: "var(--accent)" }}>{item.step}</div>
                <h3 className="font-semibold text-slate-900 text-[15px] mb-2">{item.title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-cream-100 rounded-2xl px-8 py-6 flex flex-col md:flex-row md:items-center gap-6"
            style={{ background: "var(--accent-strong)" }}
          >
            <div className="flex-1">
              <div className="font-semibold text-cream-100 mb-1">A customer with 18 months of Koemori doesn't cancel.</div>
              <div className="text-cream-100/70 text-[14px]">
                Canceling means losing the compounding review engine that's been building their Maps ranking. That's not a subscription — that's infrastructure.
              </div>
            </div>
            <button
              onClick={() => setCallOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-cream-100 px-6 py-3 rounded-full font-medium text-sm hover:bg-cream-50 transition whitespace-nowrap"
              style={{ color: "var(--accent-strong)" }}
            >
              Start building your moat
              <ArrowRight className="w-4 h-4" />
            </button>
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
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] mb-6 text-balance">
              Hear it before you buy it.
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">
              Five free calls to our demo agent — no credit card, no sales call first.
            </p>
            <button
              onClick={() => setCallOpen(true)}
              className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-8 py-4 rounded-full text-lg font-medium transition hover:brightness-110"
            >
              Try it free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 bg-cream-50 border-t border-slate-900/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "var(--accent-strong)" }}>FAQ</div>
            <h2 className="font-display text-4xl text-slate-900 tracking-tight">Common questions</h2>
          </motion.div>
          <div className="space-y-8">
            {content.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="border-b border-slate-900/8 pb-8"
              >
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{item.q}</h3>
                <p className="text-slate-600 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} tradeOptions={content.tradeOptions} />
    </div>
  );
}
