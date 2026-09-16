import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

interface POSLayoutProps {
  children: React.ReactNode;
  operatorName?: string;
  terminalCode?: string;
  sessionStatus?: 'OPEN' | 'CLOSED';
}

const POSLayout: React.FC<POSLayoutProps> = ({
  children,
  operatorName = 'Operador Padrão',
  terminalCode = 'CAIXA-01',
  sessionStatus = 'OPEN',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background-light dark:bg-background-dark text-[#0d1b14] dark:text-[#e7f3ed] select-none">
      {/* Top Touch Status Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-surface-dark/80 px-4 md:px-6 backdrop-blur-md z-30">
        {/* Brand & Terminal Info */}
        <div className="flex items-center gap-3 md:gap-5">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 p-2 text-primary hover:bg-primary/20 transition-colors"
            title="Voltar ao Painel Administrativo"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </NavLink>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-tight text-lg text-gray-900 dark:text-white">
                Gelato Manager <span className="text-primary text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10">V2 PDV</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">point_of_sale</span>
                {terminalCode}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`inline-block size-2 rounded-full ${sessionStatus === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                Caixa {sessionStatus === 'OPEN' ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Clock & Date */}
        <div className="hidden sm:flex flex-col items-center">
          <span className="font-display text-xl font-bold tracking-wider text-gray-900 dark:text-white">
            {formattedTime}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
            {formattedDate}
          </span>
        </div>

        {/* Operator & Quick Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Fullscreen Touch Button */}
          <button
            onClick={toggleFullscreen}
            type="button"
            className="hidden sm:flex size-11 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia (Kiosk)'}
          >
            <span className="material-symbols-outlined text-xl">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          {/* Operator Chip */}
          <div className="flex h-11 items-center gap-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-white text-xs font-bold">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-none text-gray-900 dark:text-white truncate max-w-[110px]">
                {operatorName}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Operador</span>
            </div>
          </div>

          {/* Quick Exit */}
          <NavLink
            to="/dashboard"
            className="flex h-11 items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 hover:bg-red-100 dark:hover:bg-red-900/50 font-bold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden md:inline">Sair PDV</span>
          </NavLink>
        </div>
      </header>

      {/* Main Touch Operation Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export { POSLayout };
export default POSLayout;
