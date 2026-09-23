import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/30 animate-in fade-in slide-in-from-top-3">
      <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
      <span>Modo Offline — O app funciona 100% com dados locais.</span>
    </div>
  );
};
