import { useState, useMemo } from "react";
import {
  Area, AreaChart,
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { ChevronDown, ChevronRight, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

const MAIN_COLORS = {
  "Food & Beverage": "#10b981",
  "Transport": "#3b82f6",
  "Living Expenses": "#8b5cf6",
  "Shopping": "#f59e0b",
  "Financial Services": "#ef4444",
  "Health & Wellness": "#06b6d4",
  "Entertainment": "#ec4899",
  "Education": "#84cc16",
  "Travel": "#0ea5e9",
  "Income": "#22c55e",
  "Other": "#94a3b8",
};

const FALLBACK_COLORS = [
  "#00a86b", "#28c98b", "#0f766e", "#84cc16",
  "#f59e0b", "#14b8a6", "#64748b", "#94a3b8",
];

function getColor(name, index) {
  return MAIN_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const fmt = (v) => `RM${Math.abs(Number(v || 0)).toLocaleString("en-US", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;



export function SpendingPie({ breakdown = {} }) {
  const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => fmt(v)} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ breakdown = {} }) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="4 4" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${v}`} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10 }}
          width={110}
          tickFormatter={(v) => v.length > 14 ? v.slice(0, 13) + "…" : v}
        />
        <Tooltip formatter={(v) => fmt(v)} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── New: Hierarchical drill-down chart ─────────────────────
export function HierarchicalBreakdown({ mainBreakdown = {}, subBreakdown = {} }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (cat) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  const mainEntries = Object.entries(mainBreakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const total = mainEntries.reduce((s, [, v]) => s + v, 0);

  if (mainEntries.length === 0) {
    return <div className="py-6 text-center text-sm text-slate-400">No spending data yet.</div>;
  }

  return (
    <div className="space-y-2 mt-2">
      {mainEntries.map(([cat, amt], idx) => {
        const pct = total > 0 ? (amt / total) * 100 : 0;
        const subs = subBreakdown[cat] || {};
        const hasSubs = Object.keys(subs).length > 0;
        const color = getColor(cat, idx);
        const isOpen = expanded[cat];

        return (
          <div key={cat} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            {/* Main row */}
            <button
              onClick={() => hasSubs && toggle(cat)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 truncate">{cat}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs font-semibold text-slate-500">{pct.toFixed(1)}%</span>
                    <span className="text-sm font-black text-slate-900 whitespace-nowrap">{fmt(amt)}</span>
                    {hasSubs && (
                      isOpen
                        ? <ChevronDown size={14} className="text-slate-400" />
                        : <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            </button>

            {/* Sub-category drill-down */}
            {isOpen && hasSubs && (
              <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100">
                {Object.entries(subs)
                  .sort(([, a], [, b]) => b - a)
                  .map(([sub, subAmt]) => {
                    const subPct = amt > 0 ? (subAmt / amt) * 100 : 0;
                    return (
                      <div key={sub} className="flex items-center gap-3 px-6 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                        <span className="flex-1 text-xs font-semibold text-slate-600 truncate">{sub}</span>
                        <span className="text-[10px] text-slate-400 mr-1">{subPct.toFixed(0)}%</span>
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{fmt(subAmt)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Behavioral Insights panel ───────────────────────────────
export function BehavioralInsights({ insights = [], tagCounts = {} }) {
  if (insights.length === 0 && Object.keys(tagCounts).length === 0) return null;

  const typeConfig = {
    warning: { bg: "bg-red-50 border-red-100", text: "text-red-800", icon: <AlertTriangle size={14} className="text-red-500" /> },
    caution: { bg: "bg-amber-50 border-amber-100", text: "text-amber-800", icon: <AlertTriangle size={14} className="text-amber-500" /> },
    tip: { bg: "bg-blue-50 border-blue-100", text: "text-blue-800", icon: <Lightbulb size={14} className="text-blue-500" /> },
  };

  return (
    <div className="space-y-2 mt-3">
      {insights.map((ins, i) => {
        const cfg = typeConfig[ins.type] || typeConfig.tip;
        return (
          <div key={i} className={`flex gap-3 p-3 rounded-xl border ${cfg.bg}`}>
            <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
            <div>
              <p className={`text-xs font-bold ${cfg.text} uppercase tracking-wide opacity-70`}>
                {ins.type === "warning" ? "Overspending Pattern" : ins.type === "caution" ? "Watch Out" : "Money Tip"}
              </p>
              <p className={`text-xs font-semibold mt-0.5 ${cfg.text}`}>{ins.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpendingTrendChart — area chart with Day / Week / Month / Year time filters
// Derives data from raw transactions array (each tx: { date, amount, merchant })
// ─────────────────────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { key: "W", label: "Week", days: 7 },
  { key: "M", label: "Month", days: 30 },
  { key: "3M", label: "3 Months", days: 90 },
  { key: "Y", label: "Year", days: 365 },
];

function bucketDate(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  if (days <= 7) return d.toLocaleDateString("en-MY", { weekday: "short" });
  if (days <= 30) return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short" });
  if (days <= 90) return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("en-MY", { month: "short", year: "2-digit" });
}

export function SpendingTrendChart({ transactions = [] }) {
  const [range, setRange] = useState("M");
  const cfg = RANGE_OPTIONS.find((o) => o.key === range);

  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cfg.days);

    // 1. filter valid transactions
    const filtered = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return !isNaN(d) && d >= cutoff && tx.amount < 0;
    });

    // 2. sort by date (IMPORTANT FIX)
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. bucket data
    const buckets = {};

    for (const tx of filtered) {
      const key = bucketDate(tx.date, cfg.days);
      if (!key) continue;
      buckets[key] = (buckets[key] || 0) + Math.abs(tx.amount);
    }

    // 4. preserve chronological order (left → right)
    const labels = filtered.map((tx) => bucketDate(tx.date, cfg.days));
    const uniqueLabels = [...new Set(labels)];

    return uniqueLabels.map((label) => ({
      label,
      amount: buckets[label] || 0,
    }));
  }, [transactions, range, cfg.days]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl bg-gx-900 px-3 py-2 shadow-lg text-white">
        <p className="text-[10px] font-bold text-violet-300 mb-0.5">{label}</p>
        <p className="text-sm font-black">RM {payload[0].value.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div>
      {/* Time filter chips */}
      <div className="flex gap-1.5 mb-3">
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setRange(o.key)}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${range === o.key
              ? "bg-gx-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-gx-600"
              }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">No spending data for this period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `RM${v}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fill="url(#spendGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#7c3aed", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopSpendingWidget — top-5 merchants by total spend from real transactions
// ─────────────────────────────────────────────────────────────────────────────
const CAT_EMOJI = {
  "Food & Beverage": "🍜", "Transport": "🚗", "Shopping": "🛍️",
  "Living Expenses": "🏠", "Financial Services": "💳", "Health & Wellness": "💊",
  "Entertainment": "🎬", "Education": "📚", "Travel": "✈️", "Other": "📦",
};

export function TopSpendingWidget({ transactions = [] }) {
  // Aggregate by merchant
  const merchants = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      if (tx.amount >= 0) continue; // expenses only
      const key = tx.merchant || "Unknown";
      if (!map[key]) {
        map[key] = {
          name: key,
          total: 0,
          count: 0,
          category: tx.main_category || tx.category || "Other",
        };
      }
      map[key].total += Math.abs(tx.amount);
      map[key].count += 1;
    }
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  const maxSpend = merchants[0]?.total || 1;

  if (merchants.length === 0) {
    return <div className="py-6 text-center text-xs text-slate-400">No spending data yet.</div>;
  }

  return (
    <div className="space-y-3 mt-1">
      {merchants.map((m, i) => {
        const pct = (m.total / maxSpend) * 100;
        const color = getColor(m.category, i);
        const emoji = CAT_EMOJI[m.category] || "📦";
        return (
          <div key={m.name} className="flex items-center gap-3">
            {/* Rank badge */}
            <div
              className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
              style={{ background: color }}
            >
              {emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    ×{m.count}
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    RM{m.total.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">{m.category}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

