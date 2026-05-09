import { AlertTriangle, ArrowDownRight, BadgeCheck, Goal, Landmark, LogOut, MapPin, Receipt, Plus, Target, X, Brain, Compass, Coins, Globe, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { post, api } from "../api.js";
import Card from "../components/Card.jsx";
import { CategoryBars, SpendingPie, HierarchicalBreakdown, BehavioralInsights } from "../components/Charts.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import SmartMap from "../components/SmartMap.jsx";

const money = (value) => {
  const n = Number(value || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}RM${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Dashboard({ data, onDemoSalary, onDemoOverspend, demoResult, onUpdate, onDataUpdate, userLocation, locationStatus, onRefreshMerchants, onSignOut }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualType, setManualType] = useState("expense");
  const [goalAllocations, setGoalAllocations] = useState([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [addGoalName, setAddGoalName] = useState("");
  const [addGoalTarget, setAddGoalTarget] = useState("");
  const [addGoalDate, setAddGoalDate] = useState("");
  const [addGoalCategory, setAddGoalCategory] = useState("General");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [mapMode, setMapMode] = useState(false);

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gx-500">
      <div className="w-10 h-10 border-4 border-gx-200 border-t-gx-600 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest animate-pulse">Syncing Intelligence...</p>
    </div>
  );

  const warnings = data.peer ? data.peer.filter((item) => item.warning).slice(0, 3) : [];

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    const goalId = editingGoal.id;
    const newName = editGoalName;
    const newTarget = parseFloat(editGoalTarget);
    if (onDataUpdate) {
      onDataUpdate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: (prev.goals || []).map(g => g.id === goalId ? { ...g, name: newName, target_amount: newTarget } : g)
        };
      });
    }
    setEditingGoal(null);
    try {
      await api(`/goals/${goalId}`, { method: "PATCH", body: JSON.stringify({ name: newName, target_amount: newTarget }) });
    } catch (e) { console.error(e); }
    if (onUpdate) onUpdate();
  };

  const handleCreateGoal = async () => {
    if (!addGoalName || !addGoalTarget) return;
    const name = addGoalName;
    const target = parseFloat(addGoalTarget);
    const deadline = addGoalDate;
    const category = addGoalCategory;
    const tempId = `goal_tmp_${Date.now()}`;
    const newGoal = { id: tempId, name, target_amount: target, current_amount: 0, monthly_contribution: 0, target_date: deadline || "", category: category || "General" };
    if (onDataUpdate) {
      onDataUpdate(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
    }
    setIsAddingGoal(false);
    setAddGoalName(""); setAddGoalTarget(""); setAddGoalDate(""); setAddGoalCategory("General");
    try {
      const result = await post("/goals", { name, target_amount: target, target_date: deadline, category });
      if (onDataUpdate) {
        onDataUpdate(prev => ({ ...prev, goals: (prev.goals || []).map(g => g.id === tempId ? { ...g, id: result.goal?.id ?? tempId } : g) }));
      }
    } catch (e) { console.error(e); }
    if (onUpdate) onUpdate();
  };

  const handleDeleteGoal = async () => {
    if (!editingGoal) return;
    const goalId = editingGoal.id;
    if (confirm("Are you sure?")) {
      if (onDataUpdate) onDataUpdate(prev => ({ ...prev, goals: (prev.goals || []).filter(g => g.id !== goalId) }));
      setEditingGoal(null);
      try { await api(`/goals/${goalId}`, { method: "DELETE" }); } catch (e) { console.error(e); }
      if (onUpdate) onUpdate();
    }
  };

  const totalAllocated = goalAllocations.reduce((sum, g) => sum + (parseFloat(g.allocatedAmount) || 0), 0);
  const unallocatedAmount = Math.max(0, (parseFloat(manualAmount) || 0) - totalAllocated);

  const addGoalAllocation = (goalId) => {
    if (!goalId || goalAllocations.find(g => g.goalId === goalId)) return;
    const goal = data.goals.find(g => g.id === goalId);
    if (goal) setGoalAllocations([...goalAllocations, { goalId: goal.id, goalName: goal.name, allocatedAmount: unallocatedAmount > 0 ? unallocatedAmount : 0 }]);
  };

  const handleCreateNewGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    const name = newGoalName;
    const target = parseFloat(newGoalTarget);
    const tempId = `goal_tmp_quick_${Date.now()}`;
    const newGoal = { id: tempId, name, target_amount: target, current_amount: 0, monthly_contribution: 0, target_date: "", category: "General" };
    if (onDataUpdate) onDataUpdate(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
    setGoalAllocations([...goalAllocations, { goalId: tempId, goalName: name, allocatedAmount: unallocatedAmount > 0 ? unallocatedAmount : 0 }]);
    setShowNewGoal(false); setNewGoalName(""); setNewGoalTarget("");
    try {
      const result = await post("/goals", { name, target_amount: target, target_date: "", category: "General" });
      if (onDataUpdate) onDataUpdate(prev => ({ ...prev, goals: (prev.goals || []).map(g => g.id === tempId ? { ...g, id: result.goal?.id ?? tempId } : g) }));
      setGoalAllocations(prev => prev.map(a => a.goalId === tempId ? { ...a, goalId: result.goal?.id ?? tempId } : a));
    } catch (e) { console.error(e); }
    if (onUpdate) onUpdate();
  };

  const handleAddTransaction = async () => {
    if (!manualAmount || !manualMerchant) return;
    const amt = parseFloat(manualAmount);
    const finalAmt = manualType === "income" ? Math.abs(amt) : -Math.abs(amt);
    const today = new Date().toISOString().slice(0, 10);
    const finalAllocations = manualType === "savings" ? goalAllocations.filter(g => g.allocatedAmount > 0) : [];
    const tempTx = { id: `tx_opt_${Date.now()}`, date: today, merchant: manualMerchant, amount: finalAmt, type: manualType, main_category: manualType === "savings" ? "Savings" : "Other", sub_category: manualType === "savings" ? "Goal Transfer" : "Miscellaneous", behavioral_tag: null, category: manualType === "savings" ? "Savings" : "Other", source: "Manual Entry", goalAllocation: finalAllocations };
    if (onDataUpdate) {
      onDataUpdate(prev => ({ ...prev, summary: { ...prev.summary, transactions: [tempTx, ...(prev.summary?.transactions ?? [])], total_spending: manualType === "expense" ? (prev.summary?.total_spending ?? 0) + Math.abs(finalAmt) : (prev.summary?.total_spending ?? 0) }, balance: { ...prev.balance, assets: (prev.balance?.assets ?? 0) + finalAmt, net_worth: (prev.balance?.net_worth ?? 0) + finalAmt }, goals: (prev.goals || []).map(g => { const alloc = finalAllocations.find(a => a.goalId === g.id); return alloc ? { ...g, current_amount: (g.current_amount || 0) + (parseFloat(alloc.allocatedAmount) || 0) } : g; }) }));
    }
    setShowAddModal(false); setManualAmount(""); setManualMerchant(""); setGoalAllocations([]); setShowNewGoal(false);
    try {
      const result = await post("/transactions", { merchant: manualMerchant, amount: amt, type: manualType, category: manualType === "savings" ? "Savings" : "Other", source: "Manual Entry", goalAllocation: finalAllocations });
      if (result.snapshot && onDataUpdate) onDataUpdate(result.snapshot);
    } catch (e) { console.error(e); }
  };

  const handleAcceptRecommendation = async (merchant) => {
    if (!merchant || !onDataUpdate) return;
    try {
      const result = await post("/recommendations/accept", { merchant: merchant.name, amount: merchant.avg_spend, category: merchant.category, paymentMethod: "GrabPay" });
      if (result.snapshot) onDataUpdate(result.snapshot);
    } catch (e) { console.error(e); }
  };

  const handleResetData = async () => {
    if (confirm("Reset all demo data?")) {
      try { await post("/reset", {}); if (onUpdate) onUpdate(); } catch (e) { console.error(e); }
    }
  };

  return (
    <main className="space-y-4 px-6 pt-14 pb-4 overflow-x-hidden">
      <section className="rounded-[1.75rem] bg-gx-900 p-5 text-white relative overflow-hidden shadow-[0_22px_50px_rgba(76,29,149,0.28)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(167,139,250,0.28),transparent_55%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200">Finova Intelligence</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">Hi {data.user.name}</h1>
              <p className="text-[11px] text-violet-100/75 mt-1">Your financial graph is live.</p>
            </div>
            {onSignOut && <button onClick={onSignOut} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-violet-100 ring-1 ring-white/15 active:scale-95"><LogOut size={15} /></button>}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setMapMode(!mapMode)} className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-[11px] font-bold transition-all active:scale-95 ${mapMode ? "bg-red-500 text-white" : "bg-white/12 text-white border border-white/15"}`}><MapPin size={13} /> {mapMode ? "Exit Map" : "Map"}</button>
            <button onClick={handleResetData} className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-[11px] font-bold text-white/85 active:scale-95">Reset Data</button>
          </div>
        </div>
      </section>

      {demoResult && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{demoResult}</div>}

      {mapMode ? (
        <section className="h-[65vh] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white relative">
          <SmartMap recommendations={data.recommendations} location={userLocation} locationStatus={locationStatus} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} onRefreshMerchants={onRefreshMerchants} onAcceptRecommendation={handleAcceptRecommendation} />
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2">
            <Card title="Balance" value={money(data.balance.assets)} />
            <Card title="Net Worth" value={money(data.balance.net_worth)} accent={data.balance.net_worth < 0 ? "text-red-600" : "text-gx-900"} />
            <Card title="Spending" value={money(data.summary.total_spending)} />
            <Card title="Daily Avg" value={money(data.summary.daily_average)} />
          </section>

          <Card>
            <ScoreRing data={data.score} />
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <span className="chip text-[10px]">Risk: {data.behavior.classification}</span>
              <span className="chip text-[10px]">Low balance in {data.prediction.days_until_low_balance}d</span>
            </div>
          </Card>

          <Card title="Predictive Alerts">
            <div className="mt-2 space-y-2">
              <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-900 border border-red-100">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[11px]">Overspending Risk</p>
                  <p className="text-[10px] mt-0.5">{money(data.prediction.monthly_spend_projection)} projected — {data.prediction.overspending_risk}</p>
                </div>
              </div>
              {warnings.map((item) => (
                <div key={item.category} className="rounded-xl bg-violet-50 p-2.5 text-[10px] text-gx-900 border border-violet-100">
                  <span className="font-black uppercase tracking-wider text-[8px] text-gx-600 block mb-0.5">{item.category}</span>
                  <span className="leading-tight">{item.warning} {item.suggestion}</span>
                </div>
              ))}
            </div>
          </Card>

          {data.coach && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div>
                  <h3 className="text-sm font-black text-gx-900 uppercase tracking-widest">AI Behaviour Coach</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Personalized Financial Intelligence</p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white border border-violet-100 p-5 shadow-sm relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-3">
                    <BadgeCheck size={16} className="text-gx-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gx-600">Monthly AI Summary</span>
                 </div>
                 <p className="text-sm font-bold text-gx-900 leading-relaxed mb-4">
                   "{data.coach.monthly_summary.insight}" 
                   Your top category this month is <span className="text-gx-600 underline decoration-gx-200 underline-offset-4">{data.coach.monthly_summary.top_category}</span>.
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Savings Performance</p>
                       <p className="text-sm font-black text-emerald-600">{data.coach.monthly_summary.savings_performance}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Spent</p>
                       <p className="text-sm font-black text-gx-900">{money(data.coach.monthly_summary.total_spent)}</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {data.coach.observations.map((obs, i) => (
                  <div key={i} className="flex gap-3 items-center bg-violet-50/50 rounded-2xl p-4 border border-violet-100/50">
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-white rounded-full text-gx-600 shadow-sm"><Compass size={16} /></div>
                    <p className="text-[11px] font-bold text-gx-900 leading-snug">{obs}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[2rem] bg-gx-900 p-6 text-white shadow-xl shadow-gx-900/20 overflow-hidden relative">
                 <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none"><Coins size={100} /></div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-4"><RefreshCcw size={16} className="text-violet-300" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Live Recommendations</span></div>
                   <div className="mb-5">
                      <p className="text-[10px] font-bold text-violet-400 uppercase mb-1">Safe Daily Limit</p>
                      <p className="text-3xl font-black">{money(data.coach.prediction.daily_allowance)}<span className="text-sm font-medium text-violet-400">/day</span></p>
                   </div>
                   <ul className="space-y-3">
                     {data.coach.recommendations.map((rec, i) => (
                       <li key={i} className="flex items-start gap-2 text-[10px] font-medium text-violet-100 leading-normal"><div className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1 shrink-0" />{rec}</li>
                     ))}
                   </ul>
                 </div>
              </div>

              {data.coach.travel.is_active && (
                <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><Globe size={60} /></div>
                   <div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-blue-600 text-white rounded-lg"><Globe size={14} /></div><span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Travel Mode Active</span></div>
                   <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Total Overseas (MYR)</p>
                        <p className="text-xl font-black text-slate-900">{money(data.coach.travel.total_overseas_myr)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Active Currencies</p>
                        <div className="flex gap-1 justify-end">
                          {data.coach.travel.currencies.map(curr => (<span key={curr} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold text-[9px] border border-blue-100">{curr}</span>))}
                        </div>
                      </div>
                   </div>
                   <div className="space-y-2 pt-3 border-t border-slate-50">
                      <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-500">Live FX Impact</span><span className="font-black text-blue-600">Low Volatility</span></div>
                      <div className="grid grid-cols-2 gap-2">
                         {data.coach.travel.currencies.map(curr => (
                           <div key={curr} className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                             <span className="font-black text-[9px] text-slate-400">1 {curr}</span>
                             <span className="font-black text-[9px] text-slate-900">RM {data.coach.fx_rates[curr]?.toFixed(2)}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}
            </section>
          )}

          <Card title="Spending Mix">
            <SpendingPie breakdown={data.summary.category_breakdown} />
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-gx-900">Spending Intelligence</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tap category to drill down</p>
              </div>
              <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">Interactive</span>
            </div>
            <HierarchicalBreakdown mainBreakdown={data.summary.category_breakdown} subBreakdown={data.summary.sub_category_breakdown || {}} />
            {data.summary.behavioral_insights?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Patterns</p>
                <BehavioralInsights insights={data.summary.behavioral_insights || []} tagCounts={data.summary.behavioral_tag_counts || {}} />
              </div>
            )}
          </Card>

          <Card title="Active Loans">
            <div className="mt-2 space-y-2">
              {data.loans.map((loan) => (
                <div key={loan.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
                  <Landmark className="text-gx-600 shrink-0" size={18} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{loan.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{money(loan.outstanding)} · {loan.remaining_months}mo left</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Savings Goals">
            <div className="absolute top-3 right-3"><button onClick={() => setIsAddingGoal(true)} className="p-1.5 rounded-lg text-gx-600 hover:bg-violet-50 transition active:scale-90"><Plus size={16} /></button></div>
            <div className="mt-2 space-y-2">
              {data.goals.map((goal) => (
                <div key={goal.id} className="rounded-xl bg-violet-50 p-3 group relative cursor-pointer active:bg-violet-100 transition" onClick={() => { setEditingGoal(goal); setEditGoalName(goal.name); setEditGoalTarget(goal.target_amount); }}>
                  <div className="flex items-center gap-2 font-bold text-sm"><Goal size={15} /><span className="truncate">{goal.name}</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white"><div className="h-1.5 rounded-full bg-gx-500" style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }} /></div>
                  <p className="mt-1 text-[10px] text-slate-600">{money(goal.current_amount)} / {money(goal.target_amount)}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-gx-600 bg-white/60 px-2 rounded">Edit</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Smart Automations">
            <div className="mt-2 space-y-2">
              <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900"><b>Projection:</b> {money(data.prediction.projected_monthly_savings)}/mo savings pace</div>
              {data.automation.map((item, index) => (
                <div key={index} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs"><BadgeCheck size={16} className="text-gx-600 shrink-0" /><span className="min-w-0">{item.message}</span></div>
              ))}
            </div>
          </Card>

          <section className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-gx-900">Recent Transactions</h2>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-gx-600 active:bg-violet-100"><Plus size={12} /> Add</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.summary.transactions.length === 0 ? <div className="py-6 text-center text-slate-400 text-xs">No transactions yet.</div> : data.summary.transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0"><p className="font-semibold text-sm truncate">{tx.merchant}</p>{tx.receipt_url && <Receipt size={12} className="text-gx-600 shrink-0" />}</div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{tx.source} · {tx.main_category || tx.category} · {tx.date}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${tx.amount < 0 ? "text-red-600" : "text-gx-600"}`}>{money(Math.abs(tx.amount))}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
            <h2 className="text-sm font-black text-gx-900">Real-time Map Intelligence</h2>
            <p className="text-[10px] text-slate-500 mt-0.5 mb-3">Discover cost-saving alternatives near you.</p>
            <button onClick={() => setMapMode(true)} className="w-full rounded-xl bg-gx-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-[0.98] flex gap-2 items-center justify-center"><MapPin size={14} /> Open Map</button>
          </section>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gx-900 mb-4">Add Transaction</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Type</label>
                <div className="mt-1 flex gap-2">
                  <button onClick={() => setManualType("expense")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${manualType === "expense" ? "bg-red-50 text-red-600 border border-red-200" : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"}`}>Expense</button>
                  <button onClick={() => setManualType("income")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${manualType === "income" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"}`}>Income</button>
                  <button onClick={() => setManualType("savings")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${manualType === "savings" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"}`}>Savings</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">{manualType === "income" ? "Source (Salary, Bonus, etc.)" : manualType === "savings" ? "Transfer Title" : "Merchant / Title"}</label>
                <input type="text" value={manualMerchant} onChange={e => setManualMerchant(e.target.value)} placeholder={manualType === "income" ? "e.g. Salary" : "e.g. Monthly Savings"} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Amount (RM)</label>
                <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              {manualType === "savings" && (
                <div className="pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Savings Goal Allocation</label>
                  <div className="space-y-2">
                    {goalAllocations.map((alloc, index) => (
                      <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <Target size={14} className="text-gx-500" />
                        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{alloc.goalName}</span>
                        <div className="w-20 relative"><span className="absolute left-2 top-1 text-[10px] text-slate-400 font-medium">RM</span><input type="number" step="0.01" value={alloc.allocatedAmount} onChange={(e) => { const newAlloc = [...goalAllocations]; newAlloc[index].allocatedAmount = parseFloat(e.target.value) || 0; setGoalAllocations(newAlloc); }} className="w-full rounded bg-white pl-6 pr-1 py-1 text-xs font-bold text-gx-900 focus:outline-none focus:ring-1 focus:ring-gx-500" /></div>
                        <button onClick={() => setGoalAllocations(goalAllocations.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    {showNewGoal ? (
                      <div className="bg-violet-50 p-2 rounded-lg border border-violet-200 space-y-2">
                        <input type="text" placeholder="Goal Name" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="w-full text-xs p-1.5 rounded border border-violet-200" />
                        <input type="number" placeholder="Target Amount" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full text-xs p-1.5 rounded border border-violet-200" />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => setShowNewGoal(false)} className="flex-1 text-[10px] py-1.5 font-bold bg-white rounded border border-slate-200 text-slate-500">Cancel</button>
                          <button onClick={handleCreateNewGoal} className="flex-1 text-[10px] py-1.5 font-bold bg-gx-500 rounded text-white">Create & Select</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select onChange={(e) => { addGoalAllocation(e.target.value); e.target.value = ""; }} className="flex-1 text-xs p-1.5 rounded-lg border border-slate-200 bg-white" defaultValue=""><option value="" disabled>Select Goal...</option>{data.goals.filter(g => !goalAllocations.find(a => a.goalId === g.id)).map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>
                        <button onClick={() => setShowNewGoal(true)} className="px-2 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap">+ New</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-semibold"><span className="text-slate-500">Unallocated:</span><span className={unallocatedAmount < 0 ? "text-red-500" : "text-gx-600"}>{money(unallocatedAmount)}</span></div>
                </div>
              )}
              <div className="mt-6 flex gap-3 pt-2"><button onClick={() => { setShowAddModal(false); setGoalAllocations([]); setShowNewGoal(false); }} className="flex-1 rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button><button onClick={handleAddTransaction} className="flex-1 rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-gx-500/20">Save</button></div>
            </div>
          </div>
        </div>
      )}

      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gx-900 mb-4">Edit Goal</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-semibold text-slate-500">Goal Name</label><input type="text" value={editGoalName} onChange={e => setEditGoalName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div><label className="text-xs font-semibold text-slate-500">Target Amount (RM)</label><input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div className="mt-6 flex gap-2"><button onClick={() => setEditingGoal(null)} className="flex-[2] rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button><button onClick={handleDeleteGoal} className="flex-[1] rounded-lg bg-red-50 py-3 font-bold text-red-600">Delete</button><button onClick={handleUpdateGoal} className="flex-[2] rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-gx-500/20">Save</button></div>
            </div>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gx-900 mb-4">Create New Goal</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-semibold text-slate-500">Goal Name</label><input type="text" value={addGoalName} onChange={e => setAddGoalName(e.target.value)} placeholder="e.g., Vacation Fund" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div><label className="text-xs font-semibold text-slate-500">Target Amount (RM)</label><input type="number" value={addGoalTarget} onChange={e => setAddGoalTarget(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div><label className="text-xs font-semibold text-slate-500">Optional Deadline (Date)</label><input type="date" value={addGoalDate} onChange={e => setAddGoalDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div><label className="text-xs font-semibold text-slate-500">Category</label><select value={addGoalCategory} onChange={e => setAddGoalCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none bg-white"><option value="General">General</option><option value="Travel">Travel</option><option value="Emergency">Emergency</option><option value="Education">Education</option><option value="Property">Property</option><option value="Other">Other</option></select></div>
              <div className="mt-6 flex gap-2"><button onClick={() => setIsAddingGoal(false)} className="flex-1 rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button><button onClick={handleCreateGoal} className="flex-1 rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-gx-500/20">Create Goal</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
