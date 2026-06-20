import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, Database, MapPin,
  ArrowRight, Send,
} from "lucide-react";
import { AnimatePresence as AP } from "framer-motion";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";
import RoiCalculator from "../components/RoiCalculator";
import GuaranteeBand from "../components/GuaranteeBand";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

const features = [
  {
    icon: Phone,
    title: "24/7 inbound coverage",
    body: "Answers every call instantly when forwarding is on. Custom voice, custom persona, objection library tuned for roofing. Toggle it on when you're on a job, off when you're back.",
  },
  {
    icon: MessageSquare,
    title: "Instant lead alerts",
    body: "The moment a call ends, the homeowner's name, number, summary, and full transcript land in your inbox and your portal. You call back warm — never cold.",
  },
  {
    icon: Calendar,
    title: "Lines up the estimate",
    body: "Koemori walks the homeowner through your booking process, locks in their preferred time window, and hands you a ready-to-confirm estimate.",
  },
  {
    icon: Database,
    title: "Every call logged",
    body: "Recording, transcript, summary, and sentiment for every call — all in your portal. Nothing slips through, nothing forgotten.",
  },
];

// Mini demo chat
function MiniChat() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hey — Ava from Apex Roofing. Got a project I can help with?" },
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
        { from: "ai", text: "Got it — I can get a tech out tomorrow 9–11am or 2–4pm. Which works?" },
      ]);
    }, 1100);
  };

  return (
    <div className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-900/6 flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rain-400 to-rain-800 flex items-center justify-center">
            <span className="font-display text-cream-100">A</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-cream-50" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900">Ava · AI Concierge</div>
          <div className="font-mono text-[10px] text-slate-500">&lt;3s response</div>
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-[180px] max-h-[240px] overflow-y-auto">
        <AP initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.from === "user"
                    ? "bg-slate-900 text-cream-100 rounded-br-md"
                    : "bg-cream-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-cream-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: d }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AP>
      </div>

      <div className="p-3 border-t border-slate-900/6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Try: 'I have a leak in my ceiling'"
          className="flex-1 bg-cream-100 border border-slate-900/8 rounded-full px-4 py-2.5 text-sm outline-none focus:border-rain-400 transition placeholder:text-slate-400"
        />
        <button
          onClick={send}
          className="w-9 h-9 bg-slate-900 text-cream-100 rounded-full flex items-center justify-center hover:bg-rain-700 transition flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Automations() {
  const [callOpen, setCallOpen] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-start"
        >
          <div className="lg:col-span-6">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-rain-700 text-cream-100 rounded-full text-[11px] uppercase tracking-[0.18em]"
            >
              <span className="w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" />
              Live · Nashville 615 / 629
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[clamp(3rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6"
            >
              The receptionist
              <br />
              that <span className="italic text-rain-700">never misses.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-slate-600 leading-relaxed mb-10 max-w-lg"
            >
              Built for roofers. When you're on a job, Koemori answers every call instantly, qualifies
              the homeowner, lines up the estimate, and sends you the full lead before they hang up —
              while you're still up on the last roof.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => setCallOpen(true)}
                className="group inline-flex items-center gap-2 bg-rain-700 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-600 transition"
              >
                <Phone className="w-4 h-4" />
                Try it free — 5 calls
              </button>
              <a
                href="#roi"
                className="inline-flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-800 px-6 py-4 rounded-full hover:border-slate-900/30 transition"
              >
                See what you're missing
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center gap-2 text-[13px] text-slate-600"
            >
              <MapPin className="w-4 h-4 text-rain-500" />
              Deployed live in Davidson County
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="lg:col-span-6">
            <MiniChat />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 bg-cream-50 border-y border-slate-900/5">
        <div className="max-w-7xl mx-auto py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-10"
          >
            What's included
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-4"
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="bg-cream-100 border border-slate-900/8 rounded-2xl p-7 flex gap-5"
                >
                  <div className="w-10 h-10 rounded-full bg-rain-700 text-cream-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-xl text-slate-900 mb-1.5 tracking-tight">
                      {f.title}
                    </div>
                    <div className="text-slate-600 text-[15px] leading-relaxed">{f.body}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <RoiCalculator />

      <GuaranteeBand />

      <ContactSection />
      <CallDemoModal open={callOpen} onClose={() => setCallOpen(false)} vertical="roofing" />
    </>
  );
}
