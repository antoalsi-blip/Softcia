import React from 'react';
import { ArrowLeftRight, Zap, AlertCircle, RefreshCw, X, Check, RotateCcw } from 'lucide-react';
import { MatchState, Team } from '../../types';

interface ServiceModalProps {
  state: MatchState;
  onClose: () => void;
  onSetServer: (team: Team, playerIndex: 0 | 1) => void;
  onSetSetFirstServer?: (team: Team, playerIndex: 0 | 1) => void;
  onToggleFirstServe: (isFirst: boolean) => void;
  onRecordAce: (team: Team) => void;
  onRecordFault: () => void;
  onRecordDoubleFault: (servingTeam: Team) => void;
  onRecordLet?: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  state,
  onClose,
  onSetServer,
  onSetSetFirstServer,
  onToggleFirstServe,
  onRecordAce,
  onRecordFault,
  onRecordDoubleFault,
  onRecordLet,
}) => {
  const currentServingTeam = state.currentServer;
  const currentServingPlayer =
    currentServingTeam === 'teamA'
      ? state.teamAPlayers[state.currentServerPlayerIndex]?.name
      : state.teamBPlayers[state.currentServerPlayerIndex]?.name;

  const currentSet = state.sets[state.currentSetIndex];
  const setNum = currentSet?.setNumber || 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-md rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2e]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#47d6ff]" />
            <h2 className="font-headline font-bold text-base text-[#e2e2e8]">
              Control de Servicio y Saque
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Active Server summary */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#47d6ff]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#bbc9cf] block">
                Servidor Actual
              </span>
              <span className="text-base font-bold text-[#47d6ff]">
                {currentServingTeam === 'teamA' ? state.teamAName : state.teamBName}
              </span>
              <span className="text-xs text-[#e2e2e8] block">
                {currentServingPlayer}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#bbc9cf]">
                Estado Saque
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded mt-0.5 ${
                  state.firstServe
                    ? 'bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/40'
                    : 'bg-[#ffba4a]/20 text-[#ffba4a] border border-[#ffba4a]/40'
                }`}
              >
                {state.firstServe ? '1er Servicio' : '2do Servicio'}
              </span>
            </div>
          </div>

          {/* Quick Serve Actions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#bbc9cf] tracking-wider block">
              Acciones de Saque
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onRecordAce(state.currentServer);
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-1 p-2.5 bg-[#111317] hover:bg-[#333539] border border-[#ffd79f]/30 rounded-xl text-center transition-all active:scale-95 text-[#ffd79f]"
              >
                <Zap className="w-4 h-4 text-[#ffd79f] shrink-0" />
                <div className="text-[11px] font-bold">Ace</div>
                <div className="text-[9px] text-[#bbc9cf] leading-none">Punto directo</div>
              </button>

              <button
                onClick={() => {
                  if (onRecordLet) onRecordLet();
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-1 p-2.5 bg-[#111317] hover:bg-[#333539] border border-[#ffba4a]/30 rounded-xl text-center transition-all active:scale-95 text-[#ffba4a]"
              >
                <RotateCcw className="w-4 h-4 text-[#ffba4a] shrink-0" />
                <div className="text-[11px] font-bold">Let</div>
                <div className="text-[9px] text-[#bbc9cf] leading-none">Repetir saque</div>
              </button>

              <button
                onClick={() => {
                  if (state.firstServe) {
                    onRecordFault();
                  } else {
                    onRecordDoubleFault(state.currentServer);
                    onClose();
                  }
                }}
                className="flex flex-col items-center justify-center gap-1 p-2.5 bg-[#111317] hover:bg-[#333539] border border-[#ffb4ab]/30 rounded-xl text-center transition-all active:scale-95 text-[#ffb4ab]"
              >
                <AlertCircle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                <div className="text-[11px] font-bold truncate max-w-full">
                  {state.firstServe ? 'Falta (2º)' : 'D. Falta'}
                </div>
                <div className="text-[9px] text-[#bbc9cf] leading-none">
                  {state.firstServe ? '2do saque' : 'Punto rival'}
                </div>
              </button>
            </div>
          </div>

          {/* Set-Level First Server Established Order */}
          {onSetSetFirstServer && (
            <div className="space-y-2 pt-2 border-t border-[#282a2e]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#bbc9cf] tracking-wider block">
                  Orden de Saque en Set {setNum}
                </span>
                <span className="text-[10px] text-[#47d6ff]">1er Servidor del Set</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Team A 1st Server in Set */}
                <div className="space-y-1 bg-[#111317] p-2.5 rounded-xl border border-[#282a2e]">
                  <span className="text-[10px] font-bold text-[#47d6ff] uppercase block truncate">
                    1º Saque: {state.teamAName}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSetSetFirstServer('teamA', 0)}
                      className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold truncate transition-all ${
                        currentSet?.firstServerA === 0
                          ? 'bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/50 font-bold'
                          : 'bg-[#1e2023] text-[#859398] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamAPlayers[0]?.name?.split(' ')[0]}
                    </button>
                    <button
                      onClick={() => onSetSetFirstServer('teamA', 1)}
                      className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold truncate transition-all ${
                        currentSet?.firstServerA === 1
                          ? 'bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/50 font-bold'
                          : 'bg-[#1e2023] text-[#859398] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamAPlayers[1]?.name?.split(' ')[0]}
                    </button>
                  </div>
                </div>

                {/* Team B 1st Server in Set */}
                <div className="space-y-1 bg-[#111317] p-2.5 rounded-xl border border-[#282a2e]">
                  <span className="text-[10px] font-bold text-[#bbc9cf] uppercase block truncate">
                    1º Saque: {state.teamBName}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSetSetFirstServer('teamB', 0)}
                      className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold truncate transition-all ${
                        currentSet?.firstServerB === 0
                          ? 'bg-[#e2e2e8]/20 text-[#e2e2e8] border border-[#e2e2e8]/50 font-bold'
                          : 'bg-[#1e2023] text-[#859398] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamBPlayers[0]?.name?.split(' ')[0]}
                    </button>
                    <button
                      onClick={() => onSetSetFirstServer('teamB', 1)}
                      className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold truncate transition-all ${
                        currentSet?.firstServerB === 1
                          ? 'bg-[#e2e2e8]/20 text-[#e2e2e8] border border-[#e2e2e8]/50 font-bold'
                          : 'bg-[#1e2023] text-[#859398] hover:text-[#e2e2e8]'
                      }`}
                    >
                      {state.teamBPlayers[1]?.name?.split(' ')[0]}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Server Selection */}
          <div className="space-y-2 pt-2 border-t border-[#282a2e]">
            <span className="text-[11px] font-bold uppercase text-[#bbc9cf] tracking-wider block">
              Servidor Activo Inmediato
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Team A options */}
              <div className="space-y-1.5 bg-[#111317] p-2.5 rounded-xl border border-[#282a2e]">
                <span className="text-[10px] font-bold text-[#47d6ff] uppercase block">
                  {state.teamAName}
                </span>
                <button
                  onClick={() => onSetServer('teamA', 0)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    state.currentServer === 'teamA' && state.currentServerPlayerIndex === 0
                      ? 'bg-[#47d6ff] text-[#001f28] font-bold'
                      : 'hover:bg-[#333539] text-[#e2e2e8]'
                  }`}
                >
                  <span className="truncate">{state.teamAPlayers[0]?.name}</span>
                  {state.currentServer === 'teamA' && state.currentServerPlayerIndex === 0 && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onSetServer('teamA', 1)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    state.currentServer === 'teamA' && state.currentServerPlayerIndex === 1
                      ? 'bg-[#47d6ff] text-[#001f28] font-bold'
                      : 'hover:bg-[#333539] text-[#e2e2e8]'
                  }`}
                >
                  <span className="truncate">{state.teamAPlayers[1]?.name}</span>
                  {state.currentServer === 'teamA' && state.currentServerPlayerIndex === 1 && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Team B options */}
              <div className="space-y-1.5 bg-[#111317] p-2.5 rounded-xl border border-[#282a2e]">
                <span className="text-[10px] font-bold text-[#bbc9cf] uppercase block">
                  {state.teamBName}
                </span>
                <button
                  onClick={() => onSetServer('teamB', 0)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    state.currentServer === 'teamB' && state.currentServerPlayerIndex === 0
                      ? 'bg-[#e2e2e8] text-[#111317] font-bold'
                      : 'hover:bg-[#333539] text-[#e2e2e8]'
                  }`}
                >
                  <span className="truncate">{state.teamBPlayers[0]?.name}</span>
                  {state.currentServer === 'teamB' && state.currentServerPlayerIndex === 0 && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onSetServer('teamB', 1)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    state.currentServer === 'teamB' && state.currentServerPlayerIndex === 1
                      ? 'bg-[#e2e2e8] text-[#111317] font-bold'
                      : 'hover:bg-[#333539] text-[#e2e2e8]'
                  }`}
                >
                  <span className="truncate">{state.teamBPlayers[1]?.name}</span>
                  {state.currentServer === 'teamB' && state.currentServerPlayerIndex === 1 && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a2e] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
