import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  Phone,
  MessageSquare,
  Database,
  ArrowUpRight,
  ArrowRight,
  Check,
  Send,
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  Globe,
  TrendingUp,
  Clock,
  MapPin,
  Mail,
  Quote,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

/* ---------- Animated SVG Raindrop Logo ---------- */
function RaindropMark({ size = 28 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <defs>
        <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7BB0" />
          <stop offset="100%" stopColor="#0F2444" />
        </linearGradient>
      </defs>
      <motion.path
        d="M16 3 C16 3, 5 15, 5 21 a11 11 0 0 0 22 0 C27 15, 16 3, 16 3 Z"
        fill="url(#dropGrad)"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "16px 22px" }}
      />
      <motion.ellipse
        cx="12"
        cy="17"
        rx="2"
        ry="3"
        fill="#F5F5F3"
        opacity="0.5"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

/* ---------- Top Nav ---------- */
function Nav({ onWaitlist }) {
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-cream-100/70 border-b border-slate-900/5"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <RaindropMark size={26} />
          <span className="font-display text-2xl text-slate-900 tracking-tight">
            Raindrop<span className="text-rain-500">.</span>
            <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-slate-500 ml-2 hidden sm:inline">
              AI
            </span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-9 font-sans text-[13px] text-slate-600">
          <a href="#hub" className="hover:text-slate-900 transition">
            Services
          </a>
          <a href="#automations" className="hover:text-slate-900 transition">
            Automations
          </a>
          <a href="#why" className="hover:text-slate-900 transition">
            Why Raindrop
          </a>
          <a href="#contact" className="hover:text-slate-900 transition">
            Contact
          </a>
        </div>
        <a
          href="#contact"
          className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-rain-700 transition"
        >
          Book a Call
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
        </a>
      </div>
    </motion.nav>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section ref={ref} id="top" className="relative pt-40 pb-28 px-6 overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 right-[-10%] w-[520px] h-[520px] rounded-full bg-rain-200/40 blur-[120px]" />
        <div className="absolute bottom-0 left-[-10%] w-[420px] h-[420px] rounded-full bg-rain-100/60 blur-[120px]" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-10 px-3.5 py-1.5 bg-cream-50 border border-slate-900/10 rounded-full text-[11px] uppercase tracking-[0.18em] text-slate-600"
          >
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            Now deploying in Nashville · 615 / 629
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3.25rem,7.5vw,7rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-8"
          >
            Intelligent systems
            <br />
            for the brands that
            <br />
            <span className="italic text-rain-700">never sleep.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed text-balance mb-12"
          >
            Raindrop AI deploys voice agents, performance campaigns, and high-conversion
            architecture for local service brands. One agency. One paycheck. Every lead answered
            in under three seconds.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <a
              href="#hub"
              className="group inline-flex items-center justify-center gap-2 bg-slate-900 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-700 transition"
            >
              Explore the system
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full hover:border-slate-900/30 transition"
            >
              Get a free audit
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Bento Service Hub ---------- */
const services = [
  {
    id: "automations",
    eyebrow: "01 / Active",
    title: "AI Automations",
    tagline: "The Safety Net",
    desc: "24/7 voice receptionists, instant SMS lead handoff, and workflow automations that pay for themselves before invoice two.",
    icon: Sparkles,
    status: "active",
    bento: "lg:col-span-2 lg:row-span-2",
    accent: "rain",
  },
  {
    id: "marketing",
    eyebrow: "02 / Strategic Beta",
    title: "Performance Marketing",
    tagline: "The Growth Engine",
    desc: "Database reactivation, AI-targeted paid social, and creative built for the trades — not for clicks, for booked jobs.",
    icon: TrendingUp,
    status: "beta",
    bento: "lg:col-span-1 lg:row-span-1",
    accent: "slate",
  },
  {
    id: "architecture",
    eyebrow: "03 / Strategic Beta",
    title: "Digital Architecture",
    tagline: "The Foundation",
    desc: "Conversion-built websites, schema, and AI-search visibility (ChatGPT, Perplexity, Gemini) — the rails the rest runs on.",
    icon: Globe,
    status: "beta",
    bento: "lg:col-span-1 lg:row-span-1",
    accent: "slate",
  },
];

function ServiceCard({ s, onBeta }) {
  const Icon = s.icon;
  const isActive = s.status === "active";

  return (
    <motion.div
      variants={fadeUp}
      layoutId={`card-${s.id}`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={`relative group bg-cream-50 border border-slate-900/8 rounded-2xl p-8 md:p-10 overflow-hidden ${s.bento}`}
    >
      {!isActive && (
        <div className="absolute top-5 right-5 z-10 inline-flex items-center gap-1.5 bg-slate-900 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]">
          <ShieldCheck className="w-3 h-3" />
          Strategic Beta
        </div>
      )}

      {isActive && (
        <div className="absolute top-5 right-5 z-10 inline-flex items-center gap-1.5 bg-rain-700 text-cream-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em]">
          <span className="w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" />
          Live
        </div>
      )}

      <div className="flex flex-col h-full">
        <Icon
          className={`w-7 h-7 mb-8 ${
            isActive ? "text-rain-700" : "text-slate-400"
          } transition`}
        />
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
          {s.eyebrow}
        </div>
        <h3 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight mb-2">
          {s.title}
        </h3>
        <div className="font-display italic text-rain-500 text-xl mb-5">{s.tagline}</div>
        <p className="text-slate-600 leading-relaxed mb-6 max-w-md">{s.desc}</p>

        <div className="mt-auto pt-4">
          {isActive ? (
            <a
              href="#automations"
              className="inline-flex items-center gap-2 text-slate-900 text-sm font-medium group/btn"
            >
              See it in action
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
          ) : (
            <button
              onClick={() => onBeta(s)}
              className="inline-flex items-center gap-2 text-slate-700 text-sm font-medium group/btn"
            >
              Join the waitlist
              <ArrowUpRight className="w-4 h-4 group-hover/btn:rotate-45 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {!isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-cream-200/40 pointer-events-none" />
      )}
    </motion.div>
  );
}

function ServiceHub({ onBeta }) {
  return (
    <section id="hub" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-12 gap-10 mb-16"
        >
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              The Hub
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] text-balance">
              Three divisions.
              <br />
              <span className="italic text-rain-700">One paycheck.</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="lg:col-span-6 lg:col-start-7">
            <p className="text-lg text-slate-600 leading-relaxed text-balance">
              Raindrop AI is structured as a service hub — three specialized divisions that share
              one operating system, one brand standard, and one obsession: making sure no lead
              your business earns ever falls through the floor.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-5 auto-rows-fr"
        >
          {services.map((s) => (
            <ServiceCard key={s.id} s={s} onBeta={onBeta} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Automations Deep Section ---------- */
function AutomationsDetail() {
  return (
    <section id="automations" className="relative py-32 px-6 bg-cream-50 border-y border-slate-900/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-12 gap-12 items-start"
        >
          <motion.div variants={fadeUp} className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4 flex items-center gap-2">
              <Phone className="w-3 h-3" /> AI Automations · Active
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] text-balance mb-6">
              A Nashville-native voice receptionist that <span className="italic text-rain-700">never misses.</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
              Live 615 and 629 numbers. Sub-three-second pickup. Every call captured, qualified,
              and texted directly to your phone before the caller hangs up.
            </p>
            <div className="inline-flex items-center gap-3 bg-cream-100 border border-slate-900/8 rounded-full px-4 py-2.5 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-rain-500" />
              Deployed live in Davidson County
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-6 lg:col-start-7 space-y-4">
            {[
              {
                icon: Phone,
                title: "24/7 inbound coverage",
                body: "Picks up in under 2 rings, day or night. Custom voice, custom persona, custom objection library tuned for your trade.",
              },
              {
                icon: MessageSquare,
                title: "Instant SMS handoff",
                body: "The moment the call ends, the full transcript and contact info hits your phone via Zapier. You call back warm, never cold.",
              },
              {
                icon: Calendar,
                title: "Live calendar booking",
                body: "Integrated with Google Calendar, GoHighLevel, or your CRM of choice. Books appointments while you're on the ladder.",
              },
              {
                icon: Database,
                title: "Database reactivation",
                body: "Wake up your CRM graveyard. AI-personalized SMS sequences that book jobs from leads you'd written off — usually within 48 hours.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="bg-cream-100 border border-slate-900/8 rounded-2xl p-6 md:p-7 flex gap-5"
                >
                  <div className="w-10 h-10 rounded-full bg-rain-700 text-cream-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl text-slate-900 mb-1.5 tracking-tight">
                      {f.title}
                    </div>
                    <div className="text-slate-600 leading-relaxed text-[15px]">{f.body}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Demo Chat (the "magic trick") ---------- */
function DemoChat() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hey there — Ava from Apex Roofing. Got a leak, a project, or just shopping around? I can get you on the calendar in under a minute.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: "user", text: input }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Got it. I can get a tech out tomorrow between 9–11am or 2–4pm — which window works better?",
        },
      ]);
    }, 1200);
  };

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid lg:grid-cols-12 gap-12 mb-12"
        >
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              Live Demo
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] text-balance">
              Talk to it. <span className="italic text-rain-700">Right now.</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="lg:col-span-6 lg:col-start-7">
            <p className="text-lg text-slate-600 leading-relaxed text-balance">
              This is the actual agent — not a screenshot. Ask about a roof leak, book an
              appointment, try to break it. This is what your customers will hit when they land
              on your site in two weeks.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="bg-cream-50 border border-slate-900/8 rounded-3xl overflow-hidden shadow-soft"
        >
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-12 border-r border-slate-900/5 bg-cream-100">
              <div className="flex items-center gap-1.5 mb-8">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="ml-3 font-mono text-[10px] text-slate-500">apex-roofing.com</div>
              </div>
              <div className="font-display text-3xl text-slate-900 mb-3 tracking-tight">
                Apex Roofing & Restoration
              </div>
              <div className="text-slate-600 text-sm mb-8 leading-relaxed">
                Family-owned. Serving Davidson County since 2011. Free estimates. No pressure.
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {["Roofing", "Gutters", "Repairs"].map((s) => (
                  <div
                    key={s}
                    className="border border-slate-900/8 rounded-lg p-3 font-mono text-[10px] uppercase text-slate-500 text-center"
                  >
                    {s}
                  </div>
                ))}
              </div>
              <div className="text-slate-400 text-xs">↓ The agent lives in the bottom-right ↘</div>
            </div>

            <div className="p-8 md:p-10 min-h-[480px] flex flex-col">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-900/5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rain-400 to-rain-700 flex items-center justify-center">
                    <span className="font-display text-cream-100 text-lg">A</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-cream-50" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Ava · AI Concierge</div>
                  <div className="font-mono text-[10px] text-slate-500">Responds in &lt;3 seconds</div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.from === "user"
                            ? "bg-slate-900 text-cream-100 rounded-br-md"
                            : "bg-cream-100 text-slate-800 rounded-bl-md border border-slate-900/5"
                        }`}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-cream-100 border border-slate-900/5 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                      <motion.span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-2 items-center border border-slate-900/10 rounded-full p-1.5 bg-cream-50 focus-within:border-rain-500 transition">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Try: 'I have a leak in my ceiling'"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 text-slate-800"
                />
                <button
                  onClick={send}
                  className="bg-slate-900 text-cream-100 p-2.5 rounded-full hover:bg-rain-700 transition"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900/5 grid grid-cols-3 divide-x divide-slate-900/5 bg-cream-100">
            {[
              { v: "<3s", l: "Avg response" },
              { v: "94%", l: "Booking rate" },
              { v: "24/7", l: "Always on" },
            ].map((s, i) => (
              <div key={i} className="p-5 text-center">
                <div className="font-display text-3xl text-rain-700">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Why Raindrop ---------- */
function WhyRaindrop() {
  const reasons = [
    {
      icon: Clock,
      stat: "<3 sec",
      title: "Speed-to-lead, always",
      body: "62% of calls to local businesses go unanswered. We answer 100% — voice, web, SMS. Every channel, every hour.",
    },
    {
      icon: Database,
      stat: "$50K+",
      title: "Dead leads, resurrected",
      body: "The average local CRM is a graveyard. Our reactivation engine wakes up dormant contacts and books jobs within 48 hours.",
    },
    {
      icon: ShieldCheck,
      stat: "10DLC",
      title: "Compliant by default",
      body: "Built for the carrier rules of 2026. Every SMS is consent-captured, registered, and deliverable — no shadow-bans.",
    },
  ];
  return (
    <section id="why" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-12 gap-12 mb-16"
        >
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
              Why Raindrop
            </div>
            <h2 className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-[0.98] text-balance">
              Built for the trades. <span className="italic text-rain-700">Run like a studio.</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="lg:col-span-6 lg:col-start-7">
            <p className="text-lg text-slate-600 leading-relaxed text-balance">
              We're not a freelance bot-builder. We're a holding company that runs the same
              systems across our own DBA portfolio — then deploys them to operators we believe in.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-3 gap-5"
        >
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="bg-cream-50 border border-slate-900/8 rounded-2xl p-8 md:p-10"
              >
                <Icon className="w-6 h-6 text-rain-700 mb-8" />
                <div className="font-display text-5xl text-slate-900 tracking-tight mb-3">
                  {r.stat}
                </div>
                <div className="font-medium text-slate-900 mb-3">{r.title}</div>
                <div className="text-slate-600 text-[15px] leading-relaxed">{r.body}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-12 bg-cream-50 border border-slate-900/8 rounded-2xl p-10 md:p-14"
        >
          <Quote className="w-8 h-8 text-rain-300 mb-6" />
          <div className="font-display text-3xl md:text-4xl text-slate-900 leading-tight tracking-tight max-w-3xl text-balance">
            "I don't just build websites. I build systems that make sure you never miss a lead
            again."
          </div>
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Rainn · Founder, Raindrop AI
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 10DLC-Compliant Contact Form ---------- */
function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-32 px-6 bg-cream-50 border-t border-slate-900/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeUp}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4"
          >
            The Next Move
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl text-slate-900 tracking-tight leading-[0.98] mb-6 text-balance"
          >
            Get your <span className="italic text-rain-700">free visibility audit.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed text-balance"
          >
            We'll show you exactly how invisible your business is to ChatGPT, Perplexity, and
            Gemini — and how many leads you're losing this week. No pitch. Just numbers.
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="bg-cream-100 border border-slate-900/8 rounded-3xl p-8 md:p-12 shadow-soft"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-10"
              >
                <div className="w-14 h-14 rounded-full bg-rain-700 text-cream-100 mx-auto flex items-center justify-center mb-6">
                  <Check className="w-7 h-7" />
                </div>
                <div className="font-display text-3xl text-slate-900 mb-3">You're in.</div>
                <div className="text-slate-600">
                  Your audit will land in your inbox within 24 hours.
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid sm:grid-cols-2 gap-4"
              >
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  className="bg-cream-50 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                />
                <input
                  required
                  type="text"
                  placeholder="Business name"
                  className="bg-cream-50 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="bg-cream-50 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                />
                <input
                  required
                  type="tel"
                  placeholder="Mobile number"
                  className="bg-cream-50 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                />
                <input
                  type="url"
                  placeholder="Website (optional)"
                  className="sm:col-span-2 bg-cream-50 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                />

                <label className="sm:col-span-2 flex items-start gap-3 text-[13px] text-slate-600 leading-relaxed cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-400 text-rain-700 focus:ring-rain-500"
                    required
                  />
                  <span>
                    I agree to receive SMS messages from <strong>Raindrop AI</strong> (operated by
                    Rainn's Enterprises) about my audit, scheduled calls, and service updates.
                    Message and data rates may apply. Message frequency varies. Reply{" "}
                    <strong>STOP</strong> to unsubscribe at any time, or <strong>HELP</strong> for
                    help. Consent is not a condition of purchase. See our{" "}
                    <a href="#legal" className="underline hover:text-slate-900">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="#legal" className="underline hover:text-slate-900">
                      Terms
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!consent}
                  className="sm:col-span-2 group inline-flex items-center justify-center gap-2 bg-slate-900 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Run my audit
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Report in &lt; 24 hours · No credit card · 10DLC compliant
        </div>
      </div>
    </section>
  );
}

/* ---------- Waitlist Modal ---------- */
function WaitlistModal({ open, service, onClose }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setEmail("");
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-cream-50 rounded-3xl w-full max-w-lg p-8 md:p-10 shadow-lift"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-700" />
            </button>

            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-rain-700 text-cream-100 mx-auto flex items-center justify-center mb-5">
                  <Check className="w-7 h-7" />
                </div>
                <div className="font-display text-3xl text-slate-900 mb-2 tracking-tight">
                  You're on the list.
                </div>
                <div className="text-slate-600">
                  We'll reach out the moment {service?.title} opens its next cohort.
                </div>
              </div>
            ) : (
              <>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-3">
                  Strategic Beta · {service?.title}
                </div>
                <div className="font-display text-3xl text-slate-900 mb-3 tracking-tight">
                  Join the waitlist.
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                  {service?.title} is currently in private beta with a small cohort of operators
                  inside the Raindrop portfolio. We open seats quarterly. Drop your email and
                  we'll loop you in.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDone(true);
                  }}
                  className="space-y-3"
                >
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-cream-100 px-6 py-3.5 rounded-full font-medium hover:bg-rain-700 transition"
                  >
                    Request access
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer id="legal" className="relative border-t border-slate-900/8 py-16 px-6 bg-cream-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-5">
              <RaindropMark size={26} />
              <span className="font-display text-2xl text-slate-900 tracking-tight">
                Raindrop<span className="text-rain-500">.</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Raindrop AI is the trading name of Rainn's Enterprises, a Nashville-based holding
              company deploying intelligent systems for local service brands across North America.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-[13px] text-slate-600">
              <Mail className="w-3.5 h-3.5 text-rain-500" />
              hello@raindrop.ai
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              Services
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#automations" className="hover:text-slate-900 transition">
                  AI Automations
                </a>
              </li>
              <li>Performance Marketing</li>
              <li>Digital Architecture</li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              Industries
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Roofing & Restoration</li>
              <li>HVAC</li>
              <li>Plumbing</li>
              <li>Med Spas</li>
              <li>Auto Detailing</li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              Legal
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#legal" className="hover:text-slate-900 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#legal" className="hover:text-slate-900 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#legal" className="hover:text-slate-900 transition">
                  SMS / 10DLC Disclosure
                </a>
              </li>
              <li>
                <a href="#legal" className="hover:text-slate-900 transition">
                  Do Not Sell My Info
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-900/8 flex flex-col md:flex-row justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          <div>© 2026 Rainn's Enterprises, LLC · Nashville, TN · All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Main App ---------- */
export default function RaindropLanding() {
  const [betaModal, setBetaModal] = useState({ open: false, service: null });
  const reduceMotion = useReducedMotion();

  // If user prefers reduced motion, the framer-motion `useReducedMotion` hook
  // already auto-disables most non-essential animations. No extra wiring needed.

  return (
    <div className="min-h-screen bg-cream-100 text-slate-900 antialiased">
      <Nav onWaitlist={(s) => setBetaModal({ open: true, service: s })} />
      <Hero />
      <ServiceHub onBeta={(s) => setBetaModal({ open: true, service: s })} />
      <AutomationsDetail />
      <DemoChat />
      <WhyRaindrop />
      <ContactForm />
      <Footer />
      <WaitlistModal
        open={betaModal.open}
        service={betaModal.service}
        onClose={() => setBetaModal({ open: false, service: null })}
      />
    </div>
  );
}
