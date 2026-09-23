import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUrlForSsrf, sanitizeCsvField, sanitizeObject } from '../server.js';
import { FinancialEngine } from '../src/domain/financialEngine.ts';

test('Security: SSRF Prevention blocks localhost, loopback and private IPs', async () => {
  const privateUrls = [
    'http://127.0.0.1:8080/secret',
    'http://localhost:3000/api/data',
    'http://0.0.0.0/',
    'http://169.254.169.254/computeMetadata/v1/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'ftp://example.com/file'
  ];

  for (const url of privateUrls) {
    const res = await validateUrlForSsrf(url);
    assert.equal(res.valid, false, `Expected ${url} to be rejected for SSRF`);
  }
});

test('Security: CSV Formula Injection escaping protects against DDE/Excel exploits', () => {
  const maliciousInputs = [
    '=cmd|\'/C calc\'!A0',
    '+SUM(A1:A10)',
    '-2+3*cmd|\' /C calc\'!A0',
    '@SUM(1,2)',
    '\t=1+1',
    '\r=calc',
    'Normal Product',
    'Product with "quotes" inside'
  ];

  for (const input of maliciousInputs) {
    const escaped = sanitizeCsvField(input);
    if (/^[=+\-@\t\r]/.test(input.trim())) {
      assert.ok(
        escaped.startsWith(`"'`) || escaped.startsWith(`"\'`),
        `Expected ${input} to be escaped with leading quote, got ${escaped}`
      );
    }
  }

  // Double quotes should be escaped
  assert.equal(sanitizeCsvField('Test "Quote"'), '"Test ""Quote"""');
});

test('Security: Prototype Pollution Cleaner removes __proto__, constructor, and prototype', () => {
  const maliciousPayload = JSON.parse(
    '{"normal": 123, "__proto__": {"admin": true}, "constructor": {"polluted": true}, "nested": {"prototype": 999, "valid": "ok"}}'
  );

  const cleaned = sanitizeObject(maliciousPayload);
  assert.equal(cleaned.normal, 123);
  assert.equal(cleaned.nested.valid, 'ok');
  assert.equal(Object.getPrototypeOf(cleaned), null);
  assert.equal(cleaned.constructor, undefined);
  assert.equal(cleaned.nested.prototype, undefined);
});

test('Security: FinancialEngine.parseStoreUrl handles malicious and non-HTTP protocols safely', () => {
  const maliciousUrls = [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://localhost:8080/test',
    'http://127.0.0.1/admin',
    'https://www.mercadolivre.com.br/<script>alert("xss")</script>-produto/p/MLB123'
  ];

  for (const url of maliciousUrls) {
    const result = FinancialEngine.parseStoreUrl(url);
    assert.ok(result);
    assert.ok(typeof result.name === 'string');
    // Ensure no HTML tags survive in the product name
    assert.ok(!result.name.includes('<script>'), `Found unescaped script tag in: ${result.name}`);
  }
});

test('Security: FinancialEngine.calculateInstallments handles extreme and malformed numbers safely', () => {
  // Negative or NaN principal
  const neg = FinancialEngine.calculateInstallments(-500, 10, 2);
  assert.equal(neg.installmentValue, 0);
  assert.equal(neg.totalAmount, 0);

  const nanRes = FinancialEngine.calculateInstallments(NaN, 12, 1);
  assert.equal(nanRes.installmentValue, 0);

  // Installments <= 0 or NaN
  const zeroInst = FinancialEngine.calculateInstallments(1000, 0, 1);
  assert.equal(zeroInst.installmentValue, 1000);

  // Astronomical interest rate (e.g. 10000%) or Infinity
  const extremeRate = FinancialEngine.calculateInstallments(1000, 12, 99999);
  assert.ok(isFinite(extremeRate.installmentValue));
  assert.ok(isFinite(extremeRate.totalAmount));
  assert.ok(!isNaN(extremeRate.installmentValue));
});
