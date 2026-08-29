import React, { useEffect, useRef, useState } from 'react';
import { PointRecord, Team } from '../types';

interface PuntoAPuntoProps {
  pointHistory: PointRecord[];
  teamAName: string;
  teamBName: string;
  pointsA: string;
  pointsB: string;
  isTiebreak: boolean;
  currentSetIndex?: number;
  currentSetGamesCount?: number;
}

export interface GameGroup {
  gameNumber: number; // 1-indexed total game of the match
  gameNumberInSet?: number; // 1-indexed game of the set
  setNumber: number; // Set number (1, 2, 3...)
  points: PointRecord[];
  isCompleted: boolean;
  winner?: Team;
  isTiebreak?: boolean;
  scoreAfterGame?: {
    gamesA: number;
    gamesB: number;
    setIndex: number;
    isTiebreak: boolean;
  };
}

const setOrdinalsSpanish: Record<number, string> = {
  1: 'primer',
  2: 'segundo',
  3: 'tercer',
  4: 'cuarto',
  5: 'quinto',
};

export const getSetOrdinalSpanish = (setNum: number): string => {
  return setOrdinalsSpanish[setNum] || `${setNum}º`;
};

/**
 * Groups raw point history into sequential games played in the match
 */
export function groupPointsByGame(pointHistory: PointRecord[]): GameGroup[] {
  const games: GameGroup[] = [];
  let currentGamePoints: PointRecord[] = [];
  let currentGameNumber = 1;

  for (const pt of pointHistory) {
    currentGamePoints.push(pt);

    if (pt.gameWon) {
      games.push({
        gameNumber: currentGameNumber,
        setNumber: (pt.scoreAfter.setIndex || 0) + 1,
        points: [...currentGamePoints],
        isCompleted: true,
        winner: pt.gameWon,
        isTiebreak: pt.scoreAfter.isTiebreak,
        scoreAfterGame: pt.scoreAfter,
      });
      currentGamePoints = [];
      currentGameNumber += 1;
    }
  }

  // Active game currently in progress
  const lastPoint = pointHistory[pointHistory.length - 1];
  games.push({
    gameNumber: currentGameNumber,
    setNumber: lastPoint ? (lastPoint.scoreAfter.setIndex || 0) + 1 : 1,
    points: currentGamePoints,
    isCompleted: false,
    isTiebreak: lastPoint ? lastPoint.scoreAfter.isTiebreak : false,
  });

  return games;
}

export const PuntoAPunto: React.FC<PuntoAPuntoProps> = ({
  pointHistory,
  teamAName,
  teamBName,
  pointsA,
  pointsB,
  isTiebreak,
  currentSetIndex,
  currentSetGamesCount,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'recent' | 'all'>('recent');

  const games = groupPointsByGame(pointHistory);
  const completedGamesCount = games.filter((g) => g.isCompleted).length;
  const activeGame = games[games.length - 1];

  // Games to display based on viewMode (Actual y Anterior by default)
  const displayedGames =
    viewMode === 'recent'
      ? games.length > 2
        ? games.slice(-2)
        : games
      : games;

  const activeSetNumber =
    currentSetIndex !== undefined
      ? currentSetIndex + 1
      : activeGame?.setNumber || 1;

  const activeGameInSet =
    currentSetGamesCount !== undefined
      ? currentSetGamesCount + 1
      : games.filter((g) => g.setNumber === (activeGame?.setNumber || 1)).length || 1;

  const formattedGameInSet = String(activeGameInSet).padStart(2, '0');
  const setOrdinalText = getSetOrdinalSpanish(activeSetNumber);

  // Auto-scroll to latest points whenever point history or viewMode updates
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [pointHistory.length, viewMode]);

  return (
    <section
      id="punto-a-punto-section"
      className="bg-[#1e2023] rounded-xl p-2 sm:p-3 interactive-shadow flex flex-col gap-2 border border-[#282a2e]"
    >
      {/* Section Header with View Selector */}
      <div className="flex items-center justify-between border-b border-[#333539] pb-1.5 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h2 className="font-bold text-[10px] sm:text-xs text-[#bbc9cf] uppercase tracking-wider">
            Punto a Punto
          </h2>
          <span className="bg-[#111317] border border-[#282a2e] text-[#859398] text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full">
            {completedGamesCount === 1
              ? '1 juego fin'
              : `${completedGamesCount} juegos`}
          </span>
        </div>

        {/* View Mode Toggle: Actual y Anterior vs Todos */}
        <div className="flex items-center gap-1 bg-[#111317] p-0.5 rounded-lg border border-[#282a2e]">
          <button
            type="button"
            onClick={() => setViewMode('recent')}
            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
              viewMode === 'recent'
                ? 'bg-[#47d6ff] text-[#001f28] shadow-[0_0_8px_rgba(71,214,255,0.4)]'
                : 'text-[#859398] hover:text-[#e2e2e8]'
            }`}
          >
            Actual y Anterior
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
              viewMode === 'all'
                ? 'bg-[#47d6ff] text-[#001f28] shadow-[0_0_8px_rgba(71,214,255,0.4)]'
                : 'text-[#859398] hover:text-[#e2e2e8]'
            }`}
          >
            Todos ({games.length})
          </button>
        </div>
      </div>

      {/* Main Track with Fixed Team Labels & Scrollable Point Stream */}
      <div className="flex items-stretch gap-1.5 sm:gap-2.5 pt-0.5">
        {/* Fixed Team Labels Column */}
        <div className="flex flex-col justify-between shrink-0 w-16 sm:w-20 border-r border-[#333539]/60 pr-1.5 py-0.5 select-none">
          {/* Top spacer for Iguales (i) / Ventaja (a) indicator alignment */}
          <div className="h-4 flex items-center">
            <span className="text-[8px] text-[#555e62] font-mono uppercase font-bold tracking-tighter">
              ESTADO
            </span>
          </div>

          <div className="flex flex-col my-1">
            <span className="font-bold text-[9px] sm:text-[10px] text-[#47d6ff] uppercase truncate leading-tight">
              {teamAName}
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#859398] font-mono font-medium">
              {isTiebreak ? pointsA : `${pointsA} pts`}
            </span>
          </div>

          <div className="h-px bg-[#282a2e] my-0.5" />

          <div className="flex flex-col my-1">
            <span className="font-bold text-[9px] sm:text-[10px] text-[#bbc9cf] uppercase truncate leading-tight">
              {teamBName}
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#859398] font-mono font-medium">
              {isTiebreak ? pointsB : `${pointsB} pts`}
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Games & Points Track */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-stretch gap-2 overflow-x-auto scrollbar-thin py-0.5 px-0.5 scroll-smooth"
        >
          {displayedGames.map((game, idx) => {
            const isLiveActiveGame = !game.isCompleted;
            const isPreviousGame =
              game.isCompleted &&
              (viewMode === 'recent'
                ? idx === 0 && displayedGames.length > 1
                : idx === displayedGames.length - 2);

            // Ensure minimum slots for visual guidance
            const minimumSlots = game.isCompleted
              ? game.points.length
              : Math.max(4, game.points.length);
            const slotsCount = Math.max(game.points.length, minimumSlots);

            return (
              <React.Fragment key={`game-group-${game.gameNumber}-${idx}`}>
                {/* Game Card */}
                <div
                  className={`flex flex-col justify-between shrink-0 rounded-lg p-1.5 sm:p-2 transition-all ${
                    isLiveActiveGame
                      ? 'bg-[#111317]/90 border border-[#47d6ff]/40 ring-1 ring-[#47d6ff]/20'
                      : isPreviousGame
                      ? 'bg-[#16181b] border border-[#ffba4a]/30'
                      : 'bg-[#16181b] border border-[#282a2e]'
                  }`}
                >
                  {/* Game Title Header Bar */}
                  <div className="flex items-center justify-between gap-1.5 mb-1 px-0.5">
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                        isLiveActiveGame
                          ? 'text-[#47d6ff]'
                          : isPreviousGame
                          ? 'text-[#ffba4a]'
                          : 'text-[#859398]'
                      }`}
                    >
                      {isLiveActiveGame
                        ? `ACTUAL (J${game.gameNumber})`
                        : isPreviousGame
                        ? `ANTERIOR (J${game.gameNumber})`
                        : game.isTiebreak
                        ? 'TB'
                        : `J${game.gameNumber}`}
                      <span className="text-[7px] sm:text-[8px] text-[#555e62]">
                        (S{game.setNumber})
                      </span>
                    </span>

                    {game.isCompleted && game.winner && (
                      <span
                        className={`text-[7px] sm:text-[8px] font-extrabold px-1 py-0.2 rounded ${
                          game.winner === 'teamA'
                            ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                            : 'bg-[#e2e2e8]/20 text-[#e2e2e8]'
                        }`}
                      >
                        {game.winner === 'teamA' ? 'Gana A' : 'Gana B'}
                      </span>
                    )}

                    {isLiveActiveGame && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#47d6ff] animate-ping" />
                    )}
                  </div>

                  {/* Top Indicator Row: 'i' for Iguales, 'a' for Ventaja, yellow dot for Game */}
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1 h-4">
                    {Array.from({ length: slotsCount }).map((_, ptIdx) => {
                      const pt = game.points[ptIdx];
                      if (!pt) {
                        return <div key={`ind-empty-${ptIdx}`} className="w-5 h-4 sm:w-6" />;
                      }

                      const isGameWon = Boolean(pt.gameWon);
                      const isSP =
                        !isGameWon &&
                        ((pt.scoreAfter.pointsA === 'SP' && pt.scoreAfter.pointsB === 'SP') ||
                          Boolean(pt.scoreAfter.isStarPoint) ||
                          pt.scoreAfter.starPointStage === 3);
                      const isIguales =
                        !isGameWon &&
                        !isSP &&
                        ((pt.scoreAfter.pointsA === '40' && pt.scoreAfter.pointsB === '40') ||
                          (pt.scoreAfter.pointsA === 'deuce 1' && pt.scoreAfter.pointsB === 'deuce 1') ||
                          (pt.scoreAfter.pointsA === 'deuce 2' && pt.scoreAfter.pointsB === 'deuce 2'));
                      const isVentaja =
                        !isGameWon &&
                        !isSP &&
                        (pt.scoreAfter.pointsA === 'AD' ||
                          pt.scoreAfter.pointsB === 'AD' ||
                          pt.scoreAfter.pointsA === 'AD 1' ||
                          pt.scoreAfter.pointsB === 'AD 1' ||
                          pt.scoreAfter.pointsA === 'AD 02' ||
                          pt.scoreAfter.pointsB === 'AD 02' ||
                          pt.scoreAfter.pointsA === 'AD 2' ||
                          pt.scoreAfter.pointsB === 'AD 2');

                      if (isGameWon) {
                        return (
                          <div
                            key={`ind-pt-${ptIdx}`}
                            title="Punto de Juego (Ganado)"
                            className="w-5 h-4 sm:w-6 flex items-center justify-center"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-[#facc15] text-[#111317] font-black text-[8px] flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.8)] animate-pulse">
                              J
                            </span>
                          </div>
                        );
                      }

                      if (isSP) {
                        return (
                          <div
                            key={`ind-pt-${ptIdx}`}
                            title="Star Point (Punto decisivo)"
                            className="w-5 h-4 sm:w-6 flex items-center justify-center"
                          >
                            <span className="w-4 h-3.5 rounded-full bg-[#ffba4a]/25 border border-[#ffba4a] text-[#ffba4a] font-black text-[7px] flex items-center justify-center leading-none">
                              SP
                            </span>
                          </div>
                        );
                      }

                      if (isIguales) {
                        const deuceLabel =
                          pt.scoreAfter.pointsA === 'deuce 2' || pt.scoreAfter.starPointStage === 2
                            ? 'i'
                            : 'i';
                        return (
                          <div
                            key={`ind-pt-${ptIdx}`}
                            title={`Iguales (${pt.scoreAfter.pointsA})`}
                            className="w-5 h-4 sm:w-6 flex items-center justify-center"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-[#47d6ff]/20 border border-[#47d6ff]/50 text-[#47d6ff] font-extrabold text-[9px] flex items-center justify-center leading-none">
                              {deuceLabel}
                            </span>
                          </div>
                        );
                      }

                      if (isVentaja) {
                        return (
                          <div
                            key={`ind-pt-${ptIdx}`}
                            title={`Ventaja (${pt.scoreAfter.pointsA === 'AD 1' || pt.scoreAfter.pointsA === 'AD 02' || pt.scoreAfter.pointsA === 'AD' ? teamAName : teamBName})`}
                            className="w-5 h-4 sm:w-6 flex items-center justify-center"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-[#ffd79f]/20 border border-[#ffd79f]/50 text-[#ffd79f] font-extrabold text-[9px] flex items-center justify-center leading-none">
                              a
                            </span>
                          </div>
                        );
                      }

                      return <div key={`ind-pt-${ptIdx}`} className="w-5 h-4 sm:w-6" />;
                    })}
                  </div>

                  {/* Team A Point Bubbles */}
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
                    {Array.from({ length: slotsCount }).map((_, ptIdx) => {
                      const pt = game.points[ptIdx];
                      const isWonByA = pt && pt.winner === 'teamA';
                      const isFilled = Boolean(pt);
                      const isGameWinningPoint = isWonByA && Boolean(pt?.gameWon);

                      return (
                        <div
                          key={`g-${game.gameNumber}-pt-a-${ptIdx}`}
                          title={
                            pt
                              ? `Punto ${ptIdx + 1}: ${
                                  pt.winner === 'teamA' ? teamAName : teamBName
                                } (${pt.pointType})${isGameWinningPoint ? ' - ¡JUEGO!' : ''}`
                              : `Slot de punto ${ptIdx + 1}`
                          }
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 ${
                            isGameWinningPoint
                              ? 'bg-[#facc15] border-2 border-[#facc15] shadow-[0_0_12px_rgba(250,204,21,0.85)] text-[#111317] scale-105'
                              : isWonByA
                              ? 'bg-[#47d6ff] border border-[#47d6ff] shadow-[0_0_8px_rgba(71,214,255,0.6)] text-[#001f28]'
                              : isFilled
                              ? 'border border-[#3c494e] bg-[#111317]'
                              : 'border border-[#47d6ff]/20 bg-transparent'
                          }`}
                        >
                          {isGameWinningPoint ? (
                            <span className="w-2 h-2 rounded-full bg-[#111317]" />
                          ) : isWonByA ? (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#001f28]" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Team B Point Bubbles */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {Array.from({ length: slotsCount }).map((_, ptIdx) => {
                      const pt = game.points[ptIdx];
                      const isWonByB = pt && pt.winner === 'teamB';
                      const isFilled = Boolean(pt);
                      const isGameWinningPoint = isWonByB && Boolean(pt?.gameWon);

                      return (
                        <div
                          key={`g-${game.gameNumber}-pt-b-${ptIdx}`}
                          title={
                            pt
                              ? `Punto ${ptIdx + 1}: ${
                                  pt.winner === 'teamB' ? teamBName : teamAName
                                } (${pt.pointType})${isGameWinningPoint ? ' - ¡JUEGO!' : ''}`
                              : `Slot de punto ${ptIdx + 1}`
                          }
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 ${
                            isGameWinningPoint
                              ? 'bg-[#facc15] border-2 border-[#facc15] shadow-[0_0_12px_rgba(250,204,21,0.85)] text-[#111317] scale-105'
                              : isWonByB
                              ? 'bg-[#e2e2e8] border border-[#e2e2e8] shadow-[0_0_8px_rgba(226,226,232,0.4)] text-[#111317]'
                              : isFilled
                              ? 'border border-[#3c494e] bg-[#111317]'
                              : 'border border-[#333539] bg-transparent'
                          }`}
                        >
                          {isGameWinningPoint ? (
                            <span className="w-2 h-2 rounded-full bg-[#111317]" />
                          ) : isWonByB ? (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#111317]" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Separator badge after completed game */}
                {game.isCompleted && (
                  <div
                    id={`game-separator-${game.gameNumber}`}
                    className="flex flex-col items-center justify-between shrink-0 px-1 sm:px-1.5 py-0.5 self-stretch min-w-[50px] sm:min-w-[64px] relative select-none"
                  >
                    <div className="w-[2px] flex-1 bg-gradient-to-b from-[#47d6ff]/70 to-[#47d6ff]/20 rounded-full" />
                    <div className="my-1 bg-[#0d0f12] border border-[#47d6ff]/60 text-[#47d6ff] px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(71,214,255,0.25)] flex flex-col items-center justify-center">
                      <div className="text-[8px] font-black uppercase font-mono leading-none">
                        J{game.gameNumber}
                      </div>
                      {game.scoreAfterGame && (
                        <div className="text-[8px] font-bold text-[#bbc9cf] font-mono leading-none mt-0.5">
                          {game.scoreAfterGame.gamesA}-{game.scoreAfterGame.gamesB}
                        </div>
                      )}
                    </div>
                    <div className="w-[2px] flex-1 bg-gradient-to-t from-[#47d6ff]/70 to-[#47d6ff]/20 rounded-full" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-[#859398] px-1 pt-1 border-t border-[#282a2e]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#47d6ff]/20 border border-[#47d6ff]/50 text-[#47d6ff] font-bold text-[8px] flex items-center justify-center">
              i
            </span>
            <span>Iguales (40-40)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#ffd79f]/20 border border-[#ffd79f]/50 text-[#ffd79f] font-bold text-[8px] flex items-center justify-center">
              a
            </span>
            <span>Ventaja</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#facc15] text-[#111317] font-black text-[7px] flex items-center justify-center shadow-[0_0_4px_rgba(250,204,21,0.8)]">
              J
            </span>
            <span className="text-[#e2e2e8] font-semibold">Punto Amarillo (Juego)</span>
          </span>
        </div>
      </div>
    </section>
  );
};
