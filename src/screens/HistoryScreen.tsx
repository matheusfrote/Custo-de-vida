import React, { useState } from 'react';
import {
  Shield,
  Search,
  Heart,
  Clock,
  RotateCcw,
  Share2,
  Trash2,
  CheckCircle,
  Tag,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';

export const HistoryScreen: React.FC = () => {
  const {
    history,
    updateDecision,
    deleteAnalysis,
    toggleFavorite,
    metrics,
    setActiveTab,
    showToast,
    prefillCalculator,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'ALL' | 'PURCHASED' | 'GIVEN_UP' | 'PENDING' | 'FAVORITES'
  >('ALL');

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'PURCHASED') return item.decision === 'PURCHASED';
    if (filterType === 'GIVEN_UP') return item.decision === 'GIVEN_UP';
    if (filterType === 'PENDING') return item.decision === 'PENDING';
    if (filterType === 'FAVORITES') return item.isFavorite;

    return true;
  });

  const handleShare = (item: (typeof history)[0]) => {
    if (navigator.share) {
      navigator.share({
        title: item.productName,
        text: `Descobri que o produto ${item.productName} custa ${item.workHours}h ${item.workMinutes}min da minha vida trabalhando no app Custo de Vida!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `O produto ${item.productName} (${FinancialEngine.formatCurrency(item.price)}) custa ${item.workHours}h ${item.workMinutes}min de trabalho!`
      );
      showToast('Cálculo copiado para a área de transferência!');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner (Screenshot 4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Shield className="w-6 h-6" />
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
            Tempo Preservado (Desistências)
          </span>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {metrics.hoursPreserved.toFixed(0)} horas de vida salvas
          </div>
          <span className="text-xs text-slate-400 block">
            {FinancialEngine.formatCurrency(metrics.totalSaved)} não gastos em compras por impulso
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar análises..."
          aria-label="Buscar análises no histórico"
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
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
          Todos
        </button>

        <button
          onClick={() => setFilterType('PURCHASED')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'PURCHASED'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Comprei
        </button>

        <button
          onClick={() => setFilterType('GIVEN_UP')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'GIVEN_UP'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Desisti
        </button>

        <button
          onClick={() => setFilterType('PENDING')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'PENDING'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Reflexão
        </button>

        <button
          onClick={() => setFilterType('FAVORITES')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'FAVORITES'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Favoritos
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">Nenhuma análise encontrada neste filtro.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isReflecting = item.decision === 'PENDING';
            const isPurchased = item.decision === 'PURCHASED';
            const isGivenUp = item.decision === 'GIVEN_UP';

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl transition-all"
              >
                {/* Header row: category, date, favorite */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(item.id)}
                    aria-label={item.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`p-1 transition-colors ${
                      item.isFavorite ? 'text-rose-500' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Title, price, work time, and status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {item.productName}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                      {item.workHours}h {item.workMinutes}min de trabalho
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white block">
                      {FinancialEngine.formatCurrency(item.price)}
                    </span>
                    {isReflecting && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {item.reflectionUntil && Date.now() < item.reflectionUntil
                          ? `Refletindo (${Math.max(1, Math.ceil((item.reflectionUntil - Date.now()) / (3600 * 1000)))}h restantes)`
                          : 'Hora de Decidir!'}
                      </span>
                    )}
                    {isPurchased && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                        Comprei
                      </span>
                    )}
                    {isGivenUp && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Desisti (Salvo)
                      </span>
                    )}
                  </div>
                </div>

                {/* Reflection Decision Box (if pending) */}
                {isReflecting && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>💡</span>
                      {item.reflectionUntil && Date.now() >= item.reflectionUntil
                        ? 'Prazo de reflexão encerrado. Decida com calma:'
                        : 'Ainda quer comprar esse item?'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateDecision(item.id, 'PURCHASED')}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Comprar
                      </button>
                      <button
                        onClick={() => updateDecision(item.id, 'GIVEN_UP')}
                        className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-colors shadow-sm"
                      >
                        Desistir (Salvar)
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom row actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <button
                    onClick={() => {
                      prefillCalculator(item.productName, item.price, item.category);
                      showToast(`Carregado no conversor: ${item.productName}`);
                    }}
                    className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recalcular</span>
                  </button>

                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </button>

                  <button
                    onClick={() => deleteAnalysis(item.id)}
                    className="text-slate-600 hover:text-rose-400 p-1"
                    title="Excluir do histórico"
                    aria-label={`Excluir análise de ${item.productName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
