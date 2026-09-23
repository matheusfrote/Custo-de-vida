import React, { useState } from 'react';
import {
  Scale,
  FolderPlus,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';

export const ComparatorScreen: React.FC = () => {
  const {
    comparisonFolders,
    createComparisonFolder,
    deleteComparisonFolder,
    addProductToComparison,
    deleteProductFromComparison,
    profile,
    showToast,
    prefillCalculator,
  } = useApp();

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState('Celulares');

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodLifespan, setProdLifespan] = useState('24');
  const [prodRating, setProdRating] = useState('4.5');

  const hourlyRate = FinancialEngine.calculateHourlyRate(
    profile.netSalary,
    profile.weeklyHours,
    profile.divisorType
  );

  const handleCreateFolder = (name: string, category: string) => {
    createComparisonFolder(name, category);
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolderId) return;
    const price = FinancialEngine.parseCurrencyInput(prodPrice);
    const lifespan = parseInt(prodLifespan, 10) || 12;
    const rating = parseFloat(prodRating.replace(',', '.')) || 4.0;

    if (!prodName.trim() || price <= 0) {
      showToast('Preencha o nome e um preço válido.');
      return;
    }

    addProductToComparison(activeFolderId, {
      name: prodName.trim(),
      price,
      rating,
      lifespanMonths: lifespan,
      pros: [],
      cons: [],
    });

    setProdName('');
    setProdPrice('');
    setIsAddProductModalOpen(false);
  };

  const selectedFolder = comparisonFolders.find((f) => f.id === activeFolderId) || comparisonFolders[0];

  // Compute difference between best and most expensive if multiple items
  let comparisonSummary: { diffPrice: number; diffHours: number; bestName: string } | null = null;
  if (selectedFolder && selectedFolder.products.length >= 2) {
    const sortedByPrice = [...selectedFolder.products].sort((a, b) => a.price - b.price);
    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
    const diffPrice = mostExpensive.price - cheapest.price;
    const diffHours = hourlyRate > 0 ? diffPrice / hourlyRate : 0;
    const bestValue = selectedFolder.products.find((p) => p.isBestValue) || cheapest;
    comparisonSummary = {
      diffPrice,
      diffHours,
      bestName: bestValue.name,
    };
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 text-center space-y-2 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400">
          <Scale className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Comparador de Decisão
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          Compare Opções por Tempo de Vida
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Descubra quanto em % e em horas, dias, semanas ou meses a mais ou a menos você terá que trabalhar se escolher determinado produto.
        </p>
      </div>

      {/* Empty State (Screenshot 3) */}
      {comparisonFolders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
            <FolderPlus className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">Nenhuma Comparação Criada</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Crie uma comparação para agrupar as opções que você está em dúvida — por exemplo: 'Celulares', 'Blusas', 'Notebooks' ou 'Carros'.
            </p>
          </div>

          <div className="pt-1">
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Criar Comparação
            </button>
          </div>

          {/* Examples chips */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] text-slate-500 block">
              Exemplos de comparações que você pode criar:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleCreateFolder('Celulares', 'Tecnologia')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors"
              >
                📱 Celulares
              </button>
              <button
                onClick={() => handleCreateFolder('Blusas', 'Vestuário')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors"
              >
                👕 Blusas
              </button>
              <button
                onClick={() => handleCreateFolder('Notebooks', 'Tecnologia')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors"
              >
                💻 Notebooks
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Criar Comparação
            </button>
          </div>
        </div>
      ) : (
        /* Folder Active View */
        <div className="space-y-4">
          {/* Folder Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {comparisonFolders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolderId(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  (selectedFolder?.id === f.id)
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{f.name}</span>
                <span className="text-[10px] opacity-75">({f.products.length})</span>
              </button>
            ))}
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova
            </button>
          </div>

          {selectedFolder && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedFolder.name}</h3>
                  <span className="text-[11px] text-slate-500">{selectedFolder.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveFolderId(selectedFolder.id);
                      setIsAddProductModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Opção
                  </button>
                  <button
                    onClick={() => deleteComparisonFolder(selectedFolder.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    title="Excluir comparação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Summary Insight banner if 2+ products */}
              {comparisonSummary && comparisonSummary.diffPrice > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Destaque Comparativo</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Optando pela melhor alternativa em relação à opção mais cara, você economiza{' '}
                    <strong className="text-emerald-400 font-bold">
                      {FinancialEngine.formatCurrency(comparisonSummary.diffPrice)}
                    </strong>{' '}
                    (equivalente a{' '}
                    <strong className="text-white font-bold">
                      {FinancialEngine.formatWorkTime(comparisonSummary.diffHours).formatted}
                    </strong>{' '}
                    de vida poupados).
                  </p>
                </div>
              )}

              {selectedFolder.products.length === 0 ? (
                <div className="bg-slate-950 rounded-2xl p-6 text-center space-y-2 border border-slate-800/80">
                  <p className="text-xs text-slate-400">Nenhum produto cadastrado neste grupo.</p>
                  <button
                    onClick={() => {
                      setActiveFolderId(selectedFolder.id);
                      setIsAddProductModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar primeira opção
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedFolder.products.map((p) => {
                    const time = FinancialEngine.formatWorkTime(p.workHours);
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          p.isBestValue
                            ? 'bg-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{p.name}</h4>
                              {p.isBestValue && (
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  Melhor Custo-Benefício
                                </span>
                              )}
                            </div>
                            <span className="text-base font-black text-emerald-400 block mt-1">
                              {FinancialEngine.formatCurrency(p.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                prefillCalculator(p.name, p.price, selectedFolder.category);
                                showToast(`Carregado no conversor: ${p.name}`);
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                              title="Calcular detalhes deste produto"
                            >
                              <Clock className="w-3 h-3 text-emerald-400" />
                              Calcular
                            </button>
                            <button
                              onClick={() => deleteProductFromComparison(selectedFolder.id, p.id)}
                              className="text-slate-600 hover:text-rose-400 p-1"
                              aria-label={`Excluir produto ${p.name} da comparação`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-medium">
                              Tempo de Trabalho
                            </span>
                            <span className="font-bold text-slate-200">{time.formatted}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-medium">
                              Custo por Mês de Uso
                            </span>
                            <span className="font-bold text-emerald-400">
                              {FinancialEngine.formatCurrency(p.costPerMonth)}/mês
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({p.lifespanMonths} meses de vida útil)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsNewFolderModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Criar Comparação</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tênis de Corrida, Celulares..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={newFolderCategory}
                  onChange={(e) => setNewFolderCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                >
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Celulares">Celulares</option>
                  <option value="Vestuário">Vestuário</option>
                  <option value="Casa">Casa</option>
                  <option value="Automóveis">Automóveis</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newFolderName.trim()) {
                    showToast('Digite um nome para a comparação.');
                    return;
                  }
                  handleCreateFolder(newFolderName.trim(), newFolderCategory);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Salvar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product to Comparison Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Adicionar Opção para Comparar</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nome do Modelo / Produto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 15 ou Galaxy S24"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="3499.00"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Durabilidade Estimada
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="24 meses"
                    value={prodLifespan}
                    onChange={(e) => setProdLifespan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nota Pessoal (1 a 5)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    value={prodRating}
                    onChange={(e) => setProdRating(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2"
              >
                Adicionar à Comparação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
