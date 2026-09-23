import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { HelpTutorialModal } from './components/HelpTutorialModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CalculatorScreen } from './screens/CalculatorScreen';
import { ComparatorScreen } from './screens/ComparatorScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { PainelScreen } from './screens/PainelScreen';
import { ConfigScreen } from './screens/ConfigScreen';
import { Shield } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, toastMessage } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(2,6,23,1))] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden w-full max-w-full">
      <Header />
      <OfflineIndicator />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 text-xs font-black px-4 py-2 rounded-full shadow-2xl shadow-emerald-500/30 border border-emerald-400/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Shield className="w-3.5 h-3.5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-24 overflow-x-hidden sm:border-x sm:border-slate-900/80 sm:bg-slate-950/40">
        {activeTab === 'calcular' && <CalculatorScreen />}
        {activeTab === 'comparar' && <ComparatorScreen />}
        {activeTab === 'historico' && <HistoryScreen />}
        {activeTab === 'metas' && <GoalsScreen />}
        {activeTab === 'painel' && <PainelScreen />}
        {activeTab === 'config' && <ConfigScreen />}
      </main>

      <Navigation />
      <AuthModal />
      <HelpTutorialModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
