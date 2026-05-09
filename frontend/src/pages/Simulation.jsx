import { useState, useMemo } from "react";
import { post } from "../api.js";
import {
  ShieldAlert, TrendingDown, TrendingUp, Wallet, PiggyBank,
  Landmark, AlertTriangle, CheckCircle2, DollarSign, Calendar,
  CreditCard, Target, Percent, Clock, ArrowRight, Sparkles
} from "lucide-react";

const money = (v) => `RM${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function Simulation({ data, onDataUpdate }) {
  const [tab, setTab] = useState("spending");

  // Spending Intervention
  const [purchaseAmount, setPurchaseAmount] = useState(500);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // What-If Forecast
  const [dailySavings, setDailySavings] = useState(10);
  const [years, setYears] = useState(10);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Loan Evaluator
  const [loanAmount, setLoanAmount] = useState(12000);
  const [loanInterest, setLoanInterest] = useState(5.5);
  const [loanMonths, setLoanMonths] = useState(36);
  const [loanResult, setLoanResult] = useState(null);
  const [loanLoading, setLoanLoading] = useState(false);

  const balance = data?.balance?.assets || 8900;
  const income = data?.user?.monthly_income || 6200;

  // Live preview calculations
  const spendPreview = useMemo(() => {
    const future = balance - purchaseAmount;
    const pct = ((purchaseAmount / balance) * 100).toFixed(1);
    const severity = purchaseAmount > balance ? "critical" : purchaseAmount > balance * 0.5 ? "high" : purchaseAmount > balance * 0.2 ? "medium" : "low";
    return { future, pct, severity };
  }, [purchaseAmount, balance]);

  const forecastPreview = useMemo(() => {
    const totalSaved = dailySavings * 365 * years;
    const monthly = dailySavings * 30.4167;
    const monthlyRate = 0.03 / 12;
    const months = years * 12;
    const fv = monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate);
    return { totalSaved, futureValue: fv, growth: fv - totalSaved };
  }, [dailySavings, years]);

  const loanPreview = useMemo(() => {
    const r = (loanInterest / 100) / 12;
    const pmt = r ? loanAmount * r / (1 - (1 + r) ** -loanMonths) : loanAmount / loanMonths;
    const total = pmt * loanMonths;
    const pctIncome = ((pmt / income) * 100).toFixed(1);
    return { monthly: pmt, total, interest: total - loanAmount, pctIncome };
  }, [loanAmount, loanInterest, loanMonths, income]);

  async function runPurchase() {
    setPurchaseLoading(true);
    try {
      const res = await post("/purchase/intervention", {
        amount: Number(purchaseAmount),
        merchant: "Simulation Purchase",
        category: "Shopping",
      });
      setPurchaseResult(res);
    } catch { setPurchaseResult({ warning: "Backend unreachable" }); }
    setPurchaseLoading(false);
  }

  async function runForecast() {
    setForecastLoading(true);
    try {
      const res = await post("/forecast", { daily_savings: Number(dailySavings), years: Number(years) });
      setForecastResult(res);
    } catch { setForecastResult({ message: "Backend unreachable" }); }
    setForecastLoading(false);
  }

  async function runLoan() {
    setLoanLoading(true);
    try {
      const res = await post("/loan/evaluate", { amount: Number(loanAmount), interest: Number(loanInterest), duration_months: Number(loanMonths) });
      setLoanResult(res);
    } catch { setLoanResult({ message: "Backend unreachable" }); }
    setLoanLoading(false);
  }

  const tabs = [
    { id: "spending", label: "Spending", icon: ShieldAlert, color: "text-amber-600" },
    { id: "forecast", label: "Forecast", icon: TrendingUp, color: "text-gx-600" },
    { id: "loan", label: "Loan", icon: Landmark, color: "text-gx-600" },
  ];

  const severityColors = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-500" },
    high: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500" },
    medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-500" },
    low: { bg: "bg-violet-50", border: "border-violet-200", text: "text-gx-600", badge: "bg-gx-500" },
  };

  return (
    <main className="space-y-6 px-6 pt-14 pb-6">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-gx-600" />
          <p className="text-[10px] font-black text-gx-600 uppercase tracking-widest">Future Lab</p>
        </div>
        <h1 className="text-2xl font-black text-gx-900 leading-tight">Decide before you spend.</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time impact analysis powered by your graph.</p>
      </section>

      {/* Tab Navigation */}
      <nav className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const selected = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${selected ? "bg-gx-900 text-white shadow-md" : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                }`}>
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* === SPENDING INTERVENTION === */}
      {tab === "spending" && (
        <div className="space-y-4">
          <div className="space-y-5">
            {/* Live Balance Preview */}
            <div className={`rounded-2xl p-5 border ${severityColors[spendPreview.severity].bg} ${severityColors[spendPreview.severity].border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Impact Preview</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${severityColors[spendPreview.severity].badge}`}>
                  {spendPreview.severity} risk
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                  <p className="text-sm font-black text-slate-800">{money(balance)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">After Purchase</p>
                  <p className={`text-sm font-black ${spendPreview.future < 0 ? "text-red-600" : "text-slate-800"}`}>{money(spendPreview.future)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">% of Balance</p>
                  <p className={`text-sm font-black ${severityColors[spendPreview.severity].text}`}>{spendPreview.pct}%</p>
                </div>
              </div>
              {/* Visual bar */}
              <div className="mt-4 h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                <div className={`h-full rounded-full transition-all duration-300 ${spendPreview.severity === "critical" ? "bg-red-500" : spendPreview.severity === "high" ? "bg-amber-500" : spendPreview.severity === "medium" ? "bg-yellow-400" : "bg-gx-500"
                  }`} style={{ width: `${Math.min(Number(spendPreview.pct), 100)}%` }} />
              </div>
            </div>

            {/* Controls */}
            <div className="card p-5">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-gx-600" /> Purchase Amount
              </h2>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-xl font-black text-gx-900">{money(purchaseAmount)}</span>
              </div>
              <input type="range" min="0" max={Math.max(10000, balance)} value={purchaseAmount}
                onChange={e => setPurchaseAmount(Number(e.target.value))}
                className="w-full accent-gx-500 mb-4" />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-5">
                <span>RM0</span><span>{money(balance / 2)}</span><span>{money(Math.max(10000, balance))}</span>
              </div>
              <button onClick={runPurchase} disabled={purchaseLoading}
                className="w-full rounded-xl bg-gx-500 px-4 py-3.5 font-bold text-white hover:bg-gx-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {purchaseLoading ? "Analyzing..." : <><ShieldAlert size={16} /> Run Spending Intervention</>}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target size={16} /> AI Intervention Result
              </h2>
              {!purchaseResult && <p className="text-sm text-slate-400 italic">Drag the slider and click "Run Spending Intervention" to see the AI analysis.</p>}
              {purchaseResult && (
                <div className="space-y-4">
                  <div className={`rounded-xl p-4 ${purchaseResult.future_balance < 1000 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
                    }`}>
                    <p className={`text-base font-bold ${purchaseResult.future_balance < 1000 ? "text-red-800" : "text-amber-800"}`}>
                      {purchaseResult.warning}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Future Balance</p>
                      <p className="text-base font-black text-slate-800 mt-1">{money(purchaseResult.future_balance)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Low-Balance In</p>
                      <p className="text-base font-black text-slate-800 mt-1">{purchaseResult.days_until_low_balance} days</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === WHAT-IF FORECAST === */}
      {tab === "forecast" && (
        <div className="space-y-4">
          <div className="space-y-5">
            {/* Live Preview */}
            <div className="rounded-2xl p-5 bg-violet-50 border border-violet-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Projected Growth</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Saved</p>
                  <p className="text-sm font-black text-slate-800">{money(forecastPreview.totalSaved)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">With 3% Growth</p>
                  <p className="text-sm font-black text-gx-600">{money(forecastPreview.futureValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Interest Earned</p>
                  <p className="text-sm font-black text-gx-600">+{money(forecastPreview.growth)}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="card p-5 space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                  <PiggyBank size={18} className="text-gx-600" /> Daily Savings
                </h2>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-xl font-black text-gx-600">{money(dailySavings)}</span>
                  <span className="text-sm text-slate-400 font-bold mb-1">/ day</span>
                </div>
                <input type="range" min="1" max="100" value={dailySavings}
                  onChange={e => setDailySavings(Number(e.target.value))}
                  className="w-full accent-gx-500" />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold"><span>RM1</span><span>RM50</span><span>RM100</span></div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><Calendar size={14} /> Investment Horizon</label>
                <div className="flex items-end gap-2 mt-1 mb-2">
                  <span className="text-xl font-black text-gx-600">{years}</span>
                  <span className="text-sm text-slate-400 font-bold mb-1">years</span>
                </div>
                <input type="range" min="1" max="30" value={years}
                  onChange={e => setYears(Number(e.target.value))}
                  className="w-full accent-gx-500" />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold"><span>1yr</span><span>15yrs</span><span>30yrs</span></div>
              </div>
              <button onClick={runForecast} disabled={forecastLoading}
                className="w-full rounded-xl bg-gx-600 px-4 py-3.5 font-bold text-white hover:bg-gx-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {forecastLoading ? "Projecting..." : <><TrendingUp size={16} /> Run What-If Forecast</>}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target size={16} /> Forecast Result
            </h2>
            {!forecastResult && <p className="text-sm text-slate-400 italic">Adjust the sliders and run the forecast to see your savings projection.</p>}
            {forecastResult && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-violet-50 border border-violet-200">
                  <p className="text-base font-bold text-gx-900">{forecastResult.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Projected Value</p>
                    <p className="text-base font-black text-gx-600 mt-1">{money(forecastResult.projected_value)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Growth Earned</p>
                    <p className="text-base font-black text-gx-600 mt-1">+{money(forecastResult.projected_growth)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === LOAN EVALUATOR === */}
      {tab === "loan" && (
        <div className="space-y-4">
          <div className="space-y-5">
            {/* Live Preview */}
            <div className={`rounded-2xl p-5 border ${Number(loanPreview.pctIncome) > 40 ? "bg-red-50 border-red-200" : Number(loanPreview.pctIncome) > 25 ? "bg-amber-50 border-amber-200" : "bg-gx-50 border-gx-100"
              }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Debt-to-Income Preview</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${Number(loanPreview.pctIncome) > 40 ? "bg-red-500" : Number(loanPreview.pctIncome) > 25 ? "bg-amber-500" : "bg-gx-500"
                  }`}>{Number(loanPreview.pctIncome) > 40 ? "RISKY" : Number(loanPreview.pctIncome) > 25 ? "CAUTION" : "HEALTHY"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Payment</p>
                  <p className="text-sm font-black text-slate-800">{money(loanPreview.monthly)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Interest</p>
                  <p className="text-sm font-black text-red-600">{money(loanPreview.interest)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">% of Income</p>
                  <p className={`text-sm font-black ${Number(loanPreview.pctIncome) > 40 ? "text-red-600" : "text-slate-800"}`}>{loanPreview.pctIncome}%</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="card p-5 space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><CreditCard size={14} /> Loan Amount</label>
                <div className="flex items-end gap-2 mt-1 mb-2">
                  <span className="text-xl font-black text-gx-600">{money(loanAmount)}</span>
                </div>
                <input type="range" min="1000" max="100000" step="500" value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value))} className="w-full accent-gx-500" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><Percent size={14} /> Interest Rate</label>
                <div className="flex items-end gap-2 mt-1 mb-2">
                  <span className="text-xl font-black text-gx-600">{loanInterest}%</span>
                  <span className="text-sm text-slate-400 font-bold mb-1">p.a.</span>
                </div>
                <input type="range" min="1" max="15" step="0.5" value={loanInterest}
                  onChange={e => setLoanInterest(Number(e.target.value))} className="w-full accent-gx-500" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><Clock size={14} /> Duration</label>
                <div className="flex items-end gap-2 mt-1 mb-2">
                  <span className="text-xl font-black text-gx-600">{loanMonths}</span>
                  <span className="text-sm text-slate-400 font-bold mb-1">months</span>
                </div>
                <input type="range" min="6" max="120" value={loanMonths}
                  onChange={e => setLoanMonths(Number(e.target.value))} className="w-full accent-gx-500" />
              </div>
              <button onClick={runLoan} disabled={loanLoading}
                className="w-full rounded-xl bg-gx-600 px-4 py-3.5 font-bold text-white hover:bg-gx-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loanLoading ? "Evaluating..." : <><Landmark size={16} /> Should I Take This Loan?</>}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target size={16} /> Loan Evaluation Result
            </h2>
            {!loanResult && <p className="text-sm text-slate-400 italic">Adjust the loan parameters and click evaluate to see the full impact analysis.</p>}
            {loanResult && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                  <p className="text-base font-bold text-red-800">{loanResult.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Monthly Payment</p>
                    <p className="text-base font-black text-slate-800 mt-1">{money(loanResult.monthly_payment)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Repayment</p>
                    <p className="text-base font-black text-red-700 mt-1">{money(loanResult.total_repayment)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Savings Impact</p>
                    <p className="text-base font-black text-amber-600 mt-1">-{money(loanResult.impact_on_savings)}/mo</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Goal Delay</p>
                    <p className="text-base font-black text-red-600 mt-1">+{loanResult.goal_delay_months} months</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
