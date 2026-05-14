import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";
import { saveWaitlistSignup } from "../lib/supabase";

const EASE = [0.22, 1, 0.36, 1];

export default function WaitlistModal({ open, service, onClose }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setEmail("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await saveWaitlistSignup({ email, service: service?.id ?? "unknown" });
    setDone(true);
    setLoading(false);
  };

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
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-cream-50 rounded-3xl w-full max-w-md p-8 md:p-10"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 text-slate-700" />
            </button>

            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-rain-700 text-cream-100 mx-auto flex items-center justify-center mb-5">
                  <Check className="w-7 h-7" />
                </div>
                <div className="font-display text-3xl text-slate-900 mb-2 tracking-tight">
                  You're on the list.
                </div>
                <p className="text-slate-600">
                  We'll reach out when {service?.title} opens its next cohort.
                </p>
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
                  {service?.title} is in private beta. We open seats quarterly — drop your email
                  and we'll loop you in first.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cream-100 px-6 py-3.5 rounded-full font-medium hover:bg-rain-700 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-cream-100/50 border-t-cream-100 rounded-full animate-spin" />
                    ) : (
                      <>
                        Request access <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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
