import React from 'react';
import { Clock, Activity } from 'lucide-react';
import { MatchSettings, PointRecord, SetScore, Team } from '../types';

interface PreviousSetsProps {
  sets: SetScore[];
  currentSetIndex: number;
  settings?: MatchSettings;
  matchWinner?: Team | null;
  pointHistory?: PointRecord[];
}

export const formatSetDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const PreviousSets: React.FC<PreviousSetsProps> = ({
  sets,
  currentSetIndex,
  settings,
  matchWinner,
  pointHistory = [],
}) => {
  const totalSets = settings?.bestOfSets || 3;
  const setSlots = Array.from({ length: totalSets }, (_, i) => i + 1);

  // Helper to calculate total points played in a specific set from pointHistory if not in setScore
  const getSetPointsCount = (setNum: number, set?: SetScore): number => {
    if (set?.pointsCount !== undefined && set.pointsCount > 0) {
      return set.pointsCount;
    }
    const setIdx = setNum - 1;
    return pointHistory.filter((pt) => (pt.scoreAfter.setIndex || 0) === setIdx).length;
  };

  return (
    <section
      id="previous-sets-section"
      className="bg-[#1e2023] rounded-xl p-2 sm:p-2.5 interactive-shadow flex flex-col gap-1 border border-[#282a2e]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333539] pb-1 px-1">
        <h2 className="font-bold text-[10px] sm:text-xs text-[#bbc9cf] uppercase tracking-wider">
          Sets del Partido
        </h2>
        <span className="text-[9px] sm:text-[10px] text-[#bbc9cf] font-mono">
          {matchWinner ? 'Partido finalizado' : `Set en juego: #${currentSetIndex + 1}`}
        </span>
      </div>

      {/* Column Headers for perfect alignment */}
      <div className="grid grid-cols-12 items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-[#748288] uppercase tracking-wider border-b border-[#282a2e]/60">
        <div className="col-span-4">Set / Estado</div>
        <div className="col-span-3 text-center">Tiempo</div>
        <div className="col-span-2 text-center">Puntos</div>
        <div className="col-span-3 text-right">Resultado</div>
      </div>

      {/* List of sets: All sets in a single line of equal size */}
      <div className="flex flex-col gap-1">
        {setSlots.map((setNum) => {
          const setIndex = setNum - 1;
          const set = sets.find((s) => s.setNumber === setNum);
          const isSuperTie =
            settings?.matchFormat === 'two_sets_super_tie' && setNum === 3;

          const isCurrent =
            setIndex === currentSetIndex && !set?.isCompleted && !matchWinner;
          const isCompleted = Boolean(set?.isCompleted);
          const isUnplayed = !set || (!isCompleted && !isCurrent);
          const isNotRequired = matchWinner && !isCompleted && !isCurrent;

          const isTeamAWinner = isCompleted && (set?.teamA || 0) > (set?.teamB || 0);
          const isTeamBWinner = isCompleted && (set?.teamB || 0) > (set?.teamA || 0);

          const pointsCount = isUnplayed || isNotRequired ? 0 : getSetPointsCount(setNum, set);
          const durationFormatted = formatSetDuration(set?.durationSeconds);

          return (
            <div
              key={setNum}
              id={`set-row-${setNum}`}
              className={`grid grid-cols-12 items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg min-h-[38px] sm:min-h-[40px] transition-all ${
                isCurrent
                  ? isSuperTie
                    ? 'bg-[#ffba4a]/10 border border-[#ffba4a]/40 shadow-[0_0_12px_rgba(255,186,74,0.15)]'
                    : 'bg-[#47d6ff]/10 border border-[#47d6ff]/35 shadow-[0_0_12px_rgba(71,214,255,0.15)]'
                  : isCompleted
                  ? 'bg-[#16181b] border border-[#282a2e] text-[#e2e2e8]'
                  : 'bg-[#15171a]/50 border border-[#202226] text-[#555e64] opacity-60'
              }`}
            >
              {/* Col 1: Set name & status badge */}
              <div className="col-span-4 flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span
                  className={`font-bold text-xs sm:text-sm truncate ${
                    isCurrent
                      ? isSuperTie
                        ? 'text-[#ffba4a]'
                        : 'text-[#47d6ff]'
                      : isCompleted
                      ? 'text-[#e2e2e8]'
                      : 'text-[#5a626a]'
                  }`}
                >
                  {isSuperTie ? `Set ${setNum} (STB)` : `Set ${setNum}`}
                </span>

                {/* Status Badge */}
                {isCurrent && (
                  <span
                    className={`px-1 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-extrabold tracking-wider border shrink-0 animate-pulse ${
                      isSuperTie
                        ? 'bg-[#ffba4a]/20 text-[#ffba4a] border-[#ffba4a]/50'
                        : 'bg-[#47d6ff]/20 text-[#47d6ff] border-[#47d6ff]/50'
                    }`}
                  >
                    {isSuperTie ? 'STB' : 'ACTIVO'}
                  </span>
                )}

                {isCompleted && (
                  <span className="px-1 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-bold text-[#859398] bg-[#111317] border border-[#282a2e] shrink-0">
                    FIN
                  </span>
                )}

                {isNotRequired && (
                  <span className="px-1 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-medium text-[#495057] bg-[#111317] border border-[#202226] shrink-0">
                    NO REQ
                  </span>
                )}

                {isUnplayed && !isNotRequired && (
                  <span className="px-1 py-0.2 rounded text-[7.5px] sm:text-[8.5px] font-medium text-[#555e64] bg-[#111317]/80 border border-[#202226] shrink-0">
                    PEND.
                  </span>
                )}
              </div>

              {/* Col 2: Tiempo de juego */}
              <div
                className="col-span-3 flex items-center justify-center gap-1 font-mono text-[10px] sm:text-xs"
                title="Tiempo de juego del set"
              >
                <Clock
                  className={`w-3 h-3 shrink-0 ${
                    isCurrent
                      ? isSuperTie
                        ? 'text-[#ffba4a]'
                        : 'text-[#47d6ff]'
                      : isCompleted
                      ? 'text-[#859398]'
                      : 'text-[#4a5259]'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isCurrent
                      ? isSuperTie
                        ? 'text-[#ffba4a]'
                        : 'text-[#47d6ff]'
                      : isCompleted
                      ? 'text-[#e2e2e8]'
                      : 'text-[#4a5259]'
                  }`}
                >
                  {isUnplayed || isNotRequired ? '--:--' : durationFormatted}
                </span>
              </div>

              {/* Col 3: Puntos jugados */}
              <div
                className="col-span-2 flex items-center justify-center gap-1 font-mono text-[10px] sm:text-xs"
                title="Puntos disputados en el set"
              >
                <Activity
                  className={`w-3 h-3 shrink-0 ${
                    isCurrent
                      ? isSuperTie
                        ? 'text-[#ffba4a]'
                        : 'text-[#47d6ff]'
                      : isCompleted
                      ? 'text-[#859398]'
                      : 'text-[#4a5259]'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isCurrent
                      ? isSuperTie
                        ? 'text-[#ffba4a]'
                        : 'text-[#47d6ff]'
                      : isCompleted
                      ? 'text-[#e2e2e8]'
                      : 'text-[#4a5259]'
                  }`}
                >
                  {isUnplayed || isNotRequired ? '--' : `${pointsCount}p`}
                </span>
              </div>

              {/* Col 4: Marcador del Set */}
              <div className="col-span-3 flex items-center justify-end gap-1 font-mono font-bold text-xs sm:text-sm">
                {isUnplayed || isNotRequired ? (
                  <div className="flex items-center gap-1 text-[#4a5259]">
                    <span>-</span>
                    <span className="font-normal opacity-50">:</span>
                    <span>-</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span
                      className={`${
                        isCurrent
                          ? (set?.tiebreakA ?? set?.teamA ?? 0) > (set?.tiebreakB ?? set?.teamB ?? 0)
                            ? 'text-[#47d6ff] font-extrabold'
                            : 'text-[#e2e2e8]'
                          : isTeamAWinner
                          ? 'text-[#47d6ff] font-extrabold'
                          : 'text-[#bbc9cf]'
                      }`}
                    >
                      {set?.isSuperTiebreak && set?.tiebreakA !== undefined
                        ? set.tiebreakA
                        : set?.teamA ?? 0}
                    </span>
                    <span className="text-[#6c767e] font-normal text-xs">-</span>
                    <span
                      className={`${
                        isCurrent
                          ? (set?.tiebreakB ?? set?.teamB ?? 0) > (set?.tiebreakA ?? set?.teamA ?? 0)
                            ? 'text-[#47d6ff] font-extrabold'
                            : 'text-[#e2e2e8]'
                          : isTeamBWinner
                          ? 'text-[#47d6ff] font-extrabold'
                          : 'text-[#bbc9cf]'
                      }`}
                    >
                      {set?.isSuperTiebreak && set?.tiebreakB !== undefined
                        ? set.tiebreakB
                        : set?.teamB ?? 0}
                    </span>

                    {/* Tiebreak score annotation if completed */}
                    {set && set.tiebreakA !== undefined && set.tiebreakB !== undefined && isCompleted && !set.isSuperTiebreak && (
                      <span className="text-[8.5px] text-[#ffd79f] font-mono ml-0.5">
                        ({Math.min(set.tiebreakA, set.tiebreakB)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
