import { FinancialProfileData, CalculationResult } from '../types';

export class FinancialEngine {
  /**
   * Calculates monthly working hours based on weekly hours and divisor type.
   * 'REAL': (52 weeks / 12 months) = 4.333333 weeks * weeklyHours
   * 'CLT': standard 200h (for 40h/week) or 220h (for 44h/week) or 5 * weeklyHours
   */
  static calculateMonthlyHours(weeklyHours: number, divisorType: 'REAL' | 'CLT'): number {
    if (divisorType === 'REAL') {
      return (52 / 12) * weeklyHours; // ~173.33h for 40h/week
    } else {
      if (weeklyHours === 40) return 200;
      if (weeklyHours === 44) return 220;
      return weeklyHours * 5;
    }
  }

  /**
   * Base hourly rate based on Net Salary and Monthly Hours.
   */
  static calculateHourlyRate(netSalary: number, weeklyHours: number, divisorType: 'REAL' | 'CLT'): number {
    const monthlyHours = this.calculateMonthlyHours(weeklyHours, divisorType);
    if (monthlyHours <= 0) return 0;
    return netSalary / monthlyHours;
  }

  /**
   * Real hourly rate based on disposable income after essential fixed expenses.
   */
  static calculateRealHourlyRate(netSalary: number, essentialExpenses: number, monthlyHours: number): number {
    const freeIncome = Math.max(0, netSalary - essentialExpenses);
    if (monthlyHours <= 0) return 0;
    return freeIncome / monthlyHours;
  }

  /**
   * Formats duration in hours and minutes: e.g. "87h 58min" or "32min" or "4h"
   */
  static formatWorkTime(totalHours: number): {
    hours: number;
    minutes: number;
    formatted: string;
  } {
    const totalMinutes = Math.round(totalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let formatted = '';
    if (hours > 0 && minutes > 0) {
      formatted = `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      formatted = `${hours}h`;
    } else {
      formatted = `${minutes}min`;
    }

    return { hours, minutes, formatted };
  }

  /**
   * Calculates work days based on hours per day.
   */
  static calculateWorkDays(totalHours: number, hoursPerDay: number = 8): number {
    if (hoursPerDay <= 0) return 0;
    return totalHours / hoursPerDay;
  }

  /**
   * Formats days and hours: e.g. "10 dias e 8h de trabalho"
   */
  static formatDaysAndHours(totalHours: number, hoursPerDay: number = 8): string {
    const totalDays = totalHours / hoursPerDay;
    const fullDays = Math.floor(totalDays);
    const remainingHours = Math.round(totalHours - fullDays * hoursPerDay);

    if (fullDays === 0) {
      return `${remainingHours}h de trabalho`;
    }
    if (remainingHours === 0) {
      return `${fullDays} ${fullDays === 1 ? 'dia' : 'dias'} de trabalho`;
    }
    return `${fullDays} ${fullDays === 1 ? 'dia' : 'dias'} e ${remainingHours}h de trabalho`;
  }

  /**
   * Formats expense duration: e.g. "1.4 semanas de trabalho" or "33h 26min de trabalho"
   */
  static formatExpenseWorkEffort(
    amount: number,
    hourlyRate: number,
    weeklyHours: number
  ): string {
    if (hourlyRate <= 0) return '0h';
    const totalHours = amount / hourlyRate;
    const weeks = totalHours / (weeklyHours > 0 ? weeklyHours : 40);

    if (weeks >= 1.0) {
      return `${weeks.toFixed(1)} semanas de trabalho`;
    }
    const { formatted } = this.formatWorkTime(totalHours);
    return `${formatted} de trabalho`;
  }

  /**
   * Core purchase calculation.
   */
  static calculatePurchase(
    price: number,
    profile: FinancialProfileData,
    essentialExpenses: number
  ): CalculationResult {
    const hourlyRate = this.calculateHourlyRate(
      profile.netSalary,
      profile.weeklyHours,
      profile.divisorType
    );

    const monthlyHours = this.calculateMonthlyHours(profile.weeklyHours, profile.divisorType);
    const realHourlyRate = this.calculateRealHourlyRate(
      profile.netSalary,
      essentialExpenses,
      monthlyHours
    );

    const hoursPerDay = profile.daysPerWeek > 0 ? profile.weeklyHours / profile.daysPerWeek : 8;
    const totalHours = hourlyRate > 0 ? price / hourlyRate : 0;
    const timeFormatted = this.formatWorkTime(totalHours);
    const workDays = this.calculateWorkDays(totalHours, hoursPerDay);

    const freeIncome = Math.max(0, profile.netSalary - essentialExpenses);
    const percentageOfSalary = profile.netSalary > 0 ? (price / profile.netSalary) * 100 : 0;
    const percentageOfDisposableIncome = freeIncome > 0 ? (price / freeIncome) * 100 : 0;

    const weeklyFreeRate = realHourlyRate * profile.weeklyHours;
    const workWeeksFree = weeklyFreeRate > 0 ? price / weeklyFreeRate : (percentageOfSalary / 100) * 4.33;

    const approxDays = Math.round(workDays);
    const summaryBullets = [
      `Essa compra custa ${timeFormatted.formatted} do seu trabalho.`,
      `Você precisará trabalhar aproximadamente ${approxDays} dias para pagar essa compra.`,
      `Essa compra representa ${percentageOfSalary.toFixed(1)}% do seu salário mensal.`,
      `Essa compra representa ${percentageOfDisposableIncome.toFixed(1)}% da sua renda disponível mensal.`
    ];

    return {
      productPrice: price,
      workHours: timeFormatted.hours,
      workMinutes: timeFormatted.minutes,
      workDays,
      percentageOfSalary,
      percentageOfDisposableIncome,
      workWeeksFree,
      hourlyRate,
      realHourlyRate,
      timeScaleFormatted: timeFormatted.formatted,
      summaryBullets,
    };
  }

  /**
   * Standard currency formatter for Brazilian Real (R$).
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  /**
   * Robust parser for currency and numeric user input in Brazilian Portuguese format.
   * Handles "2.499,00", "2499,90", "2499.90", "R$ 1.500,00", "5000", etc.
   */
  static parseCurrencyInput(input: string | number | undefined | null): number {
    if (typeof input === 'number') return isNaN(input) ? 0 : input;
    if (!input) return 0;

    let clean = input.toString().trim().replace(/^R\$\s*/i, '').trim();

    // Check if contains both dot and comma
    const hasDot = clean.includes('.');
    const hasComma = clean.includes(',');

    if (hasDot && hasComma) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        // e.g. "2.499,50" -> Brazilian standard
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // e.g. "2,499.50" -> US standard
        clean = clean.replace(/,/g, '');
      }
    } else if (hasComma) {
      // e.g. "2499,50"
      clean = clean.replace(',', '.');
    } else if (hasDot) {
      // Could be "2.499" (Brazilian thousands) or "2499.50" (decimal)
      const parts = clean.split('.');
      if (parts.length > 2) {
        // multiple dots like "1.200.000"
        clean = clean.replace(/\./g, '');
      } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) < 1000) {
        // likely thousands separator: e.g. "2.499" -> 2499
        clean = clean.replace('.', '');
      }
    }

    // Remove any remaining invalid non-numeric chars except digits and single decimal dot
    clean = clean.replace(/[^0-9.]/g, '');
    const result = parseFloat(clean);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Extracts intelligent product information, name and category from store URLs.
   */
  static parseStoreUrl(urlStr: string): {
    name: string;
    price?: number;
    category: string;
    detectedStore: string;
  } {
    let detectedStore = 'Loja Online';
    let category = 'Tecnologia';
    let name = 'Produto Importado';

    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const pathname = decodeURIComponent(parsed.pathname);

      if (host.includes('mercadolivre') || host.includes('mercadolibre')) {
        detectedStore = 'Mercado Livre';
        // Extract slug from e.g. /tenis-nike-air-max/_MLB12345
        const slug = pathname.split('/p/')[0].split('/').filter(Boolean).pop() || '';
        const cleanName = slug
          .replace(/-MLB\d+.*$/i, '')
          .replace(/^p\//i, '')
          .split('-')
          .filter((w) => w.length > 1 && !/^\d+$/.test(w))
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        if (cleanName.length > 3) name = cleanName;
        if (/celular|smartphone|iphone|galaxy/i.test(pathname)) category = 'Tecnologia';
        else if (/tenis|camisa|blusa|calca|sapato/i.test(pathname)) category = 'Vestuário';
        else if (/ar-condicionado|geladeira|fogao|panela|sofa/i.test(pathname)) category = 'Casa';
      } else if (host.includes('amazon')) {
        detectedStore = 'Amazon';
        const segments = pathname.split('/').filter(Boolean);
        const dpIndex = segments.findIndex((s) => s === 'dp');
        let rawSlug = dpIndex > 0 ? segments[dpIndex - 1] : segments[0] || '';
        const cleanName = rawSlug
          .split('-')
          .filter((w) => w.length > 1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        if (cleanName.length > 3) name = cleanName;
        category = 'Tecnologia';
      } else if (host.includes('magazineluiza') || host.includes('magalu')) {
        detectedStore = 'Magazine Luiza';
        const segments = pathname.split('/').filter(Boolean);
        const rawSlug = segments[0] || '';
        const cleanName = rawSlug
          .replace(/\/p\/.*$/, '')
          .split('-')
          .filter((w) => w.length > 1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        if (cleanName.length > 3) name = cleanName;
        category = 'Casa';
      } else if (host.includes('kabum')) {
        detectedStore = 'Kabum';
        category = 'Tecnologia';
        const slug = pathname.split('/').pop() || '';
        const cleanName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (cleanName.length > 3) name = cleanName;
      } else if (host.includes('shein') || host.includes('zara') || host.includes('renner')) {
        detectedStore = 'Moda / Vestuário';
        category = 'Vestuário';
      }

      // Check query params for price clues (e.g. ?preco=299 or ?price=299)
      const priceParam = parsed.searchParams.get('preco') || parsed.searchParams.get('price');
      let price: number | undefined;
      if (priceParam) {
        const parsedP = parseFloat(priceParam.replace(',', '.'));
        if (!isNaN(parsedP) && parsedP > 0) price = parsedP;
      }

      return { name, price, category, detectedStore };
    } catch {
      return { name: 'Produto da Loja', category: 'Tecnologia', detectedStore };
    }
  }

  /**
   * Calculates installment total and interest impact.
   * If interestRateMonthly === 0: simple installment.
   * If interestRateMonthly > 0: compound interest formula PMT = P * [i / (1 - (1+i)^-n)]
   */
  static calculateInstallments(
    principal: number,
    installments: number,
    interestRateMonthly: number
  ): {
    installmentValue: number;
    totalAmount: number;
    totalInterest: number;
    interestPercentage: number;
  } {
    if (installments <= 1) {
      return {
        installmentValue: principal,
        totalAmount: principal,
        totalInterest: 0,
        interestPercentage: 0,
      };
    }

    if (interestRateMonthly <= 0) {
      return {
        installmentValue: principal / installments,
        totalAmount: principal,
        totalInterest: 0,
        interestPercentage: 0,
      };
    }

    const i = interestRateMonthly / 100;
    const factor = Math.pow(1 + i, installments);
    const pmt = principal * ((i * factor) / (factor - 1));
    const totalAmount = pmt * installments;
    const totalInterest = Math.max(0, totalAmount - principal);
    const interestPercentage = (totalInterest / principal) * 100;

    return {
      installmentValue: pmt,
      totalAmount,
      totalInterest,
      interestPercentage,
    };
  }
}
