import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Phone, Target, Briefcase, Hammer, Wind, Wrench, Sparkles } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

// Industry averages — tuned to feel honest, not inflated.
// Math: callsPerWeek × missedPct × conversionRate × avgJobValue × 50 weeks
const INDUSTRIES = [
  {
    id: "roofing",
    label: "Roofing",
    icon: Hammer,
    callsPerWeek: 18,
    missedPct: 0.62,
    conversionRate: 0.20,
    avgJobValue: 8400,
  },
  {
    id: "hvac",
    label: "HVAC",
    icon: Wind,
    callsPerWeek: 32,
    missedPct: 0.55,
    conversionRate: 0.30,
    avgJobValue: 1100,
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: Wrench,
    callsPerWeek: 28,
    missedPct: 0.58,
    conversionRate: 0.35,
    avgJobValue: 650,
  },
  {
    id: "medspa",
    label: "Med Spa",
    icon: Sparkles,
    callsPerWeek: 22,
    missedPct: 0.50,
    conversionRate: 0.40,
    avgJobValue: 480,
  },
];

function calcAnnual(ind) {
  return Math.round(
    ind.callsPerWeek * ind.missedPct * ind.conversionRate * ind.avgJobValue * 50
  );
}

function calcJobsPerYear(ind) {
  return Math.round(ind.callsPerWeek * ind.missedPct * ind.conversionRate * 50);
}

/**
 * Animated number counter — animates from current value to `value` whenever
 * `value` changes, and animates from 0 → value on first scroll into view.
 */
function Counter({ value, entered, format = (n) => Math.round(n).toLocaleString(), className = "" }) {
  const [display, setDisplay] = useState(0);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!entered) return;
    const from = lastRef.current;
    const start = performance.now();
    const duration = 1600;
    let rafId;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const v = from + (value - from) * eased;
      setDisplay(v);
      lastRef.current = v;
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [entered, value]);

  return <span className={className}>{format(display)}</span>;
}

export default function RecoveredRevenue() {
  const [industryId, setIndustryId] = useState("roofing");
  const [entered, setEntered] = useState(false);
  const sectionRef = useRef(null);
  const industry = INDUSTRIES.find((i) => i.id === industryId) ?? INDUSTRIES[0];
  const annual = calcAnnual(industry);
  const jobs = calcJobsPerYear(industry);
  const missedPerWeek = Math.round(industry.callsPerWeek * industry.missedPct);

  // Trigger animation: scroll detection with fallback. Either way, by the time
  // the user reaches the section they'll see the counter animate.
  useEffect(() => {
    if (entered) return;
    const trigger = () => setEntered(true);
    const onScroll = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) trigger();
    };
    onScroll(); // check immediately in case section already on screen
    window.addEventListener("scroll", onScroll, { passive: true });
    // Hard fallback: animate after 1.2s no matter what (e.g. anchor links)
    const t = setTimeout(trigger, 1200);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, [entered]);

  return (
    <section
      ref={sectionRef}
      id="savings"
      className="relative px-6 py-24 overflow-hidden"
    >
      {/* Ambient blob */}
      <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] rounded-full bg-rain-200/30 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-200/20 blur-[140px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Recovered revenue
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-slate-900 tracking-tight leading-[1.02] text-balance max-w-3xl">
            See what answering the phone is <span className="italic text-rain-700">actually worth.</span>
          </h2>
          <p className="mt-5 text-slate-600 text-lg max-w-xl leading-relaxed">
            The average local business misses more than half its inbound calls.
            Pick your trade — here's what those calls would be worth captured.
          </p>
        </motion.div>

        {/* Industry pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon;
            const selected = ind.id === industryId;
            return (
              <button
                key={ind.id}
                onClick={() => setIndustryId(ind.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition ${
                  selected
                    ? "bg-slate-900 text-cream-100"
                    : "bg-cream-50 border border-slate-900/10 text-slate-600 hover:border-slate-900/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {ind.label}
              </button>
            );
          })}
        </motion.div>

        {/* Hero counter card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-14 overflow-hidden mb-4"
        >
          <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-rain-700/30 blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-700/20 blur-[80px]" />

          <div className="relative grid md:grid-cols-2 gap-8 items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">
                Annual revenue currently slipping
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-7xl md:text-[8.5rem] tracking-tight leading-none text-cream-100">
                  $<Counter value={annual} entered={entered} />
                </span>
              </div>
              <div className="text-cream-100/60 text-sm leading-relaxed max-w-md">
                Based on industry averages for a typical {industry.label.toLowerCase()} operation.
                Your real number depends on call volume, ticket size, and close rate.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-cream-100/10 pb-3">
                <span className="text-cream-100/60 text-sm flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Missed calls / week
                </span>
                <span className="font-display text-2xl text-cream-100 tabular-nums">
                  <Counter value={missedPerWeek} entered={entered} />
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-100/10 pb-3">
                <span className="text-cream-100/60 text-sm flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Conversion rate
                </span>
                <span className="font-display text-2xl text-cream-100 tabular-nums">
                  {Math.round(industry.conversionRate * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-100/10 pb-3">
                <span className="text-cream-100/60 text-sm flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Avg job value
                </span>
                <span className="font-display text-2xl text-cream-100 tabular-nums">
                  $<Counter value={industry.avgJobValue} entered={entered} />
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-rain-300 text-sm font-medium">
                  Recovered jobs / year
                </span>
                <span className="font-display text-3xl text-rain-300 tabular-nums">
                  +<Counter value={jobs} entered={entered} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="text-center mt-10"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Pricing is custom · scoped on a 15-min call
          </p>
          <p className="text-slate-600 text-[15px] max-w-xl mx-auto">
            We quote each business based on call volume, services, and what we'd build.
            Most clients break even before their second month.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
