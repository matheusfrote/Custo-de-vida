import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { showToast } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as standalone PWA, hide install prompt in header
  if (isInstalled && variant !== 'settings') {
    return null;
  }

  if (isInstalled && variant === 'settings') {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Aplicativo instalado neste dispositivo</span>
        </div>
        <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">
          Ativo
        </span>
      </div>
    );
  }

  // Handle direct automatic system download without opening any modal box
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Trigger native browser PWA install prompt if supported/available
    if (isInstallable) {
      install().catch(() => {});
    }

    // 2. Automatically initiate the direct system download
    try {
      const link = document.createElement('a');
      link.href = '/Custo-de-Vida-Sistema.html';
      link.setAttribute('download', 'Custo-de-Vida-Sistema.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Download do sistema iniciado com sucesso!');
    } catch (err) {
      window.location.href = '/Custo-de-Vida-Sistema.html';
    }
  };

  // Header compact button
  if (variant === 'header') {
    return (
      <button
        onClick={handleClick}
        title="Baixar sistema Custo de Vida"
        aria-label="Baixar aplicativo no celular ou computador"
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden xs:inline">Baixar App</span>
      </button>
    );
  }

  // Settings menu button
  if (variant === 'settings') {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 rounded-2xl text-xs text-slate-200 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white block">Baixar Sistema / App</span>
            <span className="text-[11px] text-slate-400">Download direto do aplicativo para celular ou PC</span>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          Baixar
        </span>
      </button>
    );
  }

  // Banner variant
  if (variant === 'banner' && !isDismissed) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Baixar Custo de Vida</span>
              <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                Offline
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              Baixe o sistema completo no seu dispositivo para acesso rápido e offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleClick}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer"
            title="Fechar aviso"
            aria-label="Fechar aviso de download"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
