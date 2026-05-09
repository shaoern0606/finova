import { useState, useMemo, useEffect } from "react";
import { post, api } from "../api.js";
import {
  TrendingUp, TrendingDown, Plus, Edit2, Trash2,
  Wallet, PieChart, ArrowUpRight, ArrowDownRight,
  Info, DollarSign, Landmark, Briefcase, Goal, Target, CheckCircle2
} from "lucide-react";

const money = (v) => `RM${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Investments({ data, onUpdate, onDataUpdate }) {
  const [investments, setInvestments] = useState(data?.investments || []);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInv, setEditingInv] = useState(null);

  const [name, setName] = useState("");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");

  // Goal State
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [addGoalName, setAddGoalName] = useState("");
  const [addGoalTarget, setAddGoalTarget] = useState("");
  const [addGoalDate, setAddGoalDate] = useState("");
  const [addGoalCategory, setAddGoalCategory] = useState("General");

  const balances = data?.balance || { cash: 0, investments: 0, net_worth: 0, debt: 0 };

  useEffect(() => {
    if (data?.investments) {
      setInvestments(data.investments);
    }
  }, [data]);

  const summary = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
    const totalCurrent = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
    const profitLoss = totalCurrent - totalInvested;
    const profitPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, profitLoss, profitPct };
  }, [investments]);

  async function handleSave() {
    if (!name || !amountInvested || !currentValue) return;
    setLoading(true);
    try {
      const payload = {
        name,
        amount_invested: Number(amountInvested),
        current_value: Number(currentValue)
      };

      if (editingInv) {
        await api(`/investments/${editingInv.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await post("/investments", payload);
      }

      await onUpdate(); // Refresh global data
      setShowModal(false);
      setEditingInv(null);
      resetForm();
    } catch (e) {
      console.error("Failed to save investment", e);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this investment?")) return;
    try {
      await api(`/investments/${id}`, { method: "DELETE" });
      await onUpdate();
    } catch (e) {
      console.error("Failed to delete investment", e);
    }
  }

  function openEdit(inv) {
    setEditingInv(inv);
    setName(inv.name);
    setAmountInvested(inv.amount_invested);
    setCurrentValue(inv.current_value);
    setShowModal(true);
  }

  function resetForm() {
    setName("");
    setAmountInvested("");
    setCurrentValue("");
  }

  // Goal Handlers
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

  return (
    <main className="space-y-6 px-6 pt-14 pb-6 overflow-x-hidden">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <PieChart size={16} className="text-gx-600" />
          <p className="text-[10px] font-black text-gx-600 uppercase tracking-widest">Financial Health</p>
        </div>
        <h1 className="text-2xl font-black text-gx-900 leading-tight">Net Worth & Wealth</h1>
        <p className="text-xs text-slate-500 mt-1">Track your growth across all assets.</p>
      </section>

      {/* Net Worth Dashboard Section */}
      <section className="bg-gx-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-gx-900/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gx-500/20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gx-400 mb-2">Total Net Worth</p>
          <h2 className="text-4xl font-black tracking-tight">{money(balances.net_worth)}</h2>

          <div className="mt-8 grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gx-500/20 rounded-lg">
                  <Landmark size={18} className="text-gx-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase">Savings Goals</p>
                  <p className="text-sm font-black">{money(balances.savings)}</p>
                </div>
              </div>
              <Info size={14} className="text-white/30" />
            </div>

            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Wallet size={18} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase">Cash Balance</p>
                  <p className="text-sm font-black">{money(balances.cash)}</p>
                </div>
              </div>
              <Info size={14} className="text-white/30" />
            </div>

            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase">Investments</p>
                  <p className="text-sm font-black">{money(balances.investments)}</p>
                </div>
              </div>
              <Info size={14} className="text-white/30" />
            </div>

            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <DollarSign size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase">Total Debt</p>
                  <p className="text-sm font-black">{money(balances.debt)}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-red-300">Liability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Goals Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Savings Goals</h3>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="p-1.5 rounded-lg text-gx-600 hover:bg-violet-50 transition active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {data?.goals?.length === 0 ? (
            <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-400">No active goals</p>
            </div>
          ) : (
            data.goals.map(goal => (
              <div
                key={goal.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer active:bg-slate-50 transition group"
                onClick={() => { setEditingGoal(goal); setEditGoalName(goal.name); setEditGoalTarget(goal.target_amount); }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-gx-600" />
                    <span className="text-sm font-black text-slate-900">{goal.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition">EDIT</span>
                    <span className="text-[10px] font-black text-gx-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-gx-500 rounded-full" style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Saved {money(goal.current_amount)}</span>
                  <span>Target {money(goal.target_amount)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Liabilities & Debt Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Total Liabilities</h3>
        <div className="space-y-2">
          {data?.loans?.length === 0 ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900">Debt Free</p>
                <p className="text-[10px] font-medium text-emerald-700">No outstanding liabilities detected.</p>
              </div>
            </div>
          ) : (
            data.loans.map(loan => (
              <div key={loan.id} className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{loan.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{loan.remaining_months} months remaining</p>
                  </div>
                </div>
                <p className="text-sm font-black text-red-600">{money(loan.outstanding)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Investment Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Investment Portfolio</h3>
          <button
            onClick={() => { setEditingInv(null); resetForm(); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gx-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform"
          >
            <Plus size={14} /> Add New
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Portfolio Performance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-xl font-black ${summary.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {summary.profitLoss >= 0 ? "+" : ""}{money(summary.profitLoss)}
                </p>
                <span className={`text-xs font-bold ${summary.profitLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  ({summary.profitLoss >= 0 ? "+" : ""}{summary.profitPct.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${summary.profitLoss >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {summary.profitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>
        </div>
      </section>

      {/* Investment List */}
      <section className="space-y-3">
        {investments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Briefcase size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No investments added yet.</p>
          </div>
        ) : (
          investments.map(inv => {
            const profit = inv.current_value - inv.amount_invested;
            const pct = inv.amount_invested > 0 ? (profit / inv.amount_invested) * 100 : 0;
            const isProfit = profit >= 0;

            return (
              <div key={inv.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{inv.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Asset Class</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(inv)} className="p-1.5 text-slate-300 hover:text-gx-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Invested</p>
                    <p className="text-sm font-black text-slate-600">{money(inv.amount_invested)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Value</p>
                    <p className="text-sm font-black text-gx-900">{money(inv.current_value)}</p>
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t border-slate-50 flex items-center justify-between ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                  <div className="flex items-center gap-1">
                    {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span className="text-xs font-black uppercase tracking-wider">{isProfit ? "Profit" : "Loss"}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{isProfit ? "+" : ""}{money(profit)}</p>
                    <p className="text-[10px] font-bold">({isProfit ? "+" : ""}{pct.toFixed(1)}%)</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[90%] max-w-sm bg-white rounded-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="text-gx-600" />
              {editingInv ? "Edit Investment" : "Add Investment"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Asset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. ASB, Bitcoin, AAPL Stock"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-gx-500/20 focus:border-gx-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Total Invested (RM)</label>
                <input
                  type="number"
                  value={amountInvested}
                  onChange={e => setAmountInvested(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-gx-500/20 focus:border-gx-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Current Value (RM)</label>
                <input
                  type="number"
                  value={currentValue}
                  onChange={e => setCurrentValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-gx-500/20 focus:border-gx-500 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gx-900 text-white rounded-xl py-4 font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingInv ? "Update Investment" : "Add to Portfolio")}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-slate-100 text-slate-500 rounded-xl py-4 font-black uppercase tracking-wider active:scale-95 transition-all"
                >
                  Cancel
                </button>
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
              <div><label className="text-xs font-semibold text-slate-500">Goal Name</label><input type="text" value={editGoalName} onChange={e => setEditGoalName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div><label className="text-xs font-semibold text-slate-500">Target Amount (RM)</label><input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-gx-500 focus:outline-none" /></div>
              <div className="mt-6 flex flex-col gap-2"><button onClick={() => setEditingGoal(null)} className="flex-[2] rounded-lg bg-slate-100 py-3 font-bold text-slate-600">Cancel</button><button onClick={handleDeleteGoal} className="flex-1 rounded-lg bg-red-50 py-3 font-bold text-red-600">Delete</button><button onClick={handleUpdateGoal} className="flex-[2] rounded-lg bg-gx-500 py-3 font-bold text-white shadow-md shadow-gx-500/20">Save</button></div>
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
