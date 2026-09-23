import React from 'react';
import {
  Calculator,
  ArrowLeftRight,
  History,
  Flag,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'calcular', label: 'Calcular', icon: Calculator },
    { id: 'comparar', label: 'Comparar', icon: ArrowLeftRight },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'metas', label: 'Metas', icon: Flag },
    { id: 'painel', label: 'Painel', icon: LayoutGrid },
    { id: 'config', label: 'Config', icon: SlidersHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-900 pb-safe">
      <div className="max-w-md mx-auto sm:border-x sm:border-slate-900 flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={`Aba ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive ? (
                <div className="w-10 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-0.5">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="w-10 h-7 flex items-center justify-center mb-0.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <span className={`text-[10px] tracking-tight ${isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
