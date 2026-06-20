import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, FileText, Bell, Zap, Clock, TrendingUp,
  ChevronRight, CheckCircle, Building2, Search, Send,
} from "lucide-react";
import GuaranteeBand from "../components/GuaranteeBand";
import ContactSection from "../components/ContactSection";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const howSteps = [
  {
    n: "01",
    icon: Search,
    title: "We watch every permit filing",
    body: "Koemori scrapes Davidson, Williamson, Rutherford, and Wilson county permit portals weekly — filtering for roofing, storm damage, and exterior work automatically.",
  },
  {
    n: "02",
    icon: MapPin,
    title: "We match permits to your territory",
    body: "New permits get geocoded and cross-referenced against your service area zip codes. Only relevant addresses make it to you — no noise, no out-of-territory leads.",
  },
  {
    n: "03",
    icon: Bell,
    title: "You get a weekly lead digest",
    body: 'Every Monday morning: "5 new roofing permits filed within 2 miles of your area this week." Full addresses included. You call first — before anyone else knows.',
  },
  {
    n: "04",
    icon: Zap,
    title: "Timing does the selling for you",
    body: "These homeowners are already spending money on their roof right now. You're not interrupting them — you're reaching them at exactly the right moment. Conversion rates are dramatically higher than cold outreach.",
  },
];

const stats = [
  { v: "Weekly", l: "Fresh permit data pulled from county portals" },
  { v: "4 counties", l: "Davidson, Williamson, Rutherford, Wilson — expanding" },
  { v: "2–5×", l: "Higher conversion vs random cold outreach" },
  { v: "+$50/mo", l: "Add-on tier per contractor who activates it" },
];

const whyNow = [
  "Every county in Tennessee posts permits publicly — this data is free and sitting there",
  "The average roofer has no system to monitor it, let alone automate alerts",
  "A roofing permit for a neighbor is an open door to offer a free inspection on the same block",
  "No competitor offers permit-based lead intelligence for roofing contractors",
  "The homeowner already decided to spend. You just need to be first.",
];

const permitTypes = [
  { type: "Roof replacement", signal: "Homeowner is actively replacing — neighbors often follow" },
  { type: "Storm damage repair", signal: "High urgency, insurance claim likely, fast conversion" },
  { type: "New construction", signal: "Future maintenance customer — book them early" },
  { type: "Deck / exterior", signal: "Spending mindset — cross-sell roof inspection" },
];

export default function PermitIntelligence() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-cream-100 text-slate-900">

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-3xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-rain-100 text-rain-700 text-[11px] font-mono uppercase tracking-[0.18em] px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Coming Soon
            </span>
            <span className="inline-flex items-center gap-1.5 border border-slate-900/10 text-slate-500 text-[11px] font-mono uppercase tracking-[0.18em] px-3 py-1.5 rounded-full">
              <FileText className="w-3 h-3" />
              Permit Intelligence
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-6xl text-slate-900 leading-[1.08] tracking-tight mb-6"
          >
            Know who needs a new roof{" "}
            <em className="text-rain-600">before they call anyone.</em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-10"
          >
            Every week, homeowners in your area file building permits for roof work — and that data is public. Koemori's Permit Intelligence monitors every county filing and sends you the addresses before your competitors even know the job exists.
          </motion.p>

          <motion.div variants={fadeUp}>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-cream-50 border border-slate-900/12 rounded-full px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rain-400"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-rain-700 text-cream-100 px-6 py-3 rounded-full text-sm font-medium hover:bg-rain-600 transition"
                >
                  Notify me
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                You're on the early access list — we'll reach out first.
              </div>
            )}
            <p className="mt-3 text-[12px] text-slate-500 font-mono">
              Early access contractors get first dibs + a lower add-on rate.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-900/8 bg-cream-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((s) => (
              <motion.div key={s.l} variants={fadeUp} className="space-y-1">
                <div className="font-display text-3xl text-rain-700">{s.v}</div>
                <div className="text-[13px] text-slate-500 leading-snug">{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Why this works ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeUp}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              The insight
            </div>
            <h2 className="font-display text-4xl text-slate-900 leading-tight mb-6">
              Timing is the entire game in roofing.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              A homeowner who just filed a roofing permit is <strong className="text-slate-800">actively spending money on their property right now.</strong> They're not a cold lead — they're a warm one who hasn't been called yet.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              When you reach out that same week, you're not interrupting their day. You're showing up exactly when they need someone. That's the difference between a 5% cold call conversion rate and something much closer to 30–40%.
            </p>
            <ul className="space-y-3">
              {whyNow.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <ChevronRight className="w-4 h-4 text-rain-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Permit card mock */}
          <motion.div variants={fadeUp}>
            <div className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden shadow-soft">
              <div className="bg-rain-800 px-5 py-4 flex items-center gap-3">
                <Bell className="w-4 h-4 text-rain-200" />
                <span className="text-cream-100 text-sm font-medium">Koemori Permit Digest — Mon Jun 9</span>
                <span className="ml-auto bg-amber-400 text-slate-900 text-[10px] font-mono px-2 py-0.5 rounded-full">5 new</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { addr: "4821 Granny White Pike", type: "Roof replacement", dist: "0.4 mi", hot: true },
                  { addr: "1102 Woodmont Blvd", type: "Storm damage repair", dist: "1.1 mi", hot: true },
                  { addr: "338 Harding Place", type: "Roof replacement", dist: "1.8 mi", hot: false },
                  { addr: "7734 Nolensville Rd", type: "Exterior — deck + roof", dist: "2.2 mi", hot: false },
                  { addr: "215 Old Hickory Blvd", type: "New construction", dist: "2.9 mi", hot: false },
                ].map((p) => (
                  <div
                    key={p.addr}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
                      p.hot
                        ? "bg-rain-50 border-rain-200"
                        : "bg-cream-100 border-slate-900/6"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-slate-900">{p.addr}</span>
                        {p.hot && (
                          <span className="text-[9px] font-mono bg-rain-700 text-cream-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            hot
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-slate-500">{p.type}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                      {p.dist}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="bg-slate-900 text-cream-100 text-center py-3 rounded-xl text-sm font-medium">
                  Call these 5 addresses this week →
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-cream-50 border-y border-slate-900/8 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="mb-14">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
                How it works
              </div>
              <h2 className="font-display text-4xl text-slate-900 leading-tight max-w-xl">
                Four steps from public record to booked estimate.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {howSteps.map((s) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  className="bg-cream-100 border border-slate-900/8 rounded-2xl p-7"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rain-100 flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-5 h-5 text-rain-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.18em]">
                          {s.n}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Permit types ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp} className="mb-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
              What we monitor
            </div>
            <h2 className="font-display text-4xl text-slate-900 leading-tight">
              Every permit type that means money for roofers.
            </h2>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-4">
            {permitTypes.map((p) => (
              <motion.div
                key={p.type}
                variants={fadeUp}
                className="flex items-start gap-4 bg-cream-50 border border-slate-900/8 rounded-2xl p-6"
              >
                <Building2 className="w-5 h-5 text-rain-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 mb-1">{p.type}</div>
                  <div className="text-sm text-slate-600">{p.signal}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Coming soon CTA ── */}
      <section className="bg-rain-800 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-rain-700 border border-rain-600 text-rain-200 text-[11px] font-mono uppercase tracking-[0.18em] px-4 py-2 rounded-full">
                <Clock className="w-3 h-3" />
                Launching soon · Early access open
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-5xl text-cream-100 leading-tight mb-6"
            >
              Be the first roofer in your market with permit intelligence.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-rain-200 text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Permit Intelligence will be available as a $50/month add-on for active Koemori subscribers. Early access contractors lock in a lower rate and get first access in their territory.
            </motion.p>

            <motion.div variants={fadeUp}>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-rain-700 border border-rain-600 rounded-full px-5 py-3 text-sm text-cream-100 placeholder:text-rain-400 focus:outline-none focus:ring-2 focus:ring-rain-300"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-cream-100 text-rain-800 px-6 py-3 rounded-full text-sm font-semibold hover:bg-cream-50 transition"
                  >
                    Get early access
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-5 py-3 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  You're on the list — we'll reach out when your territory opens.
                </div>
              )}
              <p className="mt-4 text-[12px] text-rain-400 font-mono">
                One contractor per territory. First to sign up owns the area.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <GuaranteeBand />
      <ContactSection />
    </div>
  );
}
