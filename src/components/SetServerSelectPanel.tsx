import React from 'react';
import { ArrowLeftRight, UserCheck, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { MatchState, Team } from '../types';

interface SetServerSelectPanelProps {
  state: MatchState;
  servingTeam: Team;
  setNumber: number;
  isFirstGameOfSet: boolean;
  isSecondGameOfSet: boolean;
  onSelectServer: (team: Team, playerIndex: 0 | 1) => void;
}

export const SetServerSelectPanel: React.FC<SetServerSelectPanelProps> = ({
  state,
  servingTeam,
  setNumber,
  isFirstGameOfSet,
  isSecondGameOfSet,
  onSelectServer,
}) => {
  const teamName = servingTeam === 'teamA' ? state.teamAName : state.teamBName;
  const players = servingTeam === 'teamA' ? state.teamAPlayers : state.teamBPlayers;

  // Specific contextual descriptions
  let headerTitle = `Elección de Saque • Set ${setNumber}`;
  let gameTag = isFirstGameOfSet ? '1er Juego' : isSecondGameOfSet ? '2º Juego' : 'Nuevo Juego';
  let explanation = `Selecciona qué jugador de ${teamName} realizará el saque para fijar el orden de servicio en este set:`;

  if (setNumber === 1 && isSecondGameOfSet) {
    headerTitle = `Set 1, Juego 2 • Elección de Saque`;
    explanation = `Primer juego al saque para ${teamName}. Elige qué jugador iniciará el servicio de su equipo en este 1er Set:`;
  } else if (isFirstGameOfSet) {
    headerTitle = `Set ${setNumber}, 1er Juego • Elección de Saque`;
    explanation = `Inicio de set: ${teamName} elige qué jugador comenzará sacando en el Set ${setNumber}:`;
  } else if (isSecondGameOfSet) {
    headerTitle = `Set ${setNumber}, 2º Juego • Elección de Saque`;
    explanation = `Primer turno de saque para ${teamName} en el Set ${setNumber}. Elige el servidor:`;
  }

  return (
    <section
      id="set-server-select-panel-section"
      className="bg-[#1e2023] rounded-xl p-2 sm:p-2.5 interactive-shadow flex flex-col gap-2 border-2 border-[#47d6ff]/50 shadow-[0_0_24px_rgba(71,214,255,0.15)] animate-in fade-in duration-200"
    >
      {/* Header bar matching PointTypeControls style */}
      <div className="flex items-center justify-between border-b border-[#333539] pb-1 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#47d6ff] animate-pulse shrink-0" />
          <div className="flex items-center gap-1.5 truncate">
            <h2 className="font-bold text-[10px] sm:text-xs text-[#47d6ff] uppercase tracking-wider truncate">
              {headerTitle}
            </h2>
            <span className="hidden xs:inline text-[9px] px-1.5 py-0.2 rounded-sm bg-[#47d6ff]/15 text-[#47d6ff] font-bold border border-[#47d6ff]/30">
              {gameTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#ffee00]/15 text-[#ffee00] border border-[#ffee00]/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span className="truncate">{teamName} al saque</span>
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-[#16181b] px-2.5 py-1.5 rounded-lg border border-[#282a2e] text-[10px] sm:text-[11px] text-[#bbc9cf] leading-snug flex items-center gap-1.5">
        <ArrowLeftRight className="w-3.5 h-3.5 text-[#47d6ff] shrink-0" />
        <span className="truncate">{explanation}</span>
      </div>

      {/* Two Player Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 items-stretch">
        {/* Player 1 (Index 0) */}
        <div className="bg-[#16181b] rounded-lg p-2 sm:p-2.5 border-2 border-[#282a2e] hover:border-[#47d6ff]/80 transition-all flex flex-col justify-between gap-2 shadow-xs group">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#859398] flex items-center gap-1 group-hover:text-[#47d6ff] transition-colors truncate">
                <UserCheck className="w-3 h-3 shrink-0" />
                Jugador 1
              </span>
              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-[#1e2023] text-[#bbc9cf] border border-[#282a2e] font-semibold">
                {players[0]?.position === 'drive' ? 'Drive' : 'Revés'}
              </span>
            </div>

            <div className="font-bold text-xs sm:text-sm text-[#e2e2e8] group-hover:text-[#47d6ff] transition-colors truncate">
              {players[0]?.name || 'Jugador 1'}
            </div>

            <div className="text-[9px] text-[#859398] mt-0.5">
              {players[0]?.hand === 'left' ? 'Zurdo' : 'Diestro'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectServer(servingTeam, 0)}
            id={`btn-select-inline-server-${servingTeam}-0`}
            className="w-full py-1.5 px-2 rounded-lg bg-[#47d6ff] hover:bg-[#38bde6] text-[#001f28] text-center font-extrabold text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="truncate">Sacar con {players[0]?.name?.split(' ')[0] || 'Jugador 1'}</span>
          </button>
        </div>

        {/* Player 2 (Index 1) */}
        <div className="bg-[#16181b] rounded-lg p-2 sm:p-2.5 border-2 border-[#282a2e] hover:border-[#47d6ff]/80 transition-all flex flex-col justify-between gap-2 shadow-xs group">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#859398] flex items-center gap-1 group-hover:text-[#47d6ff] transition-colors truncate">
                <UserCheck className="w-3 h-3 shrink-0" />
                Jugador 2
              </span>
              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-[#1e2023] text-[#bbc9cf] border border-[#282a2e] font-semibold">
                {players[1]?.position === 'drive' ? 'Drive' : 'Revés'}
              </span>
            </div>

            <div className="font-bold text-xs sm:text-sm text-[#e2e2e8] group-hover:text-[#47d6ff] transition-colors truncate">
              {players[1]?.name || 'Jugador 2'}
            </div>

            <div className="text-[9px] text-[#859398] mt-0.5">
              {players[1]?.hand === 'left' ? 'Zurdo' : 'Diestro'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectServer(servingTeam, 1)}
            id={`btn-select-inline-server-${servingTeam}-1`}
            className="w-full py-1.5 px-2 rounded-lg bg-[#47d6ff] hover:bg-[#38bde6] text-[#001f28] text-center font-extrabold text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="truncate">Sacar con {players[1]?.name?.split(' ')[0] || 'Jugador 2'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-1.5 px-1 text-[9px] text-[#859398]">
        <Shield className="w-3 h-3 text-[#47d6ff] shrink-0" />
        <span className="truncate">
          Regla FIP: el orden se alternará automáticamente en los siguientes juegos del Set {setNumber}.
        </span>
      </div>
    </section>
  );
};
