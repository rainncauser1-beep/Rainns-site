import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, ArrowUp, ArrowDown, Minus, PhoneCall, Calendar, MessageSquare } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 7;
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
});

function fmtPhone(p) {
  if (!p) return "Unknown";
  const d = String(p).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function buildVolumeData(calls) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (29 - i));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const count = calls.filter(c => {
      if (!c.started_at) return false;
      const d = new Date(c.started_at);
      return d >= day && d < next;
    }).length;
    return {
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
      isToday: i === 29,
    };
  });
}

function buildSentimentData(calls) {
  let pos = 0, neu = 0, neg = 0;
  for (const c of calls) {
    const s = (c.sentiment || "").toLowerCase();
    if (s.includes("positive")) pos++;
    else if (s.includes("negative")) neg++;
    else neu++;
  }
  return { pos, neu, neg, total: calls.length };
}

function buildHeatmapData(calls) {
  // data[dayIndex 0=Mon...6=Sun][hourIndex 0=7am...12=7pm]
  const data = Array.from({ length: 7 }, () => new Array(13).fill(0));
  for (const c of calls) {
    if (!c.started_at) continue;
    const d = new Date(c.started_at);
    const day = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    if (hour >= 7 && hour <= 19) {
      data[day][hour - 7]++;
    }
  }
  return data;
}

function buildRateData(calls) {
  const now = Date.now();
  const mo = 30 * 86400 * 1000;
  const thisMonth = calls.filter(c => c.started_at && now - new Date(c.started_at).getTime() < mo).length;
  const lastMonth = calls.filter(c => {
    if (!c.started_at) return false;
    const age = now - new Date(c.started_at).getTime();
    return age >= mo && age < 2 * mo;
  }).length;
  let pct = 0;
  let dir = "flat";
  if (thisMonth > lastMonth) { dir = "up"; pct = lastMonth === 0 ? 100 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100); }
  else if (thisMonth < lastMonth) { dir = "down"; pct = Math.round(((lastMonth - thisMonth) / lastMonth) * 100); }
  return { thisMonth, lastMonth, pct, dir };
}

function getTopLeads(calls) {
  return calls.slice(0, 5).map(c => {
    const cd = c.raw?.call_analysis?.custom_analysis_data || {};
    return {
      id: c.id,
      phone: c.from_number,
      name: cd.caller_name || null,
      service: cd.service_requested || null,
      urgency: cd.urgency || null,
      booked: cd.appointment_booked || null,
      sentiment: c.sentiment || null,
    };
  });
}

function heatmapCellStyle(count, max) {
  if (count === 0) return "bg-cream-200";
  const ratio = count / max;
  if (ratio < 0.2) return "bg-rain-100";
  if (ratio < 0.45) return "bg-rain-200";
  if (ratio < 0.7) return "bg-rain-400";
  return "bg-rain-700";
}

function HeatmapGrid({ data, max }) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 340 }}>
        <div className="flex gap-1 mb-1 pl-10">
          {DAYS.map(d => (
            <div key={d} className="flex-1 text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        {HOURS.map((h, hi) => (
          <div key={h} className="flex gap-1 mb-1 items-center">
            <div className="w-9 font-mono text-[9px] text-slate-400 text-right pr-2 flex-shrink-0">{h}</div>
            {DAYS.map((d, di) => {
              const count = data[di][hi];
              return (
                <div
                  key={di}
                  title={`${count} call${count !== 1 ? "s" : ""} · ${d} ${h}`}
                  className={`flex-1 h-5 rounded-sm ${heatmapCellStyle(count, max)} transition-opacity hover:opacity-70 cursor-default`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="font-mono text-[9px] text-slate-400 mr-1">Low</span>
          {["bg-cream-200", "bg-rain-100", "bg-rain-200", "bg-rain-400", "bg-rain-700"].map((c, i) => (
            <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
          ))}
          <span className="font-mono text-[9px] text-slate-400 ml-1">High</span>
        </div>
      </div>
    </div>
  );
}

function sentimentBadgeCls(s) {
  const l = (s || "").toLowerCase();
  if (l.includes("positive")) return "bg-emerald-100 text-emerald-800";
  if (l.includes("negative")) return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function TopLeadsTable({ leads }) {
  if (!leads.length) {
    return <p className="text-sm text-slate-500">No lead details available yet.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {["Caller", "Service requested", "Urgency", "Booked", "Sentiment"].map(h => (
              <th key={h} className="font-mono text-[9px] uppercase tracking-wider text-slate-400 pb-3 pl-2 pr-4 text-left font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/6">
          {leads.map(l => (
            <tr key={l.id} className="hover:bg-cream-100/50 transition">
              <td className="py-3 pl-2 pr-4 align-top whitespace-nowrap">
                <div className="font-medium text-slate-900 text-[13px]">{l.name || "—"}</div>
                <div className="font-mono text-[11px] text-slate-500">{fmtPhone(l.phone)}</div>
              </td>
              <td className="py-3 pr-4 align-top text-[13px] text-slate-700 max-w-[180px]">
                <div className="line-clamp-2">{l.service || "—"}</div>
              </td>
              <td className="py-3 pr-4 align-top">
                {l.urgency ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    String(l.urgency).toLowerCase() === "emergency"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {l.urgency}{String(l.urgency).toLowerCase() === "emergency" ? " 🚨" : ""}
                  </span>
                ) : <span className="text-slate-400 text-[13px]">—</span>}
              </td>
              <td className="py-3 pr-4 align-top text-[13px]">
                {l.booked
                  ? <span className="text-emerald-700 font-medium">✓ {l.booked}</span>
                  : <span className="text-slate-400">—</span>}
              </td>
              <td className="py-3 align-top">
                {l.sentiment ? (
                  <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full ${sentimentBadgeCls(l.sentiment)}`}>
                    {l.sentiment}
                  </span>
                ) : <span className="text-slate-400 text-[13px]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PortalAnalytics({ calls }) {
  const barRef = useRef(null);
  const barInst = useRef(null);
  const donutRef = useRef(null);
  const donutInst = useRef(null);

  const vol = useMemo(() => buildVolumeData(calls), [calls]);
  const sentiment = useMemo(() => buildSentimentData(calls), [calls]);
  const heatmap = useMemo(() => buildHeatmapData(calls), [calls]);
  const topLeads = useMemo(() => getTopLeads(calls), [calls]);
  const rate = useMemo(() => buildRateData(calls), [calls]);
  const heatmapMax = useMemo(() => Math.max(1, ...heatmap.flat()), [heatmap]);

  // 30-day bar chart
  useEffect(() => {
    if (!barRef.current || !window.Chart) return;
    if (barInst.current) { barInst.current.destroy(); barInst.current = null; }
    const ctx = barRef.current.getContext("2d");
    barInst.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: vol.map(d => d.label),
        datasets: [{
          data: vol.map(d => d.count),
          backgroundColor: vol.map(d =>
            d.isToday ? "#15325a" : d.count > 0 ? "#94a3b8" : "#e2e8f0"
          ),
          borderRadius: 3,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y} call${ctx.parsed.y !== 1 ? "s" : ""}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10, family: "ui-monospace, monospace" }, color: "#94a3b8" },
            grid: { color: "#f1f5f9" },
          },
          x: {
            ticks: {
              maxTicksLimit: 8,
              font: { size: 10, family: "ui-monospace, monospace" },
              color: "#94a3b8",
              maxRotation: 0,
            },
            grid: { display: false },
          },
        },
      },
    });
    return () => { barInst.current?.destroy(); barInst.current = null; };
  }, [vol]);

  // Sentiment donut
  useEffect(() => {
    if (!donutRef.current || !window.Chart) return;
    if (donutInst.current) { donutInst.current.destroy(); donutInst.current = null; }
    const ctx = donutRef.current.getContext("2d");
    donutInst.current = new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Positive", "Neutral", "Negative"],
        datasets: [{
          data: [sentiment.pos, sentiment.neu, sentiment.neg],
          backgroundColor: ["#d1fae5", "#f1f5f9", "#fee2e2"],
          borderColor: ["#10b981", "#cbd5e1", "#f87171"],
          borderWidth: 2,
          hoverBorderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11, family: "ui-monospace, monospace" },
              padding: 10,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = sentiment.total > 0 ? Math.round((ctx.parsed / sentiment.total) * 100) : 0;
                return ` ${ctx.parsed} calls (${pct}%)`;
              },
            },
          },
        },
      },
    });
    return () => { donutInst.current?.destroy(); donutInst.current = null; };
  }, [sentiment]);

  if (calls.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
      className="mt-10"
    >
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-1">
          Analytics
        </div>
        <h2 className="font-display text-2xl text-slate-900 tracking-tight">
          Lead intelligence
        </h2>
      </div>

      {/* Row 1: 30-day bar chart + sentiment donut */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 bg-cream-50 border border-slate-900/8 rounded-2xl p-6">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Call volume
          </div>
          <div className="font-display text-lg text-slate-900 tracking-tight mb-4">Last 30 days</div>
          <div className="h-44">
            <canvas ref={barRef} />
          </div>
        </div>

        <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Lead quality
          </div>
          <div className="font-display text-lg text-slate-900 tracking-tight mb-4">Sentiment breakdown</div>
          <div className="h-44">
            <canvas ref={donutRef} />
          </div>
        </div>
      </div>

      {/* Row 2: Response rate + heatmap */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Response rate
            </div>
            <div className="font-display text-lg text-slate-900 tracking-tight mb-4">Month over month</div>
          </div>
          <div>
            <div className="font-display text-5xl text-slate-900 tracking-tight tabular-nums mb-1">
              {rate.thisMonth}
            </div>
            <div className="text-[13px] text-slate-500 mb-4">leads this month</div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${
              rate.dir === "up" ? "bg-emerald-100 text-emerald-800"
                : rate.dir === "down" ? "bg-rose-100 text-rose-800"
                : "bg-slate-100 text-slate-700"
            }`}>
              {rate.dir === "up" && <ArrowUp className="w-3 h-3" />}
              {rate.dir === "down" && <ArrowDown className="w-3 h-3" />}
              {rate.dir === "flat" && <Minus className="w-3 h-3" />}
              {rate.dir !== "flat"
                ? `${rate.pct}% vs last month (${rate.lastMonth})`
                : `Same as last month (${rate.lastMonth})`}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-cream-50 border border-slate-900/8 rounded-2xl p-6">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Best call times
          </div>
          <div className="font-display text-lg text-slate-900 tracking-tight mb-4">
            When leads call (7 am – 7 pm)
          </div>
          <HeatmapGrid data={heatmap} max={heatmapMax} />
        </div>
      </div>

      {/* Row 3: Top leads table */}
      <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-6">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
          <PhoneCall className="w-3 h-3" /> Top leads
        </div>
        <div className="font-display text-lg text-slate-900 tracking-tight mb-4">
          5 most recent captures
        </div>
        <TopLeadsTable leads={topLeads} />
      </div>
    </motion.section>
  );
}
