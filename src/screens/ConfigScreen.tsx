import React, { useState } from 'react';
import {
  SlidersHorizontal,
  User,
  ShieldCheck,
  Shield,
  LogOut,
  Save,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialEngine } from '../domain/financialEngine';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const ConfigScreen: React.FC = () => {
  const {
    profile,
    updateProfile,
    user,
    setUser,
    setIsAuthModalOpen,
    setIsHelpModalOpen,
    exportBackupJson,
    importBackupJson,
    exportCsvReport,
    clearAllData,
    showToast,
  } = useApp();

  const [netSalaryInput, setNetSalaryInput] = useState(profile.netSalary.toString());
  const [weeklyHoursInput, setWeeklyHoursInput] = useState(profile.weeklyHours.toString());
  const [divisorType, setDivisorType] = useState<'REAL' | 'CLT'>(profile.divisorType);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);

  // Live computed metrics for profile card
  const tempNetSalary = FinancialEngine.parseCurrencyInput(netSalaryInput);
  const tempWeeklyHours = FinancialEngine.parseCurrencyInput(weeklyHoursInput) || 40;

  const monthlyHours = FinancialEngine.calculateMonthlyHours(tempWeeklyHours, divisorType);
  const hourlyRate = monthlyHours > 0 ? tempNetSalary / monthlyHours : 0;
  const perMinute = hourlyRate / 60;
  const perDay = hourlyRate * (tempWeeklyHours / 5);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempNetSalary <= 0 || tempWeeklyHours <= 0) {
      showToast('Por favor, informe valores válidos.');
      return;
    }
    updateProfile({
      netSalary: tempNetSalary,
      weeklyHours: tempWeeklyHours,
      divisorType,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    setUser({
      name: 'Convidado',
      email: '',
      isLoggedIn: false,
    });
    showToast('Você saiu da sua conta.');
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner Header (Screenshot 9) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-2 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Configuração & Privacidade
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          Configurações
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Personalize o cálculo de tempo de vida, exporte relatórios e gerencie seus dados.
        </p>
      </div>

      {/* Account Section (Screenshot 9) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-white">Sua Conta</h3>
          <p className="text-xs text-slate-400">Sincronize seus dados em qualquer dispositivo.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{user.name}</span>
              <span className="text-[11px] text-slate-400 block">
                {user.email || 'Modo Convidado (Dados salvos localmente)'}
              </span>
            </div>
          </div>

          {user.isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition-colors"
            >
              Sair da Conta
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* PWA Install Button */}
      <PWAInstallButton variant="settings" />

      {/* Financial Profile Section (Screenshot 10 & 11) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-white">Perfil Financeiro</h3>
          <p className="text-xs text-slate-400">O valor da sua hora é a base de todo o aplicativo.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Salário Líquido Mensal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                value={netSalaryInput}
                onChange={(e) => setNetSalaryInput(e.target.value)}
                placeholder="5000.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Horas Trabalhadas por Semana
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                max="168"
                value={weeklyHoursInput}
                onChange={(e) => setWeeklyHoursInput(e.target.value)}
                placeholder="40"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-medium text-slate-400">
                horas / semana
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Tipo de Divisor Mensal
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setDivisorType('REAL')}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                  divisorType === 'REAL'
                    ? 'bg-slate-950 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="divisor"
                  checked={divisorType === 'REAL'}
                  onChange={() => setDivisorType('REAL')}
                  className="mt-0.5 text-emerald-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Real (52 semanas ÷ 12 meses = 4.33 semanas/mês)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Mais preciso: divide o salário pelas semanas reais do ano (~173h para 40h/sem).
                  </span>
                </div>
              </label>

              <label
                onClick={() => setDivisorType('CLT')}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                  divisorType === 'CLT'
                    ? 'bg-slate-950 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="divisor"
                  checked={divisorType === 'CLT'}
                  onChange={() => setDivisorType('CLT')}
                  className="mt-0.5 text-emerald-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Padrão CLT (200h para 40h/sem ou 220h para 44h/sem)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Regra trabalhista tradicional com divisor fixo de 200h ou 220h.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Profile Calculation Result (Screenshots 10 & 11) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-3 mt-3">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Sua Hora Líquida Real
            </span>

            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {FinancialEngine.formatCurrency(hourlyRate)} / hora
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div>
                <span className="text-[11px] font-bold text-white block">
                  {FinancialEngine.formatCurrency(perMinute)}
                </span>
                <span className="text-[10px] text-slate-500 block">Valor por Minuto</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-white block">
                  {FinancialEngine.formatCurrency(perDay)}
                </span>
                <span className="text-[10px] text-slate-500 block">Valor por Dia Útil</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-white block">
                  {monthlyHours.toFixed(1)}h
                </span>
                <span className="text-[10px] text-slate-500 block">Horas / Mês</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Salvar Perfil Financeiro
          </button>
        </form>
      </div>

      {/* Tutorial & Demonstration (Screenshot 12) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white">Tutorial & Demonstração</h3>
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          Reiniciar Tutorial Interativo
        </button>
      </div>

      {/* Backup & Export (Screenshot 12) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white">Backup & Exportação</h3>

        <div className="space-y-2">
          <button
            onClick={exportBackupJson}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Exportar Backup Completo (JSON)
          </button>

          <label className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Restaurar Backup (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={exportCsvReport}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Exportar Relatório do Histórico (CSV)
          </button>
        </div>
      </div>

      {/* Transparência e Privacidade LGPD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Transparência & Privacidade (LGPD)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          O <strong>Custo de Vida</strong> opera em modelo de privacidade local por padrão. Suas informações salariais e metas não são comercializadas nem compartilhadas com terceiros.
        </p>
        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Aviso Legal Educativo:</p>
          <p>
            Esta plataforma é destinada a fins de conscientização e educação financeira. Não constitui aconselhamento ou recomendação formal de investimentos.
          </p>
        </div>
      </div>

      {/* Danger Zone (Screenshot 12) */}
      <div className="bg-slate-900 border border-rose-500/20 rounded-3xl p-5 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Zona de Perigo
        </h3>
        <p className="text-xs text-slate-400">
          Apaga permanentemente todos os registros, metas, despesas e configurações armazenados no seu navegador.
        </p>
        <button
          onClick={() => setIsConfirmClearModalOpen(true)}
          className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-400 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Apagar Todos os Dados Locais
        </button>
      </div>

      {/* Confirmation Modal for Clearing All Data */}
      {isConfirmClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Apagar Todos os Dados?</h3>
              <p className="text-xs text-slate-400">
                Tem certeza que deseja apagar todos os registros, despesas e metas? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setIsConfirmClearModalOpen(false);
                }}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
