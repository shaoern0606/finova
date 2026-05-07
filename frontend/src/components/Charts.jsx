import { useState } from "react";
import {
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

// Custom pie label
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={9} fontWeight="bold">
      {name.split(" / ")[0].slice(0, 8)}
    </text>
  );
};

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
          label={renderLabel}
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
