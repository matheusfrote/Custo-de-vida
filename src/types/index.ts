export type IncomeType =
  | 'CLT'
  | 'PJ'
  | 'AUTONOMO'
  | 'FREELANCER'
  | 'SERVIDOR_PUBLICO'
  | 'OUTRO';

export type ExpenseCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Serviços'
  | 'Utilidades'
  | 'Tecnologia'
  | 'Outros';

export type PurchaseDecision = 'PURCHASED' | 'GIVEN_UP' | 'PENDING';

export type GoalType = 'SAVINGS' | 'PURCHASE' | 'EMERGENCY';

export type ActiveTab =
  | 'calcular'
  | 'comparar'
  | 'historico'
  | 'metas'
  | 'painel'
  | 'config';

export interface FinancialProfileData {
  id: string;
  grossSalary: number;
  netSalary: number;
  weeklyHours: number;
  daysPerWeek: number;
  divisorType: 'REAL' | 'CLT'; // 'REAL' = 4.33 weeks (52/12) vs 'CLT' (200h/220h standard)
  currency: string;
}

export interface ExpenseItem {
  id: string;
  category: string;
  name: string;
  amount: number;
  isEssential: boolean;
}

export interface CalculationResult {
  productPrice: number;
  workHours: number;
  workMinutes: number;
  workDays: number;
  percentageOfSalary: number;
  percentageOfDisposableIncome: number;
  workWeeksFree: number;
  hourlyRate: number;
  realHourlyRate: number;
  timeScaleFormatted: string;
  summaryBullets: string[];
}

export interface PurchaseAnalysisItem {
  id: string;
  productName: string;
  productUrl?: string;
  category: string;
  price: number;
  workHours: number;
  workMinutes: number;
  workDays: number;
  percentageOfSalary: number;
  percentageOfFreeIncome: number;
  decision: PurchaseDecision;
  reflectionUntil: number | null;
  isFavorite: boolean;
  notes?: string;
  createdAt: number;
}

export interface SavingGoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  goalType: GoalType;
  category: string;
  createdAt: number;
}

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  lifespanMonths: number;
  costPerMonth: number;
  workHours: number;
  score: number;
  pros: string[];
  cons: string[];
  isBestValue: boolean;
}

export interface ComparisonFolderData {
  id: string;
  name: string;
  category: string;
  products: ComparisonProduct[];
  createdAt: number;
}

export interface DashboardMetrics {
  totalSaved: number;
  hoursPreserved: number;
  impulsePurchasesAvoided: number;
  totalAnalyzedHours: number;
  totalAnalyzedDays: number;
  totalAnalyzedMoney: number;
  totalAnalyzedCount: number;
  purchasedCount: number;
  purchasedTotalMoney: number;
  winRatePercent: number;
}

export interface UserAccount {
  uid?: string;
  name: string;
  email: string;
  photoURL?: string;
  isLoggedIn: boolean;
}
