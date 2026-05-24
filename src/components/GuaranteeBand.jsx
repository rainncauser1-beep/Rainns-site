import { motion } from "framer-motion";
import { ShieldCheck, Check } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const points = [
  "No long-term contract — pause or cancel anytime",
  "We build and tune your AI before you pay a cent",
  "Month-to-month — we earn the renewal every time",
];

export default function GuaranteeBand() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-14 overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-rain-600/30 blur-[90px] pointer-events-none" />

          <div className="relative grid md:grid-cols-[auto,1fr] gap-8 md:gap-12 items-center">
            {/* Shield */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="hidden md:flex w-28 h-28 rounded-3xl bg-rain-500/15 border border-rain-400/30 items-center justify-center flex-shrink-0"
            >
              <ShieldCheck className="w-12 h-12 text-rain-300" />
            </motion.div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 md:hidden" />
                The ROI guarantee
              </div>

              <h2 className="font-display text-3xl md:text-[2.75rem] leading-[1.05] tracking-tight text-balance mb-5">
                If we ever cost you more than we make you,
                <span className="text-rain-300"> your first month is free.</span>
              </h2>

              <p className="text-cream-100/75 text-[15px] md:text-lg leading-relaxed mb-7 max-w-2xl">
                That's the whole deal. If your AI doesn't book you more than it
                costs in your first month, you don't pay for that month — every
                dollar back, no hoops. We only win when you win.
              </p>

              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {points.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-2.5 text-cream-100/85 text-[14px]"
                  >
                    <Check className="w-4 h-4 text-rain-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
