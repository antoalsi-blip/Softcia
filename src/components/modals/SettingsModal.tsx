import React from 'react';
import { Settings, Volume2, Mic, RotateCcw, X, Check, Shield } from 'lucide-react';
import { MatchSettings, MatchState } from '../../types';
import { BallChangeConfigSection } from '../BallChangeConfigSection';

interface SettingsModalProps {
  state: MatchState;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<MatchSettings>) => void;
  onResetMatch: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  state,
  onClose,
  onUpdateSettings,
  onResetMatch,
}) => {
  const settings = state.settings;
  const [confirmingReset, setConfirmingReset] = React.useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-md rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2e]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#47d6ff]" />
            <h2 className="font-headline font-bold text-base text-[#e2e2e8]">
              Reglas y Ajustes del Partido
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
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Scoring Mode (Punto de Oro vs Star Point vs Ventajas) */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#47d6ff] uppercase tracking-wider block">
                Regla de Desempate en 40-40
              </span>
              <span className="text-[10px] text-[#859398] font-mono">FIP / Premier Padel</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Punto de Oro */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ scoringMode: 'golden_point' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.scoringMode === 'golden_point'
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      🥇 Punto de Oro
                    </span>
                    {settings.scoringMode === 'golden_point' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    En 40-40, el siguiente punto gana el juego directo (sin ventajas).
                  </p>
                </div>
              </button>

              {/* Star Point */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ scoringMode: 'star_point' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.scoringMode === 'star_point'
                    ? 'border-[#ffba4a] bg-[#ffba4a]/10 text-[#ffba4a] ring-1 ring-[#ffba4a]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      ⭐ Star Point
                    </span>
                    {settings.scoringMode === 'star_point' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    Deuce 1 ➔ AD 1 ➔ Deuce 2 ➔ AD 02 ➔ SP (Punto decisivo al 3er iguales).
                  </p>
                </div>
              </button>

              {/* Ventajas Tradicionales */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ scoringMode: 'advantage' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.scoringMode === 'advantage'
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      ⚡ Ventajas (AD)
                    </span>
                    {settings.scoringMode === 'advantage' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    En 40-40 ventajas continuas hasta diferencia de 2 puntos.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Match Format (Sets to win) */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider block">
                Formato de Partido
              </span>
              <span className="text-[10px] text-[#859398] font-mono">Reglamento FIP</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 2 sets + super tie (a 10 puntos) */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ matchFormat: 'two_sets_super_tie', bestOfSets: 3 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.matchFormat === 'two_sets_super_tie'
                    ? 'border-[#ffba4a] bg-[#ffba4a]/10 text-[#ffba4a] ring-1 ring-[#ffba4a]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      ⭐ 2 Sets + Super Tie (10 pts)
                    </span>
                    {settings.matchFormat === 'two_sets_super_tie' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    2 sets normales; si empatan 1-1, el 3º set se define en Super Tie-break a 10 puntos.
                  </p>
                </div>
              </button>

              {/* Al mejor de 3 */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ matchFormat: 'best_of_3', bestOfSets: 3 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.matchFormat === 'best_of_3' || (!settings.matchFormat && settings.bestOfSets === 3)
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      🎾 Al mejor de 3 sets
                    </span>
                    {(settings.matchFormat === 'best_of_3' || (!settings.matchFormat && settings.bestOfSets === 3)) && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    3 sets completos a 6 juegos (con tie-break a 7 en 6-6 en todos los sets).
                  </p>
                </div>
              </button>

              {/* 1 Set Express */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ matchFormat: 'best_of_1', bestOfSets: 1 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.matchFormat === 'best_of_1' || (!settings.matchFormat && settings.bestOfSets === 1)
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      ⚡ 1 Set Express
                    </span>
                    {(settings.matchFormat === 'best_of_1' || (!settings.matchFormat && settings.bestOfSets === 1)) && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    Partido rápido a ganar 1 único set (a 6 juegos).
                  </p>
                </div>
              </button>

              {/* Al mejor de 5 */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ matchFormat: 'best_of_5', bestOfSets: 5 })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  settings.matchFormat === 'best_of_5' || (!settings.matchFormat && settings.bestOfSets === 5)
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      🏆 Al mejor de 5 sets
                    </span>
                    {(settings.matchFormat === 'best_of_5' || (!settings.matchFormat && settings.bestOfSets === 5)) && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <p className="text-[10px] opacity-80 leading-snug">
                    Formato largo para torneos o exhibiciones especiales.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Tiebreak Points */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-2.5">
            <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider block">
              Puntos de Tie-break
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ tiebreakPoints: 7 })}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                  settings.tiebreakPoints === 7
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff]'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                7 Puntos (Estándar)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ tiebreakPoints: 10 })}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                  settings.tiebreakPoints === 10
                    ? 'border-[#47d6ff] bg-[#47d6ff]/10 text-[#47d6ff]'
                    : 'border-[#282a2e] bg-[#1e2023] text-[#bbc9cf] hover:bg-[#333539]'
                }`}
              >
                10 Puntos (Súper Tie-break)
              </button>
            </div>
          </div>

          {/* Ball Change Section */}
          <BallChangeConfigSection
            settings={
              settings.ballChange || {
                enabled: true,
                pattern: '7_9',
                firstChangeGames: 7,
                subsequentChangeGames: 9,
              }
            }
            onChange={(newBallSettings) =>
              onUpdateSettings({ ballChange: newBallSettings })
            }
          />

          {/* Audio and Feedback */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-3">
            <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider block">
              Audio y Asistente
            </span>

            {/* Sound effects */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs text-[#e2e2e8]">
                <Volume2 className="w-4 h-4 text-[#47d6ff]" />
                <span>Efectos de sonido (silbato, golpes, chimes)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 text-[#47d6ff] rounded"
              />
            </label>

            {/* Voice callout */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs text-[#e2e2e8]">
                <Mic className="w-4 h-4 text-[#47d6ff]" />
                <span>Árbitro por voz (locución de puntos)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceCallout}
                onChange={(e) => onUpdateSettings({ voiceCallout: e.target.checked })}
                className="w-4 h-4 text-[#47d6ff] rounded"
              />
            </label>

            {/* Court change reminder */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs text-[#e2e2e8]">
                <Shield className="w-4 h-4 text-[#47d6ff]" />
                <span>Recordatorio de cambio de pista</span>
              </div>
              <input
                type="checkbox"
                checked={settings.courtChangeReminder}
                onChange={(e) => onUpdateSettings({ courtChangeReminder: e.target.checked })}
                className="w-4 h-4 text-[#47d6ff] rounded"
              />
            </label>
          </div>

          {/* Reset button */}
          <div className="pt-2">
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="w-full py-2.5 rounded-xl border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/20 active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Marcador y Partido Nuevo
              </button>
            ) : (
              <div className="p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/40 rounded-xl space-y-2">
                <p className="text-xs font-bold text-[#ffb4ab] text-center">
                  ¿Confirmas reiniciar todo el partido a 0-0?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="flex-1 py-1.5 rounded-lg bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetMatch();
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-[#ffb4ab] text-[#690005] hover:bg-[#ff897d] text-xs font-bold shadow-md active:scale-95"
                  >
                    Sí, Reiniciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a2e] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
          >
            Guardar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};
