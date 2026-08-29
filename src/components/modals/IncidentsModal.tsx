import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Clock,
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  FileText,
  User,
  Shield,
  Layers,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Info,
  Timer,
} from 'lucide-react';
import {
  MatchState,
  IncidentRecord,
  SuspensionRecord,
  SuspensionType,
  Team,
} from '../../types';
import { createSuspensionSnapshot } from '../../utils/padelRules';
import { playAlarmSound, playWhistleSound } from '../../utils/sound';

interface IncidentsModalProps {
  state: MatchState;
  onClose: () => void;
  onApplySuspension: (suspension: Omit<SuspensionRecord, 'id' | 'timestamp'>) => void;
  onUpdateActiveSuspensionTimer: (remainingSeconds: number, isRunning: boolean) => void;
  onResumeMatchFromSuspension: () => void;
  onDeclareDefinitiveSuspension: () => void;
  onAddIncident: (incident: Omit<IncidentRecord, 'id' | 'timestamp'>) => void;
  onRemoveIncident?: (id: string) => void;
}

const SUSPENSION_REASONS = [
  'Lluvia / Humedad en cristales o césped',
  'Fallo en el sistema de iluminación',
  'Desperfecto en pista, cristal, red o malla',
  'Condiciones meteorológicas adversas / Viento extremo',
  'Decisión arbitral / Orden público / Seguridad',
  'Consulta reglamentaria con Juez Árbitro General',
  'Incidencia médica extraordinaria no reanudable',
  'Otro motivo de fuerza mayor',
];

const INCIDENT_TYPES = [
  { value: 'equipment', label: 'Equipamiento / Rotura de pala / Vestimenta' },
  { value: 'ball_change', label: 'Bolas / Cambio irregular de pelotas' },
  { value: 'referee_decision', label: 'Consulta / Decisión del Juez Árbitro' },
  { value: 'conduct', label: 'Conducta del público o acompañantes' },
  { value: 'delay', label: 'Demora o interrupción externa en pista' },
  { value: 'other', label: 'Otras incidencias y observaciones' },
];

const QUICK_INCIDENT_PRESETS = [
  'Rotura de cordón de seguridad de pala. Se concede tiempo para sustitución.',
  'Pelota sale fuera de recinto. Se repone por bola nueva de la misma marca.',
  'Interrupción por entrada involuntaria de pelota de la pista contigua.',
  'Advertencia al público por comentarios y ruidos durante el saque.',
  'Consulta del jugador con el Juez Árbitro sobre interpretación del punto de oro.',
  'El jugador solicita asistencia por rotura de calzado deportivo.',
];

export const IncidentsModal: React.FC<IncidentsModalProps> = ({
  state,
  onClose,
  onApplySuspension,
  onUpdateActiveSuspensionTimer,
  onResumeMatchFromSuspension,
  onDeclareDefinitiveSuspension,
  onAddIncident,
  onRemoveIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'suspension' | 'other_incidents'>('suspension');

  // Suspension Form State
  const [suspensionType, setSuspensionType] = useState<SuspensionType>('momentary');
  const [suspensionReason, setSuspensionReason] = useState(SUSPENSION_REASONS[0]);
  const [customSuspensionMinutes, setCustomSuspensionMinutes] = useState<number>(15);
  const [suspensionNotes, setSuspensionNotes] = useState('');

  // Audio / Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Other Incidents Form State
  const [incidentType, setIncidentType] = useState<any>('equipment');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Live snapshot calculation
  const liveSnapshot = createSuspensionSnapshot(state);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, []);

  // Recording counter
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecordingAndTranscribe();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const stopAllMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startVoiceRecording = async () => {
    setErrorMessage(null);
    setStatusMessage('Accediendo al micrófono...');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no permite la captura de audio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setStatusMessage('🔴 Grabando voz... Describe lo ocurrido con claridad.');
      };

      recorder.start(250);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      setStatusMessage(null);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado en el navegador.'
          : err.message || 'No se pudo iniciar la grabación de audio.'
      );
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!isRecording && !mediaRecorderRef.current) return;

    setIsRecording(false);
    setStatusMessage('✨ Transcribiendo grabación con IA...');
    setIsTranscribing(true);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setTimeout(async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder?.mimeType || 'audio/webm',
        });

        if (audioBlob.size < 1000) {
          setIsTranscribing(false);
          setStatusMessage(null);
          return;
        }

        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        const newUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(newUrl);

        const base64Audio = await blobToBase64(audioBlob);

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Audio,
            mimeType: audioBlob.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Error en la transcripción del servidor');
        }

        const data = await response.json();
        if (data.text && data.text.trim()) {
          const text = data.text.trim();
          if (activeTab === 'suspension') {
            setSuspensionNotes((prev) => (prev ? `${prev.trim()} ${text}` : text));
          } else {
            setIncidentDescription((prev) => (prev ? `${prev.trim()} ${text}` : text));
          }
          setStatusMessage('✅ Transcripción completada e incorporada.');
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          setStatusMessage('⚠️ No se detectó voz clara en el audio grabado.');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } catch (err: any) {
        console.error('Transcription error:', err);
        setErrorMessage('No se pudo transcribir el audio automáticamente. Puedes redactarlo manualmente.');
        setStatusMessage(null);
      } finally {
        setIsTranscribing(false);
      }
    }, 400);
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startVoiceRecording();
    }
  };

  const togglePlayAudio = () => {
    if (!recordedAudioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(recordedAudioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.src = recordedAudioUrl;
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Submit Suspension
  const handleApplySuspensionSubmit = () => {
    if (isRecording) stopAllMedia();

    const snapshot = createSuspensionSnapshot(state);
    onApplySuspension({
      type: suspensionType,
      reason: suspensionReason,
      description: suspensionNotes.trim() ? suspensionNotes.trim() : undefined,
      snapshot,
      durationConfigMinutes: suspensionType === 'momentary' ? customSuspensionMinutes : undefined,
      timerRemainingSeconds: suspensionType === 'momentary' ? customSuspensionMinutes * 60 : undefined,
      isTimerRunning: suspensionType === 'momentary',
      isResumed: false,
    });

    setSuspensionNotes('');
    setRecordedAudioUrl(null);
    onClose();
  };

  // Submit Other Incident
  const handleSubmitIncident = () => {
    if (!incidentDescription.trim() && !incidentTitle.trim()) return;
    if (isRecording) stopAllMedia();

    const selectedTypeObj = INCIDENT_TYPES.find((t) => t.value === incidentType);
    const title = incidentTitle.trim() || selectedTypeObj?.label || 'Incidencia';

    onAddIncident({
      type: incidentType,
      title,
      description: incidentDescription.trim(),
      setIndex: state.currentSetIndex,
      scoreAtMoment: liveSnapshot.scoreDisplay,
    });

    setIncidentTitle('');
    setIncidentDescription('');
    setRecordedAudioUrl(null);
    setStatusMessage('✅ Incidencia registrada correctamente.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Active Suspension Handler
  const activeSuspension = state.activeSuspension;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#16181b] border border-[#282a2e] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#111317] border-b border-[#282a2e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#e2e2e8] flex items-center gap-2">
                Incidencias y Suspensión de Partido
                {activeSuspension && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">
                    Partido Suspendido
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#8e989d]">
                Control arbitral oficial FIP de interrupciones, estado técnico y observaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#282a2e] text-[#8e989d] hover:text-[#e2e2e8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#282a2e] bg-[#111317]/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('suspension')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'suspension'
                ? 'bg-[#ffba4a] text-black shadow-md'
                : 'text-[#bbc9cf] hover:bg-[#1e2023] hover:text-[#e2e2e8]'
            }`}
          >
            <PauseCircle className="w-4 h-4" />
            <span>Suspensión de Partido</span>
            {activeSuspension && (
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('other_incidents')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'other_incidents'
                ? 'bg-[#47d6ff] text-black shadow-md'
                : 'text-[#bbc9cf] hover:bg-[#1e2023] hover:text-[#e2e2e8]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Otras Incidencias ({state.incidents?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'suspension' ? (
            activeSuspension ? (
              /* PANEL DE SUSPENSIÓN ACTIVA EN CURSO */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-[#1e2023] to-[#16181b] border-2 border-amber-500/50 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <PauseCircle className="w-4 h-4 text-amber-400" />
                      SUSPENSIÓN DE PARTIDO EN CURSO
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {activeSuspension.type === 'momentary' ? 'Momentánea / Temporal' : 'Definitiva / Cancelado'}
                    </span>
                  </div>

                  {/* Motivo */}
                  <div className="bg-[#111317] p-3 rounded-xl border border-[#282a2e]">
                    <div className="text-[10px] text-[#8e989d] uppercase font-bold">Causa / Motivo</div>
                    <div className="text-sm font-bold text-[#e2e2e8] mt-0.5">{activeSuspension.reason}</div>
                    {activeSuspension.description && (
                      <p className="text-xs text-[#ffd79f] italic mt-1 bg-[#16181b] p-2 rounded-lg border border-[#282a2e]">
                        "{activeSuspension.description}"
                      </p>
                    )}
                  </div>

                  {/* Temporizador de suspensión configurable si es momentánea */}
                  {activeSuspension.type === 'momentary' && (
                    <div className="bg-[#111317] p-3.5 rounded-xl border border-[#ffba4a]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#ffd79f]">
                          <Timer className="w-4 h-4 text-[#ffba4a]" />
                          <span>Temporizador de Suspensión ({activeSuspension.durationConfigMinutes || 15} min)</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8e989d]">
                          Inicio: {new Date(activeSuspension.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Display del cronómetro */}
                      <div className="flex items-center justify-center gap-4 py-2 bg-[#16181b] rounded-xl border border-[#282a2e]">
                        <div className="text-3xl sm:text-4xl font-mono font-black text-[#ffba4a] tracking-wider">
                          {(() => {
                            const sec = activeSuspension.timerRemainingSeconds ?? (activeSuspension.durationConfigMinutes || 15) * 60;
                            const m = Math.floor(sec / 60);
                            const s = sec % 60;
                            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currSec = activeSuspension.timerRemainingSeconds ?? (activeSuspension.durationConfigMinutes || 15) * 60;
                              const isRunning = activeSuspension.isTimerRunning ?? true;
                              onUpdateActiveSuspensionTimer(currSec, !isRunning);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              activeSuspension.isTimerRunning
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600/40'
                                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                            }`}
                          >
                            {activeSuspension.isTimerRunning ? (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Reanudar Crono</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const currSec = (activeSuspension.timerRemainingSeconds ?? 0) + 300;
                              onUpdateActiveSuspensionTimer(currSec, activeSuspension.isTimerRunning ?? true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#1e2023] hover:bg-[#282a2e] text-[#ffd79f] border border-[#282a2e]"
                            title="Añadir 5 minutos"
                          >
                            +5 min
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Snapshot del momento exacto */}
                  <div className="bg-[#111317] p-3 rounded-xl border border-[#282a2e] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#e2e2e8] border-b border-[#282a2e] pb-1.5">
                      <span className="flex items-center gap-1.5 text-[#47d6ff]">
                        <Layers className="w-3.5 h-3.5" />
                        Situación de Juego al Suspender
                      </span>
                      <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        {activeSuspension.snapshot.scoreDisplay}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Servicio y lado */}
                      <div className="p-2 bg-[#16181b] rounded-lg border border-[#282a2e]">
                        <span className="text-[10px] text-[#8e989d] uppercase font-bold block">Al Saque:</span>
                        <div className="font-bold text-[#ffd79f]">
                          {activeSuspension.snapshot.serverPlayerName} ({activeSuspension.snapshot.serverTeamName})
                        </div>
                        <div className="text-[11px] text-[#bbc9cf] mt-0.5">
                          Lado de saque:{' '}
                          <span className="font-bold text-[#e2e2e8]">
                            {activeSuspension.snapshot.serveSide === 'deuce' ? 'Lado Derecho (Iguales)' : 'Lado Izquierdo (Ventaja)'}
                          </span>
                        </div>
                      </div>

                      {/* Lados de pista */}
                      <div className="p-2 bg-[#16181b] rounded-lg border border-[#282a2e]">
                        <span className="text-[10px] text-[#8e989d] uppercase font-bold block">Ubicación en Pista:</span>
                        <div className="text-[11px] text-[#bbc9cf]">
                          Pista Izquierda: <span className="font-bold text-[#e2e2e8]">{activeSuspension.snapshot.courtSides.teamOnLeft}</span>
                        </div>
                        <div className="text-[11px] text-[#bbc9cf]">
                          Pista Derecha: <span className="font-bold text-[#e2e2e8]">{activeSuspension.snapshot.courtSides.teamOnRight}</span>
                        </div>
                      </div>
                    </div>

                    {/* Posiciones de los 4 jugadores */}
                    <div className="p-2 bg-[#16181b] rounded-lg border border-[#282a2e] space-y-1 text-[11px]">
                      <span className="text-[10px] text-[#8e989d] uppercase font-bold block">Posición de Jugadores en Pista:</span>
                      <div className="flex justify-between items-center text-[#bbc9cf]">
                        <span className="font-bold text-[#e2e2e8]">{state.teamAName}:</span>
                        <span>
                          {activeSuspension.snapshot.playersPositions.teamA[0].name} ({activeSuspension.snapshot.playersPositions.teamA[0].position}) — {activeSuspension.snapshot.playersPositions.teamA[1].name} ({activeSuspension.snapshot.playersPositions.teamA[1].position})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#bbc9cf]">
                        <span className="font-bold text-[#e2e2e8]">{state.teamBName}:</span>
                        <span>
                          {activeSuspension.snapshot.playersPositions.teamB[0].name} ({activeSuspension.snapshot.playersPositions.teamB[0].position}) — {activeSuspension.snapshot.playersPositions.teamB[1].name} ({activeSuspension.snapshot.playersPositions.teamB[1].position})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Reanudación */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        onResumeMatchFromSuspension();
                        onClose();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Reanudar Partido Oficialmente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeclareDefinitiveSuspension();
                        onClose();
                      }}
                      className="py-3 px-3.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Declarar Suspensión Definitiva</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* FORMULARIO DE NUEVA SUSPENSIÓN DE PARTIDO */
              <div className="space-y-4">
                {/* Tipo de Suspensión */}
                <div>
                  <label className="text-xs font-bold text-[#e2e2e8] block mb-1.5">
                    Tipo de Suspensión Reglamentaria:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSuspensionType('momentary')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        suspensionType === 'momentary'
                          ? 'bg-amber-500/15 border-amber-500 text-[#ffd79f] shadow-md'
                          : 'bg-[#111317] border-[#282a2e] text-[#8e989d] hover:bg-[#1e2023]'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Momentánea / Temporal
                      </div>
                      <div className="text-[10px] text-[#bbc9cf] mt-1">
                        Interrupción transitoria (lluvia, luz, secado de cristales). Se reanudará.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuspensionType('definitive')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        suspensionType === 'definitive'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md'
                          : 'bg-[#111317] border-[#282a2e] text-[#8e989d] hover:bg-[#1e2023]'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Square className="w-3.5 h-3.5 text-rose-400" />
                        Definitiva / Cancelación
                      </div>
                      <div className="text-[10px] text-[#bbc9cf] mt-1">
                        Aplazamiento o suspensión definitiva por imposibilidad de continuar.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Motivo de la suspensión */}
                <div>
                  <label className="text-xs font-bold text-[#e2e2e8] block mb-1.5">
                    Motivo de la Suspensión:
                  </label>
                  <select
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    className="w-full bg-[#111317] border border-[#282a2e] rounded-xl p-2.5 text-xs text-[#e2e2e8] font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    {SUSPENSION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Si es momentánea: Temporizador Configurable */}
                {suspensionType === 'momentary' && (
                  <div className="p-3 bg-[#111317] border border-[#282a2e] rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#ffd79f] flex items-center gap-1.5">
                        <Timer className="w-4 h-4 text-amber-400" />
                        Tiempo de Suspensión Configurable (Minutos):
                      </span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {customSuspensionMinutes} min ({customSuspensionMinutes * 60} seg)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setCustomSuspensionMinutes(mins)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            customSuspensionMinutes === mins
                              ? 'bg-amber-500 text-black border-amber-400 font-black shadow-xs'
                              : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#1e2023]'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SNAPSHOT EN VIVO QUE SE GUARDARÁ */}
                <div className="p-3 rounded-xl bg-[#111317] border border-[#282a2e] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#e2e2e8]">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Captura Automática de la Situación Técnica
                    </span>
                    <span className="text-[10px] text-[#8e989d]">Instantánea en vivo</span>
                  </div>

                  <div className="bg-[#16181b] p-2.5 rounded-lg border border-[#282a2e] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e989d]">Marcador:</span>
                      <span className="font-bold text-[#ffd79f]">{liveSnapshot.scoreDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e989d]">Servidor al reanudar:</span>
                      <span className="font-bold text-[#e2e2e8]">
                        {liveSnapshot.serverPlayerName} ({liveSnapshot.serverTeamName})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e989d]">Lado de servicio reglamentario:</span>
                      <span className="font-bold text-[#47d6ff]">
                        {liveSnapshot.serveSide === 'deuce' ? 'Lado Derecho (Iguales)' : 'Lado Izquierdo (Ventaja)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e989d]">Restador correspondiente:</span>
                      <span className="font-bold text-[#e2e2e8]">{liveSnapshot.receiverPlayerName || 'Restador'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] border-t border-[#282a2e] pt-1 text-[#bbc9cf]">
                      <span>Pista Izq: {liveSnapshot.courtSides.teamOnLeft}</span>
                      <span>Pista Der: {liveSnapshot.courtSides.teamOnRight}</span>
                    </div>
                  </div>
                </div>

                {/* Dictado por Voz & Observaciones de la Suspensión */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#ffd79f] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Declaración / Hechos de la Suspensión (con Voz IA):
                    </label>
                    <span className="text-[10px] text-[#8e989d]">Para el Acta Oficial FIP</span>
                  </div>

                  <textarea
                    value={suspensionNotes}
                    onChange={(e) => setSuspensionNotes(e.target.value)}
                    placeholder="Describe los detalles de la suspensión o pulsa 'Grabar / Dictar Voz' para transcribir tu relato con IA..."
                    rows={3}
                    className="w-full bg-[#111317] border border-[#282a2e] rounded-xl p-2.5 text-xs text-[#e2e2e8] placeholder:text-[#52565c] focus:border-amber-500 focus:outline-hidden resize-none leading-relaxed"
                  />

                  {/* Botones de Voz y Audio */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isTranscribing}
                      onClick={handleToggleVoice}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 ${
                        isRecording
                          ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                          : isTranscribing
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/60 text-emerald-300 hover:text-emerald-200'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 text-white" />
                          <span>Detener y Transcribir ({recordingSeconds}s)</span>
                        </>
                      ) : isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          <span>Transcribiendo con IA...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-emerald-400" />
                          <span>Grabar / Dictar Voz</span>
                        </>
                      )}
                    </button>

                    {recordedAudioUrl && !isRecording && !isTranscribing && (
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        className="text-[11px] bg-[#1e2023] hover:bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] px-2.5 py-1.5 rounded-lg border border-[#282a2e] flex items-center gap-1.5"
                      >
                        {isPlayingAudio ? (
                          <>
                            <Square className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>Pausar Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                            <span>Escuchar Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {statusMessage && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#111317] border border-[#282a2e] text-[11px] text-[#ffd79f] animate-in fade-in">
                      {isTranscribing ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="text-[10px] text-[#ffb4ab] bg-rose-950/40 p-2 rounded-lg border border-rose-900/50 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab] shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* Botón Aplicar Suspensión */}
                <button
                  type="button"
                  onClick={handleApplySuspensionSubmit}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
                >
                  <PauseCircle className="w-5 h-5" />
                  <span>Decretar Suspensión Oficial del Partido</span>
                </button>
              </div>
            )
          ) : (
            /* PESTAÑA DE OTRAS INCIDENCIAS ARBITRALES */
            <div className="space-y-4 animate-in fade-in">
              {/* Formulario de nueva incidencia */}
              <div className="p-3.5 bg-[#111317] rounded-xl border border-[#282a2e] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#47d6ff] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Nueva Incidencia u Observación
                  </span>
                  <span className="text-[10px] text-[#8e989d]">
                    Momento: {liveSnapshot.scoreDisplay}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#bbc9cf] block mb-1">
                    Tipo de Incidencia:
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full bg-[#16181b] border border-[#282a2e] rounded-xl p-2 text-xs text-[#e2e2e8] focus:border-[#47d6ff] focus:outline-hidden"
                  >
                    {INCIDENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#bbc9cf] block mb-1">
                    Título / Resumen (Optativo):
                  </label>
                  <input
                    type="text"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="Ej: Cambio de pelotas por salida fuera de recinto..."
                    className="w-full bg-[#16181b] border border-[#282a2e] rounded-xl p-2 text-xs text-[#e2e2e8] focus:border-[#47d6ff] focus:outline-hidden placeholder:text-[#52565c]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#bbc9cf] block mb-1">
                    Descripción / Hechos (con Dictado de Voz IA):
                  </label>
                  <textarea
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Describe los hechos o pulsa 'Grabar / Dictar Voz' para transcribir..."
                    rows={3}
                    className="w-full bg-[#16181b] border border-[#282a2e] rounded-xl p-2.5 text-xs text-[#e2e2e8] placeholder:text-[#52565c] focus:border-[#47d6ff] focus:outline-hidden resize-none leading-relaxed"
                  />
                </div>

                {/* Botón de Dictado de voz para otras incidencias */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isTranscribing}
                    onClick={handleToggleVoice}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 ${
                      isRecording
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : isTranscribing
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        : 'bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/60 text-emerald-300 hover:text-emerald-200'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-white" />
                        <span>Detener y Transcribir ({recordingSeconds}s)</span>
                      </>
                    ) : isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span>Transcribiendo...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Grabar / Dictar Voz</span>
                      </>
                    )}
                  </button>

                  {recordedAudioUrl && !isRecording && !isTranscribing && (
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="text-[11px] bg-[#1e2023] hover:bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] px-2.5 py-1.5 rounded-lg border border-[#282a2e] flex items-center gap-1.5"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Square className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                          <span>Escuchar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {statusMessage && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#16181b] border border-[#282a2e] text-[11px] text-[#47d6ff]">
                    <Sparkles className="w-3.5 h-3.5 text-[#47d6ff]" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Plantillas rápidas */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] uppercase font-bold text-[#8e989d] block">
                    Plantillas rápidas (clic para insertar):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_INCIDENT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setIncidentDescription((prev) =>
                            prev.trim() ? `${prev.trim()} ${preset}` : preset
                          )
                        }
                        className="text-[10px] bg-[#16181b] hover:bg-[#1e2023] text-[#bbc9cf] hover:text-[#e2e2e8] px-2 py-1 rounded-md border border-[#282a2e] text-left transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitIncident}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#47d6ff] hover:bg-[#38c2ea] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Incidencia en el Informe FIP</span>
                </button>
              </div>

              {/* Lista de incidencias ya registradas en el partido */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e989d]">
                  Incidencias Registradas en el Encuentro ({state.incidents?.length || 0})
                </h3>

                {state.incidents && state.incidents.length > 0 ? (
                  <div className="space-y-2">
                    {state.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="bg-[#111317] p-3 rounded-xl border border-[#282a2e] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#ffd79f] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#47d6ff]" />
                            {inc.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#8e989d] font-mono">
                              {new Date(inc.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {onRemoveIncident && (
                              <button
                                type="button"
                                onClick={() => onRemoveIncident(inc.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/30"
                                title="Eliminar incidencia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {inc.scoreAtMoment && (
                          <div className="text-[10px] text-[#47d6ff] font-mono">
                            Momento: {inc.scoreAtMoment}
                          </div>
                        )}

                        <p className="text-[#bbc9cf] text-[11px] leading-relaxed bg-[#16181b] p-2 rounded-lg border border-[#282a2e]">
                          {inc.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#111317] border border-[#282a2e] text-center text-xs text-[#8e989d]">
                    No se han registrado otras incidencias en este partido.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111317] border-t border-[#282a2e] flex items-center justify-between">
          <div className="text-[10px] text-[#8e989d] flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#47d6ff]" />
            <span>Reglamento Técnico Oficial de Pádel FIP</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1e2023] hover:bg-[#282a2e] text-[#e2e2e8] text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
