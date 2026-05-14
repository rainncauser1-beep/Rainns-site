import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Globe, ShieldCheck, Clock, Database, MapPin } from "lucide-react";
import WaitlistModal from "../components/WaitlistModal";
import CallDemoModal from "../components/CallDemoModal";
import ContactSection from "../components/ContactSection";

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
    id: "automations",
    to: "/automations",
    eyebrow: "Active · Live Now",
    title: "AI Automations",
    tagline: "The Safety Net",
    desc: "24/7 voice receptionists and workflow automation. Every call answered in under 3 seconds — day or night.",
    icon: Sparkles,
    active: true,
    stat: { v: "<3s", l: "Speed-to-lead" },
  },
  {
    id: "marketing",
    to: "/marketing",
    eyebrow: "Strategic Beta",
    title: "Performance Marketing",
    tagline: "The Growth Engine",
    desc: "Database reactivation and AI-targeted campaigns. Turn your dead CRM into booked jobs within 48 hours.",
    icon: TrendingUp,
    active: false,
    stat: { v: "48h", l: "Avg. reactivation" },
  },
  {
    id: "architecture",
    to: "/architecture",
    eyebrow: "Strategic Beta",
    title: "Digital Architecture",
    tagline: "The Foundation",
    desc: "Conversion-built websites and AI-search visibility across ChatGPT, Perplexity, and Gemini.",
    icon: Globe,
    active: false,
    stat: { v: "3×", l: "Conversion lift" },
  },
];

const whyStats = [
  { icon: Clock, stat: "62%", body: "of calls to small businesses go unanswered. We answer 100%." },
  { icon: Database, stat: "$50K+", body: "in dormant leads sitting in the average local CRM, unworked." },
  { icon: ShieldCheck, stat: "10DLC", body: "compliant by default — every message deliverable, no carrier blocks." },
];

export default function Home() {
  const [waitlist, setWaitlist] = useState({ open: false, service: null });
  const [callOpen, setCallOpen] = useState(false);

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
            <MapPin className="w-3 h-3" /> Nashville · 615 / 629 · AI Systems Online
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6 max-w-4xl"
          >
            The agency that runs
            <br />
            while you're on
            <br />
            <span className="italic text-rain-700">the job.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-10"
          >
            Raindrop AI deploys voice agents, performance campaigns, and conversion architecture
            for local service brands. One system. Every lead captured.
          </motion.p>

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

      {/* Why Raindrop */}
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
              Why Raindrop
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance max-w-xl">
              Built for operators. <span className="italic text-rain-700">Not for demos.</span>
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
