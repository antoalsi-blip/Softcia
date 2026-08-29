import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, BarChart3, Share2 } from 'lucide-react';
import { MatchState, Team } from '../../types';

interface MatchWonModalProps {
  winner: Team;
  state: MatchState;
  onNewMatch: () => void;
  onOpenStats: () => void;
}

export const MatchWonModal: React.FC<MatchWonModalProps> = ({
  winner,
  state,
  onNewMatch,
  onOpenStats,
}) => {
  const winnerName = winner === 'teamA' ? state.teamAName : state.teamBName;
  const winnerPlayers = winner === 'teamA' ? state.teamAPlayers : state.teamBPlayers;

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#47d6ff', '#00d2ff', '#ffd79f', '#ffffff'],
      });
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border-2 border-[#47d6ff] w-full max-w-md rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-[#47d6ff]/20 border border-[#47d6ff] flex items-center justify-center text-[#47d6ff] mb-3 shadow-[0_0_20px_rgba(71,214,255,0.4)]">
          <Trophy className="w-9 h-9" />
        </div>

        {(state.tournamentName || state.tournamentRound) && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd79f]/15 border border-[#ffd79f]/30 text-[#ffd79f] text-[11px] font-bold mb-2 max-w-full truncate">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {state.tournamentName}
              {state.tournamentName && state.tournamentRound ? ' • ' : ''}
              {state.tournamentRound}
            </span>
          </div>
        )}

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#47d6ff] mb-1">
          ¡VICTORIA DE PARTIDO!
        </span>

        <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#e2e2e8] mb-1">
          {winnerName}
        </h2>

        <p className="text-xs text-[#bbc9cf] mb-4">
          {winnerPlayers.map((p) => p.name).join(' & ')}
        </p>

        {/* Sets Score Breakdown */}
        <div className="w-full bg-[#111317] p-3 rounded-xl border border-[#282a2e] mb-5">
          <span className="text-[10px] uppercase font-bold text-[#bbc9cf] block mb-2">
            Resultado Final por Sets
          </span>
          <div className="flex justify-center gap-3 font-mono font-bold">
            {state.sets.map((s, idx) => (
              <div key={idx} className="bg-[#1e2023] px-3 py-1.5 rounded-lg border border-[#282a2e]">
                <div className="text-[9px] text-[#bbc9cf] uppercase">
                  {s.isSuperTiebreak ? 'Super Tie' : `Set ${s.setNumber}`}
                </div>
                <div className="text-base">
                  <span className={
                    (s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA) > (s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB)
                      ? 'text-[#47d6ff]'
                      : 'text-[#e2e2e8]'
                  }>
                    {s.isSuperTiebreak && s.tiebreakA !== undefined ? s.tiebreakA : s.teamA}
                  </span>
                  <span className="text-[#bbc9cf] mx-1">-</span>
                  <span className={
                    (s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB) > (s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA)
                      ? 'text-[#47d6ff]'
                      : 'text-[#e2e2e8]'
                  }>
                    {s.isSuperTiebreak && s.tiebreakB !== undefined ? s.tiebreakB : s.teamB}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onOpenStats}
            className="btn-primary w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Ver Estadísticas y Acta Completa
          </button>

          <button
            onClick={onNewMatch}
            className="w-full py-2.5 rounded-xl bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Iniciar Nuevo Partido
          </button>
        </div>
      </div>
    </div>
  );
};
