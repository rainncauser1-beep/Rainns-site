import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import RaindropMark from "../components/RaindropMark";

const EASE = [0.22, 1, 0.36, 1];

export default function PortalLogin() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already signed in, bounce straight to the portal
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate("/portal", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/.netlify/functions/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send sign-in link.");
      setSent(true);
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <RaindropMark size={32} />
          <span className="font-display text-2xl text-slate-900 tracking-tight">
            Koemori<span className="text-rain-500">.</span>
          </span>
        </div>

        <div className="bg-cream-50 border border-slate-900/8 rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-rain-100 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-rain-700" />
            </div>
            <div>
              <div className="font-display text-xl text-slate-900 tracking-tight">
                Client portal
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                Sign in with your email
              </div>
            </div>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="font-display text-lg text-slate-900 mb-1.5">
                Check your inbox
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                We sent a sign-in link to <strong>{email}</strong>. Click it to
                access your portal.
              </p>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

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
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cream-100 py-3.5 rounded-full font-medium hover:bg-rain-700 transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-cream-100/50 border-t-cream-100 rounded-full animate-spin" />
                  ) : (
                    <>Email me a sign-in link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="text-[11px] text-slate-500 text-center mt-5 leading-relaxed">
                No password needed. We'll email you a one-time link that signs
                you in instantly.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
