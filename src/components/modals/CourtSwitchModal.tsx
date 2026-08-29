import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, Play, Pause, RotateCcw } from 'lucide-react';
import { MatchState } from '../../types';

interface CourtSwitchModalProps {
  state?: MatchState;
  onClose: () => void;
  gameNumber?: number;
}

export const CourtSwitchModal: React.FC<CourtSwitchModalProps> = ({
  state,
  onClose,
  gameNumber,
}) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  const isSwapped = Boolean(state?.sidesSwapped);
  const leftTeamName = state ? (isSwapped ? state.teamBName : state.teamAName) : 'Equipo Izq';
  const rightTeamName = state ? (isSwapped ? state.teamAName : state.teamBName) : 'Equipo Der';
  const leftPlayers = state ? (isSwapped ? state.teamBPlayers : state.teamAPlayers) : [];
  const rightPlayers = state ? (isSwapped ? state.teamAPlayers : state.teamBPlayers) : [];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-[#47d6ff]/50 w-full max-w-md rounded-2xl p-5 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-[#47d6ff]/20 border border-[#47d6ff]/40 flex items-center justify-center text-[#47d6ff] mb-2 animate-pulse">
          <ArrowLeftRight className="w-6 h-6" />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#47d6ff] mb-1">
          Regla Oficial FIP
        </span>

        <h3 className="font-headline font-bold text-xl text-[#e2e2e8] mb-1">
          ¡CAMBIO DE PISTA!
        </h3>

        {gameNumber !== undefined && (
          <span className="text-[11px] font-mono text-[#bbc9cf] mb-3">
            Tras el juego #{gameNumber}
          </span>
        )}

        {/* Court Position Preview */}
        <div className="w-full bg-[#111317] border border-[#282a2e] rounded-xl p-3 my-3">
          <div className="text-[10px] uppercase font-bold text-[#859398] mb-2 tracking-wider">
            Nueva Posición en Pista
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            {/* Left Court */}
            <div className="bg-[#1e2023] p-2.5 rounded-lg border border-[#47d6ff]/30">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#47d6ff] uppercase mb-1">
                <span>⬅️ Lado Izquierdo</span>
              </div>
              <div className="font-bold text-xs text-[#e2e2e8] truncate">{leftTeamName}</div>
              <div className="text-[10px] text-[#bbc9cf] truncate">
                {leftPlayers[0]?.name || 'J1'} • {leftPlayers[1]?.name || 'J2'}
              </div>
            </div>

            {/* Right Court */}
            <div className="bg-[#1e2023] p-2.5 rounded-lg border border-[#bbc9cf]/20">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#bbc9cf] uppercase mb-1">
                <span>Lado Derecho ➡️</span>
              </div>
              <div className="font-bold text-xs text-[#e2e2e8] truncate">{rightTeamName}</div>
              <div className="text-[10px] text-[#bbc9cf] truncate">
                {rightPlayers[0]?.name || 'J1'} • {rightPlayers[1]?.name || 'J2'}
              </div>
            </div>
          </div>
        </div>

        {/* Changeover timer (90 seconds) */}
        <div className="w-full flex items-center justify-between bg-[#17191c] px-3 py-2 rounded-xl border border-[#282a2e] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#bbc9cf]">Descanso (90s):</span>
            <span className="font-mono text-base font-extrabold text-[#47d6ff]">
              {formatTimer(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTimerActive(!isTimerActive)}
              className="p-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8]"
              title={isTimerActive ? 'Pausar' : 'Iniciar'}
            >
              {isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsTimerActive(false);
                setTimeLeft(90);
              }}
              className="p-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#bbc9cf]"
              title="Reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
        >
          <Check className="w-4 h-4" />
          Continuar Partido
        </button>
      </div>
    </div>
  );
};
