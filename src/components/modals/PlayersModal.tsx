import React, { useState } from 'react';
import { Users, Check, X, Shield, Trophy } from 'lucide-react';
import { MatchState, PlayerInfo } from '../../types';

interface PlayersModalProps {
  state: MatchState;
  onClose: () => void;
  onSavePlayers: (
    teamAName: string,
    teamBName: string,
    teamAPlayers: [PlayerInfo, PlayerInfo],
    teamBPlayers: [PlayerInfo, PlayerInfo],
    tournamentName?: string,
    tournamentRound?: string
  ) => void;
}

export const PlayersModal: React.FC<PlayersModalProps> = ({
  state,
  onClose,
  onSavePlayers,
}) => {
  const [tournamentName, setTournamentName] = useState(state.tournamentName || '');
  const [tournamentRound, setTournamentRound] = useState(state.tournamentRound || '');

  const [teamAName, setTeamAName] = useState(state.teamAName);
  const [teamBName, setTeamBName] = useState(state.teamBName);

  const [pA1, setPA1] = useState<PlayerInfo>({ ...state.teamAPlayers[0] });
  const [pA2, setPA2] = useState<PlayerInfo>({ ...state.teamAPlayers[1] });
  const [pB1, setPB1] = useState<PlayerInfo>({ ...state.teamBPlayers[0] });
  const [pB2, setPB2] = useState<PlayerInfo>({ ...state.teamBPlayers[1] });

  const handleSave = () => {
    onSavePlayers(
      teamAName.trim() || 'Team A',
      teamBName.trim() || 'Team B',
      [pA1, pA2],
      [pB1, pB2],
      tournamentName.trim(),
      tournamentRound.trim()
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-lg rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2e]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#47d6ff]" />
            <h2 className="font-headline font-bold text-base text-[#e2e2e8]">
              Configuración de Equipos y Partido
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
          {/* Tournament & Round Information */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#ffd79f]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ffd79f] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Torneo e Instancia
              </span>
              <span className="text-[9px] text-[#859398] font-mono">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1">
                  Nombre del Torneo / Liga
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="ej. Premier Padel, Open Club..."
                  className="w-full bg-[#1e2023] border border-[#282a2e] focus:border-[#ffd79f] rounded-lg px-2.5 py-1.5 text-xs text-[#e2e2e8] placeholder-[#555860] outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#859398] uppercase block mb-1">
                  Instancia / Ronda
                </label>
                <input
                  type="text"
                  value={tournamentRound}
                  onChange={(e) => setTournamentRound(e.target.value)}
                  placeholder="ej. Final, Semifinal, Cuartos..."
                  className="w-full bg-[#1e2023] border border-[#282a2e] focus:border-[#ffd79f] rounded-lg px-2.5 py-1.5 text-xs text-[#e2e2e8] placeholder-[#555860] outline-hidden"
                />
              </div>
            </div>
          </div>
          {/* Team A */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#47d6ff]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#47d6ff] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Equipo A
              </span>
            </div>

            <div>
              <label className="text-[11px] text-[#bbc9cf] mb-1 block">Nombre del Equipo</label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-[#1e2023] border border-[#282a2e] focus:border-[#47d6ff] rounded-lg px-3 py-1.5 text-sm text-[#e2e2e8] outline-hidden"
              />
            </div>

            {/* Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#1e2023] p-2 rounded-lg border border-[#282a2e]">
                <span className="text-[10px] text-[#47d6ff] font-bold block mb-1">
                  Jugador 1 (Drive)
                </span>
                <input
                  type="text"
                  value={pA1.name}
                  onChange={(e) => setPA1({ ...pA1, name: e.target.value })}
                  placeholder="Nombre Jugador 1"
                  className="w-full bg-[#111317] border border-[#282a2e] rounded px-2 py-1 text-xs text-[#e2e2e8] mb-1.5"
                />
                <div className="flex gap-2 text-[10px]">
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pA1_hand"
                      checked={pA1.hand === 'right'}
                      onChange={() => setPA1({ ...pA1, hand: 'right' })}
                      className="text-[#47d6ff]"
                    />
                    Diestro
                  </label>
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pA1_hand"
                      checked={pA1.hand === 'left'}
                      onChange={() => setPA1({ ...pA1, hand: 'left' })}
                      className="text-[#47d6ff]"
                    />
                    Zurdo
                  </label>
                </div>
              </div>

              <div className="bg-[#1e2023] p-2 rounded-lg border border-[#282a2e]">
                <span className="text-[10px] text-[#47d6ff] font-bold block mb-1">
                  Jugador 2 (Revés)
                </span>
                <input
                  type="text"
                  value={pA2.name}
                  onChange={(e) => setPA2({ ...pA2, name: e.target.value })}
                  placeholder="Nombre Jugador 2"
                  className="w-full bg-[#111317] border border-[#282a2e] rounded px-2 py-1 text-xs text-[#e2e2e8] mb-1.5"
                />
                <div className="flex gap-2 text-[10px]">
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pA2_hand"
                      checked={pA2.hand === 'right'}
                      onChange={() => setPA2({ ...pA2, hand: 'right' })}
                      className="text-[#47d6ff]"
                    />
                    Diestro
                  </label>
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pA2_hand"
                      checked={pA2.hand === 'left'}
                      onChange={() => setPA2({ ...pA2, hand: 'left' })}
                      className="text-[#47d6ff]"
                    />
                    Zurdo
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Team B */}
          <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e2e2e8] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Equipo B
              </span>
            </div>

            <div>
              <label className="text-[11px] text-[#bbc9cf] mb-1 block">Nombre del Equipo</label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-[#1e2023] border border-[#282a2e] focus:border-[#47d6ff] rounded-lg px-3 py-1.5 text-sm text-[#e2e2e8] outline-hidden"
              />
            </div>

            {/* Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#1e2023] p-2 rounded-lg border border-[#282a2e]">
                <span className="text-[10px] text-[#bbc9cf] font-bold block mb-1">
                  Jugador 1 (Drive)
                </span>
                <input
                  type="text"
                  value={pB1.name}
                  onChange={(e) => setPB1({ ...pB1, name: e.target.value })}
                  placeholder="Nombre Jugador 1"
                  className="w-full bg-[#111317] border border-[#282a2e] rounded px-2 py-1 text-xs text-[#e2e2e8] mb-1.5"
                />
                <div className="flex gap-2 text-[10px]">
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pB1_hand"
                      checked={pB1.hand === 'right'}
                      onChange={() => setPB1({ ...pB1, hand: 'right' })}
                      className="text-[#47d6ff]"
                    />
                    Diestro
                  </label>
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pB1_hand"
                      checked={pB1.hand === 'left'}
                      onChange={() => setPB1({ ...pB1, hand: 'left' })}
                      className="text-[#47d6ff]"
                    />
                    Zurdo
                  </label>
                </div>
              </div>

              <div className="bg-[#1e2023] p-2 rounded-lg border border-[#282a2e]">
                <span className="text-[10px] text-[#bbc9cf] font-bold block mb-1">
                  Jugador 2 (Revés)
                </span>
                <input
                  type="text"
                  value={pB2.name}
                  onChange={(e) => setPB2({ ...pB2, name: e.target.value })}
                  placeholder="Nombre Jugador 2"
                  className="w-full bg-[#111317] border border-[#282a2e] rounded px-2 py-1 text-xs text-[#e2e2e8] mb-1.5"
                />
                <div className="flex gap-2 text-[10px]">
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pB2_hand"
                      checked={pB2.hand === 'right'}
                      onChange={() => setPB2({ ...pB2, hand: 'right' })}
                      className="text-[#47d6ff]"
                    />
                    Diestro
                  </label>
                  <label className="flex items-center gap-1 text-[#bbc9cf] cursor-pointer">
                    <input
                      type="radio"
                      name="pB2_hand"
                      checked={pB2.hand === 'left'}
                      onChange={() => setPB2({ ...pB2, hand: 'left' })}
                      className="text-[#47d6ff]"
                    />
                    Zurdo
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a2e] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
