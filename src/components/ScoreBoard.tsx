import React from 'react';
import { MatchState, Team } from '../types';
import { getBallChangeStatus } from '../utils/padelRules';

interface ScoreBoardProps {
  state: MatchState;
  onScorePoint: (team: Team) => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ state, onScorePoint }) => {
  const isSwapped = Boolean(state.sidesSwapped);
  const ballStatus = getBallChangeStatus(state);

  const leftTeamKey: Team = isSwapped ? 'teamB' : 'teamA';
  const rightTeamKey: Team = isSwapped ? 'teamA' : 'teamB';

  const isLeftServing = state.currentServer === leftTeamKey;
  const isRightServing = state.currentServer === rightTeamKey;

  const currentSet = state.sets[state.currentSetIndex];
  const gamesLeft = leftTeamKey === 'teamA' ? currentSet?.teamA || 0 : currentSet?.teamB || 0;
  const gamesRight = rightTeamKey === 'teamA' ? currentSet?.teamA || 0 : currentSet?.teamB || 0;

  const displayScoreLeft = state.isTiebreak
    ? String(leftTeamKey === 'teamA' ? state.tiebreakA : state.tiebreakB)
    : leftTeamKey === 'teamA'
    ? state.pointsA
    : state.pointsB;

  const displayScoreRight = state.isTiebreak
    ? String(rightTeamKey === 'teamA' ? state.tiebreakA : state.tiebreakB)
    : rightTeamKey === 'teamA'
    ? state.pointsA
    : state.pointsB;

  const leftTeamName = leftTeamKey === 'teamA' ? state.teamAName : state.teamBName;
  const rightTeamName = rightTeamKey === 'teamA' ? state.teamAName : state.teamBName;

  const leftPlayers = leftTeamKey === 'teamA' ? state.teamAPlayers : state.teamBPlayers;
  const rightPlayers = rightTeamKey === 'teamA' ? state.teamAPlayers : state.teamBPlayers;

  return (
    <section className="flex flex-col gap-2">
      {/* Ball Status Sub-bar: positioned below the timers and before the match results / score cards */}
      {ballStatus.enabled && (
        <div
          className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-[9px] sm:text-[10px] transition-all duration-200 min-h-[28px] ${
            ballStatus.isChangeDueNow && !state.matchWinner
              ? 'bg-[#ffee00]/20 border-[#ffee00] text-[#ffee00] shadow-[0_0_12px_rgba(255,238,0,0.25)] ring-1 ring-[#ffee00]/40 animate-pulse'
              : 'bg-[#16181b]/70 border-[#282a2e]/60 text-[#859398]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] shrink-0 ${ballStatus.isChangeDueNow && !state.matchWinner ? 'animate-bounce' : ''}`}>
              🎾
            </span>
            <span
              className={`font-bold uppercase tracking-wider truncate ${
                ballStatus.isChangeDueNow && !state.matchWinner
                  ? 'text-[#ffee00] font-extrabold'
                  : 'text-[#bbc9cf]'
              }`}
            >
              {ballStatus.isChangeDueNow && !state.matchWinner
                ? '¡CAMBIO DE BOLAS!'
                : ballStatus.badgeText}
            </span>
            {!ballStatus.isChangeDueNow && ballStatus.schedulePreview.length > 0 && (
              <span className="hidden sm:inline text-[#748288] text-[8.5px] truncate">
                (Próx: {ballStatus.schedulePreview.slice(0, 3).join(', ')} jgs)
              </span>
            )}
          </div>
          <span
            className={`font-mono text-[8.5px] sm:text-[9.5px] shrink-0 font-bold ${
              ballStatus.isChangeDueNow && !state.matchWinner
                ? 'text-[#ffee00]'
                : 'text-[#859398]'
            }`}
          >
            {ballStatus.isChangeDueNow && !state.matchWinner
              ? '🎾 Juego con bolas nuevas'
              : ballStatus.detailText}
          </span>
        </div>
      )}

      {/* Tiebreak or Super Tiebreak banner */}
      {state.isTiebreak && (
        <div
          className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider animate-pulse ${
            state.isSuperTiebreak ||
            (state.settings.matchFormat === 'two_sets_super_tie' && state.currentSetIndex === 2)
              ? 'bg-[#ffba4a]/20 border border-[#ffba4a] text-[#ffba4a] shadow-[0_0_14px_rgba(255,186,74,0.3)]'
              : 'bg-[#ffba4a]/15 border border-[#ffba4a]/40 text-[#ffba4a]'
          }`}
        >
          <span>
            {state.isSuperTiebreak ||
            (state.settings.matchFormat === 'two_sets_super_tie' && state.currentSetIndex === 2)
              ? '⭐ SUPER TIE-BREAK A 10 PUNTOS (3º SET DECISIVO)'
              : `🎾 TIE-BREAK (${state.settings.tiebreakPoints} PTS)`}
          </span>
        </div>
      )}

      {/* Banner de Estado del Juego / Desempate */}
      {!state.isTiebreak && (
        <>
          {/* Golden Point */}
          {state.settings.scoringMode === 'golden_point' && state.pointsA === '40' && state.pointsB === '40' && (
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(71,214,255,0.2)]">
              <span>🥇 PUNTO DE ORO - ¡PUNTO DECISIVO!</span>
            </div>
          )}

          {/* Star Point Mode */}
          {state.settings.scoringMode === 'star_point' && (
            <>
              {/* Deuce 1 */}
              {(state.pointsA === 'deuce 1' && state.pointsB === 'deuce 1') && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider">
                  <span>⚡ DEUCE 1 (Primer 40 iguales)</span>
                </div>
              )}

              {/* Ventaja 1 (AD 1) */}
              {(state.pointsA === 'AD 1' || state.pointsB === 'AD 1') && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider">
                  <span>
                    ⚡ VENTAJA AD 1 - {state.pointsA === 'AD 1' ? state.teamAName : state.teamBName}
                  </span>
                </div>
              )}

              {/* Deuce 2 */}
              {(state.pointsA === 'deuce 2' && state.pointsB === 'deuce 2') && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#ffd79f]/15 border border-[#ffd79f]/40 rounded-lg text-[#ffd79f] text-xs font-bold uppercase tracking-wider">
                  <span>⚡ DEUCE 2 (Segundo 40 iguales)</span>
                </div>
              )}

              {/* Ventaja 2 (AD 02) */}
              {(state.pointsA === 'AD 02' || state.pointsB === 'AD 02' || state.pointsA === 'AD 2' || state.pointsB === 'AD 2') && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#ffd79f]/15 border border-[#ffd79f]/40 rounded-lg text-[#ffd79f] text-xs font-bold uppercase tracking-wider">
                  <span>
                    ⚡ VENTAJA AD 02 - {state.pointsA === 'AD 02' || state.pointsA === 'AD 2' ? state.teamAName : state.teamBName} (Si empata activa SP)
                  </span>
                </div>
              )}

              {/* SP (Star Point) */}
              {((state.pointsA === 'SP' && state.pointsB === 'SP') || state.isStarPoint) && (
                <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-[#ffba4a]/20 border border-[#ffba4a] rounded-lg text-[#ffba4a] text-xs font-extrabold uppercase tracking-wider shadow-[0_0_14px_rgba(255,186,74,0.4)] animate-pulse">
                  <span>⭐ SP (STAR POINT) - ¡PUNTO DECISIVO!</span>
                </div>
              )}

              {/* 40-40 fallback if any */}
              {state.pointsA === '40' && state.pointsB === '40' && !state.isStarPoint && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider">
                  <span>⚡ DEUCE 1</span>
                </div>
              )}
            </>
          )}

          {/* Advantage standard mode */}
          {state.settings.scoringMode === 'advantage' && (
            <>
              {state.pointsA === '40' && state.pointsB === '40' && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider">
                  <span>⚡ DEUCE (VENTAJAS)</span>
                </div>
              )}
              {(state.pointsA === 'AD' || state.pointsB === 'AD') && (
                <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#47d6ff]/15 border border-[#47d6ff]/40 rounded-lg text-[#47d6ff] text-xs font-bold uppercase tracking-wider">
                  <span>
                    ⚡ VENTAJA {state.pointsA === 'AD' ? state.teamAName : state.teamBName}
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Two main score cards aligned with Left/Right Court sides */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 h-28 xs:h-32 sm:h-36 md:h-44 lg:h-48">
        {/* Left Side Court Card */}
        <button
          onClick={() => onScorePoint(leftTeamKey)}
          id={`score-card-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
          className={`bg-[#1e2023] rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 active:scale-95 group text-left p-1.5 sm:p-2 ${
            isLeftServing ? 'score-active-glow' : 'score-inactive hover:border-[#3c494e]'
          }`}
        >
          {/* Games & Side badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1">
            <div className="bg-[#111317] border border-[#282a2e] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[11px] font-bold text-[#bbc9cf]">
              J: <span className="text-[#47d6ff]">{gamesLeft}</span>
            </div>
            <span className="text-[7.5px] sm:text-[9px] font-mono text-[#859398] uppercase tracking-wider hidden xs:inline">
              Izq
            </span>
          </div>

          {/* Team Name */}
          <div
            className={`absolute top-1.5 sm:top-2.5 left-0 right-0 text-center font-bold text-[11px] sm:text-sm uppercase tracking-wide truncate px-5 sm:px-6 ${
              isLeftServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
            }`}
          >
            {leftTeamName}
          </div>

          {/* Players sub-line */}
          <div className="absolute top-5 sm:top-7 text-[8px] sm:text-[10px] text-[#859398] truncate max-w-[85%] text-center">
            {leftPlayers[0]?.name || 'J1'} • {leftPlayers[1]?.name || 'J2'}
          </div>

          {/* Display Score */}
          <div
            className={`font-display-score font-extrabold my-auto select-none ${
              displayScoreLeft.length > 4
                ? 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight'
                : displayScoreLeft.length > 2
                ? 'text-3xl xs:text-4xl sm:text-5xl md:text-6xl'
                : 'text-4xl xs:text-5xl sm:text-6xl md:text-7xl'
            } ${
              isLeftServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
            }`}
          >
            {displayScoreLeft}
          </div>

          {/* Serving indicator ball / dot */}
          {isLeftServing && (
            <div className="absolute bottom-1.5 sm:bottom-2 flex items-center gap-1 sm:gap-1.5 bg-[#47d6ff]/10 border border-[#47d6ff]/30 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#47d6ff] shadow-[0_0_8px_#47d6ff] animate-pulse" />
              <span className="text-[7.5px] sm:text-[9px] uppercase font-extrabold text-[#47d6ff] tracking-wider">
                {state.firstServe ? '1er Saque' : '2do Saque'}
              </span>
            </div>
          )}
        </button>

        {/* Right Side Court Card */}
        <button
          onClick={() => onScorePoint(rightTeamKey)}
          id={`score-card-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
          className={`bg-[#1e2023] rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 active:scale-95 group text-left p-1.5 sm:p-2 ${
            isRightServing ? 'score-active-glow' : 'score-inactive hover:border-[#3c494e]'
          }`}
        >
          {/* Games & Side badge */}
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1">
            <span className="text-[7.5px] sm:text-[9px] font-mono text-[#859398] uppercase tracking-wider hidden xs:inline">
              Der
            </span>
            <div className="bg-[#111317] border border-[#282a2e] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[11px] font-bold text-[#bbc9cf]">
              J: <span className="text-[#47d6ff]">{gamesRight}</span>
            </div>
          </div>

          {/* Team Name */}
          <div
            className={`absolute top-1.5 sm:top-2.5 left-0 right-0 text-center font-bold text-[11px] sm:text-sm uppercase tracking-wide truncate px-5 sm:px-6 ${
              isRightServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
            }`}
          >
            {rightTeamName}
          </div>

          {/* Players sub-line */}
          <div className="absolute top-5 sm:top-7 text-[8px] sm:text-[10px] text-[#859398] truncate max-w-[85%] text-center">
            {rightPlayers[0]?.name || 'J1'} • {rightPlayers[1]?.name || 'J2'}
          </div>

          {/* Display Score */}
          <div
            className={`font-display-score font-extrabold my-auto select-none ${
              displayScoreRight.length > 4
                ? 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight'
                : displayScoreRight.length > 2
                ? 'text-3xl xs:text-4xl sm:text-5xl md:text-6xl'
                : 'text-4xl xs:text-5xl sm:text-6xl md:text-7xl'
            } ${
              isRightServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
            }`}
          >
            {displayScoreRight}
          </div>

          {/* Serving indicator ball / dot */}
          {isRightServing && (
            <div className="absolute bottom-1.5 sm:bottom-2 flex items-center gap-1 sm:gap-1.5 bg-[#47d6ff]/10 border border-[#47d6ff]/30 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#47d6ff] shadow-[0_0_8px_#47d6ff] animate-pulse" />
              <span className="text-[7.5px] sm:text-[9px] uppercase font-extrabold text-[#47d6ff] tracking-wider">
                {state.firstServe ? '1er Saque' : '2do Saque'}
              </span>
            </div>
          )}
        </button>
      </div>
    </section>
  );
};
