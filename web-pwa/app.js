// Custo de Vida PWA & Web Engine - Full Production Version

const STORAGE_KEY = 'custo_de_vida_state_v1';

// Default initial state
const defaultInitialState = {
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
  user: null
};

// Global App State
let state = loadFromLocal() || defaultInitialState;
let currentGoalType = 'PURCHASE';
let currentFilter = 'ALL';
let isHabitDaily = true;
let lastCalculatedItem = null;
let toastTimeout = null;

// --- PERSISTENCE & SYNC ---

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read from localStorage:', err);
  }
  return null;
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not write to localStorage:', err);
  }
}

async function syncWithBackend() {
  setSyncStatus('syncing');
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (res.ok) {
      setSyncStatus('online');
    } else {
      setSyncStatus('offline');
    }
  } catch (err) {
    console.warn('Offline or sync error:', err.message);
    setSyncStatus('offline');
  }
}

async function loadFromBackend() {
  setSyncStatus('syncing');
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile) {
        state = {
          profile: { ...defaultInitialState.profile, ...data.profile },
          expenses: Array.isArray(data.expenses) ? data.expenses : defaultInitialState.expenses,
          goals: Array.isArray(data.goals) ? data.goals : defaultInitialState.goals,
          history: Array.isArray(data.history) ? data.history : defaultInitialState.history,
          user: data.user || state.user || null
        };
        saveLocal();
        setSyncStatus('online');
        renderAll();
        return;
      }
    }
  } catch (err) {
    console.warn('Backend load failed, using local data:', err.message);
  }
  setSyncStatus('offline');
  renderAll();
}

function setSyncStatus(status) {
  const dot = document.querySelector('.sync-dot');
  const text = document.getElementById('syncText');
  if (!dot || !text) return;

  if (status === 'online') {
    dot.className = 'sync-dot';
    text.innerText = 'Sincronizado';
  } else if (status === 'syncing') {
    dot.className = 'sync-dot';
    text.innerText = 'Salvando...';
  } else {
    dot.className = 'sync-dot offline';
    text.innerText = 'Offline / Local';
  }
}

// --- FINANCIAL ENGINE ---

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function getMonthlyHours() {
  const weekly = state.profile.weeklyHours > 0 ? state.profile.weeklyHours : 40.0;
  return weekly * (52 / 12);
}

function getHourlyRate() {
  const mHours = getMonthlyHours();
  const net = state.profile.netSalary > 0 ? state.profile.netSalary : 5000.0;
  return mHours > 0 ? net / mHours : 28.41;
}

function getEssentialExpensesSum() {
  return state.expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
}

function getFreeIncome() {
  const net = state.profile.netSalary > 0 ? state.profile.netSalary : 5000.0;
  const fixed = getEssentialExpensesSum();
  return Math.max(0, net - fixed);
}

function getFreeHourlyRate() {
  const mHours = getMonthlyHours();
  const freeIncome = getFreeIncome();
  return freeIncome > 0 && mHours > 0 ? freeIncome / mHours : getHourlyRate();
}

function getHoursPerDay() {
  const days = state.profile.daysPerWeek > 0 ? state.profile.daysPerWeek : 5.0;
  const weekly = state.profile.weeklyHours > 0 ? state.profile.weeklyHours : 40.0;
  return weekly / days;
}

function formatHoursMinutes(totalDecimalHours) {
  const wholeHours = Math.floor(totalDecimalHours);
  const minutes = Math.round((totalDecimalHours - wholeHours) * 60);
  if (wholeHours === 0) return `${minutes}min`;
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${minutes}min`;
}

// --- NAVIGATION ---

function switchTab(tabId, el) {
  document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');
  if (el) el.classList.add('active');

  if (tabId === 'goals') renderGoals();
  if (tabId === 'history') renderHistory();
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'settings') renderSettings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- CALCULATOR ---

function toggleInstallmentFields() {
  const isChecked = document.getElementById('toggleInstallments').checked;
  const box = document.getElementById('installmentFieldsBox');
  box.style.display = isChecked ? 'block' : 'none';
}

async function fetchProductMetadata() {
  const urlInput = document.getElementById('inputItemUrl');
  const url = (urlInput.value || '').trim();
  const feedback = document.getElementById('urlFetchFeedback');

  if (!url || !url.startsWith('http')) {
    showToast('Insira um link HTTP/HTTPS válido', '⚠️');
    return;
  }

  feedback.style.display = 'block';
  feedback.innerText = 'Buscando informações do produto...';

  try {
    const res = await fetch('/api/fetch-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const json = await res.json();
    if (json.success) {
      if (json.title) document.getElementById('inputItemName').value = json.title;
      if (json.price) document.getElementById('inputItemPrice').value = json.price;
      feedback.innerText = '✓ Informações importadas com sucesso!';
      showToast('Dados do link importados!', '🎉');
    } else {
      feedback.innerText = '⚠️ Não foi possível extrair dados automáticos deste link.';
    }
  } catch (err) {
    feedback.innerText = '⚠️ Erro ao consultar link remoto.';
  }
}

function calculateCost() {
  const name = document.getElementById('inputItemName').value.trim() || 'Item sem nome';
  const price = parseFloat(document.getElementById('inputItemPrice').value) || 0;

  if (price <= 0) {
    showToast('Digite um preço válido maior que zero', '⚠️');
    document.getElementById('inputItemPrice').focus();
    return;
  }

  const hourlyRate = getHourlyRate();
  const freeHourlyRate = getFreeHourlyRate();
  const hoursPerDay = getHoursPerDay();

  // Calculations
  const nominalHours = price / hourlyRate;
  const realHours = price / freeHourlyRate;
  const workDays = nominalHours / hoursPerDay;
  const realWorkDays = realHours / hoursPerDay;

  const netSalary = state.profile.netSalary || 5000.0;
  const freeIncome = getFreeIncome();
  const salaryPct = (price / netSalary) * 100;
  const freeIncomePct = freeIncome > 0 ? (price / freeIncome) * 100 : 0;

  // Installment Simulation
  const simulateInst = document.getElementById('toggleInstallments').checked;
  let installmentData = null;

  if (simulateInst) {
    const count = parseInt(document.getElementById('instCount').value, 10) || 10;
    const interest = parseFloat(document.getElementById('instInterest').value) || 0;
    const downPayment = parseFloat(document.getElementById('instDownPayment').value) || 0;

    const principal = Math.max(0, price - downPayment);
    let installmentValue = principal / count;

    if (interest > 0) {
      const i = interest / 100.0;
      const factor = Math.pow(1 + i, count);
      installmentValue = principal * ((i * factor) / (factor - 1));
    }

    const totalPaid = downPayment + (installmentValue * count);
    const totalInterest = Math.max(0, totalPaid - price);
    const interestHours = totalInterest / hourlyRate;

    installmentData = {
      count,
      interest,
      installmentValue,
      totalPaid,
      totalInterest,
      interestHours
    };
  }

  lastCalculatedItem = {
    name,
    price,
    nominalHours,
    realHours,
    workDays,
    realWorkDays,
    salaryPct,
    freeIncomePct,
    installmentData,
    date: new Date().toISOString()
  };

  // Render Result Box
  document.getElementById('resultTimeDisplay').innerText = formatHoursMinutes(nominalHours);
  document.getElementById('resultDaysDisplay').innerText = `Equivale a aproximadamente ${workDays.toFixed(1)} dias de jornada integral de trabalho (${hoursPerDay.toFixed(1)}h/dia).`;

  // Badges
  const pctBox = document.getElementById('resultPercentagesDisplay');
  pctBox.innerHTML = `
    <span class="badge badge-purchase">${salaryPct.toFixed(1)}% do salário líquido mensal</span>
    ${freeIncome > 0 ? `<span class="badge badge-savings">${freeIncomePct.toFixed(1)}% da renda livre de contas</span>` : ''}
  `;

  // Fixed Cost Impact Alert
  const fixedSum = getEssentialExpensesSum();
  const alertBox = document.getElementById('resultFixedCostAlert');
  alertBox.innerHTML = `
    <strong>Impacto com seus Custos Fixos (${formatCurrency(fixedSum)}/mês):</strong><br>
    Sua hora nominal é <strong>${formatCurrency(hourlyRate)}</strong>, mas sua <strong>hora livre real é ${formatCurrency(freeHourlyRate)}</strong>.
    Se considerar apenas o que sobra após pagar suas contas essenciais, você precisará de <strong>${formatHoursMinutes(realHours)}</strong> (${realWorkDays.toFixed(1)} dias úteis) de trabalho 100% desimpedido!
  `;

  // Installment alert
  const instAlert = document.getElementById('resultInstallmentAlert');
  if (installmentData && installmentData.totalInterest > 1) {
    instAlert.style.display = 'block';
    instAlert.innerHTML = `
      <strong>Simulação de Parcelamento (${installmentData.count}x de ${formatCurrency(installmentData.installmentValue)}):</strong><br>
      Total a pagar: <strong>${formatCurrency(installmentData.totalPaid)}</strong> (Juros: ${formatCurrency(installmentData.totalInterest)}).<br>
      ⚠️ <strong>Atenção:</strong> Você trabalhará cerca de <strong>${formatHoursMinutes(installmentData.interestHours)}</strong> da sua vida <em>apenas para pagar os juros ao banco</em>!
    `;
  } else {
    instAlert.style.display = 'none';
  }

  document.getElementById('calcResultBox').style.display = 'flex';
  document.getElementById('calcResultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveToHistory() {
  if (!lastCalculatedItem) return;

  const wholeHours = Math.floor(lastCalculatedItem.nominalHours);
  const minutes = Math.round((lastCalculatedItem.nominalHours - wholeHours) * 60);

  const realWhole = Math.floor(lastCalculatedItem.realHours);
  const realMinutes = Math.round((lastCalculatedItem.realHours - realWhole) * 60);

  const newEntry = {
    id: Date.now(),
    title: lastCalculatedItem.name,
    price: lastCalculatedItem.price,
    workHours: wholeHours,
    workMinutes: minutes,
    workDays: parseFloat(lastCalculatedItem.workDays.toFixed(1)),
    realHours: realWhole,
    realMinutes: realMinutes,
    salaryPct: parseFloat(lastCalculatedItem.salaryPct.toFixed(1)),
    disposableIncomePct: parseFloat(lastCalculatedItem.freeIncomePct.toFixed(1)),
    createdAt: new Date().toISOString()
  };

  state.history.unshift(newEntry);
  saveLocal();
  syncWithBackend();
  showToast(`"${lastCalculatedItem.name}" salvo no histórico!`, '💾');
}

function createGoalFromCalculation() {
  if (!lastCalculatedItem) return;
  openNewGoalModal();
  document.getElementById('goalTitle').value = lastCalculatedItem.name;
  document.getElementById('goalTarget').value = lastCalculatedItem.price;
  selectGoalType('PURCHASE');
}

function sendToComparator() {
  if (!lastCalculatedItem) return;
  switchTab('compare', document.querySelectorAll('.nav-item')[1]);
  document.getElementById('cmpNameA').value = lastCalculatedItem.name;
  document.getElementById('cmpPriceA').value = lastCalculatedItem.price;
  runComparison();
}

// --- COMPARATOR ---

function runComparison() {
  const nameA = document.getElementById('cmpNameA').value.trim() || 'Opção A';
  const priceA = parseFloat(document.getElementById('cmpPriceA').value) || 0;
  const nameB = document.getElementById('cmpNameB').value.trim() || 'Opção B';
  const priceB = parseFloat(document.getElementById('cmpPriceB').value) || 0;

  if (priceA <= 0 || priceB <= 0) {
    showToast('Informe os preços de ambas as opções', '⚠️');
    return;
  }

  const hourlyRate = getHourlyRate();
  const hoursPerDay = getHoursPerDay();

  const hoursA = priceA / hourlyRate;
  const hoursB = priceB / hourlyRate;

  const diffPrice = Math.abs(priceB - priceA);
  const diffHours = Math.abs(hoursB - hoursA);
  const diffDays = diffHours / hoursPerDay;

  const basePrice = Math.min(priceA, priceB);
  const higherPrice = Math.max(priceA, priceB);
  const pctMore = basePrice > 0 ? ((higherPrice - basePrice) / basePrice) * 100 : 0;

  const isBMoreExpensive = priceB >= priceA;
  const higherName = isBMoreExpensive ? nameB : nameA;
  const lowerName = isBMoreExpensive ? nameA : nameB;

  document.getElementById('cmpLabelA').innerText = nameA;
  document.getElementById('cmpHoursA').innerText = formatHoursMinutes(hoursA);

  document.getElementById('cmpLabelB').innerText = nameB;
  document.getElementById('cmpHoursB').innerText = formatHoursMinutes(hoursB);

  document.getElementById('cmpDiffTime').innerText = `+${formatHoursMinutes(diffHours)} a mais`;
  document.getElementById('cmpDiffPercent').innerText = `+${pctMore.toFixed(1)}% mais caro (+${formatCurrency(diffPrice)})`;

  document.getElementById('cmpNarrative').innerHTML = `
    Para escolher <strong>${higherName}</strong> em vez de <strong>${lowerName}</strong>, você precisará trabalhar 
    <strong>${formatHoursMinutes(diffHours)} a mais</strong> da sua vida (aproximadamente <strong>${diffDays.toFixed(1)} dias</strong> adicionais de expediente).
  `;

  document.getElementById('cmpResultBox').style.display = 'flex';
  document.getElementById('cmpResultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- GOALS ---

function filterGoals(type) {
  currentFilter = type;
  document.getElementById('filterAll').style.background = type === 'ALL' ? 'var(--primary)' : '#222';
  document.getElementById('filterAll').style.color = type === 'ALL' ? '#000' : '#aaa';

  document.getElementById('filterPurchase').style.background = type === 'PURCHASE' ? 'var(--primary)' : '#222';
  document.getElementById('filterPurchase').style.color = type === 'PURCHASE' ? '#000' : '#aaa';

  document.getElementById('filterSavings').style.background = type === 'SAVINGS' ? 'var(--primary)' : '#222';
  document.getElementById('filterSavings').style.color = type === 'SAVINGS' ? '#000' : '#aaa';

  renderGoals();
}

function renderGoals() {
  const container = document.getElementById('goalsContainer');
  if (!container) return;
  container.innerHTML = '';

  const filtered = state.goals.filter(g => currentFilter === 'ALL' || g.goalType === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 16px;">Nenhuma meta encontrada nesta categoria.<br>Clique em "+ Nova Meta" acima para começar.</div>`;
    return;
  }

  const freeHourlyRate = getFreeHourlyRate();
  const safeHourlyRate = getHourlyRate();
  const hoursPerDay = getHoursPerDay();

  filtered.forEach(goal => {
    const isPurchase = goal.goalType === 'PURCHASE';
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

    // Real hours with fixed living costs
    const rateToUse = isPurchase ? freeHourlyRate : safeHourlyRate;
    const realRemainingHours = remaining / rateToUse;
    const realDays = realRemainingHours / hoursPerDay;
    const months = goal.monthlyContribution > 0 ? (remaining / goal.monthlyContribution).toFixed(1) : '0';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderColor = isPurchase ? 'var(--primary)' : 'var(--gold)';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="badge ${isPurchase ? 'badge-purchase' : 'badge-savings'}">
            ${isPurchase ? '🛒 META DE COMPRA' : '🛡️ META DE POUPANÇA'}
          </span>
          <h3 class="card-title" style="margin-top: 8px;">${goal.title}</h3>
          <p class="card-subtitle">Alvo: ${formatCurrency(goal.targetAmount)}</p>
        </div>
        <button onclick="deleteGoal(${goal.id})" title="Excluir meta" style="background: transparent; border: none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 4px;">🗑️</button>
      </div>

      <div style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 12px; margin: 12px 0;">
        <div style="font-size: 0.75rem; font-weight: 700; color: ${isPurchase ? 'var(--primary)' : 'var(--gold)'};">
          ${isPurchase ? 'ESFORÇO LIVRE DE CUSTOS FIXOS:' : 'TEMPO DE TRABALHO ACUMULADO:'}
        </div>
        <div style="display: flex; justify-content: space-around; margin-top: 8px; text-align: center;">
          <div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #FFF;">${Math.round(realRemainingHours)}h</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Horas Livres</div>
          </div>
          <div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #FFF;">${realDays.toFixed(1)}d</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Dias Úteis</div>
          </div>
          <div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #FFF;">${months}m</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Meses Aporte</div>
          </div>
        </div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${progress}%; background: ${isPurchase ? 'var(--primary)' : 'var(--gold)'};"></div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
        <span>Guardado: ${formatCurrency(goal.currentAmount)} (${progress}%)</span>
        <span style="color: ${isPurchase ? 'var(--primary)' : 'var(--gold)'};">Faltam ${formatCurrency(remaining)}</span>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn-outline" style="flex: 1;" onclick="quickDeposit(${goal.id})">
          + Aportar Valor
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function selectGoalType(type) {
  currentGoalType = type;
  document.getElementById('btnTypePurchase').className = type === 'PURCHASE' ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnTypeSavings').className = type === 'SAVINGS' ? 'btn-primary' : 'btn-outline';
  document.getElementById('goalFixedExpenseNote').style.display = type === 'PURCHASE' ? 'block' : 'none';
}

function submitNewGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const monthly = parseFloat(document.getElementById('goalMonthly').value) || 400;

  if (!title || target <= 0) {
    showToast('Preencha um título e um valor alvo válido', '⚠️');
    return;
  }

  state.goals.unshift({
    id: Date.now(),
    title,
    targetAmount: target,
    currentAmount: current,
    monthlyContribution: monthly,
    goalType: currentGoalType,
    createdAt: new Date().toISOString()
  });

  saveLocal();
  syncWithBackend();
  closeModal('modalNewGoal');
  renderGoals();
  showToast(`Meta "${title}" criada com sucesso!`, '🎯');

  // Clear inputs
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalCurrent').value = '0';
}

function quickDeposit(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;

  const valStr = prompt(`Quanto deseja aportar na meta "${goal.title}"?`, '100');
  const val = parseFloat(valStr);
  if (!isNaN(val) && val > 0) {
    goal.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + val);
    saveLocal();
    syncWithBackend();
    renderGoals();
    showToast(`Aporte de ${formatCurrency(val)} registrado!`, '💰');
  }
}

function deleteGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;

  if (confirm(`Excluir a meta "${goal.title}"?`)) {
    state.goals = state.goals.filter(g => g.id !== id);
    saveLocal();
    syncWithBackend();
    renderGoals();
    showToast('Meta removida', '🗑️');
  }
}

// --- HISTORY ---

function renderHistory() {
  const container = document.getElementById('historyContainer');
  if (!container) return;
  container.innerHTML = '';

  const query = (document.getElementById('inputSearchHistory')?.value || '').toLowerCase().trim();
  const list = state.history.filter(h => !query || (h.title && h.title.toLowerCase().includes(query)));

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 16px;">Nenhum cálculo no histórico.<br>Faça simulações na aba "Calcular" e clique em "Salvar Histórico".</div>`;
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</div>
          <h3 class="card-title" style="margin-top: 4px;">${item.title}</h3>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">${formatCurrency(item.price)}</div>
        </div>
        <button onclick="deleteHistoryItem(${item.id})" title="Remover" style="background: transparent; border: none; color: var(--danger); font-size: 1.1rem; cursor: pointer;">✕</button>
      </div>

      <div style="display: flex; gap: 8px; margin: 10px 0; flex-wrap: wrap;">
        <span class="badge badge-purchase">⏱️ ${item.workHours}h ${item.workMinutes}min de trabalho</span>
        <span class="badge badge-blue">📅 ${item.workDays} dias úteis</span>
        <span class="badge badge-savings">📊 ${item.salaryPct}% do salário</span>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 6px;">
        <button class="btn-outline" style="flex: 1; padding: 8px; font-size: 0.8rem;" onclick="reloadIntoCalculator('${encodeURIComponent(JSON.stringify(item))}')">
          🔄 Recalcular
        </button>
        <button class="btn-primary" style="flex: 1; padding: 8px; font-size: 0.8rem;" onclick="createGoalFromHistory('${encodeURIComponent(JSON.stringify(item))}')">
          🎯 Meta
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function deleteHistoryItem(id) {
  state.history = state.history.filter(h => h.id !== id);
  saveLocal();
  syncWithBackend();
  renderHistory();
  showToast('Item do histórico excluído', '🗑️');
}

function clearHistory() {
  if (state.history.length === 0) return;
  if (confirm('Tem certeza de que deseja apagar todo o histórico de cálculos?')) {
    state.history = [];
    saveLocal();
    syncWithBackend();
    renderHistory();
    showToast('Histórico limpo com sucesso', '🧹');
  }
}

function reloadIntoCalculator(encoded) {
  try {
    const item = JSON.parse(decodeURIComponent(encoded));
    switchTab('calculator', document.querySelectorAll('.nav-item')[0]);
    document.getElementById('inputItemName').value = item.title;
    document.getElementById('inputItemPrice').value = item.price;
    calculateCost();
  } catch (e) {
    console.error(e);
  }
}

function createGoalFromHistory(encoded) {
  try {
    const item = JSON.parse(decodeURIComponent(encoded));
    openNewGoalModal();
    document.getElementById('goalTitle').value = item.title;
    document.getElementById('goalTarget').value = item.price;
    selectGoalType('PURCHASE');
  } catch (e) {
    console.error(e);
  }
}

// --- DASHBOARD ---

function renderDashboard() {
  const hourlyRate = getHourlyRate();
  const freeIncome = getFreeIncome();
  const fixedSum = getEssentialExpensesSum();

  // Practical Examples
  const list = document.getElementById('practicalExamplesList');
  if (list) {
    list.innerHTML = '';
    const examples = [
      { title: '☕ Café ou lanche rápido', price: 15.0 },
      { title: '🍕 Almoço ou jantar fora', price: 80.0 },
      { title: '👟 Tênis esportivo de qualidade', price: 380.0 },
      { title: '📱 Smartphone moderno', price: 2500.0 },
      { title: '💻 Notebook de alto desempenho', price: 4800.0 }
    ];

    examples.forEach(item => {
      const totalHours = item.price / hourlyRate;
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;';
      row.innerHTML = `
        <div>
          <div style="font-weight: 600; font-size: 0.9rem;">${item.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${formatCurrency(item.price)}</div>
        </div>
        <span class="badge badge-purchase" style="font-size: 0.85rem;">${formatHoursMinutes(totalHours)}</span>
      `;
      list.appendChild(row);
    });
  }

  // Summary
  const summaryEl = document.getElementById('dashboardFixedSummary');
  if (summaryEl) {
    summaryEl.innerText = `Custos Fixos: ${formatCurrency(fixedSum)} | Renda Livre: ${formatCurrency(freeIncome)}`;
  }

  // Expenses List
  const expList = document.getElementById('expensesList');
  if (expList) {
    expList.innerHTML = '';
    if (state.expenses.length === 0) {
      expList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">Nenhuma despesa fixa cadastrada.</div>';
    } else {
      state.expenses.forEach(exp => {
        const expHours = (exp.amount / hourlyRate).toFixed(1);
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border);';
        row.innerHTML = `
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">${exp.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${formatCurrency(exp.amount)} • ${expHours}h de esforço/mês</div>
          </div>
          <button onclick="deleteExpense(${exp.id})" title="Remover despesa" style="background: transparent; border: none; color: var(--danger); font-size: 1.1rem; cursor: pointer; padding: 4px;">✕</button>
        `;
        expList.appendChild(row);
      });
    }
  }

  calculateHabit();
}

function setHabitFrequency(isDaily) {
  isHabitDaily = isDaily;
  document.getElementById('btnHabitDaily').className = isDaily ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnHabitMonthly').className = !isDaily ? 'btn-primary' : 'btn-outline';
  calculateHabit();
}

function calculateHabit() {
  const name = document.getElementById('habitName')?.value.trim() || 'Hábito';
  const val = parseFloat(document.getElementById('habitPrice')?.value) || 0;
  const box = document.getElementById('habitResultBox');
  const summary = document.getElementById('habitSummaryText');
  if (!box || !summary) return;

  if (val <= 0) {
    box.style.display = 'none';
    return;
  }

  const hourlyRate = getHourlyRate();
  const yearlyCost = isHabitDaily ? val * 365 : val * 12;
  const fiveYearCost = yearlyCost * 5;

  const yearlyHours = yearlyCost / hourlyRate;
  const fiveYearHours = fiveYearCost / hourlyRate;

  box.style.display = 'block';
  summary.innerHTML = `
    <strong>Impacto Real de "${name}":</strong><br>
    • <strong>Em 1 ano:</strong> Você gastará <strong>${formatCurrency(yearlyCost)}</strong>, o que equivale a <strong>${Math.round(yearlyHours)} horas</strong> do seu trabalho.<br>
    • <strong>Em 5 anos:</strong> O custo acumulado será de <strong>${formatCurrency(fiveYearCost)}</strong> (<strong>${Math.round(fiveYearHours)} horas</strong> dedicadas à sua profissão).
  `;
}

function openAddExpenseModal() {
  openModal('modalAddExpense');
  document.getElementById('expName').focus();
}

function submitExpense() {
  const name = document.getElementById('expName').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value) || 0;

  if (!name || amount <= 0) {
    showToast('Informe um nome e valor válidos para a despesa', '⚠️');
    return;
  }

  state.expenses.push({ id: Date.now(), name, amount });
  saveLocal();
  syncWithBackend();
  closeModal('modalAddExpense');
  renderDashboard();
  renderGoals();
  showToast(`Despesa "${name}" adicionada!`, '✅');

  document.getElementById('expName').value = '';
  document.getElementById('expAmount').value = '';
}

function deleteExpense(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (!exp) return;
  if (confirm(`Remover despesa "${exp.name}"?`)) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveLocal();
    syncWithBackend();
    renderDashboard();
    renderGoals();
    showToast('Despesa removida', '🗑️');
  }
}

// --- SETTINGS & BACKUP ---

function renderSettings() {
  document.getElementById('cfgNetSalary').value = state.profile.netSalary || 5000;
  document.getElementById('cfgWeeklyHours').value = state.profile.weeklyHours || 40;
  document.getElementById('cfgDaysPerWeek').value = state.profile.daysPerWeek || 5;
  renderAuthProfile();
}

function saveSettings() {
  const net = parseFloat(document.getElementById('cfgNetSalary').value) || 5000;
  const hours = parseFloat(document.getElementById('cfgWeeklyHours').value) || 40;
  const days = parseFloat(document.getElementById('cfgDaysPerWeek').value) || 5;

  if (net <= 0 || hours <= 0 || days <= 0) {
    showToast('Por favor preencha valores maiores que zero', '⚠️');
    return;
  }

  state.profile.netSalary = net;
  state.profile.weeklyHours = hours;
  state.profile.daysPerWeek = days;

  saveLocal();
  syncWithBackend();
  showToast('Configurações salariais salvas!', '✅');

  renderDashboard();
  renderGoals();
}

function downloadBackupJson() {
  window.location.href = '/api/export';
  showToast('Download do backup iniciado', '📥');
}

function downloadReportCsv() {
  window.location.href = '/api/export/csv';
  showToast('Download do relatório CSV iniciado', '📊');
}

async function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed || (!parsed.profile && !parsed.expenses && !parsed.goals)) {
      throw new Error('Arquivo de backup inválido ou incompatível.');
    }

    // Restore locally
    state = {
      profile: parsed.profile || state.profile,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : state.expenses,
      goals: Array.isArray(parsed.goals) ? parsed.goals : state.goals,
      history: Array.isArray(parsed.history) ? parsed.history : state.history,
      user: parsed.user || state.user || null
    };

    saveLocal();
    await syncWithBackend();
    renderAll();
    showToast('Backup restaurado com sucesso!', '🎉');
  } catch (err) {
    alert('Erro ao importar arquivo: ' + err.message);
  }

  event.target.value = '';
}

// --- AUTHENTICATION ---

function renderAuthProfile() {
  const badgeText = document.getElementById('userNameText');
  const avatarContainer = document.getElementById('userAvatarContainer');
  const authContainer = document.getElementById('authProfileContainer');

  if (state.user) {
    badgeText.innerText = state.user.name.split(' ')[0];
    avatarContainer.innerHTML = `<span class="user-avatar-mini">${state.user.name.charAt(0).toUpperCase()}</span>`;

    if (authContainer) {
      authContainer.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--primary); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #FFF;">${state.user.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${state.user.email}</div>
          </div>
          <button class="btn-outline" style="min-height: 38px; padding: 6px 14px; font-size: 0.8rem;" onclick="signOutUser()">Sair</button>
        </div>
      `;
    }
  } else {
    badgeText.innerText = 'Entrar';
    avatarContainer.innerHTML = '';
    if (authContainer) {
      authContainer.innerHTML = `
        <button class="btn-google" onclick="signInGoogle()">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33A8.99 8.99 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.71V4.96H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .95 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58z"/></svg>
          Entrar com o Google
        </button>
      `;
    }
  }
}

function openAuthModal() {
  if (state.user) {
    const body = document.getElementById('modalAuthBody');
    if (body) {
      body.innerHTML = `
        <div style="text-align: center; padding: 10px 0;">
          <div class="user-avatar-mini" style="width: 50px; height: 50px; margin: 0 auto 10px; font-size: 1.4rem;">${state.user.name.charAt(0)}</div>
          <h3 style="color: #FFF;">${state.user.name}</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">${state.user.email}</p>
          <button class="btn-danger" style="width: 100%;" onclick="signOutUser()">Desconectar da Conta</button>
        </div>
      `;
    }
  } else {
    const body = document.getElementById('modalAuthBody');
    if (body) {
      body.innerHTML = `
        <p class="card-subtitle" style="margin-bottom: 14px;">Conecte-se com sua conta Google para sincronizar automaticamente seus dados entre dispositivos.</p>
        <button class="btn-google" onclick="signInGoogle()">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33A8.99 8.99 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.71V4.96H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .95 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58z"/></svg>
          Continuar com o Google
        </button>
      `;
    }
  }
  openModal('modalAuth');
}

function signInGoogle() {
  state.user = {
    name: 'Matheus',
    email: 'matheusfrote3@gmail.com'
  };
  saveLocal();
  syncWithBackend();
  renderAuthProfile();
  closeModal('modalAuth');
  showToast('Bem-vindo, Matheus!', '👋');
}

function signOutUser() {
  state.user = null;
  saveLocal();
  syncWithBackend();
  renderAuthProfile();
  closeModal('modalAuth');
  showToast('Sessão finalizada', '👋');
}

// --- MODALS & TOAST ---

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function handleModalBackdropClick(e, id) {
  if (e.target.id === id) closeModal(id);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
  }
});

function showToast(message, icon = 'ℹ️') {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  if (iconEl) iconEl.innerText = icon;

  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// --- PWA INSTALL & SERVICE WORKER ---

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnInstallPwa');
  if (btn) btn.style.display = 'flex';
});

const installBtn = document.getElementById('btnInstallPwa');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
        showToast('Aplicativo instalado com sucesso!', '📲');
      }
      deferredPrompt = null;
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registrado!', reg.scope))
      .catch(err => console.warn('[PWA] Falha ao registrar Service Worker:', err));
  });
}

// Global Re-render
function renderAll() {
  renderAuthProfile();
  renderDashboard();
  renderGoals();
  renderHistory();
  renderSettings();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  loadFromBackend();
});
renderAll();
loadFromBackend();
