import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, Users, BarChart, LogOut, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";

const EASE = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function StatCard({ icon: Icon, label, value, sub, color = "rain" }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6"
    >
      <div className={`w-9 h-9 rounded-full bg-${color}-100 flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 text-${color}-700`} />
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

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    trials: [],
    contacts: [],
    waitlist: [],
  });

  const fetchData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
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

  const signOut = async () => {
    await supabase?.auth.signOut();
    navigate("/login");
  };

  const totalCalls = data.trials.reduce((sum, t) => sum + (t.tries_used ?? 0), 0);

  return (
    <div className="min-h-screen bg-cream-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
              Admin · Raindrop AI
            </div>
            <h1 className="font-display text-3xl text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="w-9 h-9 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-700 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-cream-50 border border-slate-900/10 text-slate-700 px-4 py-2 rounded-full text-sm hover:border-slate-900/25 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>

        {!supabase ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="font-display text-2xl text-amber-900 mb-3">Supabase not connected</div>
            <p className="text-amber-800 text-sm max-w-md mx-auto leading-relaxed">
              Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
              <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your
              Netlify environment variables, then redeploy.
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Phone}
                label="Demo calls made"
                value={totalCalls}
                sub="across all trials"
              />
              <StatCard
                icon={Users}
                label="Trial signups"
                value={data.trials.length}
                sub="unique emails"
              />
              <StatCard
                icon={Mail}
                label="Contact forms"
                value={data.contacts.length}
                sub="audit requests"
                color="slate"
              />
              <StatCard
                icon={TrendingUp}
                label="Waitlist signups"
                value={data.waitlist.length}
                sub="across all services"
                color="slate"
              />
            </div>

            {/* Demo trials table */}
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

            {/* Contact forms table */}
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

            {/* Waitlist table */}
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
        )}
      </div>
    </div>
  );
}
