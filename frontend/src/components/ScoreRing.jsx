import { Info } from "lucide-react";

export default function ScoreRing({ data }) {
  if (!data) return null;
  const score = data.score || 0;
  const color = score >= 75 ? "#00a86b" : score >= 55 ? "#d59b00" : "#dc2626";
  
  return (
    <div className="flex items-center gap-4 relative group">
      <div
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e8f5ee 0deg)` }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-gx-900 shadow-inner">
          {score}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 cursor-pointer">
          <p className="text-sm font-bold uppercase tracking-wide text-gx-700">FinScope Score</p>
          <Info size={14} className="text-slate-400 group-hover:text-gx-500 transition-colors" />
        </div>
        <p className="mt-1 text-sm text-slate-600 font-medium">Hover for detailed breakdown & insights.</p>
      </div>

      {/* Hover Tooltip Modal */}
      <div className="absolute top-full left-0 mt-4 w-96 rounded-xl bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        
        <div className="mb-4 pb-3 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">FinScope Formula</p>
          <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded leading-relaxed">
            (0.30 × Savings Consistency)<br/>
            + (0.25 × Spending Stability)<br/>
            + (0.20 × Debt Ratio Score)<br/>
            + (0.15 × Emergency Fund Health)<br/>
            + (0.10 × Goal Progress Rate)
          </p>
        </div>

        <div className="space-y-3">
          {data.breakdown?.map((b, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{b.name}</span>
                <span className="text-gx-600">{b.score.toFixed(0)}/100</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
              <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gx-400 rounded-full" style={{ width: `${b.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid gap-3 text-xs">
          <div className="bg-emerald-50 text-emerald-900 p-2 rounded">
            <span className="font-bold block">Top Positive Factors:</span>
            {data.top_factors?.join(", ")}
          </div>
          <div className="bg-red-50 text-red-900 p-2 rounded">
            <span className="font-bold block">Main Risk Factor:</span>
            {data.risk_factor}
          </div>
          <div className="bg-blue-50 text-blue-900 p-2 rounded font-medium">
            {data.insight}
          </div>
        </div>

      </div>
    </div>
  );
}

