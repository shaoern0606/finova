export default function ScoreRing({ score = 0 }) {
  const color = score >= 75 ? "#00a86b" : score >= 55 ? "#d59b00" : "#dc2626";
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e8f5ee 0deg)` }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-gx-900">
          {score}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">FinScope Score</p>
        <p className="mt-1 text-sm text-slate-600">Savings, risk, consistency, and debt blended into a 0-100 view.</p>
      </div>
    </div>
  );
}

