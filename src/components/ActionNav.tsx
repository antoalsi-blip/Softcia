import React from 'react';
import { Users, ArrowLeftRight, HeartPulse, AlertTriangle, Sparkles, PauseCircle } from 'lucide-react';
import { MatchState, SuspensionRecord } from '../types';

interface ActionNavProps {
  state: MatchState;
  onOpenStart: () => void;
  onOpenPlayers: () => void;
  onOpenService: () => void;
  onOpenMedical: () => void;
  onOpenWarnings: () => void;
  onOpenIncidents?: () => void;
  isMedicalActive?: boolean;
  activeSuspension?: SuspensionRecord | null;
}

export const ActionNav: React.FC<ActionNavProps> = ({
  state,
  onOpenStart,
  onOpenPlayers,
  onOpenService,
  onOpenMedical,
  onOpenWarnings,
  onOpenIncidents,
  isMedicalActive = false,
  activeSuspension,
}) => {
  const warningsCount = state.warnings.length;
  const incidentsCount = (state.incidents?.length || 0) + (state.suspensions?.length || 0);
  const servingTeamText = state.currentServer === 'teamA' ? 'A' : 'B';
  const servingPlayerName = state.currentServer === 'teamA' 
    ? state.teamAPlayers[state.currentServerPlayerIndex]?.name?.split(' ')[0]
    : state.teamBPlayers[state.currentServerPlayerIndex]?.name?.split(' ')[0];

  return (
    <div className="bg-[#1e2023] px-1 sm:px-4 py-1 sm:py-1.5 border-b border-[#282a2e] shrink-0">
      <div className="flex justify-between items-center gap-0.5 sm:gap-2 max-w-4xl mx-auto">
        {/* Inicio / Sorteo */}
        <button
          onClick={onOpenStart}
          id="btn-nav-inicio"
          title="Configurar sorteo, servidor y peloteo inicial"
          className="flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg hover:bg-[#333539] active:scale-95 transition-all text-[#47d6ff] hover:text-[#8ae2ff] relative"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-[#47d6ff]" />
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-[#47d6ff]">
            Inicio
          </span>
        </button>

        {/* Jugadores */}
        <button
          onClick={onOpenPlayers}
          id="btn-nav-jugadores"
          className="flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg hover:bg-[#333539] active:scale-95 transition-all text-[#bbc9cf] hover:text-[#e2e2e8]"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-[#bbc9cf]" />
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-[#bbc9cf]">
            Jugadores
          </span>
        </button>

        {/* Servicio */}
        <button
          onClick={onOpenService}
          id="btn-nav-servicio"
          className="flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg hover:bg-[#333539] active:scale-95 transition-all text-[#bbc9cf] hover:text-[#e2e2e8] relative"
        >
          <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-[#47d6ff]" />
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-[#bbc9cf]">
            Servicio ({servingTeamText})
          </span>
          {servingPlayerName && (
            <span className="text-[7.5px] sm:text-[8px] text-[#47d6ff] truncate max-w-[45px] sm:max-w-[70px]">
              {servingPlayerName}
            </span>
          )}
        </button>

        {/* Médico */}
        <button
          onClick={onOpenMedical}
          id="btn-nav-medico"
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg active:scale-95 transition-all relative ${
            isMedicalActive
              ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
              : 'hover:bg-[#333539] text-[#bbc9cf] hover:text-[#e2e2e8]'
          }`}
        >
          <HeartPulse
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isMedicalActive ? 'text-[#ffb4ab] animate-pulse' : 'text-[#bbc9cf]'}`}
          />
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight">
            Médico
          </span>
          {isMedicalActive && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping" />
          )}
        </button>

        {/* Advertencias */}
        <button
          onClick={onOpenWarnings}
          id="btn-nav-advertencias"
          className="flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg hover:bg-[#333539] active:scale-95 transition-all text-[#bbc9cf] hover:text-[#e2e2e8] relative"
        >
          <AlertTriangle
            className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${warningsCount > 0 ? 'text-[#ffba4a]' : 'text-[#bbc9cf]'}`}
          />
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-[#bbc9cf]">
            Sanciones
          </span>
          {warningsCount > 0 && (
            <span className="absolute top-1 right-2 min-w-[13px] h-3 px-0.5 rounded-full bg-[#ffba4a] text-[#291800] text-[7.5px] font-extrabold flex items-center justify-center">
              {warningsCount}
            </span>
          )}
        </button>

        {/* Incidencias / Suspensión */}
        {onOpenIncidents && (
          <button
            onClick={onOpenIncidents}
            id="btn-nav-incidencias"
            title="Registrar incidencias arbitrales o suspender partido"
            className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-lg active:scale-95 transition-all relative ${
              activeSuspension
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                : 'hover:bg-[#333539] text-[#ffd79f] hover:text-white'
            }`}
          >
            {activeSuspension ? (
              <PauseCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-[#ffba4a]" />
            )}
            <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-tight ${activeSuspension ? 'text-amber-300' : 'text-[#ffd79f]'}`}>
              {activeSuspension ? 'Suspendido' : 'Incidencias'}
            </span>
            {incidentsCount > 0 && !activeSuspension && (
              <span className="absolute top-1 right-2 min-w-[13px] h-3 px-0.5 rounded-full bg-[#47d6ff] text-[#003544] text-[7.5px] font-extrabold flex items-center justify-center">
                {incidentsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
