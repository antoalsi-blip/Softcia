export type Team = 'teamA' | 'teamB';

export type PointScore = '0' | '15' | '30' | '40' | 'AD' | 'deuce 1' | 'AD 1' | 'deuce 2' | 'AD 02' | 'SP' | string;

export type ScoringMode = 'golden_point' | 'star_point' | 'advantage';

export type MatchFormat = 'best_of_3' | 'two_sets_super_tie' | 'best_of_5' | 'best_of_1';

export interface SetScore {
  setNumber: number;
  teamA: number;
  teamB: number;
  tiebreakA?: number;
  tiebreakB?: number;
  isCompleted: boolean;
  winner?: Team;
  isSuperTiebreak?: boolean; // Set jugado como Super Tie-break a 10 puntos
  durationSeconds?: number; // Duración acumulada en segundos del set
  pointsCount?: number; // Total de puntos jugados en el set
  firstServerTeam?: Team; // Equipo que abrió el servicio en este set
  firstServerA?: 0 | 1; // Jugador del Equipo A que realizó el primer saque en este set
  firstServerB?: 0 | 1; // Jugador del Equipo B que realizó el primer saque en este set
}

export type PointType = 'normal' | 'winner' | 'unforced_error' | 'forced_error' | 'ace' | 'double_fault' | 'penalty';

export interface PointRecord {
  id: string;
  winner: Team;
  server: Team;
  serverPlayerName?: string;
  pointType: PointType;
  description?: string;
  timestamp: number;
  scoreAfter: {
    pointsA: string;
    pointsB: string;
    gamesA: number;
    gamesB: number;
    setIndex: number;
    isTiebreak: boolean;
    isSuperTiebreak?: boolean;
    isStarPoint?: boolean;
    starPointStage?: number;
    sidesSwapped?: boolean;
  };
  gameWon?: Team;
  setWon?: Team;
  matchWon?: Team;
}

export interface PlayerInfo {
  name: string;
  hand: 'right' | 'left';
  position: 'drive' | 'reves';
}

export type BallChangePattern = 'none' | '7_9' | '9_11' | 'every_set' | 'every_2_sets' | 'custom';

export interface BallChangeSettings {
  enabled: boolean;
  pattern: BallChangePattern;
  firstChangeGames: number; // e.g. 7
  subsequentChangeGames: number; // e.g. 9
}

export interface MatchSettings {
  scoringMode: ScoringMode; // Punto de Oro vs Star Point vs Ventaja
  matchFormat: MatchFormat; // 'best_of_3' | 'two_sets_super_tie' | 'best_of_5' | 'best_of_1'
  bestOfSets: 1 | 3 | 5;
  tiebreakPoints: 7 | 10;
  tiebreakAtGames: 6;
  soundEnabled: boolean;
  voiceCallout: boolean;
  courtChangeReminder: boolean;
  ballChange: BallChangeSettings;
}

export type WarningLevel = 'time_violation' | 'warning' | 'point_penalty' | 'game_penalty' | 'disqualification';

export interface WarningRecord {
  id: string;
  team: Team;
  playerName?: string;
  level: WarningLevel;
  reason: string;
  description?: string; // Descripción o transcripción detallada de los hechos
  timestamp: number;
  setIndex?: number;
}

export interface MedicalTimeoutRecord {
  id: string;
  player: string;
  team: Team;
  timestamp: number;
  durationSeconds?: number;
  reason?: string;
  setIndex?: number;
}

export type SuspensionType = 'momentary' | 'definitive';

export interface PlayerPositionSnapshot {
  name: string;
  position: 'drive' | 'reves' | 'backhand';
}

export interface SuspensionStateSnapshot {
  setIndex: number;
  setNumber: number;
  scoreDisplay: string; // Ej: "Set 2 (6-4, 3-2, 30-15)"
  gamesA: number;
  gamesB: number;
  pointsA: string;
  pointsB: string;
  isTiebreak: boolean;
  tiebreakScore?: string;
  serverTeam: Team;
  serverTeamName: string;
  serverPlayerName: string;
  serverPlayerPosition?: 'drive' | 'reves' | 'backhand';
  serveSide: 'deuce' | 'ad'; // lado derecho (iguales) o lado izquierdo (ventaja)
  receiverPlayerName?: string;
  courtSides: {
    teamOnLeft: string;
    teamOnRight: string;
  };
  playersPositions: {
    teamA: [PlayerPositionSnapshot, PlayerPositionSnapshot];
    teamB: [PlayerPositionSnapshot, PlayerPositionSnapshot];
  };
  matchTimeFormatted: string;
}

export interface SuspensionRecord {
  id: string;
  timestamp: number;
  type: SuspensionType; // 'momentary' | 'definitive'
  reason: string;
  description?: string;
  snapshot: SuspensionStateSnapshot;
  durationConfigMinutes?: number; // Temporizador configurable en minutos (ej: 15, 30, 45, etc.)
  timerRemainingSeconds?: number;
  isTimerRunning?: boolean;
  resumedAt?: number;
  isResumed?: boolean;
  audioUrl?: string;
}

export interface IncidentRecord {
  id: string;
  timestamp: number;
  type: 'suspension' | 'ball_change' | 'delay' | 'court' | 'referee_decision' | 'conduct' | 'medical' | 'equipment' | 'other';
  title: string;
  description: string;
  setIndex?: number;
  scoreAtMoment?: string;
  suspensionData?: SuspensionRecord;
}

export type IntervalTimerMode = 'serve' | 'rest_game' | 'rest_set' | 'change_quick' | 'warmup_3m' | 'warmup_1m';

export interface IntervalTimerState {
  mode: IntervalTimerMode;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export type TossChoice = 'serve' | 'receive' | 'side' | 'defer';

export interface TossInfo {
  winnerTeam?: Team;
  choice?: TossChoice;
  firstServingTeam?: Team;
  firstServerPlayerIndex?: 0 | 1;
  firstServerName?: string;
  sidesSwapped?: boolean;
}

export interface MatchState {
  teamAName: string;
  teamBName: string;
  teamAPlayers: [PlayerInfo, PlayerInfo];
  teamBPlayers: [PlayerInfo, PlayerInfo];
  
  // Game & Point status
  currentServer: Team;
  currentServerPlayerIndex: 0 | 1;
  firstServe: boolean; // true = 1st serve, false = 2nd serve
  
  pointsA: PointScore;
  pointsB: PointScore;
  isStarPoint?: boolean; // Star Point active (sudden death on 3rd deuce)
  starPointStage?: number; // 0 = standard, 1 = deuce 1/AD 1, 2 = deuce 2/AD 02, 3 = SP (Star Point)
  
  isTiebreak: boolean;
  isSuperTiebreak?: boolean;
  tiebreakA: number;
  tiebreakB: number;
  sidesSwapped?: boolean; // true = Team B on Left Court, Team A on Right Court
  
  currentSetIndex: number; // 0, 1, 2...
  sets: SetScore[];
  
  matchTimeSeconds: number;
  isTimerRunning: boolean;
  startTime?: number;
  endTime?: number;
  
  pointHistory: PointRecord[];
  warnings: WarningRecord[];
  medicalRecords?: MedicalTimeoutRecord[];
  incidents?: IncidentRecord[];
  suspensions?: SuspensionRecord[];
  activeSuspension?: SuspensionRecord | null;
  
  matchWinner: Team | null;
  settings: MatchSettings;
  
  // Tournament & FIP Report details
  tournamentName?: string;
  tournamentRound?: string;
  tossInfo?: TossInfo;
  refereeName?: string;
  courtName?: string;
  refereeNotes?: string;
}
