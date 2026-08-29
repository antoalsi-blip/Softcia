import React from 'react';
import { Sparkles, Info, Check, Sliders } from 'lucide-react';
import { BallChangePattern, BallChangeSettings } from '../types';

interface BallChangeConfigSectionProps {
  settings: BallChangeSettings;
  onChange: (newSettings: BallChangeSettings) => void;
  compact?: boolean;
}

export const BallChangeConfigSection: React.FC<BallChangeConfigSectionProps> = ({
  settings,
  onChange,
  compact = false,
}) => {
  const isEnabled = settings.enabled && settings.pattern !== 'none';

  const handleSelectPreset = (pattern: BallChangePattern) => {
    if (pattern === 'none') {
      onChange({
        ...settings,
        enabled: false,
        pattern: 'none',
      });
      return;
    }

    if (pattern === '7_9') {
      onChange({
        enabled: true,
        pattern: '7_9',
        firstChangeGames: 7,
        subsequentChangeGames: 9,
      });
    } else if (pattern === '9_11') {
      onChange({
        enabled: true,
        pattern: '9_11',
        firstChangeGames: 9,
        subsequentChangeGames: 11,
      });
    } else if (pattern === 'every_set') {
      onChange({
        enabled: true,
        pattern: 'every_set',
        firstChangeGames: 6,
        subsequentChangeGames: 6,
      });
    } else if (pattern === 'every_2_sets') {
      onChange({
        enabled: true,
        pattern: 'every_2_sets',
        firstChangeGames: 12,
        subsequentChangeGames: 12,
      });
    } else if (pattern === 'custom') {
      onChange({
        enabled: true,
        pattern: 'custom',
        firstChangeGames: settings.firstChangeGames || 7,
        subsequentChangeGames: settings.subsequentChangeGames || 9,
      });
    }
  };

  const handleCustomChange = (first: number, sub: number) => {
    onChange({
      enabled: true,
      pattern: 'custom',
      firstChangeGames: Math.max(1, Math.min(30, first)),
      subsequentChangeGames: Math.max(1, Math.min(30, sub)),
    });
  };

  // Build upcoming schedule numbers for preview
  const first = settings.firstChangeGames || 7;
  const sub = settings.subsequentChangeGames || 9;
  const previewThresholds: number[] = [];
  if (settings.pattern === '7_9' || settings.pattern === '9_11' || settings.pattern === 'custom') {
    let t = first;
    for (let i = 0; i < 5; i++) {
      previewThresholds.push(t);
      t += sub;
    }
  }

  return (
    <div className="bg-[#111317] border border-[#282a2e] rounded-xl p-3 sm:p-3.5 space-y-3">
      {/* Header with Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🎾</span>
          <div>
            <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider block">
              Cambio de Bolas / Pelotas
            </span>
            <span className="text-[10px] text-[#859398]">
              Reglamento Oficial FIP & Circuito Profesional
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isEnabled) {
              handleSelectPreset('none');
            } else {
              handleSelectPreset('7_9');
            }
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            isEnabled
              ? 'bg-[#47d6ff] text-[#001f28]'
              : 'bg-[#282a2e] text-[#859398] hover:text-[#e2e2e8]'
          }`}
        >
          <span>{isEnabled ? 'Activado' : 'Desactivado'}</span>
        </button>
      </div>

      {/* Preset Options */}
      {isEnabled && (
        <div className="space-y-2.5 pt-1 border-t border-[#282a2e]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 7 / 9 Games (FIP Official) */}
            <button
              type="button"
              onClick={() => handleSelectPreset('7_9')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                settings.pattern === '7_9'
                  ? 'bg-[#47d6ff]/15 border-[#47d6ff] text-[#47d6ff] ring-1 ring-[#47d6ff]/30 shadow-[0_0_12px_rgba(71,214,255,0.15)]'
                  : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">7 / 9 Juegos</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ffee00]/20 text-[#ffee00] border border-[#ffee00]/30 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    FIP Oficial
                  </span>
                </div>
                {settings.pattern === '7_9' && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              </div>
              <p className="text-[10px] text-[#859398] mt-1 leading-snug">
                1er cambio al juego 7 (por calentamiento); luego cada 9 juegos.
              </p>
            </button>

            {/* 9 / 11 Games */}
            <button
              type="button"
              onClick={() => handleSelectPreset('9_11')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                settings.pattern === '9_11'
                  ? 'bg-[#47d6ff]/15 border-[#47d6ff] text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                  : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold">9 / 11 Juegos</span>
                {settings.pattern === '9_11' && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              </div>
              <p className="text-[10px] text-[#859398] mt-1 leading-snug">
                1er cambio al juego 9; luego cada 11 juegos disputados.
              </p>
            </button>

            {/* Cada Set */}
            <button
              type="button"
              onClick={() => handleSelectPreset('every_set')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                settings.pattern === 'every_set'
                  ? 'bg-[#47d6ff]/15 border-[#47d6ff] text-[#47d6ff] ring-1 ring-[#47d6ff]/30'
                  : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold">Al Inicio de Cada Set</span>
                {settings.pattern === 'every_set' && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              </div>
              <p className="text-[10px] text-[#859398] mt-1 leading-snug">
                Bolas nuevas automáticamente al arrancar cada nuevo set.
              </p>
            </button>

            {/* Personalizado */}
            <button
              type="button"
              onClick={() => handleSelectPreset('custom')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                settings.pattern === 'custom'
                  ? 'bg-[#ffba4a]/15 border-[#ffba4a] text-[#ffba4a] ring-1 ring-[#ffba4a]/30'
                  : 'bg-[#16181b] border-[#282a2e] text-[#bbc9cf] hover:bg-[#282a2e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Personalizado</span>
                </div>
                {settings.pattern === 'custom' && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
              </div>
              <p className="text-[10px] text-[#859398] mt-1 leading-snug">
                Configura número exacto de juegos para 1er y siguientes cambios.
              </p>
            </button>
          </div>

          {/* Custom inputs */}
          {settings.pattern === 'custom' && (
            <div className="bg-[#16181b] p-3 rounded-xl border border-[#ffba4a]/40 space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-[#ffba4a] block uppercase">
                Intervalos personalizados de juegos
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#859398] block mb-1">
                    1er Cambio tras:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={first}
                      onChange={(e) => handleCustomChange(parseInt(e.target.value) || 7, sub)}
                      className="w-full bg-[#111317] border border-[#282a2e] rounded-lg px-2.5 py-1 text-xs text-[#e2e2e8] font-bold focus:border-[#ffba4a] outline-hidden"
                    />
                    <span className="text-[10px] text-[#859398]">juegos</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#859398] block mb-1">
                    Cambios siguientes cada:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={sub}
                      onChange={(e) => handleCustomChange(first, parseInt(e.target.value) || 9)}
                      className="w-full bg-[#111317] border border-[#282a2e] rounded-lg px-2.5 py-1 text-xs text-[#e2e2e8] font-bold focus:border-[#ffba4a] outline-hidden"
                    />
                    <span className="text-[10px] text-[#859398]">juegos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule preview */}
          {previewThresholds.length > 0 && (
            <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#859398]">
                  Calendario de cambios en el partido:
                </span>
                <span className="text-[9px] text-[#47d6ff]">Juegos totales acumulados</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {previewThresholds.map((num, i) => (
                  <span
                    key={num}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      i === 0
                        ? 'bg-[#47d6ff]/15 text-[#47d6ff] border-[#47d6ff]/40'
                        : 'bg-[#1e2023] text-[#bbc9cf] border-[#282a2e]'
                    }`}
                  >
                    Juego {num}
                  </span>
                ))}
                <span className="text-[10px] text-[#859398]">...</span>
              </div>
            </div>
          )}

          {/* FIP rule note */}
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#16181b]/60 border border-[#282a2e] text-[10px] text-[#859398]">
            <Info className="w-3.5 h-3.5 text-[#47d6ff] shrink-0 mt-0.5" />
            <span>
              <strong>Regla FIP:</strong> El tie-break cuenta como 1 juego para el cómputo de bolas. No se cambian bolas justo antes de iniciar un tie-break (se aplaza al 1er juego del set siguiente).
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
