import React from 'react';
import { Hourglass, HelpCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const { user, setIsAuthModalOpen, setIsHelpModalOpen } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Hourglass className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Custo de Vida
          </span>
        </div>

        {/* Right buttons: Install App, Help (?), and User */}
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />

          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Como funciona o Custo de Vida?"
            aria-label="Abrir guia explicativo e metodologia"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {user.isLoggedIn ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-colors"
              aria-label={`Perfil de ${user.name}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-400 transition-colors"
              aria-label="Entrar ou criar conta"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
