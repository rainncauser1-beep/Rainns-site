import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Phone, RefreshCw, Users, PhoneCall, X, ChevronDown, ChevronUp, BarChart3, Clock } from "lucide-react";
import { STATUSES, CHECKLIST_STEPS, PAYMENT_STATUSES, listClients, checklistProgress } from "../lib/clients";
import ClientDrawer from "./ClientDrawer";
import { supabase } from "../lib/supabase";

const EASE = [0.22, 1, 0.36, 1];

const TONE = {
  slate: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  rain: { bg: "bg-rain-100", text: "text-rain-800", dot: "bg-rain-500" },
  amber: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  rose: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
};

const PAYMENT_BADGE = {
  active:    { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  trialing:  { label: "Trial", cls: "bg-rain-100 text-rain-700" },
  paused:    { label: "Paused", cls: "bg-amber-100 text-amber-700" },
  past_due:  { label: "Past Due", cls: "bg-amber-100 text-amber-700" },
  canceling: { label: "Canceling", cls: "bg-rose-100 text-rose-700" },
  canceled:  { label: "Canceled", cls: "bg-rose-100 text-rose-700" },
};

function ClientCard({ client, onClick }) {
  const progress = checklistProgress(client);
  const status = STATUSES.find((s) => s.id === client.status) ?? STATUSES[0];
  const tone = TONE[status.tone];
  const payBadge = PAYMENT_BADGE[client.payment_status];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className="w-full text-left bg-cream-50 border border-slate-900/8 rounded-2xl p-4 hover:border-slate-900/20 transition group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="font-display text-lg text-slate-900 tracking-tight leading-tight truncate flex-1">
          {client.business_name}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {payBadge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium ${payBadge.cls}`}>
              {payBadge.label}
            </span>
          )}
          <div className={`inline-flex items-center gap-1 ${tone.bg} ${tone.text} px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            {status.label}
          </div>
        </div>
      </div>

      {client.industry && (
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
          {client.industry}
        </div>
      )}

      <div className="space-y-1 mb-3 text-[12px] text-slate-600">
        {client.owner_name && <div className="truncate">{client.owner_name}</div>}
        {client.owner_phone && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone className="w-3 h-3" /> {client.owner_phone}
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Setup
          </span>
          <span className="font-mono text-[10px] text-slate-700 tabular-nums">
            {progress.done}/{progress.total}
          </span>
        </div>
        <div className="h-1 bg-cream-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.6, ease: EASE }}
            className={`h-full ${progress.pct === 100 ? "bg-emerald-500" : "bg-rain-500"}`}
          />
        </div>
      </div>
    </motion.button>
  );
}

function KanbanColumn({ status, clients, onCardClick }) {
  const tone = TONE[status.tone];
  return (
    <div className="bg-cream-100/40 border border-slate-900/5 rounded-2xl p-3 min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-700">
            {status.label}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
          {clients.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        <AnimatePresence>
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} onClick={() => onCardClick(c)} />
          ))}
        </AnimatePresence>
        {clients.length === 0 && (
          <div className="text-center py-8 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

function fmtPhone(p) {
  if (!p) return "Unknown";
  const d = String(p).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return p;
}

function fmtDur(sec) {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtAgo(iso) {
  if (!iso) return "—";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ClientActivityPanel({ client, onClose, onEdit }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState(null);

  useEffect(() => {
    if (!supabase || !client?.id) return;
    setLoading(true);
    supabase
      .from("call_logs")
      .select("*")
      .eq("client_id", client.id)
      .order("started_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setCalls(data || []); setLoading(false); });
  }, [client?.id]);

  const used = client.calls_this_month ?? 0;
  const limit = client.monthly_call_limit ?? 0;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const thisWeek = calls.filter(c => c.started_at && (Date.now() - new Date(c.started_at)) < 7 * 86400000).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-xl bg-cream-100 overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream-100/95 backdrop-blur-sm border-b border-slate-900/8 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-display text-xl text-slate-900 tracking-tight">{client.business_name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{client.owner_name}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-full bg-slate-900 text-cream-100 text-[12px] font-medium hover:bg-rain-700 transition"
            >Edit client</button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "This week", value: thisWeek },
              { label: "This month", value: used },
              { label: "All time", value: calls.length },
            ].map((s) => (
              <div key={s.label} className="bg-cream-50 border border-slate-900/8 rounded-2xl p-4 text-center">
                <div className="font-display text-3xl text-slate-900 tracking-tight">{s.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Usage bar */}
          {limit > 0 && (
            <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Monthly limit</span>
                <span className="font-mono text-[11px] text-slate-700">{used} / {limit}</span>
              </div>
              <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">Resets {client.calls_reset_at ? new Date(client.calls_reset_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "next month"}</div>
            </div>
          )}

          {/* Call log */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-rain-600 mb-3 flex items-center gap-2">
              <PhoneCall className="w-3 h-3" /> Call log
            </div>
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>
            ) : calls.length === 0 ? (
              <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-8 text-center text-slate-500 text-sm">No calls yet</div>
            ) : (
              <div className="space-y-2">
                {calls.map((call) => (
                  <div key={call.id} className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream-100 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-rain-100 flex items-center justify-center flex-shrink-0">
                        <PhoneCall className="w-3.5 h-3.5 text-rain-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[13px] text-slate-900">{fmtPhone(call.from_number)}</div>
                        <div className="text-[11px] text-slate-500 truncate">{call.summary || "No summary"}</div>
                      </div>
                      <div className="text-right flex-shrink-0 mr-2">
                        <div className="font-mono text-[10px] text-slate-500">{fmtAgo(call.started_at)}</div>
                        <div className="font-mono text-[10px] text-slate-400">{fmtDur(call.duration_seconds)}</div>
                      </div>
                      {expandedCall === call.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                    </button>
                    <AnimatePresence>
                      {expandedCall === call.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-900/6"
                        >
                          <div className="px-4 py-3 space-y-3">
                            {call.summary && (
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">Summary</div>
                                <p className="text-[12px] text-slate-700 leading-relaxed">{call.summary}</p>
                              </div>
                            )}
                            {call.transcript && (
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">Transcript</div>
                                <pre className="text-[11px] text-slate-600 bg-cream-100 rounded-lg p-3 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed">{call.transcript}</pre>
                              </div>
                            )}
                            <a href={`tel:${(call.from_number || "").replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 bg-slate-900 text-cream-100 px-3 py-1.5 rounded-full text-[11px] font-medium hover:bg-rain-700 transition">
                              <Phone className="w-3 h-3" /> Call back
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ClientsManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState({ open: false, client: null });
  const [activity, setActivity] = useState(null);

  const fetch = async () => {
    setLoading(true);
    setClients(await listClients());
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) =>
      [c.business_name, c.owner_name, c.industry, c.owner_email, c.owner_phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.id, []]));
    filtered.forEach((c) => {
      const key = map[c.status] ? c.status : "lead";
      map[key].push(c);
    });
    return map;
  }, [filtered]);

  const handleSaved = () => fetch();

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border border-slate-900/10 rounded-full text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <button
            onClick={fetch}
            className="w-10 h-10 rounded-full bg-cream-50 border border-slate-900/10 hover:border-slate-900/25 flex items-center justify-center transition flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <button
          onClick={() => setDrawer({ open: true, client: null })}
          className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-rain-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Empty state */}
      {!loading && clients.length === 0 ? (
        <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rain-100 mx-auto flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-rain-700" />
          </div>
          <div className="font-display text-2xl text-slate-900 mb-2 tracking-tight">
            No clients yet
          </div>
          <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
            Add your first client after your 15-min discovery call. They'll move through the pipeline as you set them up.
          </p>
          <button
            onClick={() => setDrawer({ open: true, client: null })}
            className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-rain-700 transition"
          >
            <Plus className="w-4 h-4" /> Add your first client
          </button>
        </div>
      ) : (
        /* Kanban: desktop 5-col, mobile stacked */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s.id}
              status={s}
              clients={grouped[s.id]}
              onCardClick={(c) => setActivity(c)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {activity && (
          <ClientActivityPanel
            client={activity}
            onClose={() => setActivity(null)}
            onEdit={() => { setDrawer({ open: true, client: activity }); setActivity(null); }}
          />
        )}
      </AnimatePresence>

      <ClientDrawer
        open={drawer.open}
        client={drawer.client}
        onClose={() => setDrawer({ open: false, client: null })}
        onSaved={handleSaved}
      />
    </>
  );
}
