import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Sparkles, ChevronDown } from 'lucide-react';
import { IntervalTimerMode, IntervalTimerState } from '../types';

interface MatchTimerProps {
  // Total match time
  seconds: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onResetTimer?: () => void;

  // Shot / Service / Rest Interval Countdown Timer
  intervalState: IntervalTimerState;
  onToggleIntervalPlay: () => void;
  onResetInterval: () => void;
  onSetIntervalMode: (mode: IntervalTimerMode, totalSec: number) => void;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({
  seconds,
  isRunning,
  onTogglePlay,
  onResetTimer,
  intervalState,
  onToggleIntervalPlay,
  onResetInterval,
  onSetIntervalMode,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const formatMatchTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatIntervalTime = (totalSec: number, mode?: IntervalTimerMode) => {
    if (totalSec <= 0) return '00s';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mode === 'warmup_3m' || mode === 'warmup_1m') {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (mins > 0) {
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const getModeLabel = (mode: IntervalTimerMode) => {
    switch (mode) {
      case 'serve':
        return { title: 'Servicio', icon: '🎾', badge: '20s' };
      case 'rest_game':
        return { title: 'Descanso', icon: '🪑', badge: '90s' };
      case 'rest_set':
        return { title: 'Desc. Set', icon: '🏆', badge: '120s' };
      case 'change_quick':
        return { title: 'Cambio', icon: '🔄', badge: '20s' };
      case 'warmup_3m':
        return { title: 'Peloteo', icon: '⏳', badge: '3m' };
      case 'warmup_1m':
        return { title: 'Pre-Match', icon: '⏱️', badge: '1m' };
      default:
        return { title: 'Servicio', icon: '🎾', badge: '20s' };
    }
  };

  const modeInfo = getModeLabel(intervalState.mode);
  const remaining = intervalState.remainingSeconds;
  const isExpired = remaining <= 0;
  const isWarning = remaining <= 10 && remaining > 5;
  const isDanger = remaining <= 5 && remaining > 0;

  // Calculate progress percentage
  const progressPct = intervalState.totalSeconds > 0
    ? Math.max(0, Math.min(100, (remaining / intervalState.totalSeconds) * 100))
    : 0;

  return (
    <div className="flex items-stretch justify-between gap-1.5 sm:gap-3 px-1 mb-1 sm:mb-1.5 shrink-0 select-none">
      {/* 1. Left Block: Match Elapsed Time */}
      <div className="bg-[#1e2023] border border-[#282a2e] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 flex-1 min-w-0 shadow-sm">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#bbc9cf]" />
            <span className="font-bold text-[9px] sm:text-[10px] text-[#bbc9cf] uppercase tracking-wider truncate">
              Match Time
            </span>
          </div>
          <span className="font-display-score font-extrabold text-base sm:text-xl text-[#47d6ff] tracking-tight leading-tight">
            {formatMatchTime(seconds)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onResetTimer && (
            <button
              onClick={onResetTimer}
              id="btn-reset-match-timer"
              title="Reiniciar tiempo de partido"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#282a2e] hover:bg-[#333539] flex items-center justify-center text-[#bbc9cf] hover:text-[#e2e2e8] active:scale-90 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onTogglePlay}
            id="btn-match-timer-toggle"
            title={isRunning ? 'Pausar tiempo total' : 'Iniciar tiempo total'}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center active:scale-90 transition-all ${
              isRunning
                ? 'bg-[#282a2e] text-[#47d6ff] ring-1 ring-[#47d6ff]/40'
                : 'bg-[#47d6ff] text-[#001f28]'
            }`}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Right Block: Automatic Service & Rest Countdown Timer */}
      <div
        className={`bg-[#1e2023] border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 flex-1 min-w-0 relative shadow-sm transition-colors ${
          isExpired
            ? 'border-[#ff7875] bg-[#ff7875]/10'
            : isDanger
            ? 'border-[#ff7875]/60 bg-[#ff7875]/5'
            : isWarning
            ? 'border-[#ffba4a]/60 bg-[#ffba4a]/5'
            : 'border-[#282a2e]'
        }`}
      >
        {/* Progress bar line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#282a2e] rounded-t-xl overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isExpired
                ? 'bg-[#ff7875] w-full animate-pulse'
                : isDanger
                ? 'bg-[#ff7875]'
                : isWarning
                ? 'bg-[#ffba4a]'
                : 'bg-[#47d6ff]'
            }`}
            style={{ width: isExpired ? '100%' : `${progressPct}%` }}
          />
        </div>

        {/* Mode Label & Countdown display */}
        <div className="flex flex-col min-w-0">
          {/* Top Label & Mode Picker Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-[#bbc9cf] hover:text-[#e2e2e8] uppercase tracking-wider truncate"
              title="Cambiar tipo de cronómetro (Servicio / Descanso)"
            >
              <span>{modeInfo.icon}</span>
              <span className="truncate">{modeInfo.title}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>
          </div>

          {/* Countdown digits */}
          <div className="flex items-baseline gap-1">
            <span
              className={`font-display-score font-extrabold text-base sm:text-xl tracking-tight leading-tight ${
                isExpired
                  ? 'text-[#ff7875] animate-pulse'
                  : isDanger
                  ? 'text-[#ff7875]'
                  : isWarning
                  ? 'text-[#ffba4a]'
                  : 'text-[#8ae2ff]'
              }`}
            >
              {isExpired ? 'TIEMPO' : formatIntervalTime(remaining, intervalState.mode)}
            </span>
            {isExpired && (
              <span className="text-[8px] font-bold text-[#ff7875] uppercase animate-pulse hidden xs:inline">
                00s
              </span>
            )}
          </div>
        </div>

        {/* Interval controls: Reset & Play/Pause */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onResetInterval}
            id="btn-reset-interval-timer"
            title={`Reiniciar cuenta regresiva (${modeInfo.badge})`}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#282a2e] hover:bg-[#333539] flex items-center justify-center text-[#bbc9cf] hover:text-[#e2e2e8] active:scale-90 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleIntervalPlay}
            id="btn-interval-timer-toggle"
            title={intervalState.isRunning ? 'Pausar intervalo' : 'Iniciar intervalo'}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center active:scale-90 transition-all ${
              intervalState.isRunning
                ? 'bg-[#282a2e] text-[#8ae2ff] ring-1 ring-[#8ae2ff]/40'
                : 'bg-[#38c9f0] text-[#001f28]'
            }`}
          >
            {intervalState.isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Presets Popup dropdown */}
        {showPresets && (
          <div className="absolute top-full right-0 mt-1 bg-[#16181b] border border-[#282a2e] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[150px]">
            <div className="text-[9px] font-bold text-[#859398] uppercase px-2 py-0.5 border-b border-[#282a2e]">
              Ajuste Rápido
            </div>
            <button
              onClick={() => {
                onSetIntervalMode('serve', 20);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'serve'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>🎾 Servicio</span>
              <span className="font-mono text-[10px] font-bold">20s</span>
            </button>
            <button
              onClick={() => {
                onSetIntervalMode('rest_game', 90);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'rest_game'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>🪑 Descanso Juego</span>
              <span className="font-mono text-[10px] font-bold">90s</span>
            </button>
            <button
              onClick={() => {
                onSetIntervalMode('rest_set', 120);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'rest_set'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>🏆 Descanso Set</span>
              <span className="font-mono text-[10px] font-bold">120s</span>
            </button>
            <button
              onClick={() => {
                onSetIntervalMode('change_quick', 20);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'change_quick'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>🔄 Cambio Rápido</span>
              <span className="font-mono text-[10px] font-bold">20s</span>
            </button>
            <button
              onClick={() => {
                onSetIntervalMode('warmup_3m', 180);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'warmup_3m'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>⏳ Peloteo Calentamiento</span>
              <span className="font-mono text-[10px] font-bold">3m</span>
            </button>
            <button
              onClick={() => {
                onSetIntervalMode('warmup_1m', 60);
                setShowPresets(false);
              }}
              className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                intervalState.mode === 'warmup_1m'
                  ? 'bg-[#47d6ff]/20 text-[#47d6ff]'
                  : 'text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <span>⏱️ Inicio Pre-Partido</span>
              <span className="font-mono text-[10px] font-bold">1m</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
