import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Code, Search, Zap, ArrowRight, Lock } from "lucide-react";
import WaitlistModal from "../components/WaitlistModal";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const service = { id: "architecture", title: "Digital Architecture" };

const coming = [
  {
    icon: Code,
    title: "Conversion-Built Websites",
    desc: "High-performance React sites built around one goal: booking jobs. Not portfolios. Not Wix. Revenue-generating digital storefronts.",
  },
  {
    icon: Search,
    title: "AI Search Visibility (AEO)",
    desc: "ChatGPT, Perplexity, and Gemini are how people find local services now. We build the structured content and schema that gets you cited, not buried.",
  },
  {
    icon: Zap,
    title: "Performance & Core Web Vitals",
    desc: "Google scores every page. Slow sites lose to fast ones. We build at 99+ Lighthouse scores so your ad spend doesn't go to waste.",
  },
];

export default function Architecture() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <section className="relative px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-rain-100/40 blur-[140px] pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-7xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-slate-900 text-cream-100 rounded-full text-[11px] uppercase tracking-[0.18em]"
          >
            <Lock className="w-3 h-3" /> Strategic Beta
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.02em] text-slate-900 text-balance mb-6 max-w-4xl"
          >
            Digital Architecture
            <br />
            <span className="italic text-rain-700">the rails everything runs on.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10"
          >
            Your website is the first thing your AI agent sends leads back to. If it's slow,
            unclear, or invisible to AI search engines — you're leaking revenue before the phone
            even rings. We fix that.
          </motion.p>

          <motion.button
            variants={fadeUp}
            onClick={() => setWaitlistOpen(true)}
            className="group inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-4 rounded-full font-medium hover:bg-rain-700 transition"
          >
            Request early access
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </motion.div>
      </section>

      <section className="px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-8"
          >
            What's included
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {coming.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-cream-50 border border-slate-900/8 rounded-2xl p-8"
                >
                  <Icon className="w-6 h-6 text-slate-400 mb-6" />
                  <h3 className="font-display text-2xl text-slate-900 tracking-tight mb-3">
                    {c.title}
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{c.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-8 bg-cream-50 border border-slate-900/8 rounded-2xl p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <div className="font-display text-2xl text-slate-900 mb-2 tracking-tight">
                Beta cohort opens Q4 2026.
              </div>
              <p className="text-slate-600 max-w-md">
                We take on a limited number of site builds per quarter to maintain quality.
                Get on the list early — builds fill up fast.
              </p>
            </div>
            <button
              onClick={() => setWaitlistOpen(true)}
              className="flex-shrink-0 flex items-center gap-2 bg-slate-900 text-cream-100 px-6 py-3.5 rounded-full font-medium hover:bg-rain-700 transition whitespace-nowrap"
            >
              Join the waitlist <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      <WaitlistModal
        open={waitlistOpen}
        service={service}
        onClose={() => setWaitlistOpen(false)}
      />
    </>
  );
}
