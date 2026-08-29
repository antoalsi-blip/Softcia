import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  Coins,
  ArrowRight,
  Shield,
  Zap,
  ArrowLeftRight,
  Trophy,
} from 'lucide-react';
import { MatchState, Team, TossChoice, BallChangeSettings } from '../../types';
import { playCountdownBeep, playAlarmSound, playWhistleSound } from '../../utils/sound';
import { BallChangeConfigSection } from '../BallChangeConfigSection';

interface MatchStartModalProps {
  state: MatchState;
  onClose: () => void;
  onApplyStartConfig: (params: {
    tournamentName?: string;
    tournamentRound?: string;
    tossWinner: Team;
    tossChoice: TossChoice;
    firstServerTeam: Team;
    firstServerPlayerIndex: 0 | 1;
    sidesSwapped: boolean;
    startMatchTimer: boolean;
    ballChange?: BallChangeSettings;
    initialWarmupPhase?: '3m' | '1m';
    initialWarmupRemainingSeconds?: number;
  }) => void;
  onSyncWarmupTimerToMain?: (mode: 'warmup_3m' | 'warmup_1m', seconds: number) => void;
}

export const MatchStartModal: React.FC<MatchStartModalProps> = ({
  state,
  onClose,
  onApplyStartConfig,
  onSyncWarmupTimerToMain,
}) => {
  // Tournament State
  const [tournamentName, setTournamentName] = useState<string>(state.tournamentName || '');
  const [tournamentRound, setTournamentRound] = useState<string>(state.tournamentRound || '');

  // Toss State
  const [tossWinner, setTossWinner] = useState<Team>('teamA');
  const [tossChoice, setTossChoice] = useState<TossChoice>('serve');
  const [firstServerTeam, setFirstServerTeam] = useState<Team>('teamA');
  const [firstServerPlayerIndex, setFirstServerPlayerIndex] = useState<0 | 1>(0);
  const [sidesSwapped, setSidesSwapped] = useState<boolean>(Boolean(state.sidesSwapped));
  const [startMatchTimer, setStartMatchTimer] = useState<boolean>(true);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);

  // Ball Change Settings State
  const [ballChange, setBallChange] = useState<BallChangeSettings>(
    state.settings.ballChange || {
      enabled: true,
      pattern: '7_9',
      firstChangeGames: 7,
      subsequentChangeGames: 9,
    }
  );

  // Warm-up Countdown State (Phase 1 = 180s, Phase 2 = 60s)
  const [warmupPhase, setWarmupPhase] = useState<'3m' | '1m'>('3m');
  const [warmupSeconds, setWarmupSeconds] = useState<number>(180);
  const [isWarmupRunning, setIsWarmupRunning] = useState<boolean>(false);

  // Synchronize server logic based on toss choice
  const handleTossWinnerChange = (winner: Team) => {
    setTossWinner(winner);
    updateServerFromChoice(winner, tossChoice);
  };

  const handleTossChoiceChange = (choice: TossChoice) => {
    setTossChoice(choice);
    updateServerFromChoice(tossWinner, choice);
  };

  const updateServerFromChoice = (winner: Team, choice: TossChoice) => {
    const rival: Team = winner === 'teamA' ? 'teamB' : 'teamA';
    if (choice === 'serve') {
      setFirstServerTeam(winner);
    } else if (choice === 'receive') {
      setFirstServerTeam(rival);
    } else if (choice === 'side') {
      // Winner chooses court side, so rival usually chooses serve or receive; default to rival serving
      setFirstServerTeam(rival);
    } else if (choice === 'defer') {
      // Winner passes decision to rival
      setFirstServerTeam(rival);
    }
  };

  // Flip Coin Simulation
  const handleFlipCoin = () => {
    setIsFlippingCoin(true);
    let flips = 0;
    const interval = setInterval(() => {
      setTossWinner((prev) => (prev === 'teamA' ? 'teamB' : 'teamA'));
      flips++;
      if (flips > 8) {
        clearInterval(interval);
        const finalWinner: Team = Math.random() > 0.5 ? 'teamA' : 'teamB';
        setTossWinner(finalWinner);
        updateServerFromChoice(finalWinner, tossChoice);
        setIsFlippingCoin(false);
        if (state.settings.soundEnabled) {
          playCountdownBeep(true);
        }
      }
    }, 100);
  };

  // Warmup Timer Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isWarmupRunning && warmupSeconds > 0) {
      timer = setInterval(() => {
        setWarmupSeconds((prev) => {
          if (prev <= 1) {
            // Reached zero
            if (state.settings.soundEnabled) {
              playAlarmSound();
            }
            if (warmupPhase === '3m') {
              // Auto-advance to 1m phase
              setWarmupPhase('1m');
              return 60;
            } else {
              setIsWarmupRunning(false);
              return 0;
            }
          }
          if (prev <= 4 && prev > 1 && state.settings.soundEnabled) {
            playCountdownBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWarmupRunning, warmupSeconds, warmupPhase, state.settings.soundEnabled]);

  const handleToggleWarmup = () => {
    setIsWarmupRunning(!isWarmupRunning);
  };

  const handleSelectPhase = (phase: '3m' | '1m') => {
    setWarmupPhase(phase);
    setWarmupSeconds(phase === '3m' ? 180 : 60);
    setIsWarmupRunning(false);
  };

  const handleResetWarmup = () => {
    setWarmupSeconds(warmupPhase === '3m' ? 180 : 60);
    setIsWarmupRunning(false);
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalPhaseSeconds = warmupPhase === '3m' ? 180 : 60;
  const progressPct = ((totalPhaseSeconds - warmupSeconds) / totalPhaseSeconds) * 100;

  const currentServingPlayers =
    firstServerTeam === 'teamA' ? state.teamAPlayers : state.teamBPlayers;
  const servingTeamName =
    firstServerTeam === 'teamA' ? state.teamAName : state.teamBName;

  const handleApply = () => {
    if (state.settings.soundEnabled) {
      playWhistleSound();
    }
    onApplyStartConfig({
      tournamentName: tournamentName.trim(),
      tournamentRound: tournamentRound.trim(),
      tossWinner,
      tossChoice,
      firstServerTeam,
      firstServerPlayerIndex,
      sidesSwapped,
      startMatchTimer,
      ballChange,
      initialWarmupPhase: warmupPhase,
      initialWarmupRemainingSeconds: warmupSeconds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-lg rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#282a2e] shrink-0 bg-[#16181b] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#47d6ff]/15 border border-[#47d6ff]/30 flex items-center justify-center text-[#47d6ff]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-[#e2e2e8]">
                Inicio de Partido y Sorteo
              </h2>
              <p className="text-[10px] text-[#859398]">
                Configuración del torneo, sorteo FIP, primer servicio y peloteo oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3 sm:p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* SECTION 0: INFORMACIÓN DEL TORNEO E INSTANCIA */}
          <div className="bg-[#111317] border border-[#282a2e] rounded-xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#ffd79f]" />
                <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider">
                  Torneo e Instancia
                </span>
              </div>
              <span className="text-[9px] text-[#859398] font-mono">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Nombre del Torneo */}
              <div>
                <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1">
                  Nombre del Torneo / Liga
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="ej. Premier Padel, Torneo Open..."
                  id="input-tournament-name"
                  className="w-full bg-[#16181b] border border-[#282a2e] focus:border-[#47d6ff] rounded-lg px-2.5 py-1.5 text-xs text-[#e2e2e8] placeholder-[#555860] outline-hidden transition-colors"
                />
              </div>

              {/* Instancia / Ronda */}
              <div>
                <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1">
                  Instancia / Ronda
                </label>
                <input
                  type="text"
                  value={tournamentRound}
                  onChange={(e) => setTournamentRound(e.target.value)}
                  placeholder="ej. Final, Semifinal, Cuartos..."
                  id="input-tournament-round"
                  className="w-full bg-[#16181b] border border-[#282a2e] focus:border-[#47d6ff] rounded-lg px-2.5 py-1.5 text-xs text-[#e2e2e8] placeholder-[#555860] outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Quick chips for rapid instance selection */}
            <div>
              <span className="text-[9px] font-semibold text-[#859398] block mb-1">
                Accesos rápidos de instancia:
              </span>
              <div className="flex flex-wrap gap-1">
                {['Final', 'Semifinales', 'Cuartos', 'Octavos', '16avos', 'Fase de Grupos', 'Amistoso'].map(
                  (roundOption) => (
                    <button
                      key={roundOption}
                      type="button"
                      onClick={() => setTournamentRound(roundOption)}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-medium border transition-all ${
                        tournamentRound.toLowerCase() === roundOption.toLowerCase()
                          ? 'bg-[#ffd79f]/20 text-[#ffd79f] border-[#ffd79f]/60 shadow-[0_0_8px_rgba(255,215,159,0.2)]'
                          : 'bg-[#16181b] text-[#bbc9cf] border-[#282a2e] hover:border-[#47d6ff]/40 hover:text-[#e2e2e8]'
                      }`}
                    >
                      {roundOption}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1: PELOTEO Y CRONÓMETRO PRE-PARTIDO */}
          <div className="bg-[#111317] border border-[#282a2e] rounded-xl p-3 sm:p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[#47d6ff]" />
                <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider">
                  Peloteo Inicial Reglamentario
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#1e2023] p-0.5 rounded-lg border border-[#282a2e]">
                <button
                  onClick={() => handleSelectPhase('3m')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    warmupPhase === '3m'
                      ? 'bg-[#47d6ff] text-[#001f28]'
                      : 'text-[#bbc9cf] hover:text-[#e2e2e8]'
                  }`}
                >
                  3 min (Peloteo)
                </button>
                <button
                  onClick={() => handleSelectPhase('1m')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    warmupPhase === '1m'
                      ? 'bg-[#47d6ff] text-[#001f28]'
                      : 'text-[#bbc9cf] hover:text-[#e2e2e8]'
                  }`}
                >
                  1 min (Pre-Match)
                </button>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="bg-[#16181b] border border-[#282a2e] rounded-xl p-2.5 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#859398] uppercase">
                  {warmupPhase === '3m'
                    ? 'Fase 1: Calentamiento en Pista'
                    : 'Fase 2: Ajuste previo al Saque'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-display-score font-extrabold text-2xl sm:text-3xl tracking-tight ${
                      warmupSeconds <= 10
                        ? 'text-[#ff7875] animate-pulse'
                        : 'text-[#47d6ff]'
                    }`}
                  >
                    {formatCountdown(warmupSeconds)}
                  </span>
                  <span className="text-[10px] text-[#bbc9cf]">
                    {warmupSeconds === 0
                      ? '¡Tiempo cumplido!'
                      : isWarmupRunning
                      ? 'En curso...'
                      : 'Pausado'}
                  </span>
                </div>
              </div>

              {/* Progress & Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetWarmup}
                  title="Reiniciar cuenta"
                  className="w-8 h-8 rounded-full bg-[#282a2e] hover:bg-[#333539] flex items-center justify-center text-[#bbc9cf] hover:text-[#e2e2e8] active:scale-90 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleToggleWarmup}
                  className={`px-3.5 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold active:scale-95 transition-all shadow-md ${
                    isWarmupRunning
                      ? 'bg-[#282a2e] text-[#47d6ff] ring-1 ring-[#47d6ff]/40'
                      : 'bg-[#47d6ff] text-[#001f28] hover:bg-[#38c9f0]'
                  }`}
                >
                  {isWarmupRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-[#1e2023] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#47d6ff] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>

          {/* SECTION 2: SORTEO (TOSS) */}
          <div className="bg-[#111317] border border-[#282a2e] rounded-xl p-3 sm:p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#ffd79f]" />
                <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider">
                  Sorteo Inicial de Pista y Saque
                </span>
              </div>
              <button
                onClick={handleFlipCoin}
                disabled={isFlippingCoin}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffd79f]/15 hover:bg-[#ffd79f]/25 text-[#ffd79f] border border-[#ffd79f]/30 text-[10px] font-bold active:scale-95 transition-all"
              >
                <Coins className={`w-3 h-3 ${isFlippingCoin ? 'animate-spin' : ''}`} />
                <span>{isFlippingCoin ? 'Girando...' : 'Lanzar Moneda'}</span>
              </button>
            </div>

            {/* 1. Ganador del Sorteo */}
            <div>
              <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1.5">
                1. ¿Quién ganó el sorteo?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTossWinnerChange('teamA')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    tossWinner === 'teamA'
                      ? 'bg-[#47d6ff]/15 border-[#47d6ff] text-[#47d6ff] shadow-[0_0_10px_rgba(71,214,255,0.2)]'
                      : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase block opacity-80">
                      Pareja A
                    </span>
                    <span className="text-xs font-bold truncate block">
                      {state.teamAName}
                    </span>
                  </div>
                  {tossWinner === 'teamA' && (
                    <div className="w-5 h-5 rounded-full bg-[#47d6ff] text-[#001f28] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTossWinnerChange('teamB')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    tossWinner === 'teamB'
                      ? 'bg-[#e2e2e8]/15 border-[#e2e2e8] text-[#e2e2e8] shadow-[0_0_10px_rgba(226,226,232,0.2)]'
                      : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase block opacity-80">
                      Pareja B
                    </span>
                    <span className="text-xs font-bold truncate block">
                      {state.teamBName}
                    </span>
                  </div>
                  {tossWinner === 'teamB' && (
                    <div className="w-5 h-5 rounded-full bg-[#e2e2e8] text-[#111317] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Elección de la Pareja Ganadora */}
            <div>
              <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1.5">
                2. ¿Qué eligió la pareja ganadora?
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    id: 'serve',
                    title: 'Servir (Sacar)',
                    desc: 'Saca el 1er juego; rival elige campo',
                  },
                  {
                    id: 'receive',
                    title: 'Restar (Recibir)',
                    desc: 'Recibe el 1er juego; rival elige campo',
                  },
                  {
                    id: 'side',
                    title: 'Elegir Campo (Lado)',
                    desc: 'Elige lado; rival elige sacar o restar',
                  },
                  {
                    id: 'defer',
                    title: 'Ceder Elección',
                    desc: 'Pasa la decisión a los rivales',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTossChoiceChange(item.id as TossChoice)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      tossChoice === item.id
                        ? 'bg-[#47d6ff]/15 border-[#47d6ff] text-[#47d6ff]'
                        : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[9px] text-[#859398] leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Primer Servidor y Jugador */}
            <div className="pt-1 border-t border-[#282a2e]">
              <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1.5">
                3. Pareja y Jugador al Primer Servicio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Team Serving */}
                <div className="bg-[#16181b] border border-[#282a2e] rounded-xl p-2.5">
                  <span className="text-[9px] font-bold text-[#859398] uppercase block mb-1">
                    Pareja al Saque:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFirstServerTeam('teamA')}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                        firstServerTeam === 'teamA'
                          ? 'bg-[#47d6ff] text-[#001f28]'
                          : 'bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamAName} (A)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirstServerTeam('teamB')}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                        firstServerTeam === 'teamB'
                          ? 'bg-[#e2e2e8] text-[#111317]'
                          : 'bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamBName} (B)
                    </button>
                  </div>
                </div>

                {/* Player Serving */}
                <div className="bg-[#16181b] border border-[#282a2e] rounded-xl p-2.5">
                  <span className="text-[9px] font-bold text-[#859398] uppercase block mb-1">
                    Jugador que Realiza el Saque:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFirstServerPlayerIndex(0)}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold truncate transition-all ${
                        firstServerPlayerIndex === 0
                          ? 'bg-[#47d6ff] text-[#001f28]'
                          : 'bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {currentServingPlayers[0]?.name || 'Jugador 1'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirstServerPlayerIndex(1)}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold truncate transition-all ${
                        firstServerPlayerIndex === 1
                          ? 'bg-[#47d6ff] text-[#001f28]'
                          : 'bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {currentServingPlayers[1]?.name || 'Jugador 2'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Lados de Pista Iniciales */}
            <div className="flex items-center justify-between bg-[#16181b] border border-[#282a2e] rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#47d6ff]" />
                <div>
                  <span className="text-xs font-bold text-[#e2e2e8] block">
                    Orientación de Pista
                  </span>
                  <span className="text-[9px] text-[#859398] block">
                    {sidesSwapped
                      ? `${state.teamBName} en Pista Izquierda / ${state.teamAName} en Derecha`
                      : `${state.teamAName} en Pista Izquierda / ${state.teamBName} en Derecha`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidesSwapped(!sidesSwapped)}
                className="px-2.5 py-1 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#47d6ff] text-xs font-bold active:scale-95 transition-all"
              >
                Invertir
              </button>
            </div>
          </div>

          {/* SECTION 3: CONFIGURACIÓN DE CAMBIO DE BOLAS */}
          <BallChangeConfigSection
            settings={ballChange}
            onChange={setBallChange}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#282a2e] bg-[#16181b] rounded-b-2xl flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#282a2e] transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            id="btn-confirm-match-start"
            className="px-4 py-2 bg-[#47d6ff] hover:bg-[#38c9f0] text-[#001f28] rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(71,214,255,0.4)] flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirmar y Comenzar Partido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
