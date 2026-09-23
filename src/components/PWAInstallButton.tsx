import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as standalone PWA, hide install prompt
  if (isInstalled) {
    if (variant === 'settings') {
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
    return null;
  }

  // Handle click based on platform
  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (isInstallable) {
      install();
    } else {
      // Fallback for browsers before prompt fires
      setShowIOSModal(true);
    }
  };

  // Header compact button
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Instalar App no celular ou PC"
          aria-label="Baixar ou instalar aplicativo no celular ou computador"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xs:inline">Instalar</span>
        </button>

        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Settings menu button
  if (variant === 'settings') {
    return (
      <>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 rounded-2xl text-xs text-slate-200 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white block">Instalar no Dispositivo</span>
              <span className="text-[11px] text-slate-400">Funciona offline como app nativo no celular ou PC</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            Baixar
          </span>
        </button>

        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Banner variant (shown above or below calculator)
  if (variant === 'banner' && !isDismissed) {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Instale o Custo de Vida</span>
                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                  PWA Grátis
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                Acesse direto da sua tela de início, offline e sem ocupar memória.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg"
              title="Fechar aviso"
              aria-label="Fechar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  return null;
};

// Modal for iOS Safari and other browsers needing manual step
const IOSInstallModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
          aria-label="Fechar instruções de instalação"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            {isIOS ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isIOS ? 'Como Instalar no iPhone / iPad' : 'Como Instalar no Dispositivo'}
            </h3>
            <p className="text-[11px] text-slate-400">Acesso instantâneo e offline</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                1
              </div>
              <p>
                No Safari, toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima <Share className="w-3.5 h-3.5 inline text-emerald-400" />) na barra inferior.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                2
              </div>
              <p>
                Role a tela para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />).
              </p>
            </div>

            <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                3
              </div>
              <p>
                Toque em <strong>"Adicionar"</strong> no canto superior direito. O ícone do app aparecerá na tela do seu celular!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                1
              </div>
              <p>
                No Chrome, Edge ou navegador mobile, clique no ícone de <strong>instalar (computador com seta)</strong> na barra de endereços ou abra o menu <strong>(três pontinhos)</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                2
              </div>
              <p>
                Clique em <strong>"Instalar Custo de Vida"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
