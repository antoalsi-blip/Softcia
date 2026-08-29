import React from 'react';
import { AlertTriangle, CircleDot, PanelBottomClose, PanelBottomOpen, PauseCircle, Trophy } from 'lucide-react';
import { Logo } from './Logo';
import { SuspensionRecord } from '../types';

interface TopAppBarProps {
  onOpenMatchInfo?: () => void;
  onOpenIncidents?: () => void;
  tournamentName?: string;
  tournamentRound?: string;
  isLive?: boolean;
  isNavHidden?: boolean;
  onToggleNavHidden?: () => void;
  activeSuspension?: SuspensionRecord | null;
  incidentsCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenMatchInfo,
  onOpenIncidents,
  tournamentName,
  tournamentRound,
  isLive = true,
  isNavHidden = false,
  onToggleNavHidden,
  activeSuspension,
  incidentsCount = 0,
}) => {
  const hasTournamentInfo = Boolean(tournamentName || tournamentRound);

  return (
    <header className="bg-[#111317] flex items-center justify-between px-2.5 sm:px-4 w-full h-10 sm:h-11 shrink-0 z-20 relative border-b border-[#1e2023] gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          onClick={onOpenMatchInfo}
          className="flex items-center gap-1 text-[#47d6ff] hover:opacity-80 transition-opacity p-1 rounded-lg shrink-0"
          title="Detalles del partido y torneo"
          id="btn-top-match-info"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-[#47d6ff]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Padel racket SVG */}
            <circle cx="12" cy="9" r="6" />
            <line x1="12" y1="15" x2="12" y2="22" />
            <path d="M10 22h4" />
            <circle cx="10" cy="8" r="0.8" fill="currentColor" />
            <circle cx="14" cy="8" r="0.8" fill="currentColor" />
            <circle cx="12" cy="10" r="0.8" fill="currentColor" />
          </svg>
        </button>

        <Logo height={24} />

        {hasTournamentInfo && (
          <button
            onClick={onOpenMatchInfo}
            className="hidden sm:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#ffd79f]/10 border border-[#ffd79f]/30 text-[#ffd79f] text-[9px] sm:text-[10px] font-bold truncate max-w-[110px] sm:max-w-[200px] md:max-w-[280px] hover:bg-[#ffd79f]/20 transition-all text-left"
            title={`${tournamentName || ''} ${tournamentRound ? `(${tournamentRound})` : ''}`}
          >
            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#ffd79f] shrink-0" />
            <span className="truncate">
              {tournamentName}
              {tournamentName && tournamentRound ? ' • ' : ''}
              {tournamentRound}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Incidencias & Suspensión Button */}
        {onOpenIncidents && (
          <button
            onClick={onOpenIncidents}
            id="btn-top-incidents"
            title="Incidencias arbitrales y Suspensión de partido"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all border active:scale-95 ${
              activeSuspension
                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-[#1e2023] text-[#ffd79f] hover:text-white border-[#ffba4a]/40 hover:bg-[#282a2e]'
            }`}
          >
            {activeSuspension ? (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-black" />
                <span>SUSPENDIDO</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-[#ffba4a]" />
                <span>Incidencias</span>
                {incidentsCount > 0 && (
                  <span className="ml-0.5 bg-[#47d6ff]/20 text-[#47d6ff] text-[9px] px-1 py-0.2 rounded-full font-mono">
                    {incidentsCount}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        {isLive && !activeSuspension && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-[#ffee00]/15 text-[#ffee00] border border-[#ffee00]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffee00] animate-pulse"></span>
            LIVE
          </span>
        )}

        {/* Toggle Nav Bar Button (Mobile Focus Mode) */}
        {onToggleNavHidden && (
          <button
            onClick={onToggleNavHidden}
            id="btn-toggle-nav-visibility"
            title={isNavHidden ? 'Mostrar barra de navegación' : 'Ocultar barra de navegación (Modo Celular)'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all border ${
              isNavHidden
                ? 'bg-[#47d6ff]/15 text-[#47d6ff] border-[#47d6ff]/40 shadow-[0_0_8px_rgba(71,214,255,0.25)]'
                : 'bg-[#1e2023] text-[#bbc9cf] hover:text-[#e2e2e8] border-[#282a2e] hover:bg-[#2a2c30]'
            }`}
          >
            {isNavHidden ? (
              <>
                <PanelBottomOpen className="w-3.5 h-3.5 text-[#47d6ff]" />
                <span className="hidden xs:inline">Mostrar Barra</span>
              </>
            ) : (
              <>
                <PanelBottomClose className="w-3.5 h-3.5 text-[#bbc9cf]" />
                <span className="hidden xs:inline">Ocultar Barra</span>
              </>
            )}
          </button>
        )}

        <span className="text-[10px] text-[#859398] font-mono font-medium flex items-center gap-1 ml-0.5">
          <CircleDot className="w-2.5 h-2.5 text-[#47d6ff]" />
          FIP
        </span>
      </div>
    </header>
  );
};



