import { useState, useMemo, useEffect } from "react";
import { post, api } from "../api.js";
import {
  TrendingUp, TrendingDown, Plus, Edit2, Trash2,
  Wallet, PieChart, ArrowUpRight, ArrowDownRight,
  Info, DollarSign, Landmark, Briefcase
} from "lucide-react";

const money = (v) => `RM${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Investments({ data, onUpdate }) {
  const [investments, setInvestments] = useState(data?.investments || []);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInv, setEditingInv] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");

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
          <div className="w-[90%] max-w-sm bg-white rounded-[2rem] p-6 animate-in slide-in-from-bottom duration-300">
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
    </main>
  );
}
