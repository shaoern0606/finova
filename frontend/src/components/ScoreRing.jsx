import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function ScoreRing({ data }) {
  const [showDetail, setShowDetail] = useState(false);
  if (!data) return null;
  const score = data.score || 0;
  const color = score >= 75 ? "#7c3aed" : score >= 55 ? "#d59b00" : "#dc2626";

  return (
    <div className="flex flex-col items-center">
      {/* Ring + Label */}
      <div className="flex items-center gap-4 w-full">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #ede9fe 0deg)` }}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-black text-gx-900 shadow-inner">
            {score}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gx-700">Financial Health Score</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Tap to see breakdown</p>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-gx-600 bg-violet-50 px-2.5 py-1 rounded-full active:bg-violet-100 transition"
          >
            <Info size={11} />
            {showDetail ? "Hide Details" : "View Details"}
            {showDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Expandable Detail Panel — replaces hover tooltip */}
      {showDetail && (
        <div className="mt-3 w-full rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-3">
          <div className="pb-2 border-b border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Formula</p>
            <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
              0.30×Savings + 0.25×Spending + 0.20×Debt + 0.15×Emergency + 0.10×Goals
            </p>
          </div>

          <div className="space-y-2">
            {data.breakdown?.map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span className="truncate">{b.name}</span>
                  <span className="text-gx-600 shrink-0 ml-2">{b.score.toFixed(0)}/100</span>
                </div>
                <div className="mt-0.5 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gx-400 rounded-full" style={{ width: `${b.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-1.5 text-[10px] pt-2 border-t border-slate-200">
            <div className="bg-violet-50 text-gx-900 p-2 rounded-lg">
              <span className="font-bold block text-[9px]">Positive Factors</span>
              {data.top_factors?.join(", ")}
            </div>
            <div className="bg-red-50 text-red-900 p-2 rounded-lg">
              <span className="font-bold block text-[9px]">Risk Factor</span>
              {data.risk_factor}
            </div>
            <div className="bg-blue-50 text-blue-900 p-2 rounded-lg font-medium">
              {data.insight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
