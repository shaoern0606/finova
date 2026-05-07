import { useState } from "react";
import { post } from "../api.js";
import Card from "../components/Card.jsx";

const money = (value) => `RM${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Simulation({ data }) {
  const [purchaseAmount, setPurchaseAmount] = useState(500);
  const [forecast, setForecast] = useState({ daily_savings: 10, years: 10 });
  const [loan, setLoan] = useState({ amount: 12000, interest: 5.5, duration_months: 36 });
  const [result, setResult] = useState(null);

  async function runPurchase() {
    setResult({ type: "purchase", data: await post("/purchase/intervention", { amount: Number(purchaseAmount), merchant: "Demo Purchase" }) });
  }

  async function runForecast() {
    setResult({ type: "forecast", data: await post("/forecast", { daily_savings: Number(forecast.daily_savings), years: Number(forecast.years) }) });
  }

  async function runLoan() {
    setResult({ type: "loan", data: await post("/loan/evaluate", { amount: Number(loan.amount), interest: Number(loan.interest), duration_months: Number(loan.duration_months) }) });
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
      <section>
        <p className="text-sm font-bold text-gx-600">Future lab</p>
        <h1 className="text-3xl font-black text-gx-900">Simulate decisions before money moves.</h1>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Real-Time Spending Intervention">
          <label className="mt-4 block text-sm font-semibold text-slate-600">Purchase amount</label>
          <input className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-3" value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} />
          <button onClick={runPurchase} className="mt-4 w-full rounded-lg bg-gx-500 px-4 py-3 font-bold text-white">Test Purchase</button>
        </Card>

        <Card title="What-If Forecast">
          <div className="mt-4 grid grid-cols-2 gap-3">
            <input className="rounded-lg border border-emerald-200 px-3 py-3" value={forecast.daily_savings} onChange={(event) => setForecast({ ...forecast, daily_savings: event.target.value })} />
            <input className="rounded-lg border border-emerald-200 px-3 py-3" value={forecast.years} onChange={(event) => setForecast({ ...forecast, years: event.target.value })} />
          </div>
          <button onClick={runForecast} className="mt-4 w-full rounded-lg bg-gx-500 px-4 py-3 font-bold text-white">Test Forecast</button>
        </Card>

        <Card title="Loan Evaluator">
          <div className="mt-4 grid gap-3">
            <input className="rounded-lg border border-emerald-200 px-3 py-3" value={loan.amount} onChange={(event) => setLoan({ ...loan, amount: event.target.value })} />
            <input className="rounded-lg border border-emerald-200 px-3 py-3" value={loan.interest} onChange={(event) => setLoan({ ...loan, interest: event.target.value })} />
            <input className="rounded-lg border border-emerald-200 px-3 py-3" value={loan.duration_months} onChange={(event) => setLoan({ ...loan, duration_months: event.target.value })} />
          </div>
          <button onClick={runLoan} className="mt-4 w-full rounded-lg bg-gx-500 px-4 py-3 font-bold text-white">Should I Take This Loan?</button>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Simulated Graph RAG Reasoning">
          <div className="mt-3 overflow-hidden rounded-lg bg-slate-900 p-4 text-[11px] font-mono leading-relaxed text-emerald-400">
            <p className="text-slate-500">// Neo4j Graph View (Simulated)</p>
            <div className="mt-2 space-y-1">
              {data?.graph?.nodes?.map((node) => (
                <p key={node.id}>
                  <span className="text-pink-400">({node.type}:{node.id})</span>{" "}
                  {JSON.stringify(node).slice(0, 40)}...
                </p>
              ))}
              <div className="my-2 border-t border-slate-800" />
              {data?.graph?.relationships?.map((rel, i) => (
                <p key={i}>
                  <span className="text-blue-400">({rel.from})</span>
                  <span className="text-white">-[{rel.type}]-&gt;</span>
                  <span className="text-pink-400">({rel.to})</span>
                </p>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            This graph connects your assets, liabilities, and category spending to power the predictive and intervention engines.
          </p>
        </Card>

        <Card title="Simulation Result">
          {!result && <p className="mt-3 text-sm text-slate-500">Run a demo action to see the intervention engine respond.</p>}
          {result?.type === "purchase" && (
            <div className="mt-3 rounded-lg bg-amber-50 p-4 text-amber-950">
              <p className="text-xl font-black">{result.data.warning}</p>
              <p className="mt-2">Future balance: {money(result.data.future_balance)} · Low-balance horizon: {result.data.days_until_low_balance} days</p>
            </div>
          )}
          {result?.type === "forecast" && (
            <div className="mt-3 rounded-lg bg-emerald-50 p-4 text-gx-900">
              <p className="text-xl font-black">{result.data.message}</p>
              <p className="mt-2">Projected value: {money(result.data.projected_value)} · Growth: {money(result.data.projected_growth)}</p>
            </div>
          )}
          {result?.type === "loan" && (
            <div className="mt-3 rounded-lg bg-red-50 p-4 text-red-950">
              <p className="text-xl font-black">{result.data.message}</p>
              <p className="mt-2">Monthly payment: {money(result.data.monthly_payment)} · Total repayment: {money(result.data.total_repayment)}</p>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}

