import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancialEngine } from '../src/domain/financialEngine.ts';

test('FinancialEngine.parseCurrencyInput handles Brazilian & global formats', () => {
  assert.equal(FinancialEngine.parseCurrencyInput('2.499,00'), 2499.00);
  assert.equal(FinancialEngine.parseCurrencyInput('2499,90'), 2499.90);
  assert.equal(FinancialEngine.parseCurrencyInput('2499.90'), 2499.90);
  assert.equal(FinancialEngine.parseCurrencyInput('R$ 3.500,50'), 3500.50);
  assert.equal(FinancialEngine.parseCurrencyInput('5000'), 5000);
  assert.equal(FinancialEngine.parseCurrencyInput(1250), 1250);
  assert.equal(FinancialEngine.parseCurrencyInput(''), 0);
  assert.equal(FinancialEngine.parseCurrencyInput(null), 0);
});

test('FinancialEngine calculates correct hourly rate', () => {
  // 40h/week CLT -> 200h/month. 5000 / 200 = 25
  const hourlyCLT = FinancialEngine.calculateHourlyRate(5000, 40, 'CLT');
  assert.equal(hourlyCLT, 25);

  // 40h/week REAL -> (52/12)*40 = 173.333h. 5000 / 173.333 = 28.846
  const hourlyReal = FinancialEngine.calculateHourlyRate(5000, 40, 'REAL');
  assert.ok(Math.abs(hourlyReal - 28.846) < 0.01);
});

test('FinancialEngine.formatWorkTime formats hours and minutes correctly', () => {
  const t1 = FinancialEngine.formatWorkTime(8.5);
  assert.equal(t1.hours, 8);
  assert.equal(t1.minutes, 30);
  assert.equal(t1.formatted, '8h 30min');

  const t2 = FinancialEngine.formatWorkTime(0.5);
  assert.equal(t2.hours, 0);
  assert.equal(t2.minutes, 30);
  assert.equal(t2.formatted, '30min');
});

test('FinancialEngine.parseStoreUrl extracts product info', () => {
  const ml = FinancialEngine.parseStoreUrl('https://www.mercadolivre.com.br/smartphone-samsung-galaxy-s24-256gb/p/MLB123');
  assert.equal(ml.detectedStore, 'Mercado Livre');
  assert.equal(ml.category, 'Tecnologia');
  assert.ok(ml.name.includes('Smartphone Samsung Galaxy'));

  const amz = FinancialEngine.parseStoreUrl('https://www.amazon.com.br/dp/B0CX234');
  assert.equal(amz.detectedStore, 'Amazon');
});

test('FinancialEngine.calculateInstallments calculates zero and compound interest', () => {
  // 10x sem juros de R$ 1000
  const zeroInterest = FinancialEngine.calculateInstallments(1000, 10, 0);
  assert.equal(zeroInterest.installmentValue, 100);
  assert.equal(zeroInterest.totalAmount, 1000);
  assert.equal(zeroInterest.totalInterest, 0);

  // 12x de R$ 1200 a 2.5% a.m.
  const withInterest = FinancialEngine.calculateInstallments(1200, 12, 2.5);
  assert.ok(withInterest.totalAmount > 1200);
  assert.ok(withInterest.totalInterest > 0);
  assert.ok(withInterest.installmentValue > 100);
});
