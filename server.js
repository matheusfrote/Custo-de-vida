import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    }
  } catch (err) {
    console.error('Error reading DB, falling back to default:', err.message);
  }
  return defaultState;
}

function writeDatabase(data) {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const [rawPath, queryString] = req.url.split('?');
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
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(db));
    return;
  }

  // Save/Sync full data
  if (urlPath === '/api/data' && req.method === 'POST') {
    try {
      const rawBody = await readRequestBody(req);
      const incoming = JSON.parse(rawBody);
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
      res.end(JSON.stringify({ success: false, error: 'JSON inválido: ' + err.message }));
    }
    return;
  }

  // Export JSON Backup
  if (urlPath === '/api/export' && req.method === 'GET') {
    const db = readDatabase();
    const filename = `custo-de-vida-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.end(JSON.stringify(db, null, 2));
    return;
  }

  // Export CSV of History & Goals
  if (urlPath === '/api/export/csv' && req.method === 'GET') {
    const db = readDatabase();
    let csv = '\uFEFF'; // UTF-8 BOM for Excel
    csv += 'TIPO;ID;TITULO;VALOR_R$;HORAS_TRABALHO;DIAS_TRABALHO;PERCENTUAL_SALARIO;STATUS_OU_PROGRESSO;CRIADO_EM\n';

    (db.history || []).forEach(h => {
      csv += `Cálculo Histórico;${h.id};"${(h.title || '').replace(/"/g, '""')}";${(h.price || 0).toFixed(2)};${h.workHours || 0}h ${h.workMinutes || 0}min;${(h.workDays || 0).toFixed(1)};${(h.salaryPct || 0).toFixed(1)}%;Concluído;${h.createdAt || ''}\n`;
    });

    (db.goals || []).forEach(g => {
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      csv += `Meta ${g.goalType === 'PURCHASE' ? 'Compra' : 'Poupança'};${g.id};"${(g.title || '').replace(/"/g, '""')}";${(g.targetAmount || 0).toFixed(2)};-; -; -;${pct}% guardado (R$ ${(g.currentAmount || 0).toFixed(2)});${g.createdAt || ''}\n`;
    });

    const filename = `custo-de-vida-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.end(csv);
    return;
  }

  // Import JSON Backup
  if (urlPath === '/api/import' && req.method === 'POST') {
    try {
      const rawBody = await readRequestBody(req);
      const incoming = JSON.parse(rawBody);

      if (!incoming || typeof incoming !== 'object') {
        throw new Error('Arquivo de backup inválido');
      }

      const imported = {
        profile: incoming.profile || defaultState.profile,
        expenses: Array.isArray(incoming.expenses) ? incoming.expenses : defaultState.expenses,
        goals: Array.isArray(incoming.goals) ? incoming.goals : defaultState.goals,
        history: Array.isArray(incoming.history) ? incoming.history : defaultState.history,
        user: incoming.user || null,
        updatedAt: new Date().toISOString()
      };

      writeDatabase(imported);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Dados restaurados com sucesso', data: imported }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Falha na importação: ' + err.message }));
    }
    return;
  }

  // Fetch Metadata from URL (Link Metadata Fetcher)
  if (urlPath === '/api/fetch-metadata' && req.method === 'POST') {
    try {
      const rawBody = await readRequestBody(req);
      const { url } = JSON.parse(rawBody);

      if (!url || !url.startsWith('http')) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'URL inválida ou ausente' }));
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const fetchRes = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CustoDeVidaBot/1.0; +https://ais-dev.run.app)'
          }
        });
        clearTimeout(timeout);

        const html = await fetchRes.text();

        // Extract title
        let title = '';
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1];
        } else {
          const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
          if (titleTagMatch && titleTagMatch[1]) title = titleTagMatch[1];
        }

        // Extract price if available in microdata/og
        let price = null;
        const priceMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["'](.*?)["']/i) ||
                           html.match(/<meta\s+property=["']og:price:amount["']\s+content=["'](.*?)["']/i) ||
                           html.match(/"price":\s*"?([\d.,]+)"?/i);
        if (priceMatch && priceMatch[1]) {
          const parsed = parseFloat(priceMatch[1].replace(',', '.'));
          if (!isNaN(parsed) && parsed > 0) price = parsed;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          title: title.trim().slice(0, 120),
          price: price,
          url
        }));
      } catch (fErr) {
        clearTimeout(timeout);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: 'Não foi possível acessar a página remota: ' + fErr.message
        }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let reqPath = urlPath === '/' ? '/index.html' : urlPath;
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA / PWA routes
      filePath = path.join(PUBLIC_DIR, 'index.html');
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Custo de Vida Server] Rodando na porta ${PORT} (API + PWA Web)`);
});
