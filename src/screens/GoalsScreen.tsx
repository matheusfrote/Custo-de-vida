import React, { useState } from 'react';
import {
  Hourglass,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Sparkles,
  ShoppingBag,
  Landmark,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';
import { GoalType } from '../types';

export const GoalsScreen: React.FC = () => {
  const {
    goals,
    addGoal,
    contributeToGoal,
    deleteGoal,
    profile,
    essentialExpensesTotal,
    showToast,
  } = useApp();

  const [filterType, setFilterType] = useState<'ALL' | 'PURCHASE' | 'SAVINGS'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newInitial, setNewInitial] = useState('0');
  const [newContribution, setNewContribution] = useState('400');
  const [newGoalType, setNewGoalType] = useState<GoalType>('PURCHASE');
  const [newCategory, setNewCategory] = useState('Eletrônicos');

  // Quick contribute modal
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('200');

  const hourlyRate = FinancialEngine.calculateHourlyRate(
    profile.netSalary,
    profile.weeklyHours,
    profile.divisorType
  );

  const monthlyHours = FinancialEngine.calculateMonthlyHours(
    profile.weeklyHours,
    profile.divisorType
  );

  const realHourlyRate = FinancialEngine.calculateRealHourlyRate(
    profile.netSalary,
    essentialExpensesTotal,
    monthlyHours
  );

  const freeIncome = Math.max(0, profile.netSalary - essentialExpensesTotal);

  const filteredGoals = goals.filter((g) => {
    if (filterType === 'PURCHASE') return g.goalType === 'PURCHASE';
    if (filterType === 'SAVINGS') return g.goalType === 'SAVINGS' || g.goalType === 'EMERGENCY';
    return true;
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = FinancialEngine.parseCurrencyInput(newTarget);
    const initial = FinancialEngine.parseCurrencyInput(newInitial);
    const monthly = FinancialEngine.parseCurrencyInput(newContribution);

    if (!newTitle.trim() || target <= 0) {
      showToast('Preencha o título e um valor alvo válido.');
      return;
    }

    addGoal({
      title: newTitle.trim(),
      targetAmount: target,
      currentAmount: initial,
      monthlyContribution: monthly,
      goalType: newGoalType,
      category: newCategory,
    });

    setNewTitle('');
    setNewTarget('');
    setNewInitial('0');
    setIsAddModalOpen(false);
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId) return;
    const val = FinancialEngine.parseCurrencyInput(contributeAmount);
    if (val <= 0) return;
    contributeToGoal(contributeGoalId, val);
    setContributeGoalId(null);
  };

  const purchaseGoalsCount = goals.filter((g) => g.goalType === 'PURCHASE').length;
  const savingsGoalsCount = goals.filter((g) => g.goalType !== 'PURCHASE').length;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 relative">
      {/* Top Banner (Screenshot 5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-2 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400">
          <Hourglass className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Metas de Compra & Poupança
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          Transforme objetivos em tempo real de vida
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Nas metas de compra, consideramos seus custos fixos ({FinancialEngine.formatCurrency(essentialExpensesTotal)}/mês) para dizer as horas, dias ou meses reais de esforço livre necessários!
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'ALL'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Todas ({goals.length})
        </button>

        <button
          onClick={() => setFilterType('PURCHASE')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'PURCHASE'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🛒 Metas de Compra ({purchaseGoalsCount})
        </button>

        <button
          onClick={() => setFilterType('SAVINGS')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'SAVINGS'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🏦 Poupança ({savingsGoalsCount})
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const isPurchase = goal.goalType === 'PURCHASE';
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const percent = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;

          // Free hours calculation
          const freeHours = realHourlyRate > 0 ? goal.targetAmount / realHourlyRate : (goal.targetAmount / (hourlyRate || 1));
          const workDays = freeHours / 8;
          const monthsToFinish = goal.monthlyContribution > 0 ? remaining / goal.monthlyContribution : 0;

          // Savings hours equivalent
          const savingsHoursEquiv = hourlyRate > 0 ? Math.round(goal.targetAmount / hourlyRate) : 0;

          return (
            <div
              key={goal.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl transition-all"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {isPurchase ? '🛒 META DE COMPRA' : '🏦 META DE POUPANÇA'}
                </span>

                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 rounded-lg"
                  title="Excluir meta"
                  aria-label={`Excluir meta ${goal.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Target */}
              <div>
                <h3 className="text-base font-bold text-white leading-tight">{goal.title}</h3>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Valor Alvo: {FinancialEngine.formatCurrency(goal.targetAmount)}
                </span>
              </div>

              {/* Real Investment Info Box (Screenshot 5 & 6) */}
              {isPurchase ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💵</span>
                    Investimento Real (Livre de Custos Fixos):
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                      <span className="text-sm font-black text-white block">
                        {freeHours.toFixed(0)}h
                      </span>
                      <span className="text-[10px] text-slate-500">Horas Livres</span>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                      <span className="text-sm font-black text-white block">
                        {workDays.toFixed(1)}d
                      </span>
                      <span className="text-[10px] text-slate-500">Dias Úteis</span>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                      <span className="text-sm font-black text-white block">
                        {monthsToFinish.toFixed(1)}m
                      </span>
                      <span className="text-[10px] text-slate-500">Meses de Aporte</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    Considerando seus custos fixos de {FinancialEngine.formatCurrency(essentialExpensesTotal)}, cada hora trabalhada rende {FinancialEngine.formatCurrency(realHourlyRate)} de dinheiro 100% livre.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-200">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    Equivale a {savingsHoursEquiv} horas de independência e segurança financeira.
                  </span>
                </div>
              )}

              {/* Progress Bar & Amount */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">
                    Guardado: {FinancialEngine.formatCurrency(goal.currentAmount)} ({percent}%)
                  </span>
                  <span className="text-emerald-400">
                    Faltam {FinancialEngine.formatCurrency(remaining)}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>

              {/* Contribute Button */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setContributeGoalId(goal.id);
                    setContributeAmount('300');
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  {isPurchase ? 'Guardar para Compra' : 'Aportar na Poupança'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Add Goal Button (+) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform"
        title="Criar Nova Meta"
        aria-label="Criar nova meta"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Create Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Criar Nova Meta</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem de Férias, Carro..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Valor Alvo (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="5000.00"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Já Guardado (R$)
                  </label>
                  <input
                    type="text"
                    value={newInitial}
                    onChange={(e) => setNewInitial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Aporte Mensal (R$)
                  </label>
                  <input
                    type="text"
                    value={newContribution}
                    onChange={(e) => setNewContribution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tipo da Meta
                </label>
                <select
                  value={newGoalType}
                  onChange={(e) => setNewGoalType(e.target.value as GoalType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                >
                  <option value="PURCHASE">🛒 Meta de Compra (Desconta custos fixos)</option>
                  <option value="SAVINGS">🏦 Poupança / Reserva de Emergência</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Contribute Modal */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setContributeGoalId(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Registrar Aporte</h3>
            <form onSubmit={handleContributeSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Valor a Guardar (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="300.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2"
              >
                Confirmar Aporte
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
