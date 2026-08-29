import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  Mic,
  MicOff,
  FileText,
  Sparkles,
  Volume2,
  Check,
  RotateCcw,
  Loader2,
  Play,
  Square,
} from 'lucide-react';
import { MatchState, Team, WarningLevel, WarningRecord } from '../../types';
import { playWhistleSound } from '../../utils/sound';

interface WarningsModalProps {
  state: MatchState;
  onClose: () => void;
  onAddWarning: (warning: Omit<WarningRecord, 'id' | 'timestamp'>) => void;
  onRemoveWarning: (id: string) => void;
}

// Quick preset description tags for referees
const QUICK_INCIDENT_PRESETS = [
  'Lanzó la pala con fuerza contra el cristal de fondo.',
  'Insultos verbales reiterados hacia la pareja rival.',
  'Discusión airada y desobediencia a las indicaciones del árbitro.',
  'Demora deliberada de tiempo superior a los 25 segundos entre puntos.',
  'Lanzamiento antirreglamentario de pelota fuera de la pista.',
  'Coaching o indicaciones tácticas directas no autorizadas desde la grada.',
];

export const WarningsModal: React.FC<WarningsModalProps> = ({
  state,
  onClose,
  onAddWarning,
  onRemoveWarning,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team>('teamA');
  const [selectedPlayer, setSelectedPlayer] = useState<string>(
    state.teamAPlayers[0]?.name || ''
  );
  const [level, setLevel] = useState<WarningLevel>('warning');
  const [reason, setReason] = useState('Conducta antideportiva');

  // Incident description and audio transcription state
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Refs for media recording & recognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const reasonsList = [
    'Pérdida de tiempo',
    'Conducta antideportiva',
    'Lanzamiento / Rotura de pala',
    'Lenguaje o gestos obscenos',
    'Abuso de pelota',
    'Instrucciones no autorizadas (Coaching)',
  ];

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Timer effect for voice recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            // Auto stop at 60s
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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
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

  const handleLevelChange = (newLevel: WarningLevel) => {
    setLevel(newLevel);
    if (newLevel === 'time_violation') {
      setReason('Pérdida de tiempo');
    }
  };

  // Convert Blob to Base64 String
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xyz;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start voice recording (Microphone stream + MediaRecorder + WebSpeech live preview)
  const startVoiceRecording = async () => {
    setErrorMessage(null);
    setStatusMessage('Accediendo al micrófono...');
    setShowDescription(true);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no permite la captura directa de audio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Select optimal supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setStatusMessage('🔴 Grabando voz... Describe lo ocurrido con claridad.');
      };

      recorder.start(250); // Slice data every 250ms

      // Optional real-time Web Speech recognition for instant visual text
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-ES';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                const text = event.results[i][0].transcript.trim();
                if (text) {
                  setDescription((prev) => (prev ? `${prev} ${text}` : text));
                }
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
          };

          recognition.onerror = () => {
            // SpeechRecognition error is non-fatal since Gemini backend will transcribe the recorded audio!
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          // Web speech not available, Gemini handles transcription
        }
      }
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      setStatusMessage(null);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Permiso de micrófono denegado. Concede permiso en el navegador o escribe los hechos directamente.'
        );
      } else {
        setErrorMessage(
          err.message || 'No se pudo iniciar la grabación de audio. Puedes escribir los hechos manualmente.'
        );
      }
    }
  };

  // Stop recording and transcribe audio via backend Gemini AI
  const stopRecordingAndTranscribe = async () => {
    if (!isRecording && !mediaRecorderRef.current) return;

    setIsRecording(false);
    setStatusMessage('✨ Transcribiendo grabación con IA...');
    setIsTranscribing(true);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Wait a brief moment for recorder data chunks to finalize
    setTimeout(async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder?.mimeType || 'audio/webm',
        });

        if (audioBlob.size < 1000) {
          // Very short or empty audio
          setIsTranscribing(false);
          setStatusMessage(null);
          return;
        }

        // Create local audio playback url
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);

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
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Error en el servidor (${response.status})`);
        }

        const data = await response.json();
        if (data.text && data.text.trim()) {
          const transcribedText = data.text.trim();
          setDescription((prev) => {
            if (!prev.trim()) return transcribedText;
            // Avoid duplicate if live preview already caught it
            if (prev.toLowerCase().includes(transcribedText.toLowerCase())) {
              return prev;
            }
            return `${prev.trim()} ${transcribedText}`;
          });
          setStatusMessage('✅ Transcripción completada e incorporada al informe.');
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage('⚠️ No se detectó voz clara en el audio grabado.');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } catch (err: any) {
        console.error('Transcription failed:', err);
        setErrorMessage(
          `No se pudo transcribir automáticamente (${err.message || 'error de conexión'}). Puedes redactar o editar el texto manualmente.`
        );
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

  const handleAppendPreset = (presetText: string) => {
    setShowDescription(true);
    setDescription((prev) => {
      if (!prev.trim()) return presetText;
      return `${prev.trim()} ${presetText}`;
    });
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.src = audioUrl;
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleApplyWarning = () => {
    if (isRecording) {
      stopAllMedia();
      setIsRecording(false);
    }

    playWhistleSound();
    onAddWarning({
      team: selectedTeam,
      playerName: selectedPlayer,
      level,
      reason,
      description: description.trim() ? description.trim() : undefined,
    });

    // Reset description for next warning
    setDescription('');
    setShowDescription(false);
    setAudioUrl(null);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const getLevelBadge = (lvl: WarningLevel) => {
    switch (lvl) {
      case 'time_violation':
        return (
          <span className="bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/30 px-2 py-0.5 rounded text-[10px] font-bold">
            Infracción de Tiempo
          </span>
        );
      case 'warning':
        return (
          <span className="bg-[#ffba4a]/20 text-[#ffba4a] px-2 py-0.5 rounded text-[10px] font-bold">
            1ª Advertencia
          </span>
        );
      case 'point_penalty':
        return (
          <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] px-2 py-0.5 rounded text-[10px] font-bold">
            Punto Penalizado
          </span>
        );
      case 'game_penalty':
        return (
          <span className="bg-[#93000a] text-[#ffdad6] px-2 py-0.5 rounded text-[10px] font-bold">
            Juego Penalizado
          </span>
        );
      case 'disqualification':
        return (
          <span className="bg-[#93000a] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Descalificación
          </span>
        );
    }
  };

  const currentTeamPlayers =
    selectedTeam === 'teamA' ? state.teamAPlayers : state.teamBPlayers;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1e2023] border border-[#ffba4a]/40 w-full max-w-lg rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2e] bg-[#16181b] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#ffba4a]" />
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-[#e2e2e8]">
                Código de Conducta y Advertencias
              </h2>
              <p className="text-[10px] text-[#bbc9cf]">
                Régimen Disciplinario FIP & Registro de Incidentes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* New warning form */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ffba4a] uppercase tracking-wider block">
                Aplicar Nueva Sanción
              </span>
              <span className="text-[10px] text-[#bbc9cf]">Reglamento Oficial FIP</span>
            </div>

            {/* Team selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam('teamA');
                  setSelectedPlayer(state.teamAPlayers[0]?.name);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all truncate ${
                  selectedTeam === 'teamA'
                    ? 'bg-[#47d6ff] text-[#001f28] shadow-sm'
                    : 'bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                {state.teamAName}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam('teamB');
                  setSelectedPlayer(state.teamBPlayers[0]?.name);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all truncate ${
                  selectedTeam === 'teamB'
                    ? 'bg-[#e2e2e8] text-[#111317] shadow-sm'
                    : 'bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                {state.teamBName}
              </button>
            </div>

            {/* Player */}
            <div>
              <label className="text-[11px] text-[#bbc9cf] block mb-1 font-bold">
                Jugador Sancionado
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full bg-[#1e2023] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden focus:border-[#ffba4a]"
              >
                {currentTeamPlayers.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.name} ({p.position === 'drive' ? 'Drive' : 'Revés'})
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="text-[11px] text-[#bbc9cf] block mb-1 font-bold">
                Gravedad Reglamentaria (Escala Progresiva FIP)
              </label>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value as WarningLevel)}
                className="w-full bg-[#1e2023] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden focus:border-[#ffba4a]"
              >
                <option value="time_violation">Infracción de Tiempo (Time Violation)</option>
                <option value="warning">1ª Infracción: Advertencia (Warning)</option>
                <option value="point_penalty">2ª Infracción: Penalización de Punto (Point)</option>
                <option value="game_penalty">3ª Infracción: Penalización de Juego (Game)</option>
                <option value="disqualification">4ª Infracción: Descalificación (Default)</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="text-[11px] text-[#bbc9cf] block mb-1 font-bold">
                Motivo / Tipificación de la Infracción
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#1e2023] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden focus:border-[#ffba4a]"
              >
                {reasonsList.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* SECCIÓN OPTATIVA: DESCRIBIR LO SUCEDIDO CON GRABACIÓN & IA */}
            <div className="pt-1">
              {!showDescription ? (
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#ffba4a]/40 bg-[#1e2023]/60 hover:bg-[#1e2023] text-xs text-[#ffd79f] font-bold flex items-center justify-between gap-2 transition-all active:scale-99"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ffba4a]" />
                    <span>Describir lo sucedido para el informe</span>
                    <span className="text-[9px] bg-[#ffba4a]/20 text-[#ffba4a] px-1.5 py-0.5 rounded font-normal">
                      Optativo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Grabar / Dictar</span>
                  </div>
                </button>
              ) : (
                <div className="bg-[#16181b] border border-[#ffba4a]/40 rounded-xl p-3 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffd79f]">
                      <FileText className="w-3.5 h-3.5 text-[#ffba4a]" />
                      <span>Descripción de los Hechos (Acta Arbitral)</span>
                      <span className="text-[9px] bg-[#ffba4a]/15 text-[#ffba4a] px-1.5 py-0.5 rounded">
                        Optativo
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) stopRecordingAndTranscribe();
                        setShowDescription(false);
                      }}
                      className="text-[10px] text-[#bbc9cf] hover:text-[#e2e2e8] underline"
                    >
                      Ocultar
                    </button>
                  </div>

                  {/* Textarea for detailed description */}
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe lo sucedido o pulsa 'Grabar / Dictar' para transcribir automáticamente tu voz al informe oficial..."
                      rows={3}
                      className="w-full bg-[#111317] border border-[#282a2e] rounded-xl p-2.5 text-xs text-[#e2e2e8] placeholder:text-[#52565c] focus:border-[#ffba4a] focus:outline-hidden resize-none leading-relaxed"
                    />
                    {description && (
                      <button
                        type="button"
                        onClick={() => setDescription('')}
                        title="Limpiar texto"
                        className="absolute right-2 top-2 p-1 rounded-md bg-[#1e2023] text-[#bbc9cf] hover:text-[#ffb4ab] text-[10px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Voice recording and transcription controls */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
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
                          <span>Transcribiendo Audio...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-emerald-400" />
                          <span>Grabar / Dictar Voz</span>
                        </>
                      )}
                    </button>

                    {/* Audio playback preview if recorded */}
                    {audioUrl && !isRecording && !isTranscribing && (
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

                  {/* Status / Transcription Info Banner */}
                  {statusMessage && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#111317] border border-[#282a2e] text-[11px] text-[#ffd79f] animate-in fade-in">
                      {isTranscribing ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#ffba4a] animate-spin shrink-0" />
                      ) : isRecording ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
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

                  {/* Quick incident templates for referee convenience */}
                  <div className="space-y-1 pt-1 border-t border-[#282a2e]/60">
                    <span className="text-[9px] uppercase font-bold text-[#8e989d] block">
                      Plantillas rápidas de hechos (clic para insertar):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_INCIDENT_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAppendPreset(preset)}
                          className="text-[9px] bg-[#1e2023] hover:bg-[#282a2e] border border-[#282a2e] hover:border-[#ffba4a]/40 text-[#bbc9cf] hover:text-[#ffd79f] px-2 py-1 rounded-md text-left truncate max-w-full transition-all"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Apply Warning Action Button */}
            <button
              onClick={handleApplyWarning}
              className="w-full py-2.5 bg-[#ffba4a] hover:bg-[#ffb229] active:scale-98 text-[#291800] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Registrar Sanción Oficial</span>
              {description.trim() && (
                <span className="text-[10px] bg-[#291800]/20 text-[#291800] px-1.5 py-0.5 rounded font-bold">
                  + Con Acta
                </span>
              )}
            </button>
          </div>

          {/* Existing warnings list */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#bbc9cf] uppercase tracking-wider block">
              Registro Disciplinario del Encuentro ({state.warnings.length})
            </span>
            {state.warnings.length === 0 ? (
              <p className="text-xs text-[#bbc9cf] text-center py-4 bg-[#111317] rounded-xl border border-[#282a2e]">
                Sin advertencias ni sanciones registradas (Juego Limpio).
              </p>
            ) : (
              <div className="space-y-2">
                {state.warnings.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-[#111317] border border-[#282a2e] rounded-xl flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getLevelBadge(w.level)}
                          <span className="font-bold text-[#e2e2e8]">
                            {w.team === 'teamA' ? state.teamAName : state.teamBName}
                          </span>
                          {w.playerName && (
                            <span className="text-[#bbc9cf]">({w.playerName})</span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#ffd79f] font-medium block">
                          • {w.reason}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveWarning(w.id)}
                        title="Eliminar sanción"
                        className="p-1.5 text-[#bbc9cf] hover:text-[#ffb4ab] rounded-lg hover:bg-[#282a2e]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detailed description if provided */}
                    {w.description && (
                      <div className="p-2.5 bg-[#16181b] border border-[#282a2e] rounded-lg text-[11px] text-[#e2e2e8] space-y-1">
                        <div className="flex items-center gap-1.5 text-[#ffba4a] font-bold text-[10px] uppercase">
                          <FileText className="w-3 h-3" />
                          <span>Hechos Constatados / Acta:</span>
                        </div>
                        <p className="italic text-[#d1d7db] leading-relaxed">
                          "{w.description}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a2e] bg-[#16181b] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
          >
            Listo / Volver al Partido
          </button>
        </div>
      </div>
    </div>
  );
};

