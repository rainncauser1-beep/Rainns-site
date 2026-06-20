import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone, Mail, Users, LogOut, RefreshCw, TrendingUp,
  LayoutGrid, ListChecks, ArrowLeft, ShieldAlert,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import ClientsManager from "../components/ClientsManager";
import RaindropMark from "../components/RaindropMark";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const TONE = {
  rain: { bg: "bg-rain-100", text: "text-rain-700" },
  slate: { bg: "bg-slate-100", text: "text-slate-700" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
  amber: { bg: "bg-amber-100", text: "text-amber-700" },
};

function StatCard({ icon: Icon, label, value, sub, tone = "rain" }) {
  const t = TONE[tone] ?? TONE.rain;
  return (
    <motion.div
      variants={fadeUp}
      className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6"
    >
      <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 ${t.text}`} />
      </div>
      <div className="font-display text-4xl text-slate-900 tracking-tight mb-1">{value}</div>
      <div className="font-medium text-slate-900 text-sm mb-0.5">{label}</div>
      {sub && <div className="text-[13px] text-slate-500">{sub}</div>}
    </motion.div>
  );
}

function DataTable({ title, rows, cols }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-900/6 flex items-center justify-between">
        <div className="font-display text-xl text-slate-900 tracking-tight">{title}</div>
        <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
          {rows.length} records
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-10 text-center text-slate-500 text-sm">No records yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-900/6">
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="px-6 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-900/4 hover:bg-cream-100 transition">
                  {cols.map((c) => (
                    <td key={c.key} className="px-6 py-3.5 text-slate-700">
                      {c.render ? c.render(row[c.key], row) : row[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "clients", label: "Clients", icon: ListChecks },
  { id: "access", label: "Access Log", icon: ShieldAlert },
];

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

function fmtAgo(iso) {
  if (!iso) return "—";
  const diff = Math.round((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.round(diff / 1440)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ trials: [], contacts: [], waitlist: [] });
  const [accessLog, setAccessLog] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg, setDemoMsg] = useState("");

  // Hard guard: verify the signed-in email is the admin before loading any data
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user?.email !== ADMIN_EMAIL) {
        if (session) await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  const fetchData = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [trialsRes, contactsRes, waitlistRes] = await Promise.all([
      supabase.from("demo_trials").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("waitlist_signups").select("*").order("created_at", { ascending: false }),
    ]);
    setData({
      trials: trialsRes.data ?? [],
      contacts: contactsRes.data ?? [],
      waitlist: waitlistRes.data ?? [],
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchAccessLog = async () => {
    setAccessLoading(true);
    try {
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (!token) return;
      const res = await fetch("/.netlify/functions/admin-auth-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      setAccessLog(data.unknown || []);
    } catch (e) {
      console.error("Access log error:", e.message);
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "access") fetchAccessLog();
  }, [tab]);

  const signOut = async () => {
    await supabase?.auth.signOut();
    navigate("/login");
  };

  // Create / refresh the public "Try the AI" demo agents (one per trade + default).
  const provisionDemoAgents = async () => {
    setDemoBusy(true);
    setDemoMsg("");
    try {
      const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/.netlify/functions/provision-demo-agents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      const failed = (d.results || []).filter((r) => !r.ok);
      setDemoMsg(failed.length ? `${d.summary} · failed: ${failed.map((f) => f.slug).join(", ")}` : `✓ ${d.summary}`);
    } catch (e) {
      setDemoMsg("Error: " + e.message);
    } finally {
      setDemoBusy(false);
    }
  };

  const totalCalls = data.trials.reduce((sum, t) => sum + (t.tries_used ?? 0), 0);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Sticky admin header */}
      <header className="sticky top-0 z-30 bg-cream-100/95 backdrop-blur-md border-b border-slate-900/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition">
              <RaindropMark size={24} />
              <span className="font-display text-xl text-slate-900 tracking-tight">
                Koemori<span className="text-rain-500">.</span>
              </span>
            </Link>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 ml-2">
              Admin
            </span>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-1 bg-cream-200/60 p-1 rounded-full">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium transition ${
                    active
                      ? "bg-slate-900 text-cream-100"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!supabase ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="font-display text-2xl text-amber-900 mb-3">Supabase not connected</div>
            <p className="text-amber-800 text-sm max-w-md mx-auto leading-relaxed">
              Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
              <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your
              Netlify environment variables, then redeploy.
            </p>
          </div>
        ) : tab === "overview" ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
                  Overview
                </div>
                <h1 className="font-display text-3xl text-slate-900 tracking-tight">
                  Activity at a glance
                </h1>
              </div>
              <button
                onClick={fetchData}
                className="w-10 h-10 rounded-full bg-cream-50 border border-slate-900/10 hover:border-slate-900/25 flex items-center justify-center transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Phone}
                  label="Demo calls made"
                  value={totalCalls}
                  sub="across all trials"
                  tone="rain"
                />
                <StatCard
                  icon={Users}
                  label="Trial signups"
                  value={data.trials.length}
                  sub="unique emails"
                  tone="rain"
                />
                <StatCard
                  icon={Mail}
                  label="Contact forms"
                  value={data.contacts.length}
                  sub="audit requests"
                  tone="slate"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Waitlist signups"
                  value={data.waitlist.length}
                  sub="across all services"
                  tone="amber"
                />
              </div>

              {/* Demo agents */}
              <motion.div
                variants={fadeUp}
                className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-display text-xl text-slate-900 tracking-tight mb-1">Demo agents</div>
                  <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
                    Create or refresh the public "Try the AI" agent for every trade (one per trade plus a generic default). Free — these are web-call agents, no phone numbers. Run the <code className="bg-cream-200 px-1 rounded text-[12px]">demo_agents</code> migration first.
                  </p>
                  {demoMsg && <p className="text-[13px] mt-2 font-medium text-slate-700">{demoMsg}</p>}
                </div>
                <button
                  onClick={provisionDemoAgents}
                  disabled={demoBusy}
                  className="inline-flex items-center gap-2 bg-slate-900 text-cream-100 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-rain-700 transition disabled:opacity-50 flex-shrink-0"
                >
                  {demoBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  {demoBusy ? "Creating…" : "Create / refresh demo agents"}
                </button>
              </motion.div>

              <DataTable
                title="Demo Trials"
                rows={data.trials}
                cols={[
                  { key: "email", label: "Email" },
                  { key: "tries_used", label: "Calls used", render: (v) => `${v ?? 0} / 5` },
                  { key: "created_at", label: "First trial", render: fmt },
                  { key: "last_call_at", label: "Last call", render: fmt },
                ]}
              />
              <DataTable
                title="Audit Requests"
                rows={data.contacts}
                cols={[
                  { key: "name", label: "Name" },
                  { key: "business_name", label: "Business" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "created_at", label: "Submitted", render: fmt },
                ]}
              />
              <DataTable
                title="Waitlist Signups"
                rows={data.waitlist}
                cols={[
                  { key: "email", label: "Email" },
                  { key: "service", label: "Service" },
                  { key: "created_at", label: "Signed up", render: fmt },
                ]}
              />
            </motion.div>
          </>
        ) : tab === "clients" ? (
          <>
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
                Clients
              </div>
              <h1 className="font-display text-3xl text-slate-900 tracking-tight">
                Your pipeline
              </h1>
              <p className="text-slate-600 text-sm mt-1.5">
                Click any client to see their calls and usage. Hit "Edit client" to update their settings.
              </p>
            </div>
            <ClientsManager />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
                  Access Log
                </div>
                <h1 className="font-display text-3xl text-slate-900 tracking-tight">
                  Unknown sign-ins
                </h1>
                <p className="text-slate-600 text-sm mt-1.5">
                  People who received a magic link but don't have a client account yet.
                </p>
              </div>
              <button
                onClick={fetchAccessLog}
                className="w-10 h-10 rounded-full bg-cream-50 border border-slate-900/10 hover:border-slate-900/25 flex items-center justify-center transition"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${accessLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {accessLoading ? (
              <div className="text-center py-16 text-slate-400">Loading…</div>
            ) : accessLog.length === 0 ? (
              <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-4">
                  <ShieldAlert className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="font-display text-xl text-slate-900 mb-2">All clear</div>
                <p className="text-slate-500 text-sm">No unknown sign-in attempts. Everyone who has accessed the portal is a provisioned client.</p>
              </div>
            ) : (
              <div className="bg-cream-50 border border-slate-900/8 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-900/6 flex items-center justify-between">
                  <div className="font-display text-lg text-slate-900 tracking-tight">Unknown accounts</div>
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{accessLog.length} found</div>
                </div>
                <div className="divide-y divide-slate-900/4">
                  {accessLog.map((u) => (
                    <div key={u.email} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{u.email}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Last sign-in: {fmtAgo(u.last_sign_in)} · Created: {fmtAgo(u.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-amber-100 text-amber-700">
                          No account
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
