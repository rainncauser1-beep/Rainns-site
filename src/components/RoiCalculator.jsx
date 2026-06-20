import { useState, useMemo, useRef, useEffect } from "react";
import { motion, useInView, animate } from "framer-motion";
import { TrendingUp, Phone, DollarSign } from "lucide-react";
import { lighten, darken, rgba } from "../lib/accent";

const EASE = [0.22, 1, 0.36, 1];

// Roofing defaults so the number feels real out of the gate. Other verticals
// pass their own via props (see src/config/vertical-content.js -> roi).
const ROOFING_DEFAULTS = { callsPerWeek: 12, missedPct: 50, avgJob: 8500, avgJobMin: 500, avgJobMax: 30000 };
const ROOFING_BLURB =
  "Most roofers miss over half their inbound calls — storm season, on a roof, after hours. Drag the sliders to your numbers and watch what's walking out the door.";

// Conservative assumption: of the missed calls we now answer, this share
// become booked jobs. Kept deliberately low — most missed calls are spam,
// wrong numbers, or existing customers, so the figure stays defensible.
const CAPTURE_CONVERSION = 0.10;
const WEEKS_PER_YEAR = 50;

function AnimatedNumber({ value, prefix = "", duration = 1.1 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {Math.round(display).toLocaleString()}
    </span>
  );
}

function Slider({ label, value, min, max, step, onChange, format, accentHex = "#15325a" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <span className="font-display text-xl text-slate-900 tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="roi-slider w-full"
        style={{
          background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${pct}%, #e5e1d8 ${pct}%, #e5e1d8 100%)`,
        }}
      />
    </div>
  );
}

export default function RoiCalculator({ label = "Roofing", defaults, blurb = ROOFING_BLURB, accentHex = "#15325a" }) {
  const d = { ...ROOFING_DEFAULTS, ...(defaults || {}) };
  const avgStep = d.avgJobMax <= 3000 ? 25 : 100;
  const accentLight = lighten(accentHex, 0.5);
  const accentStrong = darken(accentHex, 0.18);
  const [callsPerWeek, setCallsPerWeek] = useState(d.callsPerWeek);
  const [missedPct, setMissedPct] = useState(d.missedPct);
  const [avgJob, setAvgJob] = useState(d.avgJob);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const { lostPerYear, recoveredPerYear, jobsRecovered } = useMemo(() => {
    const missedPerWeek = callsPerWeek * (missedPct / 100);
    const lostJobsPerWeek = missedPerWeek * CAPTURE_CONVERSION;
    const lost = lostJobsPerWeek * avgJob * WEEKS_PER_YEAR;
    return {
      lostPerYear: Math.round(lost),
      recoveredPerYear: Math.round(lost), // we recover what's currently lost
      jobsRecovered: Math.round(lostJobsPerWeek * WEEKS_PER_YEAR),
    };
  }, [callsPerWeek, missedPct, avgJob]);

  return (
    <section ref={sectionRef} id="roi" className="px-6 py-24 bg-cream-50 border-y border-slate-900/5">
      {/* slider thumb styling */}
      <style>{`
        .roi-slider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 9999px; outline: none; cursor: pointer; }
        .roi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 9999px; background: ${accentHex}; border: 3px solid #f5f5f3; box-shadow: 0 1px 4px rgba(11,18,32,0.25); cursor: pointer; }
        .roi-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: ${accentHex}; border: 3px solid #f5f5f3; cursor: pointer; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 max-w-2xl"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: accentStrong }}>
            The missed-call math
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight text-balance">
            See what answering the phone is <span className="italic" style={{ color: accentHex }}>actually worth.</span>
          </h2>
          <p className="text-slate-600 mt-4 text-[15px] leading-relaxed">
            {blurb}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            className="bg-cream-100 border border-slate-900/8 rounded-3xl p-8"
          >
            <div className="inline-flex items-center gap-1.5 mb-8 px-3 py-1.5 rounded-full bg-slate-900 text-cream-100 text-[12px] font-medium">
              {label}
            </div>

            <div className="space-y-7">
              <Slider
                label="Calls per week"
                value={callsPerWeek}
                min={5}
                max={120}
                step={1}
                onChange={setCallsPerWeek}
                accentHex={accentHex}
              />
              <Slider
                label="% you miss or can't get to"
                value={missedPct}
                min={5}
                max={90}
                step={5}
                onChange={setMissedPct}
                format={(v) => `${v}%`}
                accentHex={accentHex}
              />
              <Slider
                label="Average job value"
                value={avgJob}
                min={d.avgJobMin}
                max={d.avgJobMax}
                step={avgStep}
                onChange={setAvgJob}
                format={(v) => `$${v.toLocaleString()}`}
                accentHex={accentHex}
              />
            </div>
          </motion.div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-center"
          >
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[80px]" style={{ background: rgba(accentHex, 0.4) }} />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-3 flex items-center gap-2" style={{ color: accentLight }}>
                <TrendingUp className="w-3 h-3" />
                Revenue you're leaving on the table
              </div>
              <div className="font-display text-5xl md:text-6xl tracking-tight leading-none mb-2">
                <AnimatedNumber value={lostPerYear} prefix="$" />
                <span className="text-2xl text-cream-100/50 ml-2">/yr</span>
              </div>
              <p className="text-cream-100/70 text-sm leading-relaxed mb-8">
                That's roughly <strong className="text-cream-100">{jobsRecovered} jobs</strong> a
                year your competitors are answering for — while you're on a job,
                on the road, or asleep.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-cream-100/5 border border-cream-100/10 rounded-2xl p-4">
                  <Phone className="w-4 h-4 mb-2" style={{ color: accentLight }} />
                  <div className="font-display text-2xl">
                    <AnimatedNumber value={Math.round(callsPerWeek * (missedPct / 100) * WEEKS_PER_YEAR)} />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-cream-100/50">
                    missed calls/yr
                  </div>
                </div>
                <div className="bg-cream-100/5 border border-cream-100/10 rounded-2xl p-4">
                  <DollarSign className="w-4 h-4 mb-2" style={{ color: accentLight }} />
                  <div className="font-display text-2xl">
                    <AnimatedNumber value={recoveredPerYear} prefix="$" />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-cream-100/50">
                    Koemori recovers
                  </div>
                </div>
              </div>

              <p className="text-cream-100/60 text-[13px] leading-relaxed">
                Koemori answers 100% of them — 24/7, in under 3 seconds. Even
                catching a fraction pays for itself many times over.
              </p>
            </div>
          </motion.div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Estimate based on a {Math.round(CAPTURE_CONVERSION * 100)}% booking rate on recovered calls · your numbers may vary
        </p>
      </div>
    </section>
  );
}
