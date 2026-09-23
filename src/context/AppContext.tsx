import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveTab,
  FinancialProfileData,
  ExpenseItem,
  PurchaseAnalysisItem,
  SavingGoalItem,
  ComparisonFolderData,
  DashboardMetrics,
  UserAccount,
} from '../types';
import { FinancialEngine } from '../domain/financialEngine';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: FinancialProfileData;
  updateProfile: (data: Partial<FinancialProfileData>) => void;
  expenses: ExpenseItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;
  essentialExpensesTotal: number;
  fixedExpensesTotal: number;
  history: PurchaseAnalysisItem[];
  addAnalysis: (item: Omit<PurchaseAnalysisItem, 'id' | 'createdAt'>) => string;
  updateDecision: (id: string, decision: 'PURCHASED' | 'GIVEN_UP' | 'PENDING') => void;
  deleteAnalysis: (id: string) => void;
  toggleFavorite: (id: string) => void;
  goals: SavingGoalItem[];
  addGoal: (goal: Omit<SavingGoalItem, 'id' | 'createdAt'>) => void;
  contributeToGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  comparisonFolders: ComparisonFolderData[];
  createComparisonFolder: (name: string, category: string) => void;
  deleteComparisonFolder: (id: string) => void;
  addProductToComparison: (folderId: string, product: { name: string; price: number; rating: number; lifespanMonths: number; pros: string[]; cons: string[] }) => void;
  deleteProductFromComparison: (folderId: string, productId: string) => void;
  metrics: DashboardMetrics;
  user: UserAccount;
  setUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  calculatorPrefill: { name: string; price: number; category?: string } | null;
  prefillCalculator: (name: string, price: number, category?: string) => void;
  consumePrefill: () => { name: string; price: number; category?: string } | null;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => void;
  exportCsvReport: () => void;
  clearAllData: () => void;
}

const STORAGE_KEY = 'custo_de_vida_app_v3';

const defaultProfile: FinancialProfileData = {
  id: 'default',
  grossSalary: 6200,
  netSalary: 5000,
  weeklyHours: 40,
  daysPerWeek: 5,
  divisorType: 'REAL', // 52 / 12 = 4.33 weeks -> 173.3h/month -> R$ 28,85/h
  currency: 'BRL',
};

const defaultExpenses: ExpenseItem[] = [
  { id: '1', name: 'Aluguel / Condomínio', amount: 1600, category: 'Moradia', isEssential: true },
  { id: '2', name: 'Supermercado & Alimentação', amount: 950, category: 'Alimentação', isEssential: true },
  { id: '3', name: 'Transporte & Combustível', amount: 350, category: 'Transporte', isEssential: true },
  { id: '4', name: 'Conta de Luz', amount: 180, category: 'Utilidades', isEssential: true },
  { id: '5', name: 'Streamings & Assinaturas', amount: 150, category: 'Lazer', isEssential: false },
  { id: '6', name: 'Internet Fibra', amount: 120, category: 'Serviços', isEssential: true },
  { id: '7', name: 'Água & Esgoto', amount: 85, category: 'Utilidades', isEssential: true },
  { id: '8', name: 'Plano Celular', amount: 65, category: 'Serviços', isEssential: true },
];

const defaultHistory: PurchaseAnalysisItem[] = [
  {
    id: 'h1',
    productName: 'Smartwatch Esportivo',
    category: 'Lazer',
    price: 1200,
    workHours: 42,
    workMinutes: 14,
    workDays: 5.3,
    percentageOfSalary: 24.0,
    percentageOfFreeIncome: 72.7,
    decision: 'PENDING',
    reflectionUntil: Date.now() + 48 * 3600 * 1000,
    isFavorite: true,
    createdAt: Date.now() - 1 * 24 * 3600 * 1000,
  },
  {
    id: 'h2',
    productName: 'Notebook Dell Inspiron',
    category: 'Tecnologia',
    price: 4500,
    workHours: 158,
    workMinutes: 24,
    workDays: 19.8,
    percentageOfSalary: 90.0,
    percentageOfFreeIncome: 272.7,
    decision: 'PURCHASED',
    reflectionUntil: null,
    isFavorite: false,
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
  },
  {
    id: 'h3',
    productName: 'Drone 4K Pro',
    category: 'Tecnologia',
    price: 3200,
    workHours: 112,
    workMinutes: 0,
    workDays: 14.0,
    percentageOfSalary: 64.0,
    percentageOfFreeIncome: 193.9,
    decision: 'GIVEN_UP',
    reflectionUntil: null,
    isFavorite: false,
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
  },
];

const defaultGoals: SavingGoalItem[] = [
  {
    id: 'g1',
    title: 'Smartphone Top de Linha',
    targetAmount: 4200,
    currentAmount: 1200,
    monthlyContribution: 400,
    goalType: 'PURCHASE',
    category: 'Eletrônicos',
    createdAt: Date.now() - 10 * 24 * 3600 * 1000,
  },
  {
    id: 'g2',
    title: 'Reserva de Emergência',
    targetAmount: 15000,
    currentAmount: 4500,
    monthlyContribution: 750,
    goalType: 'SAVINGS',
    category: 'Segurança',
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calcular');
  const [profile, setProfile] = useState<FinancialProfileData>(defaultProfile);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(defaultExpenses);
  const [history, setHistory] = useState<PurchaseAnalysisItem[]>(defaultHistory);
  const [goals, setGoals] = useState<SavingGoalItem[]>(defaultGoals);
  const [comparisonFolders, setComparisonFolders] = useState<ComparisonFolderData[]>([]);
  const [user, setUser] = useState<UserAccount>({
    name: 'Convidado',
    email: '',
    isLoggedIn: false,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [calculatorPrefill, setCalculatorPrefill] = useState<{ name: string; price: number; category?: string } | null>(null);

  const prefillCalculator = (name: string, price: number, category?: string) => {
    setCalculatorPrefill({ name, price, category });
    setActiveTab('calcular');
  };

  const consumePrefill = () => {
    const current = calculatorPrefill;
    setCalculatorPrefill(null);
    return current;
  };

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.expenses && parsed.expenses.length > 0) setExpenses(parsed.expenses);
        if (parsed.history && parsed.history.length > 0) setHistory(parsed.history);
        if (parsed.goals && parsed.goals.length > 0) setGoals(parsed.goals);
        if (parsed.comparisonFolders) setComparisonFolders(parsed.comparisonFolders);
        if (parsed.user) setUser(parsed.user);
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
  }, []);

  // Save to local storage & optional background sync
  useEffect(() => {
    try {
      const payload = {
        profile,
        expenses,
        history,
        goals,
        comparisonFolders,
        user,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      if (typeof window !== 'undefined' && 'fetch' in window) {
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {
          // Server offline or not configured: silent fallback to localStorage
        });
      }
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [profile, expenses, history, goals, comparisonFolders, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  const updateProfile = (data: Partial<FinancialProfileData>) => {
    setProfile((prev) => ({ ...prev, ...data }));
    showToast('Base salarial e tempo atualizados!');
  };

  const addExpense = (expenseData: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...expenseData,
      id: 'exp_' + Date.now(),
    };
    setExpenses((prev) => [...prev, newExp]);
    showToast(`Despesa "${newExp.name}" adicionada.`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Despesa removida.');
  };

  const essentialExpensesTotal = expenses
    .filter((e) => e.isEssential)
    .reduce((sum, item) => sum + item.amount, 0);

  const fixedExpensesTotal = expenses.reduce((sum, item) => sum + item.amount, 0);

  const addAnalysis = (itemData: Omit<PurchaseAnalysisItem, 'id' | 'createdAt'>) => {
    const id = 'analysis_' + Date.now();
    const newItem: PurchaseAnalysisItem = {
      ...itemData,
      id,
      createdAt: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev]);
    return id;
  };

  const updateDecision = (id: string, decision: 'PURCHASED' | 'GIVEN_UP' | 'PENDING') => {
    setHistory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            decision,
            reflectionUntil: decision === 'PENDING' ? item.reflectionUntil : null,
          };
        }
        return item;
      })
    );
    if (decision === 'GIVEN_UP') {
      showToast('Parabéns! Você evitou um gasto e preservou seu tempo de vida.');
    } else if (decision === 'PURCHASED') {
      showToast('Compra registrada no histórico com sucesso.');
    } else {
      showToast('Item colocado em reflexão.');
    }
  };

  const deleteAnalysis = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Análise excluída do histórico.');
  };

  const toggleFavorite = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const addGoal = (goalData: Omit<SavingGoalItem, 'id' | 'createdAt'>) => {
    const newGoal: SavingGoalItem = {
      ...goalData,
      id: 'goal_' + Date.now(),
      createdAt: Date.now(),
    };
    setGoals((prev) => [...prev, newGoal]);
    showToast(`Meta "${newGoal.title}" criada.`);
  };

  const contributeToGoal = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === id) {
          const newCurrent = Math.min(goal.targetAmount, goal.currentAmount + amount);
          return { ...goal, currentAmount: newCurrent };
        }
        return goal;
      })
    );
    showToast(`Aporte de ${FinancialEngine.formatCurrency(amount)} registrado!`);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    showToast('Meta removida.');
  };

  const createComparisonFolder = (name: string, category: string) => {
    const newFolder: ComparisonFolderData = {
      id: 'comp_' + Date.now(),
      name,
      category,
      products: [],
      createdAt: Date.now(),
    };
    setComparisonFolders((prev) => [...prev, newFolder]);
    showToast(`Comparação "${name}" criada.`);
  };

  const deleteComparisonFolder = (id: string) => {
    setComparisonFolders((prev) => prev.filter((f) => f.id !== id));
    showToast('Comparação removida.');
  };

  const addProductToComparison = (
    folderId: string,
    product: { name: string; price: number; rating: number; lifespanMonths: number; pros: string[]; cons: string[] }
  ) => {
    const hourlyRate = FinancialEngine.calculateHourlyRate(
      profile.netSalary,
      profile.weeklyHours,
      profile.divisorType
    );
    const workHours = hourlyRate > 0 ? product.price / hourlyRate : 0;
    const costPerMonth = product.lifespanMonths > 0 ? product.price / product.lifespanMonths : product.price;

    setComparisonFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const newProd = {
            id: 'prod_' + Date.now(),
            ...product,
            workHours,
            costPerMonth,
            score: (product.rating * 20) / (costPerMonth || 1),
            isBestValue: false,
          };
          const updated = [...f.products, newProd];
          let bestIdx = 0;
          let minMonthly = Infinity;
          updated.forEach((p, idx) => {
            if (p.costPerMonth < minMonthly) {
              minMonthly = p.costPerMonth;
              bestIdx = idx;
            }
          });
          const recomputed = updated.map((p, idx) => ({
            ...p,
            isBestValue: idx === bestIdx,
          }));
          return { ...f, products: recomputed };
        }
        return f;
      })
    );
    showToast('Opção adicionada à comparação.');
  };

  const deleteProductFromComparison = (folderId: string, productId: string) => {
    setComparisonFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const filtered = f.products.filter((p) => p.id !== productId);
          return { ...f, products: filtered };
        }
        return f;
      })
    );
  };

  // Metrics computation matching screenshot 7 & 4
  const givenUpItems = history.filter((i) => i.decision === 'GIVEN_UP');
  const purchasedItems = history.filter((i) => i.decision === 'PURCHASED');

  const totalSaved = givenUpItems.reduce((acc, i) => acc + i.price, 0);
  const hoursPreserved = givenUpItems.reduce((acc, i) => acc + (i.workHours + i.workMinutes / 60), 0);
  const impulsePurchasesAvoided = givenUpItems.length;

  const totalAnalyzedMoney = history.reduce((acc, i) => acc + i.price, 0);
  const totalAnalyzedHours = history.reduce((acc, i) => acc + (i.workHours + i.workMinutes / 60), 0);
  const totalAnalyzedDays = totalAnalyzedHours / 8;
  const totalAnalyzedCount = history.length;

  const purchasedCount = purchasedItems.length;
  const purchasedTotalMoney = purchasedItems.reduce((acc, i) => acc + i.price, 0);
  const winRatePercent =
    totalAnalyzedCount > 0 ? Math.round((impulsePurchasesAvoided / totalAnalyzedCount) * 100) : 0;

  const metrics: DashboardMetrics = {
    totalSaved,
    hoursPreserved,
    impulsePurchasesAvoided,
    totalAnalyzedHours: Math.round(totalAnalyzedHours),
    totalAnalyzedDays: Number(totalAnalyzedDays.toFixed(1)),
    totalAnalyzedMoney,
    totalAnalyzedCount,
    purchasedCount,
    purchasedTotalMoney,
    winRatePercent,
  };

  const exportBackupJson = () => {
    const data = {
      profile,
      expenses,
      history,
      goals,
      comparisonFolders,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custo-de-vida-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exportado com sucesso!');
  };

// Security Helpers: CSV Formula Injection & Prototype Pollution Sanitizers
function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function deepCleanObject<T>(input: T): T {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input.map((item) => deepCleanObject(item)) as unknown as T;
  }
  const clean = Object.create(null);
  for (const key of Object.keys(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = deepCleanObject((input as Record<string, unknown>)[key]);
  }
  return clean as T;
}

  const importBackupJson = (jsonString: string) => {
    try {
      const parsedRaw = JSON.parse(jsonString);
      if (!parsedRaw || typeof parsedRaw !== 'object') {
        throw new Error('Conteúdo não é um objeto JSON válido.');
      }
      const data = deepCleanObject(parsedRaw);

      if (data.profile && typeof data.profile === 'object') {
        setProfile({
          ...defaultProfile,
          ...data.profile,
          netSalary: Math.max(0, Math.min(Number(data.profile.netSalary) || 0, 100000000)),
          grossSalary: Math.max(0, Math.min(Number(data.profile.grossSalary) || 0, 100000000)),
          weeklyHours: Math.max(1, Math.min(Number(data.profile.weeklyHours) || 40, 168)),
          daysPerWeek: Math.max(1, Math.min(Number(data.profile.daysPerWeek) || 5, 7)),
        });
      }
      if (Array.isArray(data.expenses)) {
        const cleanExpenses = data.expenses
          .filter((e: any) => e && typeof e === 'object' && e.name)
          .map((e: any) => ({
            id: String(e.id || Math.random().toString(36).slice(2)),
            name: String(e.name).slice(0, 100),
            amount: Math.max(0, Math.min(Number(e.amount) || 0, 100000000)),
            category: String(e.category || 'Geral').slice(0, 50),
            isEssential: Boolean(e.isEssential),
          }));
        setExpenses(cleanExpenses);
      }
      if (Array.isArray(data.history)) {
        const cleanHistory = data.history
          .filter((h: any) => h && typeof h === 'object' && h.productName)
          .map((h: any) => ({
            id: String(h.id || Math.random().toString(36).slice(2)),
            productName: String(h.productName).slice(0, 150),
            category: String(h.category || 'Geral').slice(0, 50),
            price: Math.max(0, Math.min(Number(h.price) || 0, 100000000)),
            workHours: Math.max(0, Number(h.workHours) || 0),
            workMinutes: Math.max(0, Math.min(59, Number(h.workMinutes) || 0)),
            workDays: Math.max(0, Number(h.workDays) || 0),
            percentageOfSalary: Math.max(0, Number(h.percentageOfSalary) || 0),
            percentageOfFreeIncome: Math.max(0, Number(h.percentageOfFreeIncome) || 0),
            decision: ['PURCHASED', 'GIVEN_UP', 'PENDING'].includes(h.decision) ? h.decision : 'PENDING',
            reflectionUntil: typeof h.reflectionUntil === 'number' ? h.reflectionUntil : null,
            isFavorite: Boolean(h.isFavorite),
            createdAt: typeof h.createdAt === 'number' ? h.createdAt : Date.now(),
          }));
        setHistory(cleanHistory);
      }
      if (Array.isArray(data.goals)) setGoals(data.goals.filter((g: any) => g && typeof g === 'object' && g.title));
      if (Array.isArray(data.comparisonFolders)) setComparisonFolders(data.comparisonFolders);
      if (data.user && typeof data.user === 'object') {
        setUser({
          name: String(data.user.name || 'Convidado').slice(0, 60),
          email: String(data.user.email || '').slice(0, 100),
          isLoggedIn: Boolean(data.user.isLoggedIn),
        });
      }
      showToast('Dados restaurados com sucesso!');
    } catch {
      showToast('Arquivo de backup inválido.');
    }
  };

  const exportCsvReport = () => {
    const headers = 'ID,Produto,Categoria,Preço (R$),Horas de Trabalho,Status,Data\n';
    const rows = history
      .map((i) => {
        const id = sanitizeCsvValue(i.id);
        const name = sanitizeCsvValue(i.productName);
        const category = sanitizeCsvValue(i.category);
        const price = (Number(i.price) || 0).toFixed(2);
        const hours = sanitizeCsvValue(`${i.workHours}h ${i.workMinutes}min`);
        const decision = sanitizeCsvValue(i.decision);
        const date = sanitizeCsvValue(new Date(i.createdAt).toLocaleDateString('pt-BR'));
        return `${id},${name},${category},${price},${hours},${decision},${date}`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-custo-de-vida-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Relatório CSV exportado com segurança!');
  };

  const clearAllData = () => {
    setExpenses([]);
    setHistory([]);
    setGoals([]);
    setComparisonFolders([]);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Todos os dados locais foram apagados.');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        updateProfile,
        expenses,
        addExpense,
        deleteExpense,
        essentialExpensesTotal,
        fixedExpensesTotal,
        history,
        addAnalysis,
        updateDecision,
        deleteAnalysis,
        toggleFavorite,
        goals,
        addGoal,
        contributeToGoal,
        deleteGoal,
        comparisonFolders,
        createComparisonFolder,
        deleteComparisonFolder,
        addProductToComparison,
        deleteProductFromComparison,
        metrics,
        user,
        setUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isHelpModalOpen,
        setIsHelpModalOpen,
        toastMessage,
        showToast,
        calculatorPrefill,
        prefillCalculator,
        consumePrefill,
        exportBackupJson,
        importBackupJson,
        exportCsvReport,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
