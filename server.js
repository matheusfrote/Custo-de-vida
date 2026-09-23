import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : path.join(__dirname, 'web-pwa');
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default initial state
const defaultState = {
  profile: {
    grossSalary: 6200.0,
    netSalary: 5000.0,
    weeklyHours: 40.0,
    daysPerWeek: 5.0,
    currency: 'BRL'
  },
  expenses: [
    { id: 1, name: 'Aluguel & Condomínio', amount: 1800.0, category: 'Moradia' },
    { id: 2, name: 'Contas (Água, Luz, Internet)', amount: 450.0, category: 'Utilidades' },
    { id: 3, name: 'Mercado Essencial', amount: 850.0, category: 'Alimentação' }
  ],
  goals: [
    {
      id: 1,
      title: 'Reserva de Emergência',
      targetAmount: 15000.0,
      currentAmount: 4500.0,
      monthlyContribution: 750.0,
      goalType: 'SAVINGS',
      category: 'Segurança',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Smartphone Top de Linha',
      targetAmount: 4200.0,
      currentAmount: 1200.0,
      monthlyContribution: 400.0,
      goalType: 'PURCHASE',
      category: 'Eletrônicos',
      createdAt: new Date().toISOString()
    }
  ],
  history: [
    {
      id: 1,
      title: 'Tênis de Corrida',
      price: 380.0,
      workHours: 13,
      workMinutes: 22,
      workDays: 1.7,
      realHours: 20,
      realMinutes: 45,
      salaryPct: 7.6,
      disposableIncomePct: 19.9,
      createdAt: new Date().toISOString()
    }
  ],
  user: null,
  updatedAt: new Date().toISOString()
};

// --- SECURITY HELPER: Prototype Pollution Cleaner ---
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const clean = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeObject(obj[key]);
  }
  return clean;
}

// --- SECURITY HELPER: CSV Formula Injection Sanitizer ---
export function sanitizeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Escape Excel/Sheets formula triggers: =, +, -, @, tab, carriage return
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// --- SECURITY HELPER: SSRF & IP Validation ---
function isPrivateIp(ip) {
  if (!ip) return true;
  // IPv4 checks
  if (ip.startsWith('127.') || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true; // Link-local & Cloud Metadata (169.254.169.254)
  if (ip.startsWith('100.') && /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(ip)) return true; // CGNAT
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true;
  }
  return false;
}

export async function validateUrlForSsrf(inputUrl) {
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return { valid: false, error: 'URL malformada' };
  }

  // Enforce protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Protocolo inválido. Apenas HTTP/HTTPS são permitidos.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, cloud metadata, and local domains
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.includes('metadata.google') ||
    hostname.includes('169.254')
  ) {
    return { valid: false, error: 'Acesso a hosts locais ou restritos não é permitido.' };
  }

  // Resolve hostname via DNS to prevent DNS rebinding to private IPs
  try {
    const lookupResult = await dnsLookup(hostname);
    if (isPrivateIp(lookupResult.address)) {
      return { valid: false, error: 'O endereço de destino resolve para uma rede privada restrita.' };
    }
  } catch (dnsErr) {
    return { valid: false, error: 'Falha ao resolver domínio: ' + dnsErr.message };
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}

// --- SECURITY HELPER: In-Memory Rate Limiter ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(clientIp, endpoint, maxRequests) {
  const key = `${clientIp}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(key, entry);
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  rateLimitMap.set(key, entry);
  return true;
}

// Periodically clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return sanitizeObject({ ...defaultState, ...parsed });
    }
  } catch (err) {
    console.error('Error reading DB, falling back to default:', err.message);
  }
  return defaultState;
}

function writeDatabase(data) {
  try {
    const cleanData = sanitizeObject(data);
    cleanData.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err.message);
    return false;
  }
}

// Initial DB check
if (!fs.existsSync(DB_FILE)) {
  writeDatabase(defaultState);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json'
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB safe limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-XSS-Protection', '0');
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);

  // CORS configuration
  const origin = req.headers.origin;
  const host = req.headers.host || '';
  if (origin) {
    // Only allow matching host or trusted applet preview origins
    const isAllowedOrigin =
      origin.includes(host) ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.run.app') ||
      origin.endsWith('.google.com');

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Vary', 'Origin');
    }
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();

  const [rawPath] = (req.url || '/').split('?');
  const urlPath = rawPath.replace(/\/+$/, '') || '/';

  // --- API ROUTES ---

  // Healthcheck
  if (urlPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'custo-de-vida-api',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Get all data
  if (urlPath === '/api/data' && req.method === 'GET') {
    if (!checkRateLimit(clientIp, 'get-data', 120)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições. Aguarde um instante.' }));
      return;
    }
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(db));
    return;
  }

  // Save/Sync full data
  if (urlPath === '/api/data' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'post-data', 60)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições. Aguarde um instante.' }));
      return;
    }
    try {
      const rawBody = await readRequestBody(req);
      const incomingRaw = JSON.parse(rawBody);
      const incoming = sanitizeObject(incomingRaw);
      const current = readDatabase();

      const merged = {
        profile: incoming.profile ? { ...current.profile, ...incoming.profile } : current.profile,
        expenses: Array.isArray(incoming.expenses) ? incoming.expenses : current.expenses,
        goals: Array.isArray(incoming.goals) ? incoming.goals : current.goals,
        history: Array.isArray(incoming.history) ? incoming.history : current.history,
        user: incoming.user !== undefined ? incoming.user : current.user,
        updatedAt: new Date().toISOString()
      };

      const success = writeDatabase(merged);
      if (success) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, data: merged }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Falha ao gravar banco de dados local' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
    }
    return;
  }

  // Export JSON Backup
  if (urlPath === '/api/export' && req.method === 'GET') {
    if (!checkRateLimit(clientIp, 'export-json', 30)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições.' }));
      return;
    }
    const db = readDatabase();
    const filename = `custo-de-vida-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.end(JSON.stringify(db, null, 2));
    return;
  }

  // Export CSV of History & Goals with CSV Injection Protection
  if (urlPath === '/api/export/csv' && req.method === 'GET') {
    if (!checkRateLimit(clientIp, 'export-csv', 30)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições.' }));
      return;
    }
    const db = readDatabase();
    let csv = '\uFEFF'; // UTF-8 BOM for Excel
    csv += 'TIPO;ID;TITULO;VALOR_R$;HORAS_TRABALHO;DIAS_TRABALHO;PERCENTUAL_SALARIO;STATUS_OU_PROGRESSO;CRIADO_EM\n';

    (db.history || []).forEach(h => {
      const title = sanitizeCsvField(h.title || h.productName || 'Item');
      const price = typeof h.price === 'number' ? h.price.toFixed(2) : '0.00';
      const hours = `${Number(h.workHours) || 0}h ${Number(h.workMinutes) || 0}min`;
      const days = (Number(h.workDays) || 0).toFixed(1);
      const pct = (Number(h.salaryPct || h.percentageOfSalary) || 0).toFixed(1) + '%';
      const date = sanitizeCsvField(h.createdAt || '');
      csv += `Cálculo Histórico;${h.id};${title};${price};${hours};${days};${pct};Concluído;${date}\n`;
    });

    (db.goals || []).forEach(g => {
      const title = sanitizeCsvField(g.title || 'Meta');
      const target = typeof g.targetAmount === 'number' ? g.targetAmount.toFixed(2) : '0.00';
      const current = typeof g.currentAmount === 'number' ? g.currentAmount.toFixed(2) : '0.00';
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      const status = sanitizeCsvField(`${pct}% guardado (R$ ${current})`);
      const date = sanitizeCsvField(g.createdAt || '');
      csv += `Meta ${g.goalType === 'PURCHASE' ? 'Compra' : 'Poupança'};${g.id};${title};${target};-; -; -;${status};${date}\n`;
    });

    const filename = `custo-de-vida-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.end(csv);
    return;
  }

  // Import JSON Backup with Prototype Pollution & Validation Protection
  if (urlPath === '/api/import' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'import-json', 20)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições. Aguarde um instante.' }));
      return;
    }
    try {
      const rawBody = await readRequestBody(req);
      const incomingRaw = JSON.parse(rawBody);

      if (!incomingRaw || typeof incomingRaw !== 'object') {
        throw new Error('Arquivo de backup inválido');
      }

      const incoming = sanitizeObject(incomingRaw);

      const imported = {
        profile: incoming.profile && typeof incoming.profile === 'object' ? incoming.profile : defaultState.profile,
        expenses: Array.isArray(incoming.expenses) ? incoming.expenses : defaultState.expenses,
        goals: Array.isArray(incoming.goals) ? incoming.goals : defaultState.goals,
        history: Array.isArray(incoming.history) ? incoming.history : defaultState.history,
        user: incoming.user && typeof incoming.user === 'object' ? incoming.user : null,
        updatedAt: new Date().toISOString()
      };

      writeDatabase(imported);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Dados restaurados com sucesso', data: imported }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Falha na importação de dados' }));
    }
    return;
  }

  // Fetch Metadata from URL with strict SSRF & DoS Prevention
  if (urlPath === '/api/fetch-metadata' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'fetch-metadata', 30)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Limite de consultas atingido. Aguarde 1 minuto.' }));
      return;
    }
    try {
      const rawBody = await readRequestBody(req);
      const { url } = JSON.parse(rawBody);

      const validation = await validateUrlForSsrf(url);
      if (!validation.valid) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: validation.error }));
        return;
      }

      const targetUrl = validation.sanitizedUrl;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const fetchRes = await fetch(targetUrl, {
          signal: controller.signal,
          redirect: 'error', // Prevent SSRF via open redirects to internal network
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CustoDeVidaBot/1.0; +https://ais-dev.run.app)',
            'Accept': 'text/html,application/xhtml+xml'
          }
        });
        clearTimeout(timeout);

        if (!fetchRes.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: `Página retornou status ${fetchRes.status}` }));
          return;
        }

        const html = (await fetchRes.text()).slice(0, 500000); // Limit HTML to 500KB to prevent memory exhaustion

        // Extract title safely
        let title = '';
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1];
        } else {
          const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
          if (titleTagMatch && titleTagMatch[1]) title = titleTagMatch[1];
        }

        // Clean and sanitize title
        title = title.replace(/<[^>]*>/g, '').trim().slice(0, 100);

        // Extract price if available in microdata/og
        let price = null;
        const priceMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["'](.*?)["']/i) ||
                           html.match(/<meta\s+property=["']og:price:amount["']\s+content=["'](.*?)["']/i) ||
                           html.match(/"price":\s*"?([\d.,]+)"?/i);
        if (priceMatch && priceMatch[1]) {
          const parsed = parseFloat(priceMatch[1].replace(',', '.'));
          if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) price = parsed;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          title: title || 'Produto da Loja',
          price: price,
          url: targetUrl
        }));
      } catch (fErr) {
        clearTimeout(timeout);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: 'Não foi possível acessar a página remota de forma segura'
        }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Requisição inválida' }));
    }
    return;
  }

  // --- STATIC FILE SERVING WITH PATH TRAVERSAL & SENSITIVE FILE PROTECTION ---
  let reqPath = urlPath === '/' ? '/index.html' : urlPath;
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const resolvedPublicDir = path.resolve(PUBLIC_DIR);
  let filePath = path.resolve(resolvedPublicDir, '.' + safePath);

  // Path Traversal Check: Ensure resolved path is strictly within PUBLIC_DIR
  if (!filePath.startsWith(resolvedPublicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Acesso Negado');
    return;
  }

  // Block sensitive files from being served statically
  const lowerPath = filePath.toLowerCase();
  const isSensitiveFile =
    lowerPath.includes('.env') ||
    lowerPath.includes('.git') ||
    lowerPath.includes('.keystore') ||
    lowerPath.includes('.gradle') ||
    lowerPath.includes('package') ||
    lowerPath.includes('tsconfig') ||
    lowerPath.includes('.lock') ||
    (lowerPath.endsWith('.json') && !lowerPath.endsWith('manifest.json'));

  if (isSensitiveFile) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Acesso Negado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA / PWA routes
      filePath = path.join(resolvedPublicDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Erro Interno do Servidor');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
      });
      res.end(content);
    });
  });
});

export { server };

const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));
if (isMainModule) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Custo de Vida Server Hardened] Rodando na porta ${PORT} (API + PWA Web)`);
  });
}
