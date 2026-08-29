import React, { useState, useEffect } from 'react';
import {
  History,
  BarChart3,
  ListOrdered,
  FileText,
  Copy,
  Check,
  X,
  Zap,
  AlertCircle,
  Sparkles,
  Trophy,
  Printer,
  ShieldAlert,
  HeartPulse,
  Clock,
  User,
  Medal,
  Calendar,
  Scale,
  Edit3,
  Plus,
  FileCheck2,
  CheckCircle2,
  MessageCircle,
  Send,
  Smartphone,
  Share2,
  Bookmark,
  ExternalLink,
  PauseCircle,
  Layers,
  AlertTriangle,
  Timer,
} from 'lucide-react';
import {
  MatchState,
  IncidentRecord,
  MedicalTimeoutRecord,
  Team,
} from '../../types';

interface HistoryModalProps {
  state: MatchState;
  onClose: () => void;
  onUpdateMatchReportDetails?: (details: {
    refereeName?: string;
    courtName?: string;
    refereeNotes?: string;
    tournamentName?: string;
    tournamentRound?: string;
  }) => void;
  onAddIncident?: (incident: Omit<IncidentRecord, 'id' | 'timestamp'>) => void;
  onRecordMedicalTimeout?: (record: Omit<MedicalTimeoutRecord, 'id' | 'timestamp'>) => void;
  initialTab?: 'stats' | 'timeline' | 'report';
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
}

const COMMON_COUNTRY_CODES = [
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'EE.UU. / CAN', flag: '🇺🇸' },
];

export const HistoryModal: React.FC<HistoryModalProps> = ({
  state,
  onClose,
  onUpdateMatchReportDetails,
  onAddIncident,
  onRecordMedicalTimeout,
  initialTab = 'stats',
}) => {
  const [viewMode, setViewMode] = useState<'stats' | 'timeline' | 'report'>(initialTab);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedFIPReport, setCopiedFIPReport] = useState(false);
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);

  // Edit states for Match Report fields
  const [isEditingReportInfo, setIsEditingReportInfo] = useState(false);
  const [editReferee, setEditReferee] = useState(state.refereeName || '');
  const [editCourt, setEditCourt] = useState(state.courtName || 'Pista Central');
  const [editNotes, setEditNotes] = useState(state.refereeNotes || '');

  // Quick incident creation modal/section
  const [showAddIncidentForm, setShowAddIncidentForm] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState<IncidentRecord['type']>('other');
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');

  // Quick medical timeout creation
  const [showAddMTOForm, setShowAddMTOForm] = useState(false);
  const [newMTOPlayer, setNewMTOPlayer] = useState(state.teamAPlayers[0]?.name || '');
  const [newMTOTeam, setNewMTOTeam] = useState<Team>('teamA');
  const [newMTOReason, setNewMTOReason] = useState('Atención fisioterapia en pista');

  // WhatsApp configuration & sending states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(() => {
    return localStorage.getItem('padel_fip_whatsapp_phone') || '';
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState('+34');
  const [whatsappFormat, setWhatsappFormat] = useState<'full_fip' | 'condensed'>('full_fip');
  const [savedContacts, setSavedContacts] = useState<WhatsAppContact[]>(() => {
    try {
      const stored = localStorage.getItem('padel_fip_saved_contacts');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      { id: 'director', name: 'Dirección Torneo', phone: '' },
      { id: 'referee', name: 'Mesa Árbitros', phone: '' },
      { id: 'teamA', name: `Pareja A (${state.teamAName})`, phone: '' },
      { id: 'teamB', name: `Pareja B (${state.teamBName})`, phone: '' },
    ];
  });
  const [selectedContactId, setSelectedContactId] = useState<string>('custom');

  // Save contacts on change
  useEffect(() => {
    try {
      localStorage.setItem('padel_fip_saved_contacts', JSON.stringify(savedContacts));
    } catch {
      // ignore
    }
  }, [savedContacts]);

  // Compute statistics
  const totalPoints = state.pointHistory.length;
  const pointsA = state.pointHistory.filter((p) => p.winner === 'teamA').length;
  const pointsB = state.pointHistory.filter((p) => p.winner === 'teamB').length;

  const pctA = totalPoints > 0 ? Math.round((pointsA / totalPoints) * 100) : 50;
  const pctB = totalPoints > 0 ? Math.round((pointsB / totalPoints) * 100) : 50;

  const winnersA = state.pointHistory.filter((p) => p.winner === 'teamA' && p.pointType === 'winner').length;
  const winnersB = state.pointHistory.filter((p) => p.winner === 'teamB' && p.pointType === 'winner').length;

  const acesA = state.pointHistory.filter((p) => p.winner === 'teamA' && p.pointType === 'ace').length;
  const acesB = state.pointHistory.filter((p) => p.winner === 'teamB' && p.pointType === 'ace').length;

  const errorsA = state.pointHistory.filter((p) => p.winner === 'teamB' && p.pointType === 'unforced_error').length;
  const errorsB = state.pointHistory.filter((p) => p.winner === 'teamA' && p.pointType === 'unforced_error').length;

  const doubleFaultsA = state.pointHistory.filter((p) => p.winner === 'teamB' && p.pointType === 'double_fault').length;
  const doubleFaultsB = state.pointHistory.filter((p) => p.winner === 'teamA' && p.pointType === 'double_fault').length;

  const gamesA = state.sets.reduce((sum, s) => sum + s.teamA, 0);
  const gamesB = state.sets.reduce((sum, s) => sum + s.teamB, 0);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Date and Time formatting
  const matchStartDate = state.startTime ? new Date(state.startTime) : new Date();
  const formattedDate = matchStartDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedStartTime = matchStartDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedEndTime = state.endTime
    ? new Date(state.endTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : state.matchWinner
    ? new Date(matchStartDate.getTime() + state.matchTimeSeconds * 1000).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'En desarrollo (En juego)';

  // Determine first server info
  const tossWinnerTeamName =
    state.tossInfo?.winnerTeam === 'teamB' ? state.teamBName : state.teamAName;

  const getTossChoiceLabel = (choice?: string) => {
    switch (choice) {
      case 'serve':
        return 'Elegir Servicio (Sacar en Juego 1)';
      case 'receive':
        return 'Elegir Resto (Recibir en Juego 1)';
      case 'side':
        return 'Elegir Lado de Pista Inicial';
      case 'defer':
        return 'Ceder la elección al rival';
      default:
        return 'Servicio';
    }
  };

  const firstServerName =
    state.tossInfo?.firstServerName ||
    (state.sets[0]?.firstServerTeam === 'teamB'
      ? state.teamBPlayers[state.sets[0]?.firstServerB || 0]?.name || state.teamBPlayers[0]?.name
      : state.teamAPlayers[state.sets[0]?.firstServerA || 0]?.name || state.teamAPlayers[0]?.name) ||
    'Primer Sacador';

  const firstServerTeamName =
    (state.tossInfo?.firstServingTeam || state.sets[0]?.firstServerTeam) === 'teamB'
      ? state.teamBName
      : state.teamAName;

  // Condensed sets result
  const setsCondensed = state.sets
    .map((s) => {
      const gA = s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA;
      const gB = s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB;
      if (s.tiebreakA !== undefined && s.tiebreakB !== undefined && !s.isSuperTiebreak) {
        return `${gA}-${gB} (${Math.min(s.tiebreakA, s.tiebreakB)})`;
      }
      return `${gA}-${gB}`;
    })
    .join(' / ');

  const handleSaveReportDetails = () => {
    if (onUpdateMatchReportDetails) {
      onUpdateMatchReportDetails({
        refereeName: editReferee.trim(),
        courtName: editCourt.trim(),
        refereeNotes: editNotes.trim(),
      });
    }
    setIsEditingReportInfo(false);
  };

  const handleCreateIncident = () => {
    if (!newIncidentTitle.trim()) return;
    if (onAddIncident) {
      onAddIncident({
        type: newIncidentType,
        title: newIncidentTitle.trim(),
        description: newIncidentDesc.trim(),
        setIndex: state.currentSetIndex,
      });
    }
    setNewIncidentTitle('');
    setNewIncidentDesc('');
    setShowAddIncidentForm(false);
  };

  const handleCreateMTO = () => {
    if (onRecordMedicalTimeout) {
      onRecordMedicalTimeout({
        player: newMTOPlayer,
        team: newMTOTeam,
        durationSeconds: 180,
        reason: newMTOReason.trim() || 'Atención médica reglamentaria FIP',
        setIndex: state.currentSetIndex,
      });
    }
    setShowAddMTOForm(false);
  };

  // Copy standard summary
  const handleCopySummary = () => {
    const setsText = state.sets
      .map((s) => `Set ${s.setNumber}: ${s.teamA}-${s.teamB}${s.tiebreakA !== undefined ? ` (${s.tiebreakA}-${s.tiebreakB})` : ''}`)
      .join('\n');

    const tournamentHeader = state.tournamentName || state.tournamentRound
      ? `🏆 ${state.tournamentName || ''}${state.tournamentName && state.tournamentRound ? ' • ' : ''}${state.tournamentRound || ''}\n`
      : '';

    const summaryText = `🎾 *PADEL MATCH RESULT* 🎾
${tournamentHeader}${state.teamAName} vs ${state.teamBName}
⏱️ Duración: ${formatTime(state.matchTimeSeconds)}

📊 *Resultado por Sets:*
${setsText}

📈 *Estadísticas:*
- Puntos Totales: ${state.teamAName} ${pointsA} (${pctA}%) | ${state.teamBName} ${pointsB} (${pctB}%)
- Juegos Totales: ${state.teamAName} ${gamesA} | ${state.teamBName} ${gamesB}
- Winners: ${state.teamAName} ${winnersA} | ${state.teamBName} ${winnersB}
- Aces: ${state.teamAName} ${acesA} | ${state.teamBName} ${acesB}
- Dobles Faltas: ${state.teamAName} ${doubleFaultsA} | ${state.teamBName} ${doubleFaultsB}

Generado con Padel Score Tracker.`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Copy formal FIP Match Report
  const handleCopyFIPReport = () => {
    const setsTextLines = state.sets
      .map((s) => {
        const isSuper = s.isSuperTiebreak;
        const score = isSuper
          ? `Super Tie-break: ${s.tiebreakA ?? s.teamA} - ${s.tiebreakB ?? s.teamB}`
          : `Set ${s.setNumber}: ${s.teamA} - ${s.teamB}${s.tiebreakA !== undefined ? ` (Tie-break: ${s.tiebreakA}-${s.tiebreakB})` : ''}`;
        return `  • ${score}`;
      })
      .join('\n');

    const warningsLines =
      state.warnings.length > 0
        ? state.warnings
            .map(
              (w, i) =>
                `  ${i + 1}. [${w.level.toUpperCase()}] ${w.team === 'teamA' ? state.teamAName : state.teamBName} - ${w.playerName || 'Jugador'}: ${w.reason}${w.description ? `\n     ↳ Hechos constatados / Declaración: "${w.description}"` : ''}`
            )
            .join('\n')
        : '  • Sin sanciones disciplinarias registradas (Juego Limpio / Fair Play)';

    const medicalLines =
      state.medicalRecords && state.medicalRecords.length > 0
        ? state.medicalRecords
            .map(
              (m, i) =>
                `  ${i + 1}. ${m.player} (${m.team === 'teamA' ? state.teamAName : state.teamBName}): ${m.reason || 'Atención médica'} (Duración: ${Math.floor((m.durationSeconds || 180) / 60)} min)`
            )
            .join('\n')
        : '  • Sin intervenciones médicas solicitadas';

    const suspensionsList = state.suspensions || [];
    const suspensionsTextLines =
      suspensionsList.length > 0
        ? suspensionsList
            .map(
              (s, i) =>
                `  • [SUSPENSIÓN ${s.type === 'momentary' ? 'MOMENTÁNEA / TEMPORAL' : 'DEFINITIVA / CANCELADO'}]
    - Motivo / Causa: ${s.reason}
    - Situación de Juego: ${s.snapshot.scoreDisplay}
    - Turno de Saque: ${s.snapshot.serverPlayerName} (${s.snapshot.serverTeamName}) | Lado de Saque: ${s.snapshot.serveSide === 'deuce' ? 'Lado Derecho (Iguales)' : 'Lado Izquierdo (Ventaja)'}
    - Restador reglamentario: ${s.snapshot.receiverPlayerName || 'Restador'}
    - Ubicación en Pista: Izquierda (${s.snapshot.courtSides.teamOnLeft}) / Derecha (${s.snapshot.courtSides.teamOnRight})
    - Posiciones Jugadores: ${state.teamAName} [${s.snapshot.playersPositions.teamA[0].name} (${s.snapshot.playersPositions.teamA[0].position}) / ${s.snapshot.playersPositions.teamA[1].name} (${s.snapshot.playersPositions.teamA[1].position})] vs ${state.teamBName} [${s.snapshot.playersPositions.teamB[0].name} (${s.snapshot.playersPositions.teamB[0].position}) / ${s.snapshot.playersPositions.teamB[1].name} (${s.snapshot.playersPositions.teamB[1].position})]
    - Tiempo suspensión estipulado: ${s.durationConfigMinutes ? `${s.durationConfigMinutes} min` : 'N/A'} | Estado: ${s.isResumed ? 'Reanudado Oficialmente' : 'En Curso / No reanudado'}${s.description ? `\n    - Hechos descritos: "${s.description}"` : ''}`
            )
            .join('\n\n')
        : '';

    const otherIncidentsLines =
      state.incidents && state.incidents.length > 0
        ? state.incidents
            .map((inc, i) => `  ${i + 1}. [${inc.type.toUpperCase()}] ${inc.title}: ${inc.description}${inc.scoreAtMoment ? ` (Momento: ${inc.scoreAtMoment})` : ''}`)
            .join('\n')
        : '';

    let combinedIncidentsReport = '';
    if (suspensionsTextLines && otherIncidentsLines) {
      combinedIncidentsReport = `🔴 SUSPENSIONES DE PARTIDO:\n${suspensionsTextLines}\n\n📝 OTRAS INCIDENCIAS ARBITRALES:\n${otherIncidentsLines}`;
    } else if (suspensionsTextLines) {
      combinedIncidentsReport = `🔴 SUSPENSIONES DE PARTIDO:\n${suspensionsTextLines}`;
    } else if (otherIncidentsLines) {
      combinedIncidentsReport = otherIncidentsLines;
    } else {
      combinedIncidentsReport = '  • Sin incidencias extraordinarias reportadas';
    }

    const fipReportText = `=====================================================
FEDERACIÓN INTERNACIONAL DE PÁDEL (FIP)
ACTA OFICIAL DE PARTIDO / OFFICIAL MATCH REPORT
=====================================================

1. INFORMACIÓN DEL TORNEO Y ENCUENTRO:
-----------------------------------------------------
• Torneo / Liga: ${state.tournamentName || 'Torneo Oficial FIP'}
• Instancia / Ronda: ${state.tournamentRound || 'Cuadro Principal'}
• Pista: ${state.courtName || 'Pista Central'}
• Juez Árbitro: ${state.refereeName || 'Árbitro Oficial Designado'}
• Sistema de Puntuación: ${
      state.settings.scoringMode === 'golden_point'
        ? 'Punto de Oro (Golden Point)'
        : state.settings.scoringMode === 'star_point'
        ? 'Star Point'
        : 'Ventajas Tradicionales'
    }
• Formato: ${
      state.settings.matchFormat === 'two_sets_super_tie'
        ? '2 Sets + Super Tie-break'
        : `Mejor de ${state.settings.bestOfSets} Sets`
    }
• Cambio de Bolas: ${state.settings.ballChange.enabled ? 'Reglamentario FIP (7/9 juegos)' : 'Sin cambio'}

2. HORARIOS Y CRONOMETRAJE:
-----------------------------------------------------
• Fecha: ${formattedDate}
• Hora de Inicio: ${formattedStartTime}
• Hora de Finalización: ${formattedEndTime}
• Duración Total de Juego: ${formatTime(state.matchTimeSeconds)}

3. ALINEACIONES OFICIALES:
-----------------------------------------------------
• PAREJA A: ${state.teamAName}
  - Jugador 1: ${state.teamAPlayers[0]?.name || 'Jugador A1'} (${state.teamAPlayers[0]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamAPlayers[0]?.hand === 'left' ? 'Zurdo' : 'Diestro'})
  - Jugador 2: ${state.teamAPlayers[1]?.name || 'Jugador A2'} (${state.teamAPlayers[1]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamAPlayers[1]?.hand === 'left' ? 'Zurdo' : 'Diestro'})

• PAREJA B: ${state.teamBName}
  - Jugador 1: ${state.teamBPlayers[0]?.name || 'Jugador B1'} (${state.teamBPlayers[0]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamBPlayers[0]?.hand === 'left' ? 'Zurdo' : 'Diestro'})
  - Jugador 2: ${state.teamBPlayers[1]?.name || 'Jugador B2'} (${state.teamBPlayers[1]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamBPlayers[1]?.hand === 'left' ? 'Zurdo' : 'Diestro'})

4. ACTA DEL SORTEO OFICIAL (TOSS):
-----------------------------------------------------
• Ganador del Sorteo: ${tossWinnerTeamName}
• Elección Reglamentaria: ${getTossChoiceLabel(state.tossInfo?.choice)}
• Primer Servidor del Encuentro: ${firstServerName} (${firstServerTeamName})

5. TANTEADORES Y RESULTADO FINAL:
-----------------------------------------------------
${setsTextLines}
• Marcador Resumido: ${setsCondensed || '0-0'}
• RESULTADO OFICIAL: ${
      state.matchWinner
        ? `VICTORIA PARA ${state.matchWinner === 'teamA' ? state.teamAName : state.teamBName}`
        : 'PARTIDO EN CURSO / EN DESARROLLO'
    }

6. TIEMPOS MÉDICOS Y ATENCIONES (MTO):
-----------------------------------------------------
${medicalLines}

7. RÉGIMEN DISCIPLINARIO Y CÓDIGO DE CONDUCTA:
-----------------------------------------------------
${warningsLines}

8. INCIDENCIAS Y OBSERVACIONES DEL JUEZ ÁRBITRO:
-----------------------------------------------------
${combinedIncidentsReport}
${state.refereeNotes ? `• Notas Adicionales del Juez Árbitro: ${state.refereeNotes}\n` : ''}
9. RESUMEN ESTADÍSTICO TÉCNICO:
-----------------------------------------------------
• Puntos Ganados: ${state.teamAName} ${pointsA} (${pctA}%) | ${state.teamBName} ${pointsB} (${pctB}%)
• Juegos Totales: ${state.teamAName} ${gamesA} | ${state.teamBName} ${gamesB}
• Golpes Ganadores (Winners): ${state.teamAName} ${winnersA} | ${state.teamBName} ${winnersB}
• Aces: ${state.teamAName} ${acesA} | ${state.teamBName} ${acesB}
• Errores No Forzados: ${state.teamAName} ${errorsA} | ${state.teamBName} ${errorsB}
• Dobles Faltas: ${state.teamAName} ${doubleFaultsA} | ${state.teamBName} ${doubleFaultsB}

=====================================================
Acta validada oficialmente por el sistema FIP Padel Score.
=====================================================`;

    navigator.clipboard.writeText(fipReportText);
    setCopiedFIPReport(true);
    setTimeout(() => setCopiedFIPReport(false), 2500);
  };

  // Generate WhatsApp Markdown Formatted Report
  const generateWhatsAppReportText = (format: 'full_fip' | 'condensed') => {
    const setsTextLines = state.sets
      .map((s) => {
        const isSuper = s.isSuperTiebreak;
        const score = isSuper
          ? `Super Tie-break: ${s.tiebreakA ?? s.teamA} - ${s.tiebreakB ?? s.teamB}`
          : `Set ${s.setNumber}: ${s.teamA} - ${s.teamB}${s.tiebreakA !== undefined ? ` (Tie-break: ${s.tiebreakA}-${s.tiebreakB})` : ''}`;
        return `  • ${score}`;
      })
      .join('\n');

    if (format === 'condensed') {
      return `🎾 *RESULTADO DE PARTIDO DE PÁDEL* 🎾
${state.tournamentName || state.tournamentRound ? `🏆 *${state.tournamentName || ''}${state.tournamentName && state.tournamentRound ? ' • ' : ''}${state.tournamentRound || ''}*\n` : ''}🏟️ *Pista:* ${state.courtName || 'Pista Central'}
⏱️ *Duración:* ${formatTime(state.matchTimeSeconds)}

👥 *Pareja A:* ${state.teamAName} (${state.teamAPlayers.map((p) => p.name).join(' / ')})
👥 *Pareja B:* ${state.teamBName} (${state.teamBPlayers.map((p) => p.name).join(' / ')})

📊 *Marcador por Sets:*
${setsTextLines}
🎯 *Tanteador Final:* *${setsCondensed || '0-0'}*
🏆 *Ganador:* *${state.matchWinner ? (state.matchWinner === 'teamA' ? state.teamAName : state.teamBName) : 'En Juego'}*

📈 *Estadísticas:*
• Puntos: ${state.teamAName} ${pointsA} (${pctA}%) | ${state.teamBName} ${pointsB} (${pctB}%)
• Juegos: ${state.teamAName} ${gamesA} | ${state.teamBName} ${gamesB}
• Winners: ${winnersA} vs ${winnersB} | Aces: ${acesA} vs ${acesB}
• Errores NF: ${errorsA} vs ${errorsB} | Dobles Faltas: ${doubleFaultsA} vs ${doubleFaultsB}

_Transmitido vía Padel Score Tracker FIP_`;
    }

    // Full Official FIP Report formatted for WhatsApp
    const warningsLines =
      state.warnings.length > 0
        ? state.warnings
            .map(
              (w, i) =>
                `  ${i + 1}. [${w.level.toUpperCase()}] ${w.team === 'teamA' ? state.teamAName : state.teamBName} - ${w.playerName || 'Jugador'}: ${w.reason}${w.description ? `\n     ↳ _Hechos:_ "${w.description}"` : ''}`
            )
            .join('\n')
        : '  • Sin sanciones disciplinarias registradas';

    const medicalLines =
      state.medicalRecords && state.medicalRecords.length > 0
        ? state.medicalRecords
            .map(
              (m, i) =>
                `  ${i + 1}. ${m.player} (${m.team === 'teamA' ? state.teamAName : state.teamBName}): ${m.reason || 'Atención médica'} (${Math.floor((m.durationSeconds || 180) / 60)} min)`
            )
            .join('\n')
        : '  • Sin intervenciones médicas solicitadas';

    const suspensionsList = state.suspensions || [];
    const suspensionsLines =
      suspensionsList.length > 0
        ? suspensionsList
            .map(
              (s, i) =>
                `  • ⏸️ *[SUSPENSIÓN ${s.type === 'momentary' ? 'MOMENTÁNEA' : 'DEFINITIVA'}]* ${s.reason}\n     ↳ *Situación:* ${s.snapshot.scoreDisplay} | Al saque: ${s.snapshot.serverPlayerName} (${s.snapshot.serverTeamName}, ${s.snapshot.serveSide === 'deuce' ? 'Lado Der' : 'Lado Izq'}) | Resto: ${s.snapshot.receiverPlayerName || 'Restador'}\n     ↳ *Pistas:* Izq (${s.snapshot.courtSides.teamOnLeft}) / Der (${s.snapshot.courtSides.teamOnRight})${s.durationConfigMinutes ? ` | Tiempo: ${s.durationConfigMinutes}m` : ''} | Estado: ${s.isResumed ? 'Reanudado' : 'Suspendido'}${s.description ? `\n     ↳ _Detalle:_ "${s.description}"` : ''}`
            )
            .join('\n')
        : '';

    const otherIncidentsLines =
      state.incidents && state.incidents.length > 0
        ? state.incidents
            .map((inc, i) => `  ${i + 1}. [${inc.type.toUpperCase()}] ${inc.title}: ${inc.description}`)
            .join('\n')
        : '';

    let combinedWaIncidents = '';
    if (suspensionsLines && otherIncidentsLines) {
      combinedWaIncidents = `${suspensionsLines}\n${otherIncidentsLines}`;
    } else if (suspensionsLines) {
      combinedWaIncidents = suspensionsLines;
    } else if (otherIncidentsLines) {
      combinedWaIncidents = otherIncidentsLines;
    } else {
      combinedWaIncidents = '  • Sin incidencias extraordinarias reportadas';
    }

    return `🎾 *ACTA OFICIAL DE PARTIDO - FEDERACIÓN INTERNACIONAL DE PÁDEL (FIP)* 🎾
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *1. INFORMACIÓN DEL ENCUENTRO*
• *Torneo / Liga:* ${state.tournamentName || 'Torneo Oficial FIP'}
• *Instancia / Ronda:* ${state.tournamentRound || 'Cuadro Principal'}
• *Pista:* ${state.courtName || 'Pista Central'}
• *Juez Árbitro:* ${state.refereeName || 'Oficial FIP Designado'}
• *Sistema:* ${state.settings.scoringMode === 'golden_point' ? 'Punto de Oro' : state.settings.scoringMode === 'star_point' ? 'Star Point' : 'Ventajas'} | ${state.settings.matchFormat === 'two_sets_super_tie' ? '2 Sets + Super Tie-break' : `Mejor de ${state.settings.bestOfSets} Sets`}

⏱️ *2. HORARIOS Y CRONOMETRAJE*
• *Fecha:* ${formattedDate}
• *Hora Inicio:* ${formattedStartTime} | *Hora Fin:* ${formattedEndTime}
• *Tiempo de Juego Efectivo:* ${formatTime(state.matchTimeSeconds)}

👥 *3. ALINEACIONES OFICIALES*
🔵 *PAREJA A:* ${state.teamAName}
  • ${state.teamAPlayers[0]?.name || 'Jugador A1'} (${state.teamAPlayers[0]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamAPlayers[0]?.hand === 'left' ? 'Zurdo' : 'Diestro'})
  • ${state.teamAPlayers[1]?.name || 'Jugador A2'} (${state.teamAPlayers[1]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamAPlayers[1]?.hand === 'left' ? 'Zurdo' : 'Diestro'})

🔴 *PAREJA B:* ${state.teamBName}
  • ${state.teamBPlayers[0]?.name || 'Jugador B1'} (${state.teamBPlayers[0]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamBPlayers[0]?.hand === 'left' ? 'Zurdo' : 'Diestro'})
  • ${state.teamBPlayers[1]?.name || 'Jugador B2'} (${state.teamBPlayers[1]?.position === 'drive' ? 'Drive' : 'Revés'}, ${state.teamBPlayers[1]?.hand === 'left' ? 'Zurdo' : 'Diestro'})

🪙 *4. ACTA DEL SORTEO OFICIAL (TOSS)*
• *Ganador del Sorteo:* ${tossWinnerTeamName}
• *Elección Reglamentaria:* ${getTossChoiceLabel(state.tossInfo?.choice)}
• *Primer Servidor:* ${firstServerName} (${firstServerTeamName})

📊 *5. TANTEADORES Y RESULTADO OFICIAL*
${setsTextLines}
🎯 *Marcador Final:* *${setsCondensed || '0-0'}*
🏆 *RESULTADO OFICIAL:* *${
      state.matchWinner
        ? `VICTORIA PARA ${state.matchWinner === 'teamA' ? state.teamAName : state.teamBName}`
        : 'PARTIDO EN CURSO / EN DESARROLLO'
    }*

🩺 *6. TIEMPOS MÉDICOS Y ATENCIONES (MTO)*
${medicalLines}

⚠️ *7. RÉGIMEN DISCIPLINARIO (CÓDIGO DE CONDUCTA)*
${warningsLines}

📋 *8. INCIDENCIAS Y OBSERVACIONES DEL JUEZ ÁRBITRO*
${combinedWaIncidents}
${state.refereeNotes ? `• *Notas Árbitro:* ${state.refereeNotes}\n` : ''}
📈 *9. RESUMEN ESTADÍSTICO TÉCNICO*
• Puntos Ganados: ${state.teamAName} ${pointsA} (${pctA}%) | ${state.teamBName} ${pointsB} (${pctB}%)
• Juegos Totales: ${state.teamAName} ${gamesA} | ${state.teamBName} ${gamesB}
• Winners: ${state.teamAName} ${winnersA} | ${state.teamBName} ${winnersB}
• Aces: ${state.teamAName} ${acesA} | ${state.teamBName} ${acesB}
• Errores No Forzados: ${state.teamAName} ${errorsA} | ${state.teamBName} ${errorsB}
• Dobles Faltas: ${state.teamAName} ${doubleFaultsA} | ${state.teamBName} ${doubleFaultsB}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Acta oficial certificada y transmitida mediante el sistema Padel Score Tracker FIP_`;
  };

  // Launch WhatsApp with the selected number
  const handleOpenWhatsApp = (customNumber?: string) => {
    const numberToUse = customNumber !== undefined ? customNumber : whatsappPhone;
    const cleanNumber = numberToUse.replace(/[^0-9]/g, '');

    if (whatsappPhone.trim()) {
      localStorage.setItem('padel_fip_whatsapp_phone', whatsappPhone.trim());
    }

    const message = generateWhatsAppReportText(whatsappFormat);
    const encoded = encodeURIComponent(message);

    let waUrl = '';
    if (cleanNumber) {
      waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encoded}`;
    } else {
      // Allows selecting any chat or group freely inside WhatsApp
      waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    }

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy WhatsApp Formatted text to Clipboard
  const handleCopyWhatsAppText = () => {
    const message = generateWhatsAppReportText(whatsappFormat);
    navigator.clipboard.writeText(message);
    setCopiedWhatsAppText(true);
    setTimeout(() => setCopiedWhatsAppText(false), 2500);
  };

  // Select contact helper
  const handleSelectContact = (contact: WhatsAppContact) => {
    setSelectedContactId(contact.id);
    if (contact.phone) {
      setWhatsappPhone(contact.phone);
    }
  };

  // Save current phone to the active contact slot
  const handleSavePhoneToContact = (contactId: string) => {
    if (!whatsappPhone.trim()) return;
    setSavedContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, phone: whatsappPhone.trim() } : c))
    );
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-2xl lg:max-w-3xl rounded-2xl max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#282a2e] bg-[#16181b] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#47d6ff]/15 border border-[#47d6ff]/30 flex items-center justify-center text-[#47d6ff]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-[#e2e2e8]">
                Historial, Estadísticas e Informe
              </h2>
              <p className="text-[10px] text-[#bbc9cf]">
                {state.tournamentName || 'Torneo de Pádel'}
                {state.tournamentRound ? ` • ${state.tournamentRound}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#333539]"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subnav Tabs (Estadísticas / Punto a Punto / Informe FIP) */}
        <div className="flex border-b border-[#282a2e] px-3 sm:px-4 pt-2 bg-[#111317] shrink-0 overflow-x-auto gap-2">
          <button
            onClick={() => setViewMode('stats')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap relative ${
              viewMode === 'stats' ? 'text-[#47d6ff]' : 'text-[#bbc9cf] hover:text-[#e2e2e8]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Estadísticas
            {viewMode === 'stats' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#47d6ff]" />
            )}
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap relative ${
              viewMode === 'timeline' ? 'text-[#47d6ff]' : 'text-[#bbc9cf] hover:text-[#e2e2e8]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Punto a Punto ({totalPoints})
            {viewMode === 'timeline' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#47d6ff]" />
            )}
          </button>

          <button
            onClick={() => setViewMode('report')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap relative ${
              viewMode === 'report' ? 'text-[#ffd79f]' : 'text-[#bbc9cf] hover:text-[#ffd79f]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#ffd79f]" />
            Informe Oficial FIP
            <span className="ml-1 text-[9px] uppercase font-mono px-1.5 py-0.2 bg-[#ffd79f]/20 text-[#ffd79f] rounded-full border border-[#ffd79f]/30">
              Acta
            </span>
            {viewMode === 'report' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffd79f]" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ESTADÍSTICAS */}
          {viewMode === 'stats' && (
            <div className="space-y-4">
              {/* Match Score Card Banner */}
              <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e]">
                {(state.tournamentName || state.tournamentRound) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#ffd79f] font-bold mb-2 pb-2 border-b border-[#282a2e]">
                    <Trophy className="w-3.5 h-3.5 text-[#ffd79f] shrink-0" />
                    <span className="truncate">
                      {state.tournamentName || 'Torneo Oficial'}
                      {state.tournamentName && state.tournamentRound ? ' • ' : ''}
                      {state.tournamentRound}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#bbc9cf] mb-2 pb-2 border-b border-[#282a2e]">
                  <span>Duración: {formatTime(state.matchTimeSeconds)}</span>
                  <span>
                    {state.settings.scoringMode === 'golden_point'
                      ? '🥇 Punto de Oro'
                      : state.settings.scoringMode === 'star_point'
                      ? '⭐ Star Point'
                      : '⚡ Ventajas'}
                    {' • '}
                    {state.settings.matchFormat === 'two_sets_super_tie'
                      ? '2 Sets + Super Tie'
                      : state.settings.bestOfSets === 1
                      ? '1 Set Express'
                      : `Mejor de ${state.settings.bestOfSets}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 text-left">
                    <div className="font-bold text-[#47d6ff] truncate">{state.teamAName}</div>
                    <div className="text-[11px] text-[#bbc9cf]">
                      {state.teamAPlayers.map((p) => p.name).join(' & ')}
                    </div>
                  </div>

                  {/* Sets comparison */}
                  <div className="flex gap-2 font-mono font-bold px-3">
                    {state.sets.map((s, idx) => (
                      <div key={idx} className="bg-[#1e2023] px-2 py-1 rounded text-center">
                        <div className="text-[8px] text-[#859398] uppercase">
                          {s.isSuperTiebreak ? 'STB' : `Set ${s.setNumber}`}
                        </div>
                        <div>
                          <span
                            className={
                              (s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA) >
                              (s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB)
                                ? 'text-[#47d6ff]'
                                : 'text-[#e2e2e8]'
                            }
                          >
                            {s.isSuperTiebreak && s.tiebreakA !== undefined ? s.tiebreakA : s.teamA}
                          </span>
                          <span className="text-[#bbc9cf] mx-1">-</span>
                          <span
                            className={
                              (s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB) >
                              (s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA)
                                ? 'text-[#47d6ff]'
                                : 'text-[#e2e2e8]'
                            }
                          >
                            {s.isSuperTiebreak && s.tiebreakB !== undefined ? s.tiebreakB : s.teamB}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="font-bold text-[#e2e2e8] truncate">{state.teamBName}</div>
                    <div className="text-[11px] text-[#bbc9cf]">
                      {state.teamBPlayers.map((p) => p.name).join(' & ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Points Bar */}
              <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#47d6ff]">
                    {pointsA} pts ({pctA}%)
                  </span>
                  <span className="text-[#bbc9cf] uppercase text-[10px]">
                    Puntos Totales Ganados
                  </span>
                  <span className="text-[#e2e2e8]">
                    {pointsB} pts ({pctB}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#282a2e] rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${pctA}%` }}
                    className="bg-[#47d6ff] h-full transition-all duration-300"
                  />
                  <div
                    style={{ width: `${pctB}%` }}
                    className="bg-[#e2e2e8] h-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Stats Metrics Table */}
              <div className="bg-[#111317] p-3.5 rounded-xl border border-[#282a2e] divide-y divide-[#282a2e]">
                <div className="flex justify-between py-2 text-xs">
                  <span className="font-bold text-[#47d6ff] w-12">{gamesA}</span>
                  <span className="text-[#bbc9cf] font-medium flex-1 text-center">
                    Juegos Totales
                  </span>
                  <span className="font-bold text-[#e2e2e8] w-12 text-right">{gamesB}</span>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <span className="font-bold text-[#47d6ff] w-12">{winnersA}</span>
                  <span className="text-[#bbc9cf] font-medium flex-1 text-center flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#47d6ff]" />
                    Golpes Ganadores (Winners)
                  </span>
                  <span className="font-bold text-[#e2e2e8] w-12 text-right">{winnersB}</span>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <span className="font-bold text-[#47d6ff] w-12">{acesA}</span>
                  <span className="text-[#bbc9cf] font-medium flex-1 text-center flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#ffd79f]" />
                    Aces (Saques directos)
                  </span>
                  <span className="font-bold text-[#e2e2e8] w-12 text-right">{acesB}</span>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <span className="font-bold text-[#ffb4ab] w-12">{errorsA}</span>
                  <span className="text-[#bbc9cf] font-medium flex-1 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#ffb4ab]" />
                    Errores No Forzados
                  </span>
                  <span className="font-bold text-[#ffb4ab] w-12 text-right">{errorsB}</span>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <span className="font-bold text-[#ffb4ab] w-12">{doubleFaultsA}</span>
                  <span className="text-[#bbc9cf] font-medium flex-1 text-center">Dobles Faltas</span>
                  <span className="font-bold text-[#ffb4ab] w-12 text-right">{doubleFaultsB}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PUNTO A PUNTO (TIMELINE) */}
          {viewMode === 'timeline' && (
            <div className="space-y-2">
              {state.pointHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#bbc9cf] bg-[#111317] rounded-xl border border-[#282a2e]">
                  Aún no se han anotado puntos en este partido.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {state.pointHistory
                    .slice()
                    .reverse()
                    .map((pt, idx) => {
                      const isTeamA = pt.winner === 'teamA';
                      const numberFromEnd = state.pointHistory.length - idx;

                      return (
                        <div
                          key={pt.id}
                          className="bg-[#111317] p-2.5 rounded-xl border border-[#282a2e] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-[10px] text-[#bbc9cf] font-mono">
                              #{numberFromEnd}
                            </span>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isTeamA ? 'bg-[#47d6ff]' : 'bg-[#e2e2e8]'
                              }`}
                            />
                            <span className="font-bold text-[#e2e2e8]">
                              {isTeamA ? state.teamAName : state.teamBName}
                            </span>
                            {pt.pointType !== 'normal' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#282a2e] text-[#ffd79f] uppercase font-bold">
                                {pt.pointType === 'unforced_error'
                                  ? 'Error NF'
                                  : pt.pointType === 'double_fault'
                                  ? 'Doble Falta'
                                  : pt.pointType === 'winner'
                                  ? 'Winner'
                                  : pt.pointType === 'ace'
                                  ? 'Ace'
                                  : pt.pointType}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {pt.gameWon && (
                              <span className="bg-[#47d6ff]/20 text-[#47d6ff] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                JUEGO
                              </span>
                            )}
                            {pt.setWon && (
                              <span className="bg-[#ffd79f]/20 text-[#ffd79f] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                SET
                              </span>
                            )}
                            <span className="font-mono text-[#bbc9cf]">
                              {pt.scoreAfter.pointsA} - {pt.scoreAfter.pointsB}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INFORME OFICIAL FIP (MATCH REPORT) */}
          {viewMode === 'report' && (
            <div className="space-y-4 text-[#e2e2e8]">
              {/* FIP Official Document Header Card */}
              <div className="bg-[#111317] border border-[#ffd79f]/40 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd79f]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282a2e] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#ffd79f]/15 border border-[#ffd79f]/30 flex items-center justify-center text-[#ffd79f] shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-[#ffd79f] uppercase flex items-center gap-1.5">
                        <span>Federación Internacional de Pádel</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ffd79f]" />
                        <span>FIP</span>
                      </div>
                      <h3 className="font-headline font-extrabold text-base text-[#e2e2e8]">
                        Acta Oficial de Partido / Scorecard
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        state.matchWinner
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#47d6ff]/20 text-[#47d6ff] border border-[#47d6ff]/40'
                      }`}
                    >
                      {state.matchWinner ? 'Partido Finalizado' : 'Partido en Curso'}
                    </span>
                    <button
                      onClick={() => setShowWhatsAppModal(true)}
                      className="p-1.5 px-2.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 hover:text-emerald-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      title="Enviar Acta Oficial por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px]">Enviar WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setIsEditingReportInfo(!isEditingReportInfo)}
                      className="p-1.5 rounded-lg bg-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8] text-xs font-bold flex items-center gap-1"
                      title="Editar datos de árbitro y pista"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[11px] hidden sm:inline">Editar Datos</span>
                    </button>
                  </div>
                </div>

                {/* Edit Form Drawer */}
                {isEditingReportInfo && (
                  <div className="bg-[#1e2023] border border-[#282a2e] rounded-xl p-3.5 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-[#ffd79f] uppercase flex items-center justify-between">
                      <span>Editar Parámetros del Acta</span>
                      <button
                        onClick={() => setIsEditingReportInfo(false)}
                        className="text-[#bbc9cf] hover:text-white text-[11px]"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#bbc9cf] block mb-1">
                          Juez Árbitro / Silla
                        </label>
                        <input
                          type="text"
                          value={editReferee}
                          onChange={(e) => setEditReferee(e.target.value)}
                          placeholder="Nombre del Árbitro"
                          className="w-full bg-[#111317] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#bbc9cf] block mb-1">
                          Pista / Court
                        </label>
                        <input
                          type="text"
                          value={editCourt}
                          onChange={(e) => setEditCourt(e.target.value)}
                          placeholder="ej. Pista Central, Pista 1"
                          className="w-full bg-[#111317] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#bbc9cf] block mb-1">
                        Observaciones Generales del Acta
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Observaciones de arbitraje, condiciones climáticas, estado de la pista..."
                        rows={2}
                        className="w-full bg-[#111317] border border-[#282a2e] text-xs text-[#e2e2e8] rounded-lg p-2 outline-hidden resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveReportDetails}
                        className="px-4 py-1.5 rounded-lg bg-[#ffd79f] text-[#492e00] font-bold text-xs active:scale-95"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Torneo, Instancia y Reglamentación */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-[#16181b] p-3 rounded-xl border border-[#282a2e]">
                  <div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block">
                      Torneo
                    </span>
                    <span className="font-bold text-[#e2e2e8] truncate block">
                      {state.tournamentName || 'Torneo Oficial FIP'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block">
                      Instancia / Ronda
                    </span>
                    <span className="font-bold text-[#ffd79f] truncate block">
                      {state.tournamentRound || 'Cuadro Principal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block">
                      Pista
                    </span>
                    <span className="font-bold text-[#e2e2e8] truncate block">
                      {state.courtName || 'Pista Central'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block">
                      Juez Árbitro
                    </span>
                    <span className="font-bold text-[#e2e2e8] truncate block">
                      {state.refereeName || 'Oficial FIP'}
                    </span>
                  </div>
                </div>

                {/* 2. Horarios y Duración */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-[#16181b] p-3 rounded-xl border border-[#282a2e]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#47d6ff] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#bbc9cf] uppercase font-bold block">
                        Fecha
                      </span>
                      <span className="font-bold font-mono text-[#e2e2e8]">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#47d6ff] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#bbc9cf] uppercase font-bold block">
                        Inicio
                      </span>
                      <span className="font-bold font-mono text-[#e2e2e8]">
                        {formattedStartTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ffd79f] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#bbc9cf] uppercase font-bold block">
                        Finalización
                      </span>
                      <span className="font-bold font-mono text-[#e2e2e8]">
                        {formattedEndTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ffba4a] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#bbc9cf] uppercase font-bold block">
                        Tiempo Total
                      </span>
                      <span className="font-bold font-mono text-[#47d6ff]">
                        {formatTime(state.matchTimeSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ALINEACIÓN OFICIAL DE JUGADORES Y POSICIÓN */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#282a2e] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#47d6ff]">
                    <User className="w-4 h-4" />
                    <span>Alineaciones Oficiales de Parejas</span>
                  </div>
                  <span className="text-[10px] text-[#bbc9cf]">Reglamento FIP Dobles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pareja A */}
                  <div className="bg-[#16181b] border border-[#47d6ff]/30 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#47d6ff]">
                        PAREJA A: {state.teamAName}
                      </span>
                      <span className="text-[9px] bg-[#47d6ff]/15 text-[#47d6ff] px-2 py-0.5 rounded font-bold">
                        Equipo 1
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs divide-y divide-[#282a2e]/60">
                      {state.teamAPlayers.map((p, i) => (
                        <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <span className="font-bold text-[#e2e2e8]">{p.name || `Jugador A${i + 1}`}</span>
                          <span className="text-[10px] text-[#bbc9cf] bg-[#282a2e] px-2 py-0.5 rounded">
                            {p.position === 'drive' ? 'Drive' : 'Revés'} •{' '}
                            {p.hand === 'left' ? 'Zurdo' : 'Diestro'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pareja B */}
                  <div className="bg-[#16181b] border border-[#282a2e] p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#e2e2e8]">
                        PAREJA B: {state.teamBName}
                      </span>
                      <span className="text-[9px] bg-[#282a2e] text-[#bbc9cf] px-2 py-0.5 rounded font-bold">
                        Equipo 2
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs divide-y divide-[#282a2e]/60">
                      {state.teamBPlayers.map((p, i) => (
                        <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <span className="font-bold text-[#e2e2e8]">{p.name || `Jugador B${i + 1}`}</span>
                          <span className="text-[10px] text-[#bbc9cf] bg-[#282a2e] px-2 py-0.5 rounded">
                            {p.position === 'drive' ? 'Drive' : 'Revés'} •{' '}
                            {p.hand === 'left' ? 'Zurdo' : 'Diestro'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ACTA DEL SORTEO OFICIAL (TOSS FIP) */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffd79f] border-b border-[#282a2e] pb-2">
                  <Medal className="w-4 h-4" />
                  <span>Acta del Sorteo Oficial (Toss FIP)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e]">
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block mb-0.5">
                      Ganador del Sorteo
                    </span>
                    <span className="font-bold text-[#ffd79f]">{tossWinnerTeamName}</span>
                  </div>

                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e]">
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block mb-0.5">
                      Elección Reglamentaria
                    </span>
                    <span className="font-bold text-[#e2e2e8]">
                      {getTossChoiceLabel(state.tossInfo?.choice)}
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e]">
                    <span className="text-[10px] text-[#bbc9cf] uppercase font-bold block mb-0.5">
                      Primer Servidor del Encuentro
                    </span>
                    <span className="font-bold text-[#47d6ff]">
                      {firstServerName} ({firstServerTeamName})
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. TANTEADORES SET A SET Y RESULTADO FINAL */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#282a2e] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#47d6ff]">
                    <Trophy className="w-4 h-4" />
                    <span>Tanteadores por Set y Resultado Final</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#ffd79f]">
                    {setsCondensed || '0-0'}
                  </span>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#282a2e] text-[10px] uppercase text-[#bbc9cf]">
                        <th className="py-2 px-3">Equipo / Pareja</th>
                        {state.sets.map((s, idx) => (
                          <th key={idx} className="py-2 px-3 text-center">
                            {s.isSuperTiebreak ? 'Super Tie' : `Set ${s.setNumber}`}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-right">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282a2e]/60 font-mono">
                      <tr className="hover:bg-[#16181b]/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-[#47d6ff]">
                          {state.teamAName}
                        </td>
                        {state.sets.map((s, idx) => {
                          const val = s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA;
                          const rivalVal = s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB;
                          const isWin = val > rivalVal;
                          return (
                            <td
                              key={idx}
                              className={`py-2.5 px-3 text-center font-bold text-sm ${
                                isWin ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
                              }`}
                            >
                              {val}
                              {s.tiebreakA !== undefined && !s.isSuperTiebreak && (
                                <span className="text-[10px] text-[#bbc9cf] ml-1">
                                  ({s.tiebreakA})
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-sans font-bold">
                          {state.matchWinner === 'teamA' ? (
                            <span className="text-emerald-400">GANADOR 🏆</span>
                          ) : (
                            <span className="text-[#bbc9cf]">-</span>
                          )}
                        </td>
                      </tr>

                      <tr className="hover:bg-[#16181b]/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-[#e2e2e8]">
                          {state.teamBName}
                        </td>
                        {state.sets.map((s, idx) => {
                          const val = s.isSuperTiebreak ? (s.tiebreakB ?? s.teamB) : s.teamB;
                          const rivalVal = s.isSuperTiebreak ? (s.tiebreakA ?? s.teamA) : s.teamA;
                          const isWin = val > rivalVal;
                          return (
                            <td
                              key={idx}
                              className={`py-2.5 px-3 text-center font-bold text-sm ${
                                isWin ? 'text-[#47d6ff]' : 'text-[#e2e2e8]'
                              }`}
                            >
                              {val}
                              {s.tiebreakB !== undefined && !s.isSuperTiebreak && (
                                <span className="text-[10px] text-[#bbc9cf] ml-1">
                                  ({s.tiebreakB})
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-sans font-bold">
                          {state.matchWinner === 'teamB' ? (
                            <span className="text-emerald-400">GANADOR 🏆</span>
                          ) : (
                            <span className="text-[#bbc9cf]">-</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Final Result Callout */}
                <div className="bg-[#16181b] border border-[#282a2e] p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-[#bbc9cf]">Veredicto del Encuentro:</span>
                  <span className="font-extrabold text-sm text-[#ffd79f]">
                    {state.matchWinner ? (
                      <>
                        Victoria para{' '}
                        {state.matchWinner === 'teamA' ? state.teamAName : state.teamBName}
                      </>
                    ) : (
                      'Partido en Desarrollo'
                    )}
                  </span>
                </div>
              </div>

              {/* 6. TIEMPOS MÉDICOS FIP (MTO) */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282a2e] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffb4ab]">
                    <HeartPulse className="w-4 h-4" />
                    <span>Tiempos Médicos Oficiales (MTO FIP - 3 min)</span>
                  </div>
                  <button
                    onClick={() => setShowAddMTOForm(!showAddMTOForm)}
                    className="text-[11px] text-[#ffb4ab] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Asentar MTO
                  </button>
                </div>

                {showAddMTOForm && (
                  <div className="bg-[#1e2023] p-3 rounded-xl border border-[#ffb4ab]/30 space-y-2 animate-in fade-in text-xs">
                    <div className="font-bold text-[#ffb4ab] text-[11px] uppercase">
                      Registrar Atención Médica en Acta
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#bbc9cf] block mb-1">Jugador</label>
                        <input
                          type="text"
                          value={newMTOPlayer}
                          onChange={(e) => setNewMTOPlayer(e.target.value)}
                          placeholder="Nombre del Jugador"
                          className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#bbc9cf] block mb-1">Equipo</label>
                        <select
                          value={newMTOTeam}
                          onChange={(e) => setNewMTOTeam(e.target.value as Team)}
                          className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                        >
                          <option value="teamA">{state.teamAName}</option>
                          <option value="teamB">{state.teamBName}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#bbc9cf] block mb-1">
                        Motivo / Diagnóstico
                      </label>
                      <input
                        type="text"
                        value={newMTOReason}
                        onChange={(e) => setNewMTOReason(e.target.value)}
                        placeholder="ej. Molestia muscular gemelo derecho"
                        className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowAddMTOForm(false)}
                        className="px-3 py-1 text-xs text-[#bbc9cf]"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateMTO}
                        className="px-4 py-1 bg-[#ffb4ab] text-[#690005] font-bold text-xs rounded-lg"
                      >
                        Guardar en Acta
                      </button>
                    </div>
                  </div>
                )}

                {state.medicalRecords && state.medicalRecords.length > 0 ? (
                  <div className="space-y-1.5">
                    {state.medicalRecords.map((m) => (
                      <div
                        key={m.id}
                        className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
                          <span className="font-bold text-[#e2e2e8]">{m.player}</span>
                          <span className="text-[10px] text-[#bbc9cf]">
                            ({m.team === 'teamA' ? state.teamAName : state.teamBName})
                          </span>
                          <span className="text-[#ffd79f] text-[11px]">— {m.reason}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-[#ffb4ab]/15 text-[#ffb4ab] px-2 py-0.5 rounded">
                          {Math.floor((m.durationSeconds || 180) / 60)}:00 min
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] text-xs text-[#bbc9cf] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sin tiempos médicos registrados en el encuentro (Condición física normal).</span>
                  </div>
                )}
              </div>

              {/* 7. RÉGIMEN DISCIPLINARIO Y ADVERTENCIAS */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282a2e] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffba4a]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Código de Conducta y Advertencias Arbitrales</span>
                  </div>
                  <span className="text-[10px] text-[#bbc9cf]">
                    {state.warnings.length} sanción(es)
                  </span>
                </div>

                {state.warnings.length > 0 ? (
                  <div className="space-y-2">
                    {state.warnings.map((w) => (
                      <div
                        key={w.id}
                        className="bg-[#16181b] p-3 rounded-xl border border-[#282a2e] flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2 h-2 rounded-full bg-[#ffba4a]" />
                            <span className="font-bold text-[#e2e2e8]">
                              {w.team === 'teamA' ? state.teamAName : state.teamBName}
                            </span>
                            {w.playerName && (
                              <span className="text-[11px] text-[#bbc9cf]">({w.playerName})</span>
                            )}
                            <span className="text-[#ffd79f] text-[11px] font-medium">— {w.reason}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-[#ffba4a]/20 text-[#ffba4a] px-2 py-0.5 rounded shrink-0">
                            {w.level.replace('_', ' ')}
                          </span>
                        </div>

                        {w.description && (
                          <div className="p-2.5 bg-[#111317] border border-[#282a2e] rounded-lg text-[11px] text-[#e2e2e8] space-y-1">
                            <div className="flex items-center gap-1.5 text-[#ffba4a] font-bold text-[10px] uppercase">
                              <FileText className="w-3 h-3 text-[#ffba4a]" />
                              <span>Hechos Constatados / Declaración Arbitral:</span>
                            </div>
                            <p className="italic text-[#d1d7db] leading-relaxed pl-1">
                              "{w.description}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] text-xs text-[#bbc9cf] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sin sanciones disciplinarias registradas (Juego Limpio / Fair Play).</span>
                  </div>
                )}
              </div>

              {/* 8. INCIDENCIAS Y SUSPENSIONES (OBSERVACIONES DEL ÁRBITRO) */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#282a2e] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#47d6ff]">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Incidencias y Suspensiones Arbitrales</span>
                  </div>
                  <button
                    onClick={() => setShowAddIncidentForm(!showAddIncidentForm)}
                    className="text-[11px] text-[#47d6ff] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Incidencia
                  </button>
                </div>

                {/* Suspensiones de Partido */}
                {state.suspensions && state.suspensions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#ff5c5c]">
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Actas de Suspensión de Encuentro ({state.suspensions.length})</span>
                    </div>

                    <div className="space-y-2">
                      {state.suspensions.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="bg-[#1e2023] border border-[#ff5c5c]/40 rounded-xl p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#e2e2e8] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#ff5c5c]" />
                                {s.reason}
                              </span>
                              <span
                                className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  s.type === 'momentary'
                                    ? 'bg-[#ffba4a]/20 text-[#ffba4a] border border-[#ffba4a]/30'
                                    : 'bg-[#ff5c5c]/20 text-[#ff5c5c] border border-[#ff5c5c]/30'
                                }`}
                              >
                                {s.type === 'momentary' ? 'Momentánea' : 'Definitiva'}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                s.isResumed
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {s.isResumed ? '✓ Reanudado' : '⏸️ Suspendido'}
                            </span>
                          </div>

                          {/* Technical snapshot snapshot grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#111317] p-2.5 rounded-lg border border-[#282a2e] text-[11px]">
                            <div className="space-y-1">
                              <div className="text-[#bbc9cf] text-[10px]">
                                Marcador al suspender:
                              </div>
                              <div className="font-mono font-bold text-[#47d6ff]">
                                {s.snapshot.scoreDisplay}
                              </div>

                              <div className="text-[#bbc9cf] text-[10px] pt-1">
                                Turno de saque y lado:
                              </div>
                              <div className="text-[#e2e2e8]">
                                🎾 <span className="font-bold">{s.snapshot.serverPlayerName}</span>{' '}
                                <span className="text-[#bbc9cf]">
                                  ({s.snapshot.serverTeamName})
                                </span>{' '}
                                •{' '}
                                <span className="text-amber-400">
                                  {s.snapshot.serveSide === 'deuce'
                                    ? 'Lado Derecho (Iguales)'
                                    : 'Lado Izquierdo (Ventaja)'}
                                </span>
                              </div>
                              {s.snapshot.receiverPlayerName && (
                                <div className="text-[10px] text-[#bbc9cf]">
                                  Restador reglamentario:{' '}
                                  <span className="text-[#e2e2e8] font-medium">
                                    {s.snapshot.receiverPlayerName}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 sm:border-l sm:border-[#282a2e] sm:pl-3">
                              <div className="text-[#bbc9cf] text-[10px]">
                                Lados de pista y posiciones:
                              </div>
                              <div className="text-[#e2e2e8] text-[10px]">
                                <span>
                                  Pista Izq: <b>{s.snapshot.courtSides.teamOnLeft}</b>
                                </span>{' '}
                                •{' '}
                                <span>
                                  Pista Der: <b>{s.snapshot.courtSides.teamOnRight}</b>
                                </span>
                              </div>

                              <div className="text-[10px] text-[#bbc9cf] space-y-0.5 pt-0.5">
                                <div>
                                  {state.teamAName}:{' '}
                                  <span className="text-[#e2e2e8]">
                                    {s.snapshot.playersPositions.teamA[0].name} (
                                    {s.snapshot.playersPositions.teamA[0].position}) /{' '}
                                    {s.snapshot.playersPositions.teamA[1].name} (
                                    {s.snapshot.playersPositions.teamA[1].position})
                                  </span>
                                </div>
                                <div>
                                  {state.teamBName}:{' '}
                                  <span className="text-[#e2e2e8]">
                                    {s.snapshot.playersPositions.teamB[0].name} (
                                    {s.snapshot.playersPositions.teamB[0].position}) /{' '}
                                    {s.snapshot.playersPositions.teamB[1].name} (
                                    {s.snapshot.playersPositions.teamB[1].position})
                                  </span>
                                </div>
                              </div>

                              {s.durationConfigMinutes && (
                                <div className="text-[10px] text-amber-300 flex items-center gap-1 pt-0.5">
                                  <Timer className="w-3 h-3" />
                                  <span>Tiempo estipulado: {s.durationConfigMinutes} min</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {s.description && (
                            <div className="p-2 bg-[#111317] border border-[#282a2e] rounded-lg text-[11px] text-[#e2e2e8] space-y-0.5">
                              <div className="text-[#bbc9cf] text-[10px] font-bold uppercase">
                                Descripción de los hechos:
                              </div>
                              <p className="italic text-[#d1d7db]">{s.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showAddIncidentForm && (
                  <div className="bg-[#1e2023] p-3 rounded-xl border border-[#47d6ff]/30 space-y-2 animate-in fade-in text-xs">
                    <div className="font-bold text-[#47d6ff] text-[11px] uppercase">
                      Nueva Incidencia en Acta
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#bbc9cf] block mb-1">
                          Tipo de Incidencia
                        </label>
                        <select
                          value={newIncidentType}
                          onChange={(e) =>
                            setNewIncidentType(e.target.value as IncidentRecord['type'])
                          }
                          className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                        >
                          <option value="ball_change">Cambio de Bolas</option>
                          <option value="delay">Demora / Interrupción</option>
                          <option value="court">Estado de la Pista</option>
                          <option value="referee_decision">Decisión Arbitral</option>
                          <option value="conduct">Conducta</option>
                          <option value="other">Otras Observaciones</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#bbc9cf] block mb-1">Título</label>
                        <input
                          type="text"
                          value={newIncidentTitle}
                          onChange={(e) => setNewIncidentTitle(e.target.value)}
                          placeholder="ej. Cambio de pelotas aplicado en juego 7"
                          className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#bbc9cf] block mb-1">Descripción</label>
                      <input
                        type="text"
                        value={newIncidentDesc}
                        onChange={(e) => setNewIncidentDesc(e.target.value)}
                        placeholder="Detalles adicionales..."
                        className="w-full bg-[#111317] border border-[#282a2e] rounded-lg p-2 text-xs text-[#e2e2e8] outline-hidden"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowAddIncidentForm(false)}
                        className="px-3 py-1 text-xs text-[#bbc9cf]"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateIncident}
                        className="px-4 py-1 bg-[#47d6ff] text-[#003642] font-bold text-xs rounded-lg"
                      >
                        Asentar Incidencia
                      </button>
                    </div>
                  </div>
                )}

                {state.incidents && state.incidents.length > 0 ? (
                  <div className="space-y-1.5">
                    {state.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#e2e2e8]">{inc.title}</span>
                          <span className="text-[9px] uppercase font-mono bg-[#282a2e] text-[#bbc9cf] px-1.5 py-0.5 rounded">
                            {inc.type}
                          </span>
                        </div>
                        {inc.description && (
                          <p className="text-[11px] text-[#bbc9cf]">{inc.description}</p>
                        )}
                        {inc.scoreAtMoment && (
                          <p className="text-[10px] text-[#47d6ff]">
                            Marcador: {inc.scoreAtMoment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !state.suspensions || state.suspensions.length === 0 ? (
                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] text-xs text-[#bbc9cf] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sin incidencias extraordinarias reportadas durante el encuentro.</span>
                  </div>
                ) : null}

                {state.refereeNotes && (
                  <div className="bg-[#16181b] p-2.5 rounded-xl border border-[#282a2e] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#ffd79f]">
                      Notas Generales del Árbitro:
                    </span>
                    <p className="text-[11px] text-[#e2e2e8]">{state.refereeNotes}</p>
                  </div>
                )}
              </div>

              {/* 9. RESUMEN TÉCNICO ESTADÍSTICO */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffd79f] border-b border-[#282a2e] pb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Resumen Estadístico Técnico FIP</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Puntos Totales:</span>
                    <span className="font-bold text-[#47d6ff]">
                      {pointsA} ({pctA}%) / {pointsB} ({pctB}%)
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Winners:</span>
                    <span className="font-bold text-[#ffd79f]">
                      {winnersA} / {winnersB}
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Aces:</span>
                    <span className="font-bold text-[#e2e2e8]">
                      {acesA} / {acesB}
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Errores No Forzados:</span>
                    <span className="font-bold text-[#ffb4ab]">
                      {errorsA} / {errorsB}
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Dobles Faltas:</span>
                    <span className="font-bold text-[#ffb4ab]">
                      {doubleFaultsA} / {doubleFaultsB}
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-2 rounded-xl border border-[#282a2e] flex justify-between items-center">
                    <span className="text-[#bbc9cf]">Juegos Disputados:</span>
                    <span className="font-bold text-[#e2e2e8]">
                      {gamesA} / {gamesB}
                    </span>
                  </div>
                </div>
              </div>

              {/* 10. FIRMAS Y VALIDACIÓN OFICIAL FIP */}
              <div className="bg-[#111317] border border-[#282a2e] rounded-2xl p-4 space-y-3">
                <div className="text-[10px] uppercase font-bold text-[#bbc9cf] tracking-widest text-center">
                  Firmas de Conformidad y Validación Arbitral
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-[#16181b] p-3 rounded-xl border border-[#282a2e] space-y-4">
                    <div className="h-8 border-b border-dashed border-[#282a2e] flex items-end justify-center pb-1">
                      <span className="text-[11px] font-mono text-[#ffd79f]">
                        {state.refereeName || 'Oficial FIP Designado'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase block font-bold">
                      Juez Árbitro / Silla
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-3 rounded-xl border border-[#282a2e] space-y-4">
                    <div className="h-8 border-b border-dashed border-[#282a2e] flex items-end justify-center pb-1">
                      <span className="text-[11px] font-mono text-[#47d6ff]">
                        {state.teamAPlayers[0]?.name || state.teamAName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase block font-bold">
                      Capitán / Jugador Pareja A
                    </span>
                  </div>

                  <div className="bg-[#16181b] p-3 rounded-xl border border-[#282a2e] space-y-4">
                    <div className="h-8 border-b border-dashed border-[#282a2e] flex items-end justify-center pb-1">
                      <span className="text-[11px] font-mono text-[#e2e2e8]">
                        {state.teamBPlayers[0]?.name || state.teamBName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#bbc9cf] uppercase block font-bold">
                      Capitán / Jugador Pareja B
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#282a2e] bg-[#16181b] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'report' ? (
              <>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-emerald-950/40"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar por WhatsApp
                </button>

                <button
                  onClick={handleCopyFIPReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ffd79f] text-[#492e00] hover:bg-[#ffd79f]/90 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                >
                  {copiedFIPReport ? (
                    <Check className="w-4 h-4 text-emerald-800" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedFIPReport ? '¡Acta Copiada!' : 'Copiar Acta FIP (Texto)'}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111317] hover:bg-[#282a2e] border border-[#282a2e] text-[#e2e2e8] rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4 text-[#ffd79f]" />
                  Imprimir / PDF
                </button>
              </>
            ) : (
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111317] hover:bg-[#282a2e] border border-[#282a2e] rounded-xl text-xs font-bold text-[#47d6ff] active:scale-95 transition-all"
              >
                {copiedSummary ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedSummary ? '¡Copiado!' : 'Copiar Resumen'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode !== 'report' && (
              <button
                onClick={() => setViewMode('report')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ffd79f]/15 hover:bg-[#ffd79f]/25 border border-[#ffd79f]/30 text-[#ffd79f] rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                Ver Informe FIP
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* MODAL CONFIGURACIÓN Y ENVÍO POR WHATSAPP */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#1e2023] border border-[#282a2e] w-full max-w-lg rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* WhatsApp Modal Header */}
              <div className="p-4 border-b border-[#282a2e] bg-[#16181b] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-sm text-[#e2e2e8]">
                      Enviar Acta FIP por WhatsApp
                    </h3>
                    <p className="text-[10px] text-[#bbc9cf]">
                      Configura el número y formato de envío
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1.5 rounded-lg text-[#bbc9cf] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* WhatsApp Modal Body */}
              <div className="p-4 overflow-y-auto space-y-4 text-xs">
                {/* Format selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#ffd79f] tracking-wider block">
                    1. Formato del Mensaje
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWhatsappFormat('full_fip')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        whatsappFormat === 'full_fip'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                          : 'bg-[#111317] border-[#282a2e] text-[#bbc9cf] hover:border-[#3b3e44]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-[#e2e2e8]">
                          Acta Completa FIP
                        </span>
                        {whatsappFormat === 'full_fip' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-[9px] text-[#bbc9cf] leading-tight">
                        Exhaustiva con árbitro, toss, sets, warnings, MTOs y estadísticas.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWhatsappFormat('condensed')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        whatsappFormat === 'condensed'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                          : 'bg-[#111317] border-[#282a2e] text-[#bbc9cf] hover:border-[#3b3e44]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-[#e2e2e8]">
                          Resumen Rápido (Flash)
                        </span>
                        {whatsappFormat === 'condensed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-[9px] text-[#bbc9cf] leading-tight">
                        Tanteador directo, duración, ganadores y resumen estadístico conciso.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recipient Preset Pills */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-[#ffd79f] tracking-wider block">
                      2. Destinatario Rápido
                    </label>
                    <span className="text-[9px] text-[#bbc9cf]">
                      Guarda números frecuentes
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {savedContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className={`p-2 rounded-lg border text-left transition-all truncate ${
                          selectedContactId === contact.id
                            ? 'bg-[#282a2e] border-[#ffd79f] text-[#ffd79f] font-bold'
                            : 'bg-[#111317] border-[#282a2e] text-[#bbc9cf] hover:text-[#e2e2e8]'
                        }`}
                      >
                        <div className="text-[10px] font-bold truncate">{contact.name}</div>
                        <div className="text-[9px] font-mono text-[#8e989d] truncate">
                          {contact.phone || 'Sin número'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Input with Country Code Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-[#ffd79f] tracking-wider">
                      3. Número de Teléfono (WhatsApp)
                    </label>
                    {selectedContactId !== 'custom' && whatsappPhone.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSavePhoneToContact(selectedContactId)}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                      >
                        <Bookmark className="w-2.5 h-2.5" />
                        Guardar en contacto
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Country Code dropdown */}
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedCountryCode(code);
                        // If phone doesn't start with +, can prepend or update
                        if (!whatsappPhone.startsWith('+')) {
                          setWhatsappPhone(`${code} ${whatsappPhone.replace(/^[0-9]{1,3}\s*/, '')}`);
                        }
                      }}
                      className="bg-[#111317] border border-[#282a2e] rounded-xl px-2.5 py-2 text-xs text-[#e2e2e8] focus:border-emerald-500 focus:outline-hidden"
                    >
                      {COMMON_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.country})
                        </option>
                      ))}
                    </select>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-[#8e989d] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => {
                          setWhatsappPhone(e.target.value);
                          setSelectedContactId('custom');
                        }}
                        placeholder="Ej: +34 612 345 678 o 612345678"
                        className="w-full bg-[#111317] border border-[#282a2e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#e2e2e8] placeholder:text-[#52565c] focus:border-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#bbc9cf] leading-relaxed">
                    💡 <span className="text-[#e2e2e8]">Nota:</span> Si dejas el campo vacío, WhatsApp te permitirá seleccionar cualquier chat, grupo o contacto directamente desde la aplicación.
                  </p>
                </div>

                {/* Message Live Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-[#bbc9cf] tracking-wider">
                      Vista Previa del Mensaje
                    </label>
                    <span className="text-[9px] text-[#8e989d]">
                      Formato WhatsApp (*negrita*, • viñetas)
                    </span>
                  </div>
                  <div className="bg-[#0b141a] border border-[#1f2c34] rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-[#d1d7db] whitespace-pre-wrap leading-relaxed select-all">
                    {generateWhatsAppReportText(whatsappFormat)}
                  </div>
                </div>
              </div>

              {/* WhatsApp Modal Actions */}
              <div className="p-3.5 border-t border-[#282a2e] bg-[#16181b] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#111317] hover:bg-[#282a2e] border border-[#282a2e] text-[#e2e2e8] rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  {copiedWhatsAppText ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedWhatsAppText ? '¡Copiado!' : 'Copiar Texto'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(false)}
                    className="px-3 py-2 text-[#bbc9cf] hover:text-[#e2e2e8] text-xs font-bold"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-emerald-950/40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Abrir y Enviar en WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
