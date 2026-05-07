import { AlertTriangle, ArrowDownRight, BadgeCheck, Goal, Landmark, Receipt } from "lucide-react";
import Card from "../components/Card.jsx";
import { CategoryBars, SpendingPie } from "../components/Charts.jsx";
import ScoreRing from "../components/ScoreRing.jsx";

const money = (value) => `RM${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function Dashboard({ data, onDemoSalary, onDemoOverspend, demoResult }) {
  if (!data) return <div className="p-6 text-slate-600">Loading financial graph...</div>;

  const warnings = data.peer.filter((item) => item.warning).slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
      <section className="rounded-lg bg-gx-900 p-5 text-white shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Open finance intelligence</p>
            <h1 className="mt-1 text-3xl font-black">Hi {data.user.name}, your money graph is live.</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50">
              GXBank, e-wallet, loans, goals, peer comparison, and simulated Graph RAG reasoning in one operating view.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onDemoSalary} className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-gx-900">Simulate Salary</button>
            <button onClick={onDemoOverspend} className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-gx-900">Simulate Overspending</button>
          </div>
        </div>
      </section>

      {demoResult && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{demoResult}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Combined Balance" value={money(data.balance.assets)} />
        <Card title="Net Worth" value={money(data.balance.net_worth)} accent={data.balance.net_worth < 0 ? "text-red-600" : "text-gx-900"} />
        <Card title="Total Spending" value={money(data.summary.total_spending)} />
        <Card title="Daily Average" value={money(data.summary.daily_average)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <ScoreRing score={data.score.score} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <span className="chip">Risk: {data.behavior.classification}</span>
            <span className="chip">Low balance in {data.prediction.days_until_low_balance} days</span>
          </div>
        </Card>
        <Card title="Predictive Alerts">
          <div className="mt-3 space-y-3">
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
              <AlertTriangle size={18} />
              Overspending risk is {data.prediction.overspending_risk}; projected monthly spend is {money(data.prediction.monthly_spend_projection)}.
            </div>
            {warnings.map((item) => (
              <div key={item.category} className="rounded-lg bg-emerald-50 p-3 text-sm text-gx-900">
                <b>{item.category}</b>: {item.warning} {item.suggestion}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Spending Mix">
          <SpendingPie breakdown={data.summary.category_breakdown} />
        </Card>
        <Card title="Category Breakdown">
          <CategoryBars breakdown={data.summary.category_breakdown} />
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Active Loans">
          <div className="mt-3 space-y-3">
            {data.loans.map((loan) => (
              <div key={loan.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <Landmark className="text-gx-600" size={20} />
                <div>
                  <p className="font-bold">{loan.name}</p>
                  <p className="text-sm text-slate-600">{money(loan.outstanding)} outstanding, {loan.remaining_months} months left</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Savings Goals">
          <div className="mt-3 space-y-3">
            {data.goals.map((goal) => (
              <div key={goal.id} className="rounded-lg bg-emerald-50 p-3">
                <div className="flex items-center gap-2 font-bold"><Goal size={17} />{goal.name}</div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-gx-500" style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{money(goal.current_amount)} / {money(goal.target_amount)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Smart Automations">
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
              <b>Projection:</b> Saving {money(data.prediction.projected_monthly_savings)}/month based on current pace.
            </div>
            {data.automation.map((item, index) => (
              <div key={index} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <BadgeCheck size={18} className="text-gx-600" />
                <span>{item.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-black text-gx-900">Merchant Perks & Smarter Choices</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {data.recommendations.map((rec, index) => (
            <div key={index} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gx-600">{rec.category}</span>
                <Landmark size={16} className="text-slate-400" />
              </div>
              <p className="mt-2 font-bold text-slate-900">{rec.merchant}</p>
              <p className="mt-1 text-sm text-slate-600">{rec.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-black text-gx-900">Recent Transactions</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {data.summary.transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{tx.merchant}</p>
                  {tx.receipt_url && <Receipt size={14} className="text-emerald-500" title="Receipt saved" />}
                </div>
                <p className="text-xs text-slate-500">{tx.source} · {tx.category} · {tx.date}</p>
              </div>
              <span className={`flex items-center gap-1 font-bold ${tx.amount < 0 ? "text-red-600" : "text-gx-600"}`}>
                {tx.amount < 0 && <ArrowDownRight size={15} />}
                {money(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

