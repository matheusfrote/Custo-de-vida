import React, { useState } from 'react';
import {
  LayoutGrid,
  Clock,
  DollarSign,
  Shield,
  ShoppingBag,
  Plus,
  Trash2,
  Coffee,
  Utensils,
  Footprints,
  Smartphone,
  Laptop,
  CheckCircle,
  X,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';

export const PainelScreen: React.FC = () => {
  const {
    profile,
    expenses,
    addExpense,
    deleteExpense,
    essentialExpensesTotal,
    fixedExpensesTotal,
    metrics,
    setActiveTab,
    showToast,
    prefillCalculator,
  } = useApp();

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Moradia');
  const [isEssential, setIsEssential] = useState(true);

  const hourlyRate = FinancialEngine.calculateHourlyRate(
    profile.netSalary,
    profile.weeklyHours,
    profile.divisorType
  );

  const freeIncome = Math.max(0, profile.netSalary - fixedExpensesTotal);
  const fixedCostWeeks = hourlyRate > 0 ? fixedExpensesTotal / (hourlyRate * profile.weeklyHours) : 0;
  const freeIncomeWeeks = hourlyRate > 0 ? freeIncome / (hourlyRate * profile.weeklyHours) : 0;

  // Practical examples (Screenshot 7)
  const practicalExamples = [
    { name: 'Café', icon: Coffee, price: 15, category: 'Lazer' },
    { name: 'Almoço', icon: Utensils, price: 80, category: 'Lazer' },
    { name: 'Tênis', icon: Footprints, price: 350, category: 'Vestuário' },
    { name: 'Smartphone', icon: Smartphone, price: 2500, category: 'Tecnologia' },
    { name: 'Notebook', icon: Laptop, price: 4800, category: 'Tecnologia' },
  ];

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = FinancialEngine.parseCurrencyInput(expenseAmount);
    if (!expenseName.trim() || amount <= 0) {
      showToast('Preencha o nome e um valor válido.');
      return;
    }

    addExpense({
      name: expenseName.trim(),
      amount,
      category: expenseCategory,
      isEssential,
    });

    setExpenseName('');
    setExpenseAmount('');
    setIsAddExpenseModalOpen(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner Header (Screenshot 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-2 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Painel de Controle
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          Seu Painel de Vida
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Monitore horas trabalhadas para bancar seu estilo de vida, gastos fixos e conquistas financeiras.
        </p>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Tempo Analisado */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Tempo Analisado</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.totalAnalyzedHours}h
          </div>
          <span className="text-[11px] text-slate-500 block">
            {metrics.totalAnalyzedDays} dias de vida
          </span>
        </div>

        {/* Total em Reais */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Total em Reais</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
            {FinancialEngine.formatCurrency(metrics.totalAnalyzedMoney)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {metrics.totalAnalyzedCount} análises feitas
          </span>
        </div>

        {/* Taxa de Vitória */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Taxa de Vitória</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {metrics.winRatePercent}%
          </div>
          <span className="text-[11px] text-slate-500 block">
            Decisões de desistência
          </span>
        </div>

        {/* Compras Feitas */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Compras Feitas</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.purchasedCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {FinancialEngine.formatCurrency(metrics.purchasedTotalMoney)}
          </span>
        </div>
      </div>

      {/* Economia Real por Decisão Consciente Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Shield className="w-6 h-6" />
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
            Economia Real por Decisão Consciente
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {FinancialEngine.formatCurrency(metrics.totalSaved)}
          </div>
          <span className="text-xs text-slate-400 block">
            {metrics.hoursPreserved.toFixed(0)} horas de vida salvas • {metrics.impulsePurchasesAvoided} compras evitadas
          </span>
        </div>
      </div>

      {/* Exemplos Práticos com Sua Hora Atual (Screenshot 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-white">
            Exemplos Práticos com Sua Hora Atual
          </h3>
          <p className="text-[11px] text-slate-400">
            Baseado na sua hora líquida de {FinancialEngine.formatCurrency(hourlyRate)}:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {practicalExamples.map((item, idx) => {
            const Icon = item.icon;
            const time = FinancialEngine.formatWorkTime(item.price / (hourlyRate || 1));
            return (
              <button
                key={idx}
                onClick={() => {
                  prefillCalculator(item.name, item.price, item.category);
                  showToast(`Calculando ${item.name}: ${FinancialEngine.formatCurrency(item.price)}`);
                }}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-2xl p-3 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    {item.name}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-xs text-slate-500">
                  {FinancialEngine.formatCurrency(item.price)}
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  {time.formatted}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custos Fixos & Liberdade Financeira (Screenshot 8) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white">
            Custos Fixos & Liberdade Financeira
          </h3>
          <p className="text-xs text-slate-400">
            Quantas horas da sua jornada mensal já estão comprometidas antes de você gastar 1 centavo livre.
          </p>
        </div>

        {/* Summary Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Custos Fixos</span>
              <span className="text-sm font-bold text-white">
                {FinancialEngine.formatCurrency(fixedExpensesTotal)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                ({fixedCostWeeks.toFixed(1)} semanas de trabalho)
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Renda Livre</span>
              <span className="text-sm font-bold text-emerald-400">
                {FinancialEngine.formatCurrency(freeIncome)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                ({freeIncomeWeeks.toFixed(1)} semanas de trabalho)
              </span>
            </div>
          </div>

          {/* Progress Bar of Committed Salary */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="h-full bg-slate-500"
              style={{
                width: `${Math.min(100, profile.netSalary > 0 ? (fixedExpensesTotal / profile.netSalary) * 100 : 0)}%`,
              }}
              title="Custos Fixos"
            />
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${Math.max(0, 100 - (profile.netSalary > 0 ? (fixedExpensesTotal / profile.netSalary) * 100 : 0))}%`,
              }}
              title="Renda Livre"
            />
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          {expenses.map((expense) => {
            const effort = FinancialEngine.formatExpenseWorkEffort(
              expense.amount,
              hourlyRate,
              profile.weeklyHours
            );

            return (
              <div
                key={expense.id}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{expense.name}</h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className={expense.isEssential ? 'text-emerald-400/90' : 'text-slate-400'}>
                      {expense.isEssential ? 'Essencial' : 'Opcional'}
                    </span>
                    <span>•</span>
                    <span>{effort}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-white">
                    {FinancialEngine.formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-slate-600 hover:text-rose-400 p-1"
                    title="Remover despesa"
                    aria-label={`Remover despesa ${expense.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Adicionar Custo Fixo
        </button>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Adicionar Custo Fixo</h3>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel, Internet, Seguro..."
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Valor Mensal (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="500.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                >
                  <option value="Moradia">Moradia</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Utilidades">Utilidades</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isEss"
                  checked={isEssential}
                  onChange={(e) => setIsEssential(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <label htmlFor="isEss" className="text-xs text-slate-300">
                  Despesa essencial (obrigatória para viver)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2"
              >
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
