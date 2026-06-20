import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import RaindropMark from "../components/RaindropMark";

const EASE = [0.22, 1, 0.36, 1];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Auth backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data?.user?.email !== "rainn.causer1@gmail.com") {
      await supabase.auth.signOut();
      setError("Access denied.");
      setLoading(false);
      return;
    }
    navigate("/admin");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-20">
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
              <Lock className="w-3.5 h-3.5 text-rain-700" />
            </div>
            <div>
              <div className="font-display text-xl text-slate-900 tracking-tight">Admin access</div>
              <div className="font-mono text-[10px] text-slate-500">Koemori · Internal</div>
            </div>
          </div>

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
              placeholder="Email"
              className="w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] text-slate-500 mt-6 uppercase tracking-wider">
          Restricted access · Koemori
        </p>
      </motion.div>
    </div>
  );
}
