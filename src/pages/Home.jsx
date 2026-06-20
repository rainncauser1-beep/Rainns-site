import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Globe, ShieldCheck, Clock, Database, MapPin } from "lucide-react";
import WaitlistModal from "../components/WaitlistModal";
import { supabase } from "../lib/supabase";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";
import RoiCalculator from "../components/RoiCalculator";
import GuaranteeBand from "../components/GuaranteeBand";

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const services = [
  {
    id: "answer",
    to: "/automations",
    eyebrow: "Active · Live Now",
    title: "Answers Every Call",
    tagline: "The Guard",
    desc: "Storm season, on a roof, after hours — Koemori picks up in under 3 seconds and talks like a real person. No more voicemail, no more lost jobs.",
    icon: Sparkles,
    active: true,
    stat: { v: "<3s", l: "Pickup speed" },
  },
  {
    id: "capture",
    to: "/get-started",
    eyebrow: "Active · Live Now",
    title: "Sends You the Lead",
    tagline: "The Handoff",
    desc: "The second a call ends, the homeowner's name, number, summary, and transcript land on your phone. You call back warm — never cold, never too late.",
    icon: TrendingUp,
    active: true,
    stat: { v: "Instant", l: "Lead alert" },
  },
  {
    id: "book",
    to: "/get-started",
    eyebrow: "Active · Live Now",
    title: "Lines Up the Estimate",
    tagline: "The Handoff",
    desc: "Koemori walks the homeowner through your booking, locks in their preferred time, and hands you a ready-to-confirm estimate — while you're still up on the last roof.",
    icon: Globe,
    active: true,
    stat: { v: "24/7", l: "On the clock" },
  },
];

const steps = [
  {
    n: "01",
    title: "Forward your missed calls",
    desc: "One simple dial code on your existing phone. Your number doesn't change — Koemori only answers when you can't pick up.",
  },
  {
    n: "02",
    title: "Koemori answers in under 3 seconds",
    desc: "Natural voice, no robot tone. The caller thinks they reached your front desk — day, night, or mid-storm.",
  },
  {
    n: "03",
    title: "Qualifies the lead",
    desc: "Asks the right questions — address, damage type, roof age, urgency. Filters spam. Captures every real job.",
  },
  {
    n: "04",
    title: "Books the estimate",
    desc: "Syncs with your calendar, locks in a time, and confirms with the homeowner automatically before you hang up the last call.",
  },
  {
    n: "05",
    title: "You get the full report instantly",
    desc: "Name, number, summary, lead score (Hot/Warm/Cold), and recording land on your phone the second the call ends.",
  },
];

const whyStats = [
  { icon: Clock, stat: "62%", body: "of calls to roofers go unanswered. Koemori answers 100% — day, night, and through every storm." },
  { icon: Database, stat: "$8,500", body: "is the average roofing job. Miss two calls a month and that's six figures a year walking next door." },
  { icon: ShieldCheck, stat: "100%", body: "of your calls answered — nights, weekends, storm season. The line is never busy, never closed." },
];

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

export default function Home() {
  const navigate = useNavigate();
  const [waitlist, setWaitlist] = useState({ open: false, service: null });
  const [callOpen, setCallOpen] = useState(false);

  // If a client lands on the home page while signed in (e.g. after clicking
  // a magic link that Supabase redirected here), send them straight to their portal.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email && email !== ADMIN_EMAIL) {
        navigate("/portal", { replace: true });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const email = session?.user?.email;
      if (email && email !== ADMIN_EMAIL) {
        navigate("/portal", { replace: true });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 right-[-15%] w-[600px] h-[600px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-7xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
          >
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            <MapPin className="w-3 h-3" /> Built for roofers · Nashville · On the line 24/7
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6 max-w-4xl"
          >
            Answers every call
            <br />
            while you're on
            <br />
            <span className="italic text-rain-700">the roof.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-6"
          >
            Koemori is the AI receptionist built for roofing companies. It answers every call in
            under 3 seconds, sends you the lead, and lines up the estimate — so you never lose a job
            to a missed phone again.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-6"
          >
            Koemori · 声 + 守り · "the voice that guards"
          </motion.p>

          {/* Missed call math bar */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-3 bg-rain-800 text-cream-100 px-5 py-3 rounded-full text-sm font-medium mb-10"
          >
            <span className="text-rain-300 font-mono font-bold">$1,200</span>
            <span className="text-rain-400">·</span>
            <span>average value of a missed roofing call</span>
            <span className="text-rain-400">·</span>
            <span className="text-rain-300 font-mono font-bold">$14,400+</span>
            <span>lost per year</span>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <button
              onClick={() => setCallOpen(true)}
              className="group inline-flex items-center gap-2 bg-rain-700 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-600 transition"
            >
              Try the AI free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              to="/get-started"
              className="inline-flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full hover:border-slate-900/30 transition"
            >
              See how it works
            </Link>
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
              <Globe className="w-6 h-6 text-rain-700 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 text-sm">Google's AI now books jobs directly for contractors</div>
                <div className="text-slate-500 text-sm">Businesses that answer in under 3 seconds qualify for Google's agentic booking — Koemori answers in &lt;3s, putting you first before your competitors even pick up.</div>
              </div>
            </div>
            <div className="md:ml-auto flex-shrink-0">
              <button onClick={() => setCallOpen(true)} className="text-rain-700 font-semibold text-sm border border-rain-300 px-4 py-2 rounded-full hover:bg-rain-50 transition whitespace-nowrap">
                Hear it in action →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service cards */}
      <section className="px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-4"
          >
            {services.map((s) => {
              const Icon = s.icon;
              const isActive = s.active;
              return (
                <motion.div key={s.id} variants={fadeUp}>
                  {isActive ? (
                    <Link to={s.to} className="block group h-full">
                      <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                        className="h-full bg-cream-50 border-2 border-rain-300 rounded-2xl p-8 relative overflow-hidden hover:border-rain-400 transition-colors"
                      >
                        <CardInner s={s} Icon={Icon} isActive={isActive} />
                      </motion.div>
                    </Link>
                  ) : (
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      onClick={() => setWaitlist({ open: true, service: s })}
                      className="h-full bg-cream-50 border border-slate-900/8 rounded-2xl p-8 relative overflow-hidden cursor-pointer hover:border-slate-900/20 transition-colors"
                    >
                      <CardInner s={s} Icon={Icon} isActive={isActive} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              How it works
            </div>
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
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="font-display text-4xl text-rain-200 tracking-tight leading-none select-none">
                  {s.n}
                </div>
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              Why Koemori
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              Built for roofers. <span className="italic text-rain-700">Not for demos.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {whyStats.map((w, i) => {
              const Icon = w.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-cream-100 border border-slate-900/8 rounded-2xl p-8"
                >
                  <Icon className="w-5 h-5 text-rain-600 mb-6" />
                  <div className="font-display text-5xl text-slate-900 tracking-tight mb-3">
                    {w.stat}
                  </div>
                  <div className="text-slate-600 text-[15px] leading-relaxed">{w.body}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ROI calculator */}
      <RoiCalculator />

      {/* Storm Mode */}
      <section className="px-6 py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-rain-700/30 border border-rain-600/30 rounded-full text-[11px] uppercase tracking-[0.18em] text-rain-300">
                <span className="w-1.5 h-1.5 bg-rain-400 rounded-full animate-pulse" />
                Storm season · Always on
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-cream-100 tracking-tight leading-tight text-balance mb-6">
                While your competitors go to voicemail,{" "}
                <span className="italic text-rain-400">you get the job.</span>
              </h2>
              <p className="text-cream-100/70 text-[15px] leading-relaxed mb-8">
                Storm season is your biggest opportunity — and your biggest liability. Every missed call during a surge is a job that walks to the next roofer who answered. Koemori handles unlimited simultaneous calls, 24/7, with zero surge fees.
              </p>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-rain-400">85%</span>
                <span className="text-cream-100/60 text-sm leading-snug max-w-[200px]">of callers who reach voicemail never call back. They just call the next roofer.</span>
              </div>
            </div>

            {/* Right — stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "$126K", label: "Average revenue lost to missed calls per year", sub: "per roofing contractor" },
                { stat: "<3s", label: "Koemori pickup speed", sub: "every call, every time" },
                { stat: "∞", label: "Simultaneous calls during storm surge", sub: "no hold music, no voicemail" },
                { stat: "24/7", label: "Coverage including nights, weekends, and holidays", sub: "even when you're asleep" },
              ].map((c, i) => (
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
                  <div className="font-mono text-[10px] uppercase tracking-wider text-rain-400">{c.sub}</div>
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              The compounding advantage
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance mb-4">
              You're building a moat your competitors{" "}
              <span className="italic text-rain-700">can never close.</span>
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Missed calls cost you money today. But Koemori does something more powerful than just answer the phone — it turns every answered call into a review, and every review into a permanent Google Maps ranking advantage that compounds for as long as you run it.
            </p>
          </motion.div>

          {/* Flywheel */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-4 gap-4 mb-12"
          >
            {[
              {
                step: "01",
                title: "Koemori answers every call",
                desc: "No missed calls, no voicemail. Every inbound lead gets a real conversation.",
                accent: "text-rain-700",
              },
              {
                step: "02",
                title: "Auto-sends a review request",
                desc: "90 minutes after the job, the homeowner gets a personalized SMS with your Google review link.",
                accent: "text-rain-600",
              },
              {
                step: "03",
                title: "Your Google Maps ranking rises",
                desc: "Google rewards recent review velocity. More reviews this month beats a competitor's 200 old ones.",
                accent: "text-rain-500",
              },
              {
                step: "04",
                title: "More calls. More reviews. Repeat.",
                desc: "After 12 months you have a local authority your competitors would need years to replicate.",
                accent: "text-rain-400",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative bg-cream-100 border border-slate-900/8 rounded-2xl p-8"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-rain-300 z-10" />
                )}
                <div className={`font-display text-4xl tracking-tight leading-none mb-4 ${item.accent}`}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 text-[15px] mb-2">{item.title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
            className="bg-rain-800 text-cream-100 rounded-2xl px-8 py-6 flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="flex-1">
              <div className="font-semibold text-cream-100 mb-1">
                A customer with 18 months of Koemori doesn't cancel.
              </div>
              <div className="text-cream-100/70 text-[14px]">
                Canceling means losing the compounding review engine that's been building their Maps ranking. That's not a subscription — that's infrastructure.
              </div>
            </div>
            <button
              onClick={() => setCallOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-cream-100 text-rain-900 px-6 py-3 rounded-full font-medium text-sm hover:bg-cream-50 transition whitespace-nowrap"
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
              className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-8 py-4 rounded-full text-lg font-medium hover:bg-rain-700 transition"
            >
              Try it free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ — SEO + GEO anchor content */}
      <section className="px-6 py-24 bg-cream-50 border-t border-slate-900/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">FAQ</div>
            <h2 className="font-display text-4xl text-slate-900 tracking-tight">Common questions</h2>
          </motion.div>
          <div className="space-y-8">
            {[
              {
                q: "What is Koemori and who is it for?",
                a: "Koemori is an AI phone receptionist built exclusively for roofing contractors and home service trades. It answers every inbound call in under 3 seconds, qualifies the lead, books estimates, and sends you an instant alert — so you never lose a job because you were on a roof."
              },
              {
                q: "How does the AI answering service work for roofers?",
                a: "When a customer calls your number, Koemori answers immediately — day or night, storm season included. It talks like a real person, collects the job details (address, issue, preferred time), books the estimate, and texts you a summary. No voicemail, no missed calls, no lost leads."
              },
              {
                q: "How much does Koemori cost compared to a receptionist?",
                a: "Koemori starts at $300/month — less than $10/day. A part-time human receptionist costs $1,500–$2,500/month and can't work nights, weekends, or storm surges. The average roofing job is worth $8,500. Koemori pays for itself with one saved call per month."
              },
              {
                q: "Will the AI sound robotic to my customers?",
                a: "No. Koemori uses the latest voice AI technology to have natural, flowing conversations — not the robotic phone trees you're used to. Try the live demo on this page and hear it yourself. Most callers don't know they're talking to AI."
              },
              {
                q: "How do I set it up? Do I need to change my phone number?",
                a: "No number changes needed. Setup takes under 5 minutes: you forward missed calls to your Koemori number using a simple dial code on your phone. Your existing number stays the same. When you're available, take calls normally. When you're on a roof, Koemori has it covered."
              },
              {
                q: "What makes Koemori different from other AI answering services?",
                a: "Koemori is built specifically for roofers — not a generic AI tool repurposed for trades. That means storm-season call surge handling, roofing-specific qualification questions, estimate booking flow, and instant lead alerts formatted the way contractors actually work. Generic AI answering services don't know what a 'soft wash' or 'wind mitigation inspection' is. Koemori does."
              },
            ].map((item, i) => (
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
      <WaitlistModal
        open={waitlist.open}
        service={waitlist.service}
        onClose={() => setWaitlist({ open: false, service: null })}
      />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} />
    </>
  );
}

function CardInner({ s, Icon, isActive }) {
  return (
    <>
      {isActive ? (
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-rain-700 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]">
          <span className="w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" />
          Live
        </div>
      ) : (
        <div className="absolute top-5 right-5 bg-slate-900 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]">
          Strategic Beta
        </div>
      )}
      <Icon className={`w-6 h-6 mb-8 ${isActive ? "text-rain-700" : "text-slate-400"}`} />
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
        {s.eyebrow}
      </div>
      <h3 className="font-display text-3xl text-slate-900 tracking-tight mb-1">{s.title}</h3>
      <div className="font-display italic text-rain-500 mb-4">{s.tagline}</div>
      <p className="text-slate-600 text-[15px] leading-relaxed mb-6">{s.desc}</p>
      <div className="pt-4 border-t border-slate-900/6 flex items-center justify-between">
        <div>
          <div className="font-display text-2xl text-slate-900">{s.stat.v}</div>
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            {s.stat.l}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isActive ? "text-rain-700" : "text-slate-500"}`}>
          {isActive ? "Explore" : "Join waitlist"}
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </>
  );
}
