import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone, Calendar, Rocket, ArrowRight, Check,
  Clock, ShieldCheck, Mic, MessageSquare, Sparkles,
} from "lucide-react";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";

const EASE = [0.22, 1, 0.36, 1];
const CAL_LINK = "https://cal.com/rainn/15-min-meeting";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const steps = [
  {
    n: "01",
    icon: Mic,
    title: "Try the live demo",
    body: "Pick up the phone and talk to our AI receptionist yourself. No signup, no card, no demo video — actual voice agent. Five free calls.",
    actionLabel: "Start a test call",
    duration: "Takes ~2 minutes",
    accent: "rain",
  },
  {
    n: "02",
    icon: Calendar,
    title: "Tell us about your business",
    body: "Fill out a quick 3-minute setup — your hours, services, and the calls you're missing — then grab a 15-minute call. We show up already knowing your business and walk through exactly what we'd build.",
    actionLabel: "Start setup",
    duration: "Takes 3 minutes",
    accent: "slate",
  },
  {
    n: "03",
    icon: Rocket,
    title: "We deploy your Koemori line",
    body: "Within 48 hours we build your custom AI receptionist, wire up instant lead texts to your phone, give you the carrier code to forward your number, and run live test calls together.",
    actionLabel: "See what it could earn",
    duration: "Live in 48 hours",
    accent: "rain",
  },
];

const handles = {
  koemori: [
    "Custom AI receptionist tuned to your roofing company",
    "All inbound calls answered in <3 seconds, 24/7",
    "Real-time text handoff of every lead to your phone",
    "Roofing objection library + your brand voice",
    "Calendar integration and live estimate booking",
    "10DLC compliance + ongoing optimization",
  ],
  you: [
    "Forward your business number (5-min carrier code)",
    "Tell us your services + the calls you keep missing",
    "Pick a brand voice direction (we can suggest)",
    "Show up to the 15-min discovery call",
    "Pay your custom quote once we're confirmed live",
  ],
};

const faqs = [
  {
    q: "Will it sound like a robot?",
    a: "No. Modern AI voice agents pass for human in casual conversation. Try the live demo above — that's the actual voice quality you'd ship with. You can pick from male/female and several accents.",
  },
  {
    q: "What if a caller needs something the AI can't handle?",
    a: "The agent escalates cleanly: it captures the caller's info, says \"let me get one of our specialists to call you right back,\" and SMS-handoffs to your phone. You call back warm, never cold.",
  },
  {
    q: "Do I keep my existing phone number?",
    a: "Yes. We don't port your number. Your existing carrier (Verizon, AT&T, etc.) supports conditional call forwarding — we give you a 6-digit code to dial, and inbound calls forward to your Koemori line after 2 rings.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no long-term commitment. You pay month-to-month and pause whenever. Our job is to earn the renewal — if the AI isn't paying for itself, you shouldn't be paying us.",
  },
  {
    q: "What does it cost?",
    a: "Pricing is custom — we quote every business individually based on call volume, services, and what we'd build. There's no tier you have to fit into. On the 15-min discovery call we walk through your numbers, agree on a setup fee and monthly amount, and send you a payment link. All platform usage costs (Retell, Twilio, etc.) are included — no hidden bills.",
  },
];

function StepCard({ s, i, onDemo }) {
  const Icon = s.icon;
  const onClick = i === 0 ? onDemo : null;
  const href = null;
  const internalLink = i === 1 ? "/onboarding" : i === 2 ? "/automations#savings" : null;

  const buttonContent = (
    <>
      {s.actionLabel}
      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
    </>
  );

  return (
    <motion.div variants={fadeUp} className="bg-cream-50 border border-slate-900/8 rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-slate-900/20 transition">
      <div className="absolute -top-4 -right-4 font-display text-[10rem] leading-none text-rain-100/60 select-none pointer-events-none">
        {s.n}
      </div>
      <div className="relative">
        <div className={`w-12 h-12 rounded-full ${s.accent === "rain" ? "bg-rain-700 text-cream-100" : "bg-slate-900 text-cream-100"} flex items-center justify-center mb-6`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          {s.duration}
        </div>
        <h3 className="font-display text-3xl text-slate-900 tracking-tight mb-4 leading-tight">
          {s.title}
        </h3>
        <p className="text-slate-600 leading-relaxed mb-7 max-w-md">{s.body}</p>

        {onClick && (
          <button onClick={onClick} className="group/btn inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition">
            {buttonContent}
          </button>
        )}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="group/btn inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition">
            {buttonContent}
          </a>
        )}
        {internalLink && (
          <Link to={internalLink} className="group/btn inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-3 rounded-full text-sm font-medium hover:bg-rain-700 transition">
            {buttonContent}
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-cream-100 transition"
      >
        <span className="font-display text-lg text-slate-900 tracking-tight">{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0"
        >
          <span className="text-slate-700 text-lg leading-none">+</span>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5 text-slate-600 text-[15px] leading-relaxed">{a}</div>
      </motion.div>
    </motion.div>
  );
}

export default function GetStarted() {
  const [callOpen, setCallOpen] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-20 overflow-hidden">
        <div className="absolute top-0 right-[-15%] w-[600px] h-[600px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-5xl mx-auto text-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
          >
            <Sparkles className="w-3 h-3 text-rain-500" />
            How it works · 3 steps · 48 hours
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6"
          >
            From first call
            <br />
            to <span className="italic text-rain-700">live in 48 hours.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            No drawn-out sales cycles, no agency runaround. Try the system, hop on a 15-minute call,
            and we have your AI receptionist answering the phones by week's end.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setCallOpen(true)}
              className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-700 transition"
            >
              <Mic className="w-4 h-4" />
              Try the demo first
            </button>
            <Link
              to="/onboarding"
              className="group inline-flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full font-medium hover:border-slate-900/30 transition"
            >
              <Calendar className="w-4 h-4" />
              Set up your AI
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 3 steps */}
      <section className="relative px-6 pb-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4"
        >
          {steps.map((s, i) => (
            <StepCard key={i} s={s} i={i} onDemo={() => setCallOpen(true)} />
          ))}
        </motion.div>
      </section>

      {/* What we handle vs what you handle */}
      <section className="relative px-6 py-20 bg-cream-50 border-y border-slate-900/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-12"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              Division of labor
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance">
              We do the heavy lifting. <span className="italic text-rain-700">You stay on the truck.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-4"
          >
            <motion.div
              variants={fadeUp}
              className="bg-slate-900 text-cream-100 rounded-2xl p-8 md:p-10 relative overflow-hidden"
            >
              <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-rain-700/30 blur-3xl" />
              <div className="relative">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-400 mb-3">
                  Koemori handles
                </div>
                <h3 className="font-display text-2xl tracking-tight mb-6">All the AI stuff.</h3>
                <ul className="space-y-3">
                  {handles.koemori.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-cream-100/85 text-[15px]">
                      <Check className="w-4 h-4 text-rain-400 mt-1 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-cream-100 border border-slate-900/8 rounded-2xl p-8 md:p-10"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">
                You handle
              </div>
              <h3 className="font-display text-2xl text-slate-900 tracking-tight mb-6">
                A few small things.
              </h3>
              <ul className="space-y-3">
                {handles.you.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-[15px]">
                    <Check className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-10"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              Common questions
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance">
              You probably want to know <span className="italic text-rain-700">these things.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </motion.div>
        </div>
      </section>

      <ContactSection />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} />
    </>
  );
}
