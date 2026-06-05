import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Power, LogOut, MapPin, Clock, TrendingUp, Calendar,
  PhoneCall, MessageSquare, ChevronDown, ChevronUp, AlertCircle, Loader2,
  BarChart3, Wifi, Settings, Save, Check, ArrowUp, ArrowDown, Minus,
  CreditCard, PauseCircle, PlayCircle, XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import RaindropMark from "../components/RaindropMark";

const EASE = [0.22, 1, 0.36, 1];

// Forwarding instructions per major US carrier
// Unconditional forward = all calls go to AI. Simple, always works.
// Toggle on/off with the off code. Roofers use this when on job sites.
const CARRIERS = [
  { name: "AT&T",     on: "**21*{n}#", off: "##21#", settings: false },
  { name: "T-Mobile", on: "**21*{n}#", off: "##21#", settings: false },
  { name: "Verizon",  on: "*72{n}",    off: "*73",   settings: true  },
  { name: "Other",    on: "**21*{n}#", off: "##21#", settings: false },
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
  const [liveBadge, setLiveBadge] = useState(false);
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

  // Realtime subscription: new calls appear without refresh
  useEffect(() => {
    if (!supabase || !client?.id) return;
    const channel = supabase
      .channel(`call-logs-${client.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_logs",
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          setCalls((prev) => {
            // Dedupe by id in case the initial load and the realtime event race
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
          setLiveBadge(true);
          setTimeout(() => setLiveBadge(false), 4000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_logs",
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          setCalls((prev) =>
            prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [client?.id]);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;
    const thisWeek = calls.filter(c => c.started_at && (now - new Date(c.started_at).getTime()) < week).length;
    const lastWeek = calls.filter(c => {
      if (!c.started_at) return false;
      const age = now - new Date(c.started_at).getTime();
      return age >= week && age < 2 * week;
    }).length;
    const thisMonth = calls.filter(c => c.started_at && (now - new Date(c.started_at).getTime()) < month).length;
    const lastCall = calls[0]?.started_at || calls[0]?.created_at;
    return { thisWeek, lastWeek, thisMonth, total: calls.length, lastCall };
  }, [calls]);

  // 14-day daily call counts for the performance chart
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const count = calls.filter((c) => {
        if (!c.started_at) return false;
        const d = new Date(c.started_at);
        return d >= day && d < next;
      }).length;
      days.push({
        date: day,
        count,
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        full: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isToday: i === 0,
      });
    }
    return days;
  }, [calls]);

  const chartMax = useMemo(() => Math.max(1, ...chartData.map((d) => d.count)), [chartData]);

  // Trend delta this week vs last week
  const weekDelta = useMemo(() => {
    const { thisWeek, lastWeek } = stats;
    if (lastWeek === 0 && thisWeek === 0) return { pct: 0, dir: "flat" };
    if (lastWeek === 0) return { pct: 100, dir: "up" };
    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    return {
      pct: Math.round(Math.abs(change)),
      dir: change > 0 ? "up" : change < 0 ? "down" : "flat",
    };
  }, [stats]);

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
            This portal is for active Koemori clients. If you've signed up
            recently, your account may still be being provisioned. Reach out
            and we'll sort it out.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:hello@koemori.ai"
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
              Koemori<span className="text-rain-500">.</span>
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
            Your Koemori dashboard
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight">
            Hey {client.owner_name?.split(" ")[0] || "there"}.
          </h1>
          <p className="text-slate-600 mt-3 text-[15px]">
            Everything your AI receptionist has been up to.
          </p>
        </motion.div>

        {/* AI Number + Setup Guide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
          className="mb-8"
        >
          {/* AI number hero */}
          <div className="bg-slate-900 text-cream-100 rounded-3xl p-8 md:p-10 mb-4 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rain-700/30 blur-[80px]" />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">
                Your AI phone number
              </div>
              {aiNumber ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="font-display text-4xl md:text-5xl tracking-tight break-all">
                    {fmtPhone(aiNumber)}
                  </div>
                  <a
                    href={`tel:${aiNumber.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 bg-rain-500 hover:bg-rain-400 text-slate-900 px-4 py-2 rounded-full text-sm font-medium transition self-start"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call to test
                  </a>
                </div>
              ) : (
                <div className="text-cream-100/70 text-sm leading-relaxed max-w-md">
                  Your dedicated AI number is being set up. You'll get an email
                  within 24 hours with the number and setup instructions.
                </div>
              )}
              {aiNumber && (
                <p className="mt-3 text-cream-100/60 text-sm">
                  Callers never see this number — they call your regular number and the AI picks up when you don't answer.
                </p>
              )}
            </div>
          </div>

          {/* Step by step setup */}
          {aiNumber && (
            <div className="bg-cream-50 border border-slate-900/8 rounded-3xl p-7 md:p-10 space-y-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">Setup guide</div>
                <h2 className="font-display text-2xl text-slate-900 tracking-tight">3 steps to go live</h2>
                <p className="text-slate-500 text-sm mt-1">Takes about 5 minutes. Do these in order.</p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-900 text-cream-100 flex items-center justify-center font-bold text-sm">1</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">Call your AI to hear how it sounds</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    Dial <span className="font-mono bg-cream-200 px-1.5 py-0.5 rounded text-slate-800">{fmtPhone(aiNumber)}</span> from any phone right now. The AI will answer as your business. This is just a test — nothing is forwarded yet.
                  </p>
                  <a
                    href={`tel:${aiNumber.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-rain-700 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call now
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-900 text-cream-100 flex items-center justify-center font-bold text-sm">2</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">Forward your calls to the AI</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    Open your dialer and type the code below, then press <strong>Call</strong>. It's a carrier command — not a real call. You'll hear a quick confirmation tone and you're done. Flip it off just as fast when you want to take calls yourself.
                  </p>

                  {/* Carrier selector */}
                  <div className="mb-3">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">Select your carrier</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CARRIERS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setCarrier(c.name)}
                          className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition border ${
                            carrier === c.name
                              ? "bg-slate-900 text-cream-100 border-slate-900"
                              : "bg-cream-100 text-slate-700 border-slate-900/15 hover:border-slate-900/35"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Turn ON code */}
                  <div className="bg-slate-900 rounded-2xl p-5 mb-3">
                    <p className="text-cream-100/60 text-[11px] uppercase tracking-wider font-mono mb-1">Turn AI ON — open dialer and type:</p>
                    <p className="font-mono text-cream-100 text-xl md:text-2xl break-all tracking-wide mb-3">
                      {fmtCode(selectedCarrier.on, aiNumber)}
                    </p>
                    <div className="border-t border-cream-100/10 pt-3 mt-1">
                      <p className="text-cream-100/60 text-[11px] uppercase tracking-wider font-mono mb-1">Turn AI OFF — back to normal:</p>
                      <p className="font-mono text-cream-100 text-lg break-all">{selectedCarrier.off}</p>
                    </div>
                    <p className="text-cream-100/40 text-[11px] mt-3">Press Call after each code. You'll hear a confirmation tone.</p>
                  </div>

                  {selectedCarrier.settings && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-900 leading-relaxed mb-3">
                      <strong>Verizon tip:</strong> If the dialer code doesn't work, go to <strong>Settings → Phone → Call Forwarding</strong> on your iPhone, toggle it on, and enter <span className="font-mono">{aiNumber}</span>. To turn off, toggle it back.
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-[13px] text-emerald-900 leading-relaxed">
                    💡 <strong>How roofers use this:</strong> Turn AI ON when you head to a job site. Turn it OFF when you're back in the office. Your customers always call your same number — the AI just catches what you can't.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-900 text-cream-100 flex items-center justify-center font-bold text-sm">3</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">Test that it's working</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Ask a friend to call your <strong>regular business number</strong>. Don't answer. The AI should pick up on the 2nd or 3rd ring. Within 30 seconds you'll get a text and email with a summary of the call — and it'll show up below in your call log.
                  </p>
                </div>
              </div>

              {/* Quick reference */}
              <div className="bg-cream-100 border border-slate-900/8 rounded-2xl p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">Quick reference — {carrier} codes</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-[12px] mb-1">AI ON (forward calls)</p>
                    <code className="font-mono bg-slate-900 text-cream-100 px-2.5 py-1.5 rounded-lg text-[12px] block break-all">
                      {fmtCode(selectedCarrier.on, aiNumber)}
                    </code>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[12px] mb-1">AI OFF (back to normal)</p>
                    <code className="font-mono bg-slate-900 text-cream-100 px-2.5 py-1.5 rounded-lg text-[12px] block">
                      {selectedCarrier.off}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Performance chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          className="mb-8"
        >
          <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Performance
                </div>
                <h2 className="font-display text-2xl text-slate-900 tracking-tight">
                  Last 14 days
                </h2>
              </div>
              {weekDelta.dir !== "flat" || stats.thisWeek > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${
                    weekDelta.dir === "up"
                      ? "bg-emerald-100 text-emerald-800"
                      : weekDelta.dir === "down"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {weekDelta.dir === "up" && <ArrowUp className="w-3 h-3" />}
                    {weekDelta.dir === "down" && <ArrowDown className="w-3 h-3" />}
                    {weekDelta.dir === "flat" && <Minus className="w-3 h-3" />}
                    {weekDelta.pct}% vs last week
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bars */}
            <div className="flex items-end gap-1.5 md:gap-2 h-32 mb-3">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  {d.count > 0 && (
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-cream-100 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap z-10">
                      {d.count} call{d.count !== 1 ? "s" : ""} · {d.full}
                    </div>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / chartMax) * 100}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.025 }}
                    className={`w-full rounded-t-md ${
                      d.isToday
                        ? "bg-gradient-to-t from-rain-700 to-rain-500"
                        : d.count > 0
                        ? "bg-slate-400 group-hover:bg-slate-600 transition-colors"
                        : "bg-cream-200"
                    }`}
                    style={{ minHeight: d.count > 0 ? 4 : 2 }}
                  />
                </div>
              ))}
            </div>

            {/* Day labels */}
            <div className="flex gap-1.5 md:gap-2">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center font-mono text-[10px] ${
                    d.isToday ? "text-rain-700 font-semibold" : "text-slate-400"
                  }`}
                >
                  {d.label[0]}
                </div>
              ))}
            </div>

            {stats.total === 0 && (
              <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Once your AI starts taking calls, you'll see the rhythm here
              </p>
            )}
          </div>
        </motion.div>

        {/* Calls list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1 flex items-center gap-2">
                Recent calls
                <AnimatePresence>
                  {liveBadge && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 normal-case tracking-normal bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      New call
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <h2 className="font-display text-2xl text-slate-900 tracking-tight">
                Every lead your AI captured
              </h2>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
              Live
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

        {/* Edit business info */}
        <EditBusinessInfo client={client} onUpdated={(updated) => setClient((c) => ({ ...c, ...updated }))} />

        {/* Manage subscription */}
        <ManageSubscription client={client} onChanged={(status) => setClient((c) => ({ ...c, payment_status: status }))} />

        <div className="mt-12 mb-6 text-center text-[12px] text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition">Back to koemori.ai</Link>
          {" · "}
          <a href="mailto:hello@koemori.ai" className="hover:text-slate-900 transition">Get help</a>
        </div>
      </main>
    </div>
  );
}

function EditBusinessInfo({ client, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    business_hours: client.business_hours || "",
    services: client.services || "",
    top_objections: client.top_objections || "",
    brand_voice_notes: client.brand_voice_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    form.business_hours !== (client.business_hours || "") ||
    form.services !== (client.services || "") ||
    form.top_objections !== (client.top_objections || "") ||
    form.brand_voice_notes !== (client.brand_voice_notes || "");

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/.netlify/functions/update-client-prefs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (HTTP ${res.status})`);

      onUpdated?.(data.client || form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400 text-slate-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      className="mt-10"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 bg-cream-50 border border-slate-900/8 hover:border-slate-900/20 rounded-2xl px-6 py-5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rain-100 flex items-center justify-center">
            <Settings className="w-3.5 h-3.5 text-rain-700" />
          </div>
          <div className="text-left">
            <div className="font-display text-lg text-slate-900 tracking-tight">
              Tune your AI
            </div>
            <div className="text-[12px] text-slate-500">
              Update hours, services, objections — changes go live within a minute
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="bg-cream-50 border border-t-0 border-slate-900/8 rounded-b-2xl -mt-px p-6 md:p-8 space-y-5">
              <Field label="Business hours" hint="When you're open. Mon–Fri 8am–6pm, Sat 9am–2pm, etc.">
                <input
                  className={inputCls}
                  value={form.business_hours}
                  onChange={(e) => setForm((f) => ({ ...f, business_hours: e.target.value }))}
                />
              </Field>

              <Field label="Services offered" hint="One per line or comma-separated. The AI will reference these when answering questions.">
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y`}
                  value={form.services}
                  onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                />
              </Field>

              <Field label="Common objections" hint="Things callers often push back on — the AI will be ready for these.">
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y`}
                  value={form.top_objections}
                  onChange={(e) => setForm((f) => ({ ...f, top_objections: e.target.value }))}
                />
              </Field>

              <Field label="Brand voice notes" hint="Tone, do's and don'ts. Things you want the AI to sound like (or not).">
                <textarea
                  className={`${inputCls} min-h-[80px] resize-y`}
                  value={form.brand_voice_notes}
                  onChange={(e) => setForm((f) => ({ ...f, brand_voice_notes: e.target.value }))}
                />
              </Field>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                  Heads up: AI changes take effect on your <strong>next</strong> call,
                  not calls already in progress.
                </p>
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-rain-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   saved ? <Check className="w-4 h-4" /> :
                   <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1.5">
        {label}
      </div>
      {children}
      {hint && <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</div>}
    </label>
  );
}

const SUB_STATUS_COPY = {
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-800" },
  trialing:  { label: "Free trial", cls: "bg-rain-100 text-rain-800" },
  paused:    { label: "Paused",    cls: "bg-amber-100 text-amber-800" },
  past_due:  { label: "Past due",  cls: "bg-amber-100 text-amber-800" },
  canceling: { label: "Ends at period end", cls: "bg-rose-100 text-rose-800" },
  canceled:  { label: "Canceled",  cls: "bg-rose-100 text-rose-800" },
  unpaid:    { label: "Not started", cls: "bg-slate-100 text-slate-700" },
};

function ManageSubscription({ client, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const status = client.payment_status || "unpaid";
  const statusCopy = SUB_STATUS_COPY[status] || SUB_STATUS_COPY.unpaid;
  const hasSub = Boolean(client.stripe_subscription_id);

  const act = async (action) => {
    setBusy(action);
    setError("");
    try {
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/.netlify/functions/manage-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (HTTP ${res.status})`);
      onChanged?.(data.payment_status);
      setConfirmCancel(false);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
      className="mt-3"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 bg-cream-50 border border-slate-900/8 hover:border-slate-900/20 rounded-2xl px-6 py-5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rain-100 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5 text-rain-700" />
          </div>
          <div className="text-left">
            <div className="font-display text-lg text-slate-900 tracking-tight flex items-center gap-2">
              Subscription
              <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${statusCopy.cls}`}>
                {statusCopy.label}
              </span>
            </div>
            <div className="text-[12px] text-slate-500">
              Pause for the slow season or cancel anytime — no phone call required
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="bg-cream-50 border border-t-0 border-slate-900/8 rounded-b-2xl -mt-px p-6 md:p-8">
              {!hasSub ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  You don't have an active subscription on file yet. Once your
                  payment is set up, you'll be able to pause or cancel here.
                </p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mb-5">
                    {status === "paused" ? (
                      <button
                        onClick={() => act("resume")}
                        disabled={busy}
                        className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {busy === "resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                        Resume billing
                      </button>
                    ) : (
                      <button
                        onClick={() => act("pause")}
                        disabled={busy || status === "canceled" || status === "canceling"}
                        className="flex items-center justify-center gap-2 bg-cream-100 border border-slate-900/15 text-slate-800 py-3 rounded-xl text-sm font-medium hover:border-slate-900/35 transition disabled:opacity-50"
                      >
                        {busy === "pause" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                        Pause billing
                      </button>
                    )}

                    {!confirmCancel ? (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        disabled={busy || status === "canceled" || status === "canceling"}
                        className="flex items-center justify-center gap-2 bg-cream-100 border border-slate-900/15 text-rose-700 py-3 rounded-xl text-sm font-medium hover:border-rose-300 transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => act("cancel")}
                        disabled={busy}
                        className="flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        {busy === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Confirm cancel
                      </button>
                    )}
                  </div>

                  {confirmCancel && (
                    <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                      You'll keep service through the end of your current billing
                      period, then it stops. You can resubscribe anytime.{" "}
                      <button onClick={() => setConfirmCancel(false)} className="text-slate-800 underline">
                        Never mind
                      </button>
                    </p>
                  )}

                  <div className="space-y-1.5 text-[12px] text-slate-500 leading-relaxed">
                    <p><strong className="text-slate-700">Pause:</strong> stops billing while you're slow. No charges until you resume.</p>
                    <p><strong className="text-slate-700">Cancel:</strong> ends at your billing period — no early-termination fee, ever.</p>
                  </div>
                </>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
