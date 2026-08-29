import React from 'react';
import { Undo2, RotateCcw, History, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export type TabType = 'live' | 'history' | 'settings';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
  isNavHidden?: boolean;
  onToggleNavHidden?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onUndo,
  onReset,
  canUndo,
  isNavHidden = false,
  onToggleNavHidden,
}) => {
  // If nav is hidden on mobile, render a subtle floating mini-bar that doesn't obstruct screen space
  if (isNavHidden) {
    return (
      <div className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 z-40 flex items-center gap-1.5 bg-[#1e2023]/95 backdrop-blur border border-[#282a2e] p-1 rounded-full shadow-2xl">
        {/* Quick Undo in floating mode */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          id="btn-floating-undo"
          title="Deshacer último punto"
          className={`flex items-center justify-center p-2 rounded-full active:scale-90 transition-all ${
            canUndo
              ? 'bg-[#111317] text-[#47d6ff] border border-[#47d6ff]/40 shadow-[0_0_8px_rgba(71,214,255,0.3)]'
              : 'bg-[#111317]/50 text-[#495057] cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Quick Settings/History */}
        <button
          onClick={() => onTabChange(activeTab === 'settings' ? 'live' : 'settings')}
          id="btn-floating-settings"
          title="Ajustes"
          className={`flex items-center justify-center p-2 rounded-full active:scale-90 transition-all ${
            activeTab === 'settings'
              ? 'bg-[#47d6ff] text-[#001f28]'
              : 'bg-[#111317] text-[#bbc9cf] hover:text-[#e2e2e8]'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Restore / Show full bar */}
        {onToggleNavHidden && (
          <button
            onClick={onToggleNavHidden}
            id="btn-floating-restore-nav"
            title="Mostrar barra de navegación completa"
            className="flex items-center gap-1 bg-[#47d6ff]/20 text-[#47d6ff] hover:bg-[#47d6ff]/30 border border-[#47d6ff]/40 px-2.5 py-1.5 rounded-full text-[10px] font-extrabold active:scale-90 transition-all"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Barra</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <nav className="bg-[#1e2023] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] shrink-0 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto z-40 flex justify-around items-center px-2 sm:px-4 py-1 sm:py-1.5 rounded-t-xl border-t border-[#282a2e] transition-all">
      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        id="btn-nav-undo"
        title="Deshacer último punto"
        className={`flex flex-col items-center justify-center py-0.5 sm:py-1 px-2.5 sm:px-3 rounded-xl active:scale-90 transition-all duration-150 ${
          canUndo
            ? 'text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]'
            : 'text-[#3c494e] opacity-40 cursor-not-allowed'
        }`}
      >
        <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[11px] font-medium mt-0.5">Undo</span>
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        id="btn-nav-reset"
        title="Reiniciar partido / juego"
        className="flex flex-col items-center justify-center text-[#bbc9cf] hover:text-[#e2e2e8] py-0.5 sm:py-1 px-2.5 sm:px-3 rounded-xl active:scale-90 transition-all duration-150 hover:bg-[#333539]"
      >
        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[11px] font-medium mt-0.5">Reset</span>
      </button>

      {/* History */}
      <button
        onClick={() => onTabChange(activeTab === 'history' ? 'live' : 'history')}
        id="btn-nav-history"
        className={`flex flex-col items-center justify-center rounded-xl py-0.5 sm:py-1 px-2.5 sm:px-3 active:scale-90 transition-all duration-150 ${
          activeTab === 'history'
            ? 'bg-[#00d2ff] text-[#001f28] shadow-[0_0_12px_rgba(0,210,255,0.4)]'
            : 'text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]'
        }`}
      >
        <History className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={activeTab === 'history' ? 2.5 : 2} />
        <span className="text-[9px] sm:text-[11px] font-bold mt-0.5">History</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => onTabChange(activeTab === 'settings' ? 'live' : 'settings')}
        id="btn-nav-settings"
        className={`flex flex-col items-center justify-center rounded-xl py-0.5 sm:py-1 px-2.5 sm:px-3 active:scale-90 transition-all duration-150 ${
          activeTab === 'settings'
            ? 'bg-[#00d2ff] text-[#001f28] shadow-[0_0_12px_rgba(0,210,255,0.4)]'
            : 'text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]'
        }`}
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
        <span className="text-[9px] sm:text-[11px] font-medium mt-0.5">Settings</span>
      </button>

      {/* Hide Bar Button */}
      {onToggleNavHidden && (
        <button
          onClick={onToggleNavHidden}
          id="btn-nav-hide"
          title="Ocultar barra inferior para ganar espacio en pantalla"
          className="flex flex-col items-center justify-center text-[#859398] hover:text-[#47d6ff] py-0.5 sm:py-1 px-2 sm:px-2.5 rounded-xl active:scale-90 transition-all duration-150 hover:bg-[#333539]"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5 text-[#859398]">Ocultar</span>
        </button>
      )}
    </nav>
  );
};

