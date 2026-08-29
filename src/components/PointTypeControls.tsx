import React from 'react';
import {
  Sparkles,
  Zap,
  AlertCircle,
  AlertTriangle,
  Plus,
  ArrowLeftRight,
  RotateCcw,
} from 'lucide-react';
import { MatchState, PointType, Team } from '../types';

interface PointTypeControlsProps {
  state: MatchState;
  onAddPoint: (team: Team, type?: PointType) => void;
  onToggleSides?: () => void;
  onRecordLet?: () => void;
  onToggleSecondServe?: () => void;
  disabled?: boolean;
}

export const PointTypeControls: React.FC<PointTypeControlsProps> = ({
  state,
  onAddPoint,
  onToggleSides,
  onRecordLet,
  onToggleSecondServe,
  disabled = false,
}) => {
  const isSwapped = Boolean(state.sidesSwapped);

  const leftTeamKey: Team = isSwapped ? 'teamB' : 'teamA';
  const rightTeamKey: Team = isSwapped ? 'teamA' : 'teamB';

  const leftTeamName = isSwapped ? state.teamBName : state.teamAName;
  const rightTeamName = isSwapped ? state.teamAName : state.teamBName;

  const isLeftServing = state.currentServer === leftTeamKey;
  const isRightServing = state.currentServer === rightTeamKey;

  const handlePoint = (team: Team, type: PointType) => {
    if (disabled) return;
    if (type === 'unforced_error' || type === 'double_fault') {
      // Error no forzado o doble falta del equipo seleccionado: el punto se otorga al equipo contrario
      const opposingTeam: Team = team === 'teamA' ? 'teamB' : 'teamA';
      onAddPoint(opposingTeam, type);
    } else {
      onAddPoint(team, type);
    }
  };

  return (
    <section
      id="point-type-controls-section"
      className="bg-[#1e2023] rounded-xl p-2 sm:p-2.5 interactive-shadow flex flex-col gap-2 border border-[#282a2e]"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#333539] pb-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#47d6ff]" />
          <h2 className="font-bold text-[10px] sm:text-xs text-[#bbc9cf] uppercase tracking-wider">
            Tipo de Punto
          </h2>
        </div>

        {onToggleSides && (
          <button
            type="button"
            onClick={onToggleSides}
            title="Invertir visualmente el lado de la pista"
            className="flex items-center gap-1 py-0.5 px-2 rounded-full bg-[#16181b] hover:bg-[#282a2e] border border-[#282a2e] text-[9px] sm:text-[10px] text-[#859398] hover:text-[#e2e2e8] transition-colors active:scale-95"
          >
            <ArrowLeftRight className="w-3 h-3 text-[#47d6ff]" />
            <span>Invertir Lado</span>
          </button>
        )}
      </div>

      {/* Two columns: Left Team vs Right Team */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 items-start">
        {/* Left Team Controls */}
        <div className="bg-[#16181b] rounded-lg p-1.5 sm:p-2 border border-[#282a2e] flex flex-col gap-1.5">
          {/* Team Label & Server indicator */}
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span
              className={`text-[10px] sm:text-xs font-bold truncate uppercase ${
                isLeftServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
              }`}
            >
              {leftTeamName}
            </span>
            {isLeftServing ? (
              <span className="shrink-0 bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/40 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <span>🎾 {state.firstServe ? '1er Saque' : '2º Saque'}</span>
              </span>
            ) : (
              <span className="shrink-0 text-[#859398] text-[8px] font-bold px-1 uppercase tracking-wider">
                Resto
              </span>
            )}
          </div>

          {/* Special Service Controls: Active for Server, Disabled/Gray for Receiver */}
          {isLeftServing ? (
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 bg-[#111317] p-1 rounded-md border border-[#282a2e]">
              {/* Let Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={onRecordLet}
                title="Let en el saque (Repetición del servicio actual)"
                id={`btn-let-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
                className="py-1 px-1 sm:px-2 rounded bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffba4a]/40 text-[#ffba4a] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 shrink-0 text-[#ffba4a]" />
                <span className="truncate">Let</span>
              </button>

              {/* Segundo Servicio Button / Toggle */}
              <button
                type="button"
                disabled={disabled}
                onClick={onToggleSecondServe}
                title={
                  state.firstServe
                    ? '1ª Falta: Pasar a 2º Servicio'
                    : 'Volver a 1er Servicio'
                }
                id={`btn-second-serve-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
                className={`py-1 px-1 sm:px-2 rounded active:scale-95 border text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
                  state.firstServe
                    ? 'bg-[#1e2023] hover:bg-[#282a2e] border-[#47d6ff]/40 text-[#47d6ff]'
                    : 'bg-[#ffba4a]/20 border-[#ffba4a] text-[#ffba4a] shadow-[0_0_8px_rgba(255,186,74,0.3)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    state.firstServe ? 'bg-[#47d6ff]' : 'bg-[#ffba4a] animate-pulse'
                  }`}
                />
                <span className="truncate">
                  {state.firstServe ? '2º Servicio' : '2º Saque (Activo)'}
                </span>
              </button>
            </div>
          ) : (
            /* Inhabilitados en gris para el equipo que resta */
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 bg-[#111317]/50 p-1 rounded-md border border-[#222428] opacity-40">
              <button
                type="button"
                disabled
                title="Let solo disponible para el equipo al saque"
                className="py-1 px-1 sm:px-2 rounded bg-[#16181b] border border-[#282a2e] text-[#6b7280] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
              >
                <RotateCcw className="w-3 h-3 shrink-0 text-[#6b7280]" />
                <span className="truncate">Let</span>
              </button>
              <button
                type="button"
                disabled
                title="Segundo servicio solo disponible para el equipo al saque"
                className="py-1 px-1 sm:px-2 rounded bg-[#16181b] border border-[#282a2e] text-[#6b7280] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#6b7280]" />
                <span className="truncate">2º Servicio</span>
              </button>
            </div>
          )}

          {/* Action buttons grid */}
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            {/* Winner */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(leftTeamKey, 'winner')}
              id={`btn-winner-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#47d6ff]/30 text-[#47d6ff] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#47d6ff]" />
              <span className="truncate">Winner</span>
            </button>

            {/* Ace */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(leftTeamKey, 'ace')}
              id={`btn-ace-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffd79f]/30 text-[#ffd79f] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ffd79f]" />
              <span className="truncate">Ace</span>
            </button>

            {/* Error NF */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(leftTeamKey, 'unforced_error')}
              title={`Error no forzado de ${leftTeamName} (Punto para ${rightTeamName})`}
              id={`btn-unforced-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ffb4ab]" />
              <span className="truncate">Error NF</span>
            </button>

            {/* Doble Falta */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(leftTeamKey, 'double_fault')}
              title={`Doble falta de ${leftTeamName} (Punto para ${rightTeamName})`}
              id={`btn-df-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ff897d]/30 text-[#ff897d] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ff897d]" />
              <span className="truncate">D. Falta</span>
            </button>
          </div>

          {/* Direct Point (Normal point) full width button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePoint(leftTeamKey, 'normal')}
            id={`btn-point-normal-${leftTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
            className="w-full py-1.5 px-2 rounded-md bg-[#282a2e] hover:bg-[#333539] active:scale-95 border border-[#3c494e] text-[#e2e2e8] hover:text-[#47d6ff] text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
            <span className="truncate">Punto Normal</span>
          </button>
        </div>

        {/* Right Team Controls */}
        <div className="bg-[#16181b] rounded-lg p-1.5 sm:p-2 border border-[#282a2e] flex flex-col gap-1.5">
          {/* Team Label & Server indicator */}
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span
              className={`text-[10px] sm:text-xs font-bold truncate uppercase ${
                isRightServing ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
              }`}
            >
              {rightTeamName}
            </span>
            {isRightServing ? (
              <span className="shrink-0 bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/40 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <span>🎾 {state.firstServe ? '1er Saque' : '2º Saque'}</span>
              </span>
            ) : (
              <span className="shrink-0 text-[#859398] text-[8px] font-bold px-1 uppercase tracking-wider">
                Resto
              </span>
            )}
          </div>

          {/* Special Service Controls: Active for Server, Disabled/Gray for Receiver */}
          {isRightServing ? (
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 bg-[#111317] p-1 rounded-md border border-[#282a2e]">
              {/* Let Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={onRecordLet}
                title="Let en el saque (Repetición del servicio actual)"
                id={`btn-let-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
                className="py-1 px-1 sm:px-2 rounded bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffba4a]/40 text-[#ffba4a] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 shrink-0 text-[#ffba4a]" />
                <span className="truncate">Let</span>
              </button>

              {/* Segundo Servicio Button / Toggle */}
              <button
                type="button"
                disabled={disabled}
                onClick={onToggleSecondServe}
                title={
                  state.firstServe
                    ? '1ª Falta: Pasar a 2º Servicio'
                    : 'Volver a 1er Servicio'
                }
                id={`btn-second-serve-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
                className={`py-1 px-1 sm:px-2 rounded active:scale-95 border text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
                  state.firstServe
                    ? 'bg-[#1e2023] hover:bg-[#282a2e] border-[#47d6ff]/40 text-[#47d6ff]'
                    : 'bg-[#ffba4a]/20 border-[#ffba4a] text-[#ffba4a] shadow-[0_0_8px_rgba(255,186,74,0.3)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    state.firstServe ? 'bg-[#47d6ff]' : 'bg-[#ffba4a] animate-pulse'
                  }`}
                />
                <span className="truncate">
                  {state.firstServe ? '2º Servicio' : '2º Saque (Activo)'}
                </span>
              </button>
            </div>
          ) : (
            /* Inhabilitados en gris para el equipo que resta */
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 bg-[#111317]/50 p-1 rounded-md border border-[#222428] opacity-40">
              <button
                type="button"
                disabled
                title="Let solo disponible para el equipo al saque"
                className="py-1 px-1 sm:px-2 rounded bg-[#16181b] border border-[#282a2e] text-[#6b7280] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
              >
                <RotateCcw className="w-3 h-3 shrink-0 text-[#6b7280]" />
                <span className="truncate">Let</span>
              </button>
              <button
                type="button"
                disabled
                title="Segundo servicio solo disponible para el equipo al saque"
                className="py-1 px-1 sm:px-2 rounded bg-[#16181b] border border-[#282a2e] text-[#6b7280] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#6b7280]" />
                <span className="truncate">2º Servicio</span>
              </button>
            </div>
          )}

          {/* Action buttons grid */}
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            {/* Winner */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(rightTeamKey, 'winner')}
              id={`btn-winner-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#47d6ff]/30 text-[#47d6ff] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#47d6ff]" />
              <span className="truncate">Winner</span>
            </button>

            {/* Ace */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(rightTeamKey, 'ace')}
              id={`btn-ace-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffd79f]/30 text-[#ffd79f] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ffd79f]" />
              <span className="truncate">Ace</span>
            </button>

            {/* Error NF */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(rightTeamKey, 'unforced_error')}
              title={`Error no forzado de ${rightTeamName} (Punto para ${leftTeamName})`}
              id={`btn-unforced-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ffb4ab]" />
              <span className="truncate">Error NF</span>
            </button>

            {/* Doble Falta */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handlePoint(rightTeamKey, 'double_fault')}
              title={`Doble falta de ${rightTeamName} (Punto para ${leftTeamName})`}
              id={`btn-df-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
              className="py-1.5 px-1 sm:px-2 rounded-md bg-[#1e2023] hover:bg-[#282a2e] active:scale-95 border border-[#ff897d]/30 text-[#ff897d] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#ff897d]" />
              <span className="truncate">D. Falta</span>
            </button>
          </div>

          {/* Direct Point (Normal point) full width button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePoint(rightTeamKey, 'normal')}
            id={`btn-point-normal-${rightTeamKey === 'teamA' ? 'team-a' : 'team-b'}`}
            className="w-full py-1.5 px-2 rounded-md bg-[#282a2e] hover:bg-[#333539] active:scale-95 border border-[#3c494e] text-[#e2e2e8] hover:text-[#47d6ff] text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
            <span className="truncate">Punto Normal</span>
          </button>
        </div>
      </div>
    </section>
  );
};

