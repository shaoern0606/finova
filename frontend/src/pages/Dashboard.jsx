import { AlertTriangle, ArrowDownRight, BadgeCheck, Goal, Landmark, MapPin, Receipt, Plus, Target, X } from "lucide-react";
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

export default function Dashboard({ data, onDemoSalary, onDemoOverspend, demoResult, onUpdate, onDataUpdate, userLocation, locationStatus, onRefreshMerchants }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualType, setManualType] = useState("expense");
  const [goalAllocations, setGoalAllocations] = useState([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  
  // Goal Edit State
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  
  // New Goal State
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [addGoalName, setAddGoalName] = useState("");
  const [addGoalTarget, setAddGoalTarget] = useState("");
  const [addGoalDate, setAddGoalDate] = useState("");
  const [addGoalCategory, setAddGoalCategory] = useState("General");
  
  // Smart Map Filter State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [mapMode, setMapMode] = useState(false);

  if (!data) return <div className="p-6 text-slate-600">Loading financial graph...</div>;

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    const goalId = editingGoal.id;
    const newName = editGoalName;
    const newTarget = parseFloat(editGoalTarget);

    // Optimistic: update goal in local state immediately
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

    // Background sync to backend
    try {
      await api(`/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName, target_amount: newTarget })
      });
    } catch (e) {
      console.error("Failed to persist goal update", e);
    }
    if (onUpdate) onUpdate();
  };

  const handleCreateGoal = async () => {
    if (!addGoalName || !addGoalTarget) return;
    const name = addGoalName;
    const target = parseFloat(addGoalTarget);
    const deadline = addGoalDate;
    const category = addGoalCategory;

    // Optimistic: add goal to local state immediately
    const tempId = `goal_tmp_${Date.now()}`;
    const newGoal = {
      id: tempId,
      name: name,
      target_amount: target,
      current_amount: 0,
      monthly_contribution: 0,
      target_date: deadline || "",
      category: category || "General"
    };
    
    if (onDataUpdate) {
      onDataUpdate(prev => {
        if (!prev) return prev;
        // Strict rule: ALWAYS append, NEVER overwrite
        return { 
          ...prev, 
          goals: [...(prev.goals || []), newGoal] 
        };
      });
    }
    
    // Close modal and reset fields
    setIsAddingGoal(false);
    setAddGoalName("");
    setAddGoalTarget("");
    setAddGoalDate("");
    setAddGoalCategory("General");

    // Background sync to backend
    try {
      const result = await post("/goals", { 
        name: name, 
        target_amount: target,
        target_date: deadline,
        category: category
      });
      
      // Update the temp ID with the real ID from backend
      if (onDataUpdate) {
        onDataUpdate(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            goals: (prev.goals || []).map(g => g.id === tempId ? { ...g, id: result.goal?.id ?? tempId } : g)
          };
        });
      }
    } catch (e) {
      console.error("Failed to persist goal", e);
      // Rollback optimistic update on failure
      if (onDataUpdate) {
        onDataUpdate(prev => ({
          ...prev,
          goals: (prev.goals || []).filter(g => g.id !== tempId)
        }));
      }
      alert("Failed to save goal. Please check your connection.");
    }
    // Final sync to ensure everything is aligned
    if (onUpdate) onUpdate();
  };

  const handleDeleteGoal = async () => {
    if (!editingGoal) return;
    const goalId = editingGoal.id;
    if (confirm("Are you sure you want to delete this goal?")) {
      // Optimistic: remove goal from local state immediately
      if (onDataUpdate) {
        onDataUpdate(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            goals: (prev.goals || []).filter(g => g.id !== goalId)
          };
        });
      }
      setEditingGoal(null);

      // Background sync to backend
      try {
        await api(`/goals/${goalId}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete goal", e);
      }
      if (onUpdate) onUpdate();
    }
  };

  const totalAllocated = goalAllocations.reduce((sum, g) => sum + (parseFloat(g.allocatedAmount) || 0), 0);
  const unallocatedAmount = Math.max(0, (parseFloat(manualAmount) || 0) - totalAllocated);

  const addGoalAllocation = (goalId) => {
    if (!goalId) return;
    if (goalAllocations.find(g => g.goalId === goalId)) return;
    const goal = data.goals.find(g => g.id === goalId);
    if (goal) {
      setGoalAllocations([...goalAllocations, { goalId: goal.id, goalName: goal.name, allocatedAmount: unallocatedAmount > 0 ? unallocatedAmount : 0 }]);
    }
  };

  const handleCreateNewGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    const name = newGoalName;
    const target = parseFloat(newGoalTarget);

    // Optimistic: add goal to local state immediately
    const tempId = `goal_tmp_quick_${Date.now()}`;
    const newGoal = {
      id: tempId,
      name: name,
      target_amount: target,
      current_amount: 0,
      monthly_contribution: 0,
      target_date: "",
      category: "General"
    };
    
    if (onDataUpdate) {
      onDataUpdate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: [...(prev.goals || []), newGoal]
        };
      });
    }

    setGoalAllocations([...goalAllocations, { goalId: tempId, goalName: name, allocatedAmount: unallocatedAmount > 0 ? unallocatedAmount : 0 }]);
    setShowNewGoal(false);
    setNewGoalName("");
    setNewGoalTarget("");

    // Background sync
    try {
      const result = await post("/goals", { 
        name: name, 
        target_amount: target,
        target_date: "",
        category: "General"
      });
      // Replace temp ID
      if (onDataUpdate) {
        onDataUpdate(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            goals: (prev.goals || []).map(g => g.id === tempId ? { ...g, id: result.goal?.id ?? tempId } : g)
          };
        });
      }
      setGoalAllocations(prev => prev.map(a => a.goalId === tempId ? { ...a, goalId: result.goal?.id ?? tempId } : a));
    } catch (e) {
      console.error("Failed to persist quick goal", e);
      // Rollback
      if (onDataUpdate) {
        onDataUpdate(prev => ({
          ...prev,
          goals: (prev.goals || []).filter(g => g.id !== tempId)
        }));
      }
    }
    if (onUpdate) onUpdate();
  };

  const handleAddTransaction = async () => {
    if (!manualAmount || !manualMerchant) return;
    const amt = parseFloat(manualAmount);
    const finalAmt = manualType === "income" ? Math.abs(amt) : -Math.abs(amt);
    const today = new Date().toISOString().slice(0, 10);

    // Optimistic: inject transaction into local data immediately
    const finalAllocations = manualType === "savings" ? goalAllocations.filter(g => g.allocatedAmount > 0) : [];
    
    const tempTx = {
      id: `tx_opt_${Date.now()}`,
      date: today,
      merchant: manualMerchant,
      amount: finalAmt,
      type: manualType,
      main_category: manualType === "savings" ? "Savings" : "Other",
      sub_category: manualType === "savings" ? "Goal Transfer" : "Miscellaneous",
      behavioral_tag: null,
      category: manualType === "savings" ? "Savings" : "Other",
      source: "Manual Entry",
      goalAllocation: finalAllocations,
    };

    if (onDataUpdate) {
      onDataUpdate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            transactions: [tempTx, ...(prev.summary?.transactions ?? [])],
            total_spending: manualType === "expense"
              ? (prev.summary?.total_spending ?? 0) + Math.abs(finalAmt)
              : (prev.summary?.total_spending ?? 0),
          },
          balance: {
            ...prev.balance,
            assets: (prev.balance?.assets ?? 0) + finalAmt,
            net_worth: (prev.balance?.net_worth ?? 0) + finalAmt,
          },
          goals: (prev.goals || []).map(g => {
            const alloc = finalAllocations.find(a => a.goalId === g.id);
            if (alloc) {
              return { ...g, current_amount: (g.current_amount || 0) + (parseFloat(alloc.allocatedAmount) || 0) };
            }
            return g;
          })
        };
      });
    }

    setShowAddModal(false);
    setManualAmount("");
    setManualMerchant("");
    setGoalAllocations([]);
    setShowNewGoal(false);

    // Background persist + full re-sync
    try {
      await post("/transactions", {
        merchant: manualMerchant,
        amount: amt,
        type: manualType,
        category: manualType === "savings" ? "Savings" : "Other",
        source: "Manual Entry",
        goalAllocation: finalAllocations,
      });
    } catch (e) {
      console.error("Failed to persist transaction", e);
    }
    if (onUpdate) onUpdate();
  };

  const handleResetData = async () => {
    if (confirm("Are you sure you want to reset all demo data? This will clear all your manual changes.")) {
      try {
        await post("/reset", {});
        if (onUpdate) onUpdate();
      } catch (e) {
        console.error("Failed to reset demo data", e);
      }
    }
  };

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
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setMapMode(!mapMode)} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold shadow-md transition-colors ${mapMode ? "bg-red-500 text-white" : "bg-gx-500 text-white"}`}>
              <MapPin size={18} /> {mapMode ? "Exit Map Mode" : "Map Mode"}
            </button>
            <button onClick={onDemoSalary} className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-gx-900">Simulate Salary</button>
            <button onClick={onDemoOverspend} className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-gx-900">Simulate Overspending</button>
            <button onClick={handleResetData} className="rounded-lg border-2 border-red-400 bg-transparent px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400 hover:text-white transition-all">Reset Demo Data</button>
          </div>
        </div>
      </section>

      {demoResult && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{demoResult}</div>}

      {mapMode ? (
        <section className="h-[75vh] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          <SmartMap
            recommendations={data.recommendations}
            location={userLocation}
            locationStatus={locationStatus}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onRefreshMerchants={onRefreshMerchants}
          />
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4 animate-in fade-in duration-300">
        <Card title="Combined Balance" value={money(data.balance.assets)} />
        <Card title="Net Worth" value={money(data.balance.net_worth)} accent={data.balance.net_worth < 0 ? "text-red-600" : "text-gx-900"} />
        <Card title="Total Spending" value={money(data.summary.total_spending)} />
        <Card title="Daily Average" value={money(data.summary.daily_average)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <ScoreRing data={data.score} />
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

      {/* Hierarchical drill-down analytics */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gx-900">Spending Intelligence</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Click category to drill down</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Hierarchical breakdown — main category → sub-category level</p>
        <HierarchicalBreakdown
          mainBreakdown={data.summary.category_breakdown}
          subBreakdown={data.summary.sub_category_breakdown || {}}
        />
        {data.summary.behavioral_insights?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Behavioral AI Insights</p>
            <BehavioralInsights
              insights={data.summary.behavioral_insights || []}
              tagCounts={data.summary.behavioral_tag_counts || {}}
            />
          </div>
        )}
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
          <div className="absolute top-4 right-4">
            <button onClick={() => setIsAddingGoal(true)} className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition">
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {data.goals.map((goal) => (
              <div key={goal.id} className="rounded-lg bg-emerald-50 p-3 group relative cursor-pointer hover:bg-emerald-100 transition" onClick={() => {
                setEditingGoal(goal);
                setEditGoalName(goal.name);
                setEditGoalTarget(goal.target_amount);
              }}>
                <div className="flex items-center gap-2 font-bold"><Goal size={17} />{goal.name}</div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-gx-500" style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{money(goal.current_amount)} / {money(goal.target_amount)}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs font-bold text-emerald-700 bg-white/50 px-2 rounded">Edit</div>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gx-900">Recent Transactions</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-gx-600 hover:bg-emerald-100 transition"
          >
            <Plus size={14} /> Add Manual
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {data.summary.transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm font-medium">No recent transactions yet. Add manual entries or scan a receipt to see them here.</div>
          ) : (
            data.summary.transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{tx.merchant}</p>
                    {tx.receipt_url && <Receipt size={14} className="text-emerald-500" title="Receipt saved" />}
                    {tx.goalAllocation && tx.goalAllocation.length > 0 && (
                      <span className="flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                        <Target size={10} /> Goal
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {tx.source} · <span className="font-semibold text-slate-600">{tx.main_category || tx.category}</span>
                    {tx.sub_category && ` › ${tx.sub_category}`} · {tx.date}
                  </p>
                  {tx.behavioral_tag && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {tx.behavioral_tag.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <span className={`flex items-center gap-1 font-bold ${tx.amount < 0 ? "text-red-600" : "text-gx-600"}`}>
                  {tx.amount < 0 && <ArrowDownRight size={15} />}
                  {money(Math.abs(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Map Banner - always visible outside map mode */}
      <section className="card p-4 flex justify-between items-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
        <div>
          <h2 className="text-lg font-black text-gx-900">Real-time Map Intelligence</h2>
          <p className="text-sm text-slate-500">Discover cost-saving alternatives based on your spending habits.</p>
        </div>
        <button onClick={() => setMapMode(true)} className="rounded-xl bg-gx-500 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 whitespace-nowrap flex gap-2 items-center">
          <MapPin size={18} /> Open Map
        </button>
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
                <label className="text-xs font-semibold text-slate-500">
                  {manualType === "income" ? "Source (Salary, Bonus, etc.)" : manualType === "savings" ? "Transfer Title" : "Merchant / Title"}
                </label>
                <input type="text" value={manualMerchant} onChange={e => setManualMerchant(e.target.value)} placeholder={manualType === "income" ? "e.g. Salary" : "e.g. Monthly Savings"} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Amount (RM)</label>
                <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>

              {/* Goal Allocation Section - ONLY for Savings type */}
              {manualType === "savings" && (
              <div className="pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Savings Goal Allocation</label>
                <div className="space-y-2">
                  {goalAllocations.map((alloc, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <Target size={14} className="text-gx-500" />
                      <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{alloc.goalName}</span>
                      <div className="w-20 relative">
                        <span className="absolute left-2 top-1 text-[10px] text-slate-400 font-medium">RM</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={alloc.allocatedAmount}
                          onChange={(e) => {
                            const newAlloc = [...goalAllocations];
                            newAlloc[index].allocatedAmount = parseFloat(e.target.value) || 0;
                            setGoalAllocations(newAlloc);
                          }}
                          className="w-full rounded bg-white pl-6 pr-1 py-1 text-xs font-bold text-gx-900 focus:outline-none focus:ring-1 focus:ring-gx-500"
                        />
                      </div>
                      <button onClick={() => setGoalAllocations(goalAllocations.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {showNewGoal ? (
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 space-y-2">
                      <input type="text" placeholder="Goal Name" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="w-full text-xs p-1.5 rounded border border-emerald-200" />
                      <input type="number" placeholder="Target Amount" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full text-xs p-1.5 rounded border border-emerald-200" />
                      <div className="flex gap-1 mt-1">
                        <button onClick={() => setShowNewGoal(false)} className="flex-1 text-[10px] py-1.5 font-bold bg-white rounded border border-slate-200 text-slate-500">Cancel</button>
                        <button onClick={handleCreateNewGoal} className="flex-1 text-[10px] py-1.5 font-bold bg-gx-500 rounded text-white">Create & Select</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select 
                        onChange={(e) => { addGoalAllocation(e.target.value); e.target.value = ""; }}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Goal...</option>
                        {data.goals.filter(g => !goalAllocations.find(a => a.goalId === g.id)).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button onClick={() => setShowNewGoal(true)} className="px-2 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap">
                        + New
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold">
                  <span className="text-slate-500">Unallocated:</span>
                  <span className={unallocatedAmount < 0 ? "text-red-500" : "text-gx-600"}>{money(unallocatedAmount)}</span>
                </div>
              </div>
              )}

              <div className="mt-6 flex gap-3 pt-2">
                <button onClick={() => { setShowAddModal(false); setGoalAllocations([]); setShowNewGoal(false); }} className="flex-1 rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button>
                <button onClick={handleAddTransaction} className="flex-1 rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-emerald-500/20">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gx-900 mb-4">Edit Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Goal Name</label>
                <input type="text" value={editGoalName} onChange={e => setEditGoalName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Target Amount (RM)</label>
                <input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setEditingGoal(null)} className="flex-[2] rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button>
                <button onClick={handleDeleteGoal} className="flex-[1] rounded-lg bg-red-50 py-3 font-bold text-red-600">Delete</button>
                <button onClick={handleUpdateGoal} className="flex-[2] rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-emerald-500/20">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gx-900 mb-4">Create New Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Goal Name</label>
                <input type="text" value={addGoalName} onChange={e => setAddGoalName(e.target.value)} placeholder="e.g., Vacation Fund" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Target Amount (RM)</label>
                <input type="number" value={addGoalTarget} onChange={e => setAddGoalTarget(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Optional Deadline (Date)</label>
                <input type="date" value={addGoalDate} onChange={e => setAddGoalDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Category</label>
                <select value={addGoalCategory} onChange={e => setAddGoalCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none bg-white">
                  <option value="General">General</option>
                  <option value="Travel">Travel</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Education">Education</option>
                  <option value="Property">Property</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setIsAddingGoal(false)} className="flex-1 rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button>
                <button onClick={handleCreateGoal} className="flex-1 rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-emerald-500/20">Create Goal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

