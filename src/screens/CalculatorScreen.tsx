import React, { useState } from 'react';
import {
  Hourglass,
  ShoppingBag,
  Calculator,
  Link as LinkIcon,
  CheckCircle,
  Shield,
  Clock,
  Calendar,
  Percent,
  Sparkles,
  TrendingDown,
  X,
  Share2,
  CreditCard,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';
import { CalculationResult } from '../types';

export const CalculatorScreen: React.FC = () => {
  const { profile, essentialExpensesTotal, setActiveTab, addAnalysis, showToast, consumePrefill } = useApp();

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('2499.00');
  const [category, setCategory] = useState('Tecnologia');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [reflectionHours, setReflectionHours] = useState(48);
  const [showInstallments, setShowInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(10);
  const [monthlyInterest, setMonthlyInterest] = useState(0);

  // Check for prefill on mount / activation
  React.useEffect(() => {
    const prefill = consumePrefill();
    if (prefill) {
      setProductName(prefill.name);
      setProductPrice(prefill.price.toFixed(2));
      if (prefill.category) setCategory(prefill.category);
      const result = FinancialEngine.calculatePurchase(
        prefill.price,
        profile,
        essentialExpensesTotal
      );
      setCalculation(result);
    }
  }, [consumePrefill, profile, essentialExpensesTotal]);

  const hourlyRate = FinancialEngine.calculateHourlyRate(
    profile.netSalary,
    profile.weeklyHours,
    profile.divisorType
  );

  const categories = [
    'Tecnologia',
    'Casa',
    'Automóveis',
    'Viagens',
    'Lazer',
    'Vestuário',
    'Outros',
  ];

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const priceNum = FinancialEngine.parseCurrencyInput(productPrice);
    if (priceNum <= 0) {
      showToast('Digite um preço válido maior que zero.');
      return;
    }

    const result = FinancialEngine.calculatePurchase(
      priceNum,
      profile,
      essentialExpensesTotal
    );
    setCalculation(result);
  };

  const handleDecision = (decision: 'PURCHASED' | 'GIVEN_UP' | 'PENDING', hours: number = reflectionHours) => {
    if (!calculation) return;
    const nameToSave = productName.trim() || 'Produto Calculado';
    const id = addAnalysis({
      productName: nameToSave,
      category,
      price: calculation.productPrice,
      workHours: calculation.workHours,
      workMinutes: calculation.workMinutes,
      workDays: calculation.workDays,
      percentageOfSalary: calculation.percentageOfSalary,
      percentageOfFreeIncome: calculation.percentageOfDisposableIncome,
      decision,
      reflectionUntil: decision === 'PENDING' ? Date.now() + hours * 3600 * 1000 : null,
      isFavorite: false,
    });
    setLastSavedId(id);
    if (decision === 'GIVEN_UP') {
      showToast('Parabéns! Você evitou um gasto e preservou seu tempo de vida.');
    } else if (decision === 'PURCHASED') {
      showToast('Compra registrada no histórico!');
    } else {
      showToast(`Reflexão ativada por ${hours} horas.`);
    }
  };

  const handlePasteLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    const parsed = FinancialEngine.parseStoreUrl(linkInput.trim());
    setProductName(parsed.name);
    setCategory(parsed.category);
    if (parsed.price && parsed.price > 0) {
      setProductPrice(parsed.price.toFixed(2));
    }
    setIsLinkModalOpen(false);
    setLinkInput('');
    showToast(`Identificado: "${parsed.name}" (${parsed.detectedStore})`);
  };

  const handleShareResult = async () => {
    if (!calculation) return;
    const nameStr = productName.trim() || 'este produto';
    const text = `💡 Descobri que ${nameStr} (${FinancialEngine.formatCurrency(calculation.productPrice)}) equivale a ${calculation.timeScaleFormatted} (${FinancialEngine.formatDaysAndHours(calculation.workHours + calculation.workMinutes / 60)}) da minha vida trabalhando! Calcule o seu em: https://ais-dev-rvfjritif2lrbmppj6wl6a-779336876744.us-east1.run.app/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Custo de Vida - Calculadora de Tempo de Trabalho',
          text,
          url: 'https://ais-dev-rvfjritif2lrbmppj6wl6a-779336876744.us-east1.run.app/',
        });
        showToast('Compartilhado com sucesso!');
        return;
      } catch {
        // user cancelled or share failed, fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Cálculo copiado! Cole no WhatsApp ou redes sociais.');
    } else {
      showToast('Resultado pronto para envio!');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 text-center space-y-2.5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400">
          <Hourglass className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Conversor de Preço em Tempo
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          QUANTO DA SUA VIDA ISSO CUSTA?
        </h1>

        {/* Hourly Rate Pill */}
        <div className="pt-1">
          <button
            onClick={() => setActiveTab('config')}
            className="inline-flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-950 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400 hover:border-emerald-500/60 transition-all"
          >
            <span>⚡ Sua hora líquida: {FinancialEngine.formatCurrency(hourlyRate)}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 underline underline-offset-2">Configurar</span>
          </button>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <form onSubmit={handleCalculate} className="space-y-4">
          {/* Product Name Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="O que você quer comprar? (opcional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Product Price Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Preço do Produto
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="2499.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Categoria:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Installment Simulator Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowInstallments(!showInstallments)}
              className="w-full flex items-center justify-between bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-xs">Simular Parcelamento & Juros</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">
                {showInstallments ? 'Ocultar' : 'Configurar'}
              </span>
            </button>

            {showInstallments && (
              <div className="mt-2.5 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Nº de Parcelas
                    </label>
                    <select
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? '1x à vista' : `${n}x`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Juros (% a.m.)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={monthlyInterest}
                      onChange={(e) => setMonthlyInterest(Math.max(0, Number(e.target.value)))}
                      placeholder="0.0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setMonthlyInterest(0)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      monthlyInterest === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    Sem Juros (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthlyInterest(1.99)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      monthlyInterest === 1.99
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    1.99% a.m.
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthlyInterest(2.99)}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      monthlyInterest === 2.99
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    2.99% a.m.
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcular Meu Tempo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Colar Link de Loja (Amazon, ML, etc.)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Card (Screenshot 2) */}
      {calculation && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-center space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">
              {FinancialEngine.formatCurrency(calculation.productPrice)}
            </span>
            <span className="text-xs text-slate-500 block">=</span>
            <div className="text-4xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
              {calculation.timeScaleFormatted}
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Do seu tempo de vida trabalhando
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-0.5">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {FinancialEngine.formatDaysAndHours(calculation.workHours + calculation.workMinutes / 60)}
              </span>
              <span className="text-[10px] text-slate-500 block">Jornada</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-0.5">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {calculation.percentageOfSalary.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block">% Salário</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-0.5">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {calculation.workWeeksFree.toFixed(1)} semanas
              </span>
              <span className="text-[10px] text-slate-500 block">Renda Livre</span>
            </div>
          </div>

          {/* Interpretação do Impacto Real */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>💡</span>
              Interpretação do Impacto Real
            </h4>
            <div className="space-y-1 text-xs text-slate-300">
              {calculation.summaryBullets.map((bullet, idx) => (
                <p key={idx} className="leading-relaxed">
                  {bullet}
                </p>
              ))}
            </div>
          </div>

          {/* Análise de Parcelamento & Juros */}
          {showInstallments && installmentCount > 1 && (() => {
            const installmentInfo = FinancialEngine.calculateInstallments(
              calculation.productPrice,
              installmentCount,
              monthlyInterest
            );
            const instHours = hourlyRate > 0 ? installmentInfo.installmentValue / hourlyRate : 0;
            const intHours = hourlyRate > 0 ? installmentInfo.totalInterest / hourlyRate : 0;

            return (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Parcelamento em {installmentCount}x
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    {FinancialEngine.formatCurrency(installmentInfo.installmentValue)}/mês
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <p>
                    Cada parcela compromete <strong>{FinancialEngine.formatWorkTime(instHours).formatted}</strong> todo mês.
                  </p>
                  {installmentInfo.totalInterest > 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-rose-300 space-y-0.5 mt-2">
                      <div className="flex items-center gap-1 font-bold text-xs text-rose-400">
                        <Flame className="w-3.5 h-3.5" />
                        Custo Oculto dos Juros ({monthlyInterest}% a.m.):
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Você pagará <strong>+{FinancialEngine.formatCurrency(installmentInfo.totalInterest)}</strong> a mais no total.
                        Isso exige <strong>+{FinancialEngine.formatWorkTime(intHours).formatted} de trabalho adicional</strong> só para cobrir os juros!
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                      ✓ Parcelamento sem juros adicionais.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Decision Buttons */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDecision('PURCHASED')}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Comprar
              </button>

              <button
                type="button"
                onClick={() => handleDecision('GIVEN_UP')}
                className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Desistir (Salvar)
              </button>
            </div>

            {/* Reflection Selector and Button */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Quarentena Anti-Impulso
                </span>
                <div className="flex items-center gap-1">
                  {[24, 48, 72, 168].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setReflectionHours(h)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        reflectionHours === h
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {h === 168 ? '7d' : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDecision('PENDING', reflectionHours)}
                className="w-full py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                Ativar Quarentena ({reflectionHours === 168 ? '7 dias' : `${reflectionHours}h`})
              </button>
            </div>

            {/* Share Result Button */}
            <button
              type="button"
              onClick={handleShareResult}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-400 transition-colors flex items-center justify-center gap-2"
              aria-label="Compartilhar análise de custo de vida"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar Resultado
            </button>
          </div>
        </div>
      )}

      {/* Paste Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              Colar Link de Loja
            </h3>
            <p className="text-xs text-slate-400">
              Cole o link do produto na Amazon, Mercado Livre ou outra loja para preenchimento rápido.
            </p>
            <form onSubmit={handlePasteLink} className="space-y-3">
              <input
                type="url"
                required
                placeholder="https://www.mercadolivre.com.br/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Importar Produto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
