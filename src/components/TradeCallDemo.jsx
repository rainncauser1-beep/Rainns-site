import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Check } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

// A small animated waveform — lively while Ava is "speaking".
function Waveform({ active }) {
  const bars = [0.4, 0.8, 1, 0.6, 0.9, 0.5];
  return (
    <div className="flex items-center gap-[3px] h-4">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ height: 16, transformOrigin: "center", background: "var(--accent)" }}
          animate={active ? { scaleY: [h * 0.3, h, h * 0.5] } : { scaleY: 0.18 }}
          transition={active ? { duration: 0.7 + i * 0.06, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 px-1 py-0.5">
      {[0, 0.15, 0.3].map((d, i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: d }}
        />
      ))}
    </div>
  );
}

// Auto-playing, trade-specific call transcript. Inherits the page accent via
// the --accent CSS vars set on an ancestor (see Vertical.jsx).
export default function TradeCallDemo({ demo, businessLabel = "the front desk" }) {
  const ref = useRef(null);
  const bodyRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const turns = demo?.turns ?? [];
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [typingSide, setTypingSide] = useState("ai");
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Drive the conversation forward once it scrolls into view.
  useEffect(() => {
    if (!inView || turns.length === 0) return;
    const timers = [];
    let i = 0;
    const run = () => {
      if (i >= turns.length) {
        setTyping(false);
        setDone(true);
        return;
      }
      setTypingSide(turns[i].speaker);
      setTyping(true);
      const dwell = turns[i].speaker === "ai" ? 1050 : 700;
      timers.push(
        setTimeout(() => {
          setTyping(false);
          setShown((s) => s + 1);
          i += 1;
          timers.push(setTimeout(run, 600));
        }, dwell)
      );
    };
    timers.push(setTimeout(run, 500));
    return () => timers.forEach(clearTimeout);
  }, [inView, turns]);

  // Running call timer.
  useEffect(() => {
    if (!inView || done) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [inView, done]);

  // Keep the latest line in view.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shown, typing]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const visible = turns.slice(0, shown);

  return (
    <div
      ref={ref}
      className="bg-cream-50 border border-slate-900/8 rounded-3xl overflow-hidden shadow-soft"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-900/6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-cream-100 font-display text-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}
        >
          A
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">Ava · AI receptionist</div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              {done ? "Call ended" : "Live"}
            </span>
            <span className="tabular-nums">{mm}:{ss}</span>
          </div>
        </div>
        <div className="ml-auto">
          <Waveform active={typing && typingSide === "ai" && !done} />
        </div>
      </div>

      {/* Transcript */}
      <div ref={bodyRef} className="p-4 space-y-2.5 h-[300px] overflow-y-auto">
        {visible.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className={`flex ${t.speaker === "caller" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                t.speaker === "caller"
                  ? "text-cream-100 rounded-br-md"
                  : "bg-cream-100 text-slate-800 rounded-bl-md"
              }`}
              style={t.speaker === "caller" ? { background: "var(--accent)" } : undefined}
            >
              {t.text}
            </div>
          </motion.div>
        ))}

        {typing && (
          <div className={`flex ${typingSide === "caller" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-2xl ${typingSide === "caller" ? "rounded-br-md" : "bg-cream-100 rounded-bl-md"}`}
                 style={typingSide === "caller" ? { background: "var(--accent-soft)" } : undefined}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Footer — booked confirmation */}
      <div className="px-4 py-4 border-t border-slate-900/6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={done ? { opacity: 1, y: 0 } : { opacity: 0.35, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: "var(--accent-soft)" }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
               style={{ background: "var(--accent)" }}>
            {done ? <Check className="w-4 h-4 text-cream-100" /> : <Calendar className="w-3.5 h-3.5 text-cream-100" />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--accent-strong)" }}>
              {done ? "Lead captured · texted to owner" : "Booking…"}
            </div>
            <div className="text-sm font-medium text-slate-900 truncate">{demo?.booked}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
