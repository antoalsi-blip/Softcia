import React, { useState, useEffect } from 'react';
import { HeartPulse, Play, Pause, RotateCcw, X, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { MatchState, MedicalTimeoutRecord, Team } from '../../types';
import { playAlarmSound } from '../../utils/sound';

interface MedicalModalProps {
  state: MatchState;
  onClose: () => void;
  onRecordMedicalTimeout?: (record: Omit<MedicalTimeoutRecord, 'id' | 'timestamp'>) => void;
}

export const MedicalModal: React.FC<MedicalModalProps> = ({ state, onClose, onRecordMedicalTimeout }) => {
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 minutes standard
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>(
    state.teamAPlayers[0]?.name || 'Jugador'
  );
  const [reason, setReason] = useState('Tratamiento por molestia física');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            playAlarmSound();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const allPlayers: { team: Team; teamName: string; name: string }[] = [
    { team: 'teamA', teamName: state.teamAName, name: state.teamAPlayers[0]?.name || 'Jugador A1' },
    { team: 'teamA', teamName: state.teamAName, name: state.teamAPlayers[1]?.name || 'Jugador A2' },
    { team: 'teamB', teamName: state.teamBName, name: state.teamBPlayers[0]?.name || 'Jugador B1' },
    { team: 'teamB', teamName: state.teamBName, name: state.teamBPlayers[1]?.name || 'Jugador B2' },
  ];

  const handleRegisterMTO = () => {
    if (onRecordMedicalTimeout) {
      const selected = allPlayers.find((p) => p.name === selectedPlayer) || allPlayers[0];
      const elapsed = 180 - secondsLeft;
      onRecordMedicalTimeout({
        player: selected.name,
        team: selected.team,
        durationSeconds: elapsed > 0 ? elapsed : 180,
        reason: reason.trim() || 'Atención Médica FIP',
        setIndex: state.currentSetIndex,
      });
      setRegistered(true);
      setTimeout(() => setRegistered(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-[#ffb4ab]/40 w-full max-w-md rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2e]">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#ffb4ab]" />
            <h2 className="font-headline font-bold text-base text-[#e2e2e8]">
              Tiempo Médico Oficial (FIP)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          <div className="w-full text-left space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-[#bbc9cf] uppercase block mb-1.5">
                Jugador atendido
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full bg-[#111317] border border-[#282a2e] text-sm text-[#e2e2e8] rounded-xl p-2.5 outline-hidden"
              >
                {allPlayers.map((p, i) => (
                  <option key={i} value={p.name}>
                    {p.name} ({p.teamName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#bbc9cf] uppercase block mb-1.5">
                Motivo / Zona de tratamiento
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ej. Molestia muscular gemelo, vendaje de tobillo..."
                className="w-full bg-[#111317] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-xl p-2.5 outline-hidden"
              />
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="bg-[#111317] border-2 border-[#ffb4ab]/30 w-full py-6 rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[#bbc9cf] tracking-widest mb-1">
              Tiempo Restante (Reglamentario 3:00 min)
            </span>
            <div className="font-display-score text-5xl sm:text-6xl font-extrabold text-[#ffb4ab] tracking-tight">
              {formatted}
            </div>
            {secondsLeft === 0 && (
              <span className="text-xs font-bold text-[#ffb4ab] mt-2 animate-bounce">
                ¡TIEMPO MÉDICO FINALIZADO!
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 ${
                isRunning
                  ? 'bg-[#282a2e] text-[#ffb4ab] border border-[#ffb4ab]/40'
                  : 'bg-[#ffb4ab] text-[#690005]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Iniciar 3:00 min
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(180);
              }}
              title="Reiniciar a 3 minutos"
              className="p-2.5 rounded-xl bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onRecordMedicalTimeout && (
              <button
                onClick={handleRegisterMTO}
                className="px-3.5 py-2.5 rounded-xl bg-[#111317] border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#282a2e] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                {registered ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4" />}
                {registered ? 'Registrado en Acta' : 'Asentar en Acta FIP'}
              </button>
            )}
          </div>

          <div className="bg-[#111317] p-2.5 rounded-xl border border-[#282a2e] text-[11px] text-[#bbc9cf] text-left flex gap-2 w-full">
            <AlertTriangle className="w-4 h-4 text-[#ffba4a] shrink-0 mt-0.5" />
            <span>
              Según la FIP, cada jugador tiene derecho a una atención médica de máximo 3 minutos
              por lesión diagnosticable durante el transcurso del partido.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a2e] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
          >
            Volver al Marcador
          </button>
        </div>
      </div>
    </div>
  );
};
