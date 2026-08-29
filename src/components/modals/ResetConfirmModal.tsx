import React from 'react';
import { RotateCcw, AlertTriangle, X, Play, RefreshCw } from 'lucide-react';

interface ResetConfirmModalProps {
  onClose: () => void;
  onResetFullMatch: () => void;
  onResetCurrentGame: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  onClose,
  onResetFullMatch,
  onResetCurrentGame,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-sm rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#16181b] border-b border-[#282a2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ffb4ab]/15 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e2e2e8]">Reiniciar Marcador</h3>
              <p className="text-[10px] text-[#859398]">Selecciona una opción de reinicio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Options */}
        <div className="p-4 space-y-2.5">
          {/* Option 1: Full Match Reset */}
          <button
            onClick={() => {
              onResetFullMatch();
              onClose();
            }}
            id="btn-confirm-full-reset"
            className="w-full p-3 rounded-xl border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-left flex items-start gap-3 active:scale-98 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#ffb4ab] group-hover:underline">
                Reiniciar Partido Completo
              </div>
              <div className="text-[10px] text-[#bbc9cf] mt-0.5 leading-tight">
                Pone todos los sets a 0-0, tiempo a 00:00 y borra el historial de puntos.
              </div>
            </div>
          </button>

          {/* Option 2: Current Game Reset */}
          <button
            onClick={() => {
              onResetCurrentGame();
              onClose();
            }}
            id="btn-confirm-game-reset"
            className="w-full p-3 rounded-xl border border-[#282a2e] bg-[#16181b] hover:bg-[#282a2e] text-left flex items-start gap-3 active:scale-98 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#47d6ff]/15 flex items-center justify-center text-[#47d6ff] shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#e2e2e8] group-hover:text-[#47d6ff]">
                Reiniciar Solo el Juego Actual
              </div>
              <div className="text-[10px] text-[#bbc9cf] mt-0.5 leading-tight">
                Mantiene los sets y juegos ganados, solo reinicia los puntos a 0-0.
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#16181b] border-t border-[#282a2e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
