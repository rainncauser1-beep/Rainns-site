import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Power, LogOut, MapPin, Clock, TrendingUp, Calendar,
  PhoneCall, MessageSquare, ChevronDown, ChevronUp, AlertCircle, Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import RaindropMark from "../components/RaindropMark";

const EASE = [0.22, 1, 0.36, 1];

// Forwarding instructions per major US carrier
const CARRIERS = [
  { name: "AT&T",     code: "**61*{n}#",  unconditional: "**21*{n}#",  off: "##61#" },
  { name: "Verizon",  code: "*71 {n}",    unconditional: "*72 {n}",    off: "*73"   },
  { name: "T-Mobile", code: "**61*{n}#",  unconditional: "**21*{n}#",  off: "##61#" },
  { name: "Other",    code: "*71 {n}",    unconditional: "*72 {n}",    off: "*73"   },
];

function fmtCode(template, number) {
  return template.replace("{n}", number || "<your AI number>");
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtDuration(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtPhone(p) {
  if (!p) return "Unknown";
  const digits = String(p).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return p;
}

function CallRow({ call }) {
  const [open, setOpen] = useState(false);
  const sentimentColor =
    call.sentiment?.toLowerCase().includes("positive") ? "bg-emerald-100 text-emerald-800" :
    call.sentiment?.toLowerCase().includes("negative") ? "bg-rose-100 text-rose-800" :
    "bg-slate-100 text-slate-700";

  return (
    <motion.div
      layout
      className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream-100 transition"
      >
        <div className="w-9 h-9 rounded-full bg-rain-100 flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-4 h-4 text-rain-700" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-base text-slate-900 tracking-tight">
              {fmtPhone(call.from_number)}
            </span>
            {call.sentiment && (
              <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full ${sentimentColor}`}>
                {call.sentiment}
              </span>
            )}
          </div>
          <div className="text-[13px] text-slate-600 line-clamp-1">
            {call.summary || "Call captured — view transcript for details"}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
            {fmtDate(call.started_at || call.created_at)}
          </div>
          <div className="font-mono text-[11px] text-slate-400 tabular-nums">
            {fmtDuration(call.duration_seconds)}
          </div>
        </div>

        <div className="flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-900/6 space-y-3">
              {call.summary && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">Summary</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{call.summary}</div>
                </div>
              )}
              {call.transcript && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">Transcript</div>
                  <pre className="text-[12px] text-slate-700 bg-cream-100 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                    {call.transcript}
                  </pre>
                </div>
              )}
              <a
                href={`tel:${(call.from_number || "").replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-rain-700 transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call them back
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Portal() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [calls, setCalls] = useState([]);
  const [carrier, setCarrier] = useState("AT&T");
  const [showForwardCodes, setShowForwardCodes] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (!cancelled) navigate("/portal/login", { replace: true });
        return;
      }
      setAuthChecked(true);

      // Find this user's client row by their email
      const { data: clientRow } = await supabase
        .from("clients")
        .select("*")
        .eq("owner_email", user.email)
        .maybeSingle();

      if (cancelled) return;
      setClient(clientRow);

      if (clientRow) {
        const { data: callRows } = await supabase
          .from("call_logs")
          .select("*")
          .eq("client_id", clientRow.id)
          .order("started_at", { ascending: false, nullsFirst: false })
          .limit(50);
        if (!cancelled) setCalls(callRows || []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;
    const thisWeek = calls.filter(c => c.started_at && (now - new Date(c.started_at).getTime()) < week).length;
    const thisMonth = calls.filter(c => c.started_at && (now - new Date(c.started_at).getTime()) < month).length;
    const lastCall = calls[0]?.started_at || calls[0]?.created_at;
    return { thisWeek, thisMonth, total: calls.length, lastCall };
  }, [calls]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate("/portal/login", { replace: true });
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-cream-100 px-6 py-20 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <h1 className="font-display text-3xl text-slate-900 tracking-tight mb-3">
            We don't see your account yet
          </h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            This portal is for active Raindrop AI clients. If you've signed up
            recently, your account may still be being provisioned. Reach out
            and we'll sort it out.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:hello@raindrop.ai"
              className="bg-slate-900 text-cream-100 px-5 py-3 rounded-full font-medium hover:bg-rain-700 transition"
            >
              Email us
            </a>
            <button
              onClick={signOut}
              className="text-sm text-slate-500 hover:text-slate-900 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const aiNumber = client.retell_phone_number;
  const selectedCarrier = CARRIERS.find(c => c.name === carrier) || CARRIERS[0];

  return (
    <div className="min-h-screen bg-cream-100 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-xl border-b border-slate-900/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <RaindropMark size={26} />
            <span className="font-display text-xl text-slate-900 tracking-tight">
              Raindrop<span className="text-rain-500">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-slate-500">
              {client.business_name}
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full text-[13px] font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-8"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-2">
            Your Raindrop dashboard
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight">
            Hey {client.owner_name?.split(" ")[0] || "there"}.
          </h1>
          <p className="text-slate-600 mt-3 text-[15px]">
            Everything your AI receptionist has been up to.
          </p>
        </motion.div>

        {/* AI Number + Forwarding card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
          className="bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rain-700/30 blur-[80px]" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">
                Your AI phone number
              </div>
              {aiNumber ? (
                <>
                  <div className="font-display text-4xl md:text-5xl tracking-tight mb-3 break-all">
                    {fmtPhone(aiNumber)}
                  </div>
                  <a
                    href={`tel:${aiNumber.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 bg-rain-500 hover:bg-rain-400 text-slate-900 px-4 py-2 rounded-full text-sm font-medium transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call it to test
                  </a>
                </>
              ) : (
                <div className="text-cream-100/70 text-sm leading-relaxed">
                  Your dedicated AI number is being provisioned. You'll get an
                  email within 24 hours with the number and forwarding code.
                </div>
              )}
            </div>

            {aiNumber && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">
                  Forwarding setup
                </div>
                <p className="text-cream-100/80 text-sm leading-relaxed mb-4">
                  Dial this code from your business phone — calls forward to AI
                  only when you don't answer in 2 rings.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CARRIERS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setCarrier(c.name)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
                        carrier === c.name
                          ? "bg-cream-100 text-slate-900"
                          : "bg-cream-100/10 text-cream-100/70 hover:bg-cream-100/20"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-800/60 border border-cream-100/10 rounded-xl px-4 py-3 font-mono text-base text-cream-100 break-all">
                  {fmtCode(selectedCarrier.code, aiNumber)}
                </div>

                <button
                  onClick={() => setShowForwardCodes(!showForwardCodes)}
                  className="mt-3 text-[12px] text-rain-300 hover:text-rain-200 transition flex items-center gap-1"
                >
                  {showForwardCodes ? "Hide" : "Show"} other options (vacation mode / turn off)
                  {showForwardCodes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {showForwardCodes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2 text-[12px]">
                        <div>
                          <span className="text-cream-100/60">Send ALL calls to AI (vacation mode):</span>
                          <div className="font-mono text-cream-100 mt-0.5">{fmtCode(selectedCarrier.unconditional, aiNumber)}</div>
                        </div>
                        <div>
                          <span className="text-cream-100/60">Turn off forwarding (you take all calls):</span>
                          <div className="font-mono text-cream-100 mt-0.5">{selectedCarrier.off}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatTile icon={TrendingUp} label="Calls this week" value={stats.thisWeek} />
          <StatTile icon={Calendar} label="Calls this month" value={stats.thisMonth} />
          <StatTile icon={PhoneCall} label="All-time" value={stats.total} />
          <StatTile icon={Clock} label="Last call" value={stats.lastCall ? fmtDate(stats.lastCall) : "—"} />
        </motion.div>

        {/* Calls list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
                Recent calls
              </div>
              <h2 className="font-display text-2xl text-slate-900 tracking-tight">
                Every lead your AI captured
              </h2>
            </div>
          </div>

          {calls.length === 0 ? (
            <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-slate-500" />
              </div>
              <div className="font-display text-xl text-slate-900 mb-2 tracking-tight">
                Quiet for now
              </div>
              <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
                Once you've forwarded your number, every missed call shows up
                here with a transcript and summary.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {calls.map((c) => <CallRow key={c.id} call={c} />)}
            </div>
          )}
        </motion.div>

        <div className="mt-12 mb-6 text-center text-[12px] text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition">Back to raindrop.ai</Link>
          {" · "}
          <a href="mailto:hello@raindrop.ai" className="hover:text-slate-900 transition">Get help</a>
        </div>
      </main>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-rain-600" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <div className="font-display text-3xl text-slate-900 tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}
