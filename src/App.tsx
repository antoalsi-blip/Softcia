/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MatchState, PointType, Team, WarningRecord, PlayerInfo, MatchSettings, IntervalTimerMode, IntervalTimerState, TossChoice, BallChangeSettings, MedicalTimeoutRecord, IncidentRecord, SuspensionRecord, SuspensionType } from './types';
import {
  INITIAL_MATCH_STATE,
  addPoint,
  getScoreAnnouncement,
  toggleCourtSides,
  needsSetServerSelection,
  getServingPlayerIndex,
  getBallChangeStatus,
} from './utils/padelRules';
import {
  playPointSound,
  playGameWonSound,
  playSetWonSound,
  playBallChangeSound,
  playAlarmSound,
  playCountdownBeep,
  playWhistleSound,
  speakScore,
} from './utils/sound';

import { TopAppBar } from './components/TopAppBar';
import { ActionNav } from './components/ActionNav';
import { MatchTimer } from './components/MatchTimer';
import { ScoreBoard } from './components/ScoreBoard';
import { PreviousSets } from './components/PreviousSets';
import { PuntoAPunto } from './components/PuntoAPunto';
import { PointTypeControls } from './components/PointTypeControls';
import { SetServerSelectPanel } from './components/SetServerSelectPanel';
import { BottomNavBar, TabType } from './components/BottomNavBar';

import { PlayersModal } from './components/modals/PlayersModal';
import { ServiceModal } from './components/modals/ServiceModal';
import { MedicalModal } from './components/modals/MedicalModal';
import { WarningsModal } from './components/modals/WarningsModal';
import { IncidentsModal } from './components/modals/IncidentsModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { CourtSwitchModal } from './components/modals/CourtSwitchModal';
import { MatchWonModal } from './components/modals/MatchWonModal';
import { MatchStartModal } from './components/modals/MatchStartModal';
import { ResetConfirmModal } from './components/modals/ResetConfirmModal';

export default function App() {
  // Main Match State
  const [matchState, setMatchState] = useState<MatchState>(() => {
    const saved = localStorage.getItem('padel_match_state_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MATCH_STATE;
      }
    }
    return INITIAL_MATCH_STATE;
  });

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState<MatchState[]>([]);

  // Automatic Service & Rest Interval Countdown Timer
  const [intervalState, setIntervalState] = useState<IntervalTimerState>({
    mode: 'serve',
    totalSeconds: 20,
    remainingSeconds: 20,
    isRunning: false,
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [showIncidentsModal, setShowIncidentsModal] = useState(false);
  const [showCourtSwitchModal, setShowCourtSwitchModal] = useState(false);

  // Match timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (matchState.isTimerRunning && !matchState.matchWinner) {
      timer = setInterval(() => {
        setMatchState((prev) => {
          const sets = [...prev.sets];
          const activeIdx = prev.currentSetIndex;
          if (sets[activeIdx] && !sets[activeIdx].isCompleted) {
            sets[activeIdx] = {
              ...sets[activeIdx],
              durationSeconds: (sets[activeIdx].durationSeconds || 0) + 1,
            };
          }
          return {
            ...prev,
            matchTimeSeconds: prev.matchTimeSeconds + 1,
            sets,
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchState.isTimerRunning, matchState.matchWinner]);

  // Interval countdown ticker (Service / Rest / Warmup)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (intervalState.isRunning && intervalState.remainingSeconds > 0) {
      timer = setInterval(() => {
        setIntervalState((prev) => {
          // Warning beeps in final 3 seconds
          if (prev.remainingSeconds <= 4 && prev.remainingSeconds > 1 && matchState.settings.soundEnabled) {
            playCountdownBeep(false);
          }

          if (prev.remainingSeconds <= 1) {
            // Check mode for sequential progression
            if (prev.mode === 'warmup_3m') {
              // 3-Minute Warm-up finished -> Automatically advance to 1-Minute Pre-Match phase
              if (matchState.settings.soundEnabled) {
                playAlarmSound();
              }
              if (matchState.settings.voiceCallout) {
                speakScore('Fin del peloteo. Un minuto para el inicio del partido');
              }
              return {
                mode: 'warmup_1m',
                totalSeconds: 60,
                remainingSeconds: 60,
                isRunning: true,
              };
            } else if (prev.mode === 'warmup_1m') {
              // 1-Minute Pre-Match finished -> Match begins!
              if (matchState.settings.soundEnabled) {
                playWhistleSound();
              }
              if (matchState.settings.voiceCallout) {
                speakScore('Tiempo cumplido. Comienza el partido');
              }
              // Start match elapsed timer
              setMatchState((m) => ({ ...m, isTimerRunning: true }));
              return {
                mode: 'serve',
                totalSeconds: 20,
                remainingSeconds: 20,
                isRunning: true,
              };
            } else {
              // Regular rest or serve interval expired
              if (matchState.settings.soundEnabled) {
                playAlarmSound();
              }
              return {
                ...prev,
                remainingSeconds: 0,
                isRunning: false,
              };
            }
          }

          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [intervalState.isRunning, intervalState.remainingSeconds, matchState.settings.soundEnabled, matchState.settings.voiceCallout]);

  // Active Suspension Countdown Ticker
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (
      matchState.activeSuspension &&
      matchState.activeSuspension.isTimerRunning &&
      (matchState.activeSuspension.timerRemainingSeconds ?? 0) > 0
    ) {
      timer = setInterval(() => {
        setMatchState((prev) => {
          if (!prev.activeSuspension || !prev.activeSuspension.isTimerRunning) return prev;
          const currentRem = prev.activeSuspension.timerRemainingSeconds ?? 0;
          if (currentRem <= 1) {
            if (prev.settings.soundEnabled) {
              playAlarmSound();
            }
            if (prev.settings.voiceCallout) {
              speakScore('Tiempo de suspensión finalizado');
            }
            const updatedActive: SuspensionRecord = {
              ...prev.activeSuspension,
              timerRemainingSeconds: 0,
              isTimerRunning: false,
            };
            return {
              ...prev,
              activeSuspension: updatedActive,
              suspensions: (prev.suspensions || []).map((s) =>
                s.id === updatedActive.id ? updatedActive : s
              ),
            };
          }
          const updatedActive: SuspensionRecord = {
            ...prev.activeSuspension,
            timerRemainingSeconds: currentRem - 1,
          };
          return {
            ...prev,
            activeSuspension: updatedActive,
            suspensions: (prev.suspensions || []).map((s) =>
              s.id === updatedActive.id ? updatedActive : s
            ),
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchState.activeSuspension?.isTimerRunning, matchState.activeSuspension?.timerRemainingSeconds]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('padel_match_state_v1', JSON.stringify(matchState));
    } catch {
      // Ignore
    }
  }, [matchState]);

  // Point scoring handler
  const handleScorePoint = (winner: Team, pointType: PointType = 'normal') => {
    if (matchState.matchWinner) return;

    // Push current state to undo stack
    setHistoryStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(matchState))]);

    // Apply rules
    const { newState, event, courtSwitch } = addPoint(matchState, winner, pointType);
    setMatchState(newState);

    // Automatic Shot Clock / Service & Rest Countdown Timer Update
    if (event === 'match') {
      setIntervalState({
        mode: 'rest_set',
        totalSeconds: 0,
        remainingSeconds: 0,
        isRunning: false,
      });
    } else if (event === 'set') {
      // 120 seconds rest between sets
      setIntervalState({
        mode: 'rest_set',
        totalSeconds: 120,
        remainingSeconds: 120,
        isRunning: true,
      });
    } else if (event === 'game') {
      const currentSet = newState.sets[newState.currentSetIndex];
      const totalGamesInSet = (currentSet?.teamA || 0) + (currentSet?.teamB || 0);
      if (totalGamesInSet === 1) {
        // 1-0: Quick changeover without sitting (20s)
        setIntervalState({
          mode: 'change_quick',
          totalSeconds: 20,
          remainingSeconds: 20,
          isRunning: true,
        });
      } else if (courtSwitch) {
        // 90 seconds changeover rest
        setIntervalState({
          mode: 'rest_game',
          totalSeconds: 90,
          remainingSeconds: 90,
          isRunning: true,
        });
      } else {
        // Even game (e.g. 1-1, 2-2): 20 seconds for next serve
        setIntervalState({
          mode: 'serve',
          totalSeconds: 20,
          remainingSeconds: 20,
          isRunning: true,
        });
      }
    } else {
      // Standard point in game or tiebreak
      if (
        newState.isTiebreak &&
        (newState.tiebreakA + newState.tiebreakB) % 6 === 0 &&
        newState.tiebreakA + newState.tiebreakB > 0
      ) {
        // Tiebreak change of ends every 6 points: 20s
        setIntervalState({
          mode: 'change_quick',
          totalSeconds: 20,
          remainingSeconds: 20,
          isRunning: true,
        });
      } else {
        // Standard serve interval: 20s
        setIntervalState({
          mode: 'serve',
          totalSeconds: 20,
          remainingSeconds: 20,
          isRunning: true,
        });
      }
    }

    // Ball Change check
    const prevBallStatus = getBallChangeStatus(matchState);
    const newBallStatus = getBallChangeStatus(newState);
    const isBallChangeTriggered =
      newBallStatus.enabled &&
      newBallStatus.isChangeDueNow &&
      !prevBallStatus.isChangeDueNow &&
      !newState.matchWinner;

    // Audio & voice effects
    if (newState.settings.soundEnabled) {
      if (isBallChangeTriggered) {
        playBallChangeSound();
      } else if (event === 'match' || event === 'set') {
        playSetWonSound();
      } else if (event === 'game') {
        playGameWonSound();
      } else {
        playPointSound();
      }
    }

    if (newState.settings.voiceCallout) {
      if (event === 'match') {
        speakScore(`Partido para ${winner === 'teamA' ? newState.teamAName : newState.teamBName}`);
      } else if (event === 'set') {
        speakScore(
          isBallChangeTriggered
            ? `Set para ${winner === 'teamA' ? newState.teamAName : newState.teamBName}. ¡Cambio de bolas!`
            : `Set para ${winner === 'teamA' ? newState.teamAName : newState.teamBName}`
        );
      } else if (event === 'game') {
        speakScore(
          isBallChangeTriggered
            ? `Juego ${winner === 'teamA' ? newState.teamAName : newState.teamBName}. ¡Cambio de bolas!`
            : `Juego ${winner === 'teamA' ? newState.teamAName : newState.teamBName}`
        );
      } else {
        const announcement = getScoreAnnouncement(
          newState.isTiebreak ? String(newState.tiebreakA) : newState.pointsA,
          newState.isTiebreak ? String(newState.tiebreakB) : newState.pointsB,
          newState.teamAName,
          newState.teamBName,
          newState.isTiebreak,
          newState.settings.scoringMode,
          newState.isStarPoint,
          newState.isSuperTiebreak,
          newState.starPointStage
        );
        speakScore(announcement);
      }
    }

    // Court change notification
    if (courtSwitch && newState.settings.courtChangeReminder && !newState.matchWinner) {
      setShowCourtSwitchModal(true);
    }
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setMatchState(previousState);
  };

  // Reset Handlers
  const handleResetMatch = () => {
    const freshState: MatchState = {
      ...INITIAL_MATCH_STATE,
      teamAName: matchState.teamAName,
      teamBName: matchState.teamBName,
      teamAPlayers: matchState.teamAPlayers,
      teamBPlayers: matchState.teamBPlayers,
      settings: matchState.settings,
      matchTimeSeconds: 0,
      isTimerRunning: false,
      pointHistory: [],
      warnings: [],
      matchWinner: null,
      sets: [
        {
          setNumber: 1,
          teamA: 0,
          teamB: 0,
          isCompleted: false,
          firstServerTeam: 'teamA',
          firstServerA: 0,
        },
      ],
      currentSetIndex: 0,
      pointsA: '0',
      pointsB: '0',
      isStarPoint: false,
      isTiebreak: false,
      isSuperTiebreak: false,
      tiebreakA: 0,
      tiebreakB: 0,
      sidesSwapped: false,
      firstServe: true,
      currentServer: 'teamA',
      currentServerPlayerIndex: 0,
    };
    try {
      localStorage.setItem('padel_match_state_v1', JSON.stringify(freshState));
    } catch {
      // Ignore
    }
    setHistoryStack([]);
    setMatchState(freshState);
    setIntervalState({
      mode: 'serve',
      totalSeconds: 20,
      remainingSeconds: 20,
      isRunning: false,
    });
  };

  const handleResetCurrentGame = () => {
    setMatchState((prev) => {
      const next: MatchState = {
        ...prev,
        pointsA: '0',
        pointsB: '0',
        isStarPoint: false,
        isTiebreak: false,
        tiebreakA: 0,
        tiebreakB: 0,
        firstServe: true,
      };
      try {
        localStorage.setItem('padel_match_state_v1', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
    setIntervalState({
      mode: 'serve',
      totalSeconds: 20,
      remainingSeconds: 20,
      isRunning: false,
    });
  };

  // Toggle Timer
  const handleToggleTimer = () => {
    setMatchState((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  };

  // Interval Controls
  const handleToggleIntervalPlay = () => {
    setIntervalState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));
  };

  const handleResetInterval = () => {
    setIntervalState((prev) => ({
      ...prev,
      remainingSeconds: prev.totalSeconds,
      isRunning: true,
    }));
  };

  const handleSetIntervalMode = (mode: IntervalTimerMode, totalSec: number) => {
    setIntervalState({
      mode,
      totalSeconds: totalSec,
      remainingSeconds: totalSec,
      isRunning: true,
    });
  };

  // Start & Toss Configuration Handler
  const handleApplyStartConfig = (params: {
    tournamentName?: string;
    tournamentRound?: string;
    tossWinner: Team;
    tossChoice: TossChoice;
    firstServerTeam: Team;
    firstServerPlayerIndex: 0 | 1;
    sidesSwapped: boolean;
    startMatchTimer: boolean;
    ballChange?: BallChangeSettings;
    initialWarmupPhase?: '3m' | '1m';
    initialWarmupRemainingSeconds?: number;
  }) => {
    setMatchState((prev) => {
      const sets = [...prev.sets];
      if (sets[0]) {
        sets[0] = {
          ...sets[0],
          firstServerTeam: params.firstServerTeam,
          firstServerA: params.firstServerTeam === 'teamA' ? params.firstServerPlayerIndex : undefined,
          firstServerB: params.firstServerTeam === 'teamB' ? params.firstServerPlayerIndex : undefined,
        };
      }

      const servingPlayers = params.firstServerTeam === 'teamA' ? prev.teamAPlayers : prev.teamBPlayers;
      const firstServerName = servingPlayers[params.firstServerPlayerIndex]?.name;

      return {
        ...prev,
        tournamentName: params.tournamentName !== undefined ? params.tournamentName : prev.tournamentName,
        tournamentRound: params.tournamentRound !== undefined ? params.tournamentRound : prev.tournamentRound,
        settings: params.ballChange
          ? { ...prev.settings, ballChange: params.ballChange }
          : prev.settings,
        currentServer: params.firstServerTeam,
        currentServerPlayerIndex: params.firstServerPlayerIndex,
        sidesSwapped: params.sidesSwapped,
        firstServe: true,
        sets,
        tossInfo: {
          winnerTeam: params.tossWinner,
          choice: params.tossChoice,
          firstServingTeam: params.firstServerTeam,
          firstServerPlayerIndex: params.firstServerPlayerIndex,
          firstServerName,
          sidesSwapped: params.sidesSwapped,
        },
        startTime: prev.startTime || Date.now(),
        // If user selected to start match elapsed timer right away or keep previous
        isTimerRunning: params.startMatchTimer ? true : prev.isTimerRunning,
      };
    });

    // Start sequential warmup countdown on main screen (Phase 1: 3m Peloteo -> Phase 2: 1m Pre-Match -> Serve & Match)
    const is1mPhase = params.initialWarmupPhase === '1m';
    const totalSec = is1mPhase ? 60 : 180;
    const remainingSec = params.initialWarmupRemainingSeconds !== undefined ? params.initialWarmupRemainingSeconds : totalSec;

    setIntervalState({
      mode: is1mPhase ? 'warmup_1m' : 'warmup_3m',
      totalSeconds: totalSec,
      remainingSeconds: remainingSec,
      isRunning: true,
    });

    if (matchState.settings.voiceCallout) {
      if (is1mPhase) {
        speakScore('Inicio de un minuto previo al partido');
      } else {
        speakScore('Inicio del peloteo de calentamiento. Tres minutos');
      }
    }
  };

  // Save Players & Match Details
  const handleSavePlayers = (
    teamAName: string,
    teamBName: string,
    teamAPlayers: [PlayerInfo, PlayerInfo],
    teamBPlayers: [PlayerInfo, PlayerInfo],
    tournamentName?: string,
    tournamentRound?: string
  ) => {
    setMatchState((prev) => ({
      ...prev,
      teamAName,
      teamBName,
      teamAPlayers,
      teamBPlayers,
      tournamentName: tournamentName !== undefined ? tournamentName : prev.tournamentName,
      tournamentRound: tournamentRound !== undefined ? tournamentRound : prev.tournamentRound,
    }));
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<MatchSettings>) => {
    setMatchState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  // Set-level Server Selection Handler (Game 1 & Game 2 per set order establish)
  const handleSelectSetServer = (team: Team, playerIndex: 0 | 1) => {
    setMatchState((prev) => {
      const sets = [...prev.sets];
      const currentSet = sets[prev.currentSetIndex];
      if (currentSet) {
        sets[prev.currentSetIndex] = {
          ...currentSet,
          firstServerA: team === 'teamA' ? playerIndex : currentSet.firstServerA,
          firstServerB: team === 'teamB' ? playerIndex : currentSet.firstServerB,
        };
      }
      return {
        ...prev,
        currentServer: team,
        currentServerPlayerIndex: playerIndex,
        firstServe: true,
        sets,
      };
    });

    if (matchState.settings.soundEnabled) {
      playWhistleSound();
    }

    if (matchState.settings.voiceCallout) {
      const player = team === 'teamA' ? matchState.teamAPlayers[playerIndex] : matchState.teamBPlayers[playerIndex];
      speakScore(`${player?.name || 'Servidor'} al servicio`);
    }
  };

  // Adjust Set First Server from Service modal
  const handleSetSetFirstServer = (team: Team, playerIndex: 0 | 1) => {
    setMatchState((prev) => {
      const sets = [...prev.sets];
      const currentSet = sets[prev.currentSetIndex];
      if (currentSet) {
        sets[prev.currentSetIndex] = {
          ...currentSet,
          firstServerA: team === 'teamA' ? playerIndex : currentSet.firstServerA,
          firstServerB: team === 'teamB' ? playerIndex : currentSet.firstServerB,
        };
      }
      const nextState: MatchState = { ...prev, sets };
      if (prev.currentServer === team) {
        nextState.currentServerPlayerIndex = getServingPlayerIndex(nextState, team, prev.currentSetIndex);
      }
      return nextState;
    });
  };

  // Service Management Handlers
  const handleSetServer = (team: Team, playerIndex: 0 | 1) => {
    setMatchState((prev) => ({
      ...prev,
      currentServer: team,
      currentServerPlayerIndex: playerIndex,
      firstServe: true,
    }));
  };

  const handleToggleFirstServe = (isFirst: boolean) => {
    setMatchState((prev) => ({
      ...prev,
      firstServe: isFirst,
    }));
  };

  const handleRecordAce = (team: Team) => {
    handleScorePoint(team, 'ace');
  };

  const handleRecordFault = () => {
    setMatchState((prev) => ({
      ...prev,
      firstServe: false,
    }));
  };

  const handleRecordLet = () => {
    // Reset service interval countdown (20s standard serve clock)
    setIntervalState({
      mode: 'serve',
      secondsLeft: 20,
      isRunning: true,
      initialDuration: 20,
    });
    if (matchState.settings.voiceScore) {
      speakScore('Let');
    }
  };

  const handleToggleSecondServe = () => {
    const nextIsFirst = !matchState.firstServe;
    setMatchState((prev) => ({
      ...prev,
      firstServe: nextIsFirst,
    }));
    // Reset service interval countdown (20s standard serve clock)
    setIntervalState({
      mode: 'serve',
      secondsLeft: 20,
      isRunning: true,
      initialDuration: 20,
    });
    if (matchState.settings.voiceScore) {
      speakScore(nextIsFirst ? 'Primer servicio' : 'Segundo servicio');
    }
  };

  const handleRecordDoubleFault = (servingTeam: Team) => {
    const receivingTeam: Team = servingTeam === 'teamA' ? 'teamB' : 'teamA';
    handleScorePoint(receivingTeam, 'double_fault');
  };

  // Court Side Manual Toggle
  const handleToggleSides = () => {
    setMatchState((prev) => toggleCourtSides(prev));
  };

  // Warnings Handlers
  const handleAddWarning = (warningData: Omit<WarningRecord, 'id' | 'timestamp'>) => {
    const newWarning: WarningRecord = {
      ...warningData,
      id: 'w_' + Date.now(),
      timestamp: Date.now(),
    };

    setMatchState((prev) => ({
      ...prev,
      warnings: [...prev.warnings, newWarning],
    }));

    // If point penalty or game penalty, apply according to rule
    if (warningData.level === 'point_penalty') {
      const opposingTeam: Team = warningData.team === 'teamA' ? 'teamB' : 'teamA';
      handleScorePoint(opposingTeam, 'penalty');
    }
  };

  const handleRemoveWarning = (id: string) => {
    setMatchState((prev) => ({
      ...prev,
      warnings: prev.warnings.filter((w) => w.id !== id),
    }));
  };

  // Medical Timeouts Handler
  const handleRecordMedicalTimeout = (medicalData: Omit<MedicalTimeoutRecord, 'id' | 'timestamp'>) => {
    const newRecord: MedicalTimeoutRecord = {
      ...medicalData,
      id: 'mto_' + Date.now(),
      timestamp: Date.now(),
    };
    setMatchState((prev) => ({
      ...prev,
      medicalRecords: [...(prev.medicalRecords || []), newRecord],
    }));
  };

  // Incidents & Suspensions Handlers
  const handleAddIncident = (incidentData: Omit<IncidentRecord, 'id' | 'timestamp'>) => {
    const newIncident: IncidentRecord = {
      ...incidentData,
      id: 'inc_' + Date.now(),
      timestamp: Date.now(),
    };
    setMatchState((prev) => ({
      ...prev,
      incidents: [...(prev.incidents || []), newIncident],
    }));
  };

  const handleRemoveIncident = (id: string) => {
    setMatchState((prev) => ({
      ...prev,
      incidents: (prev.incidents || []).filter((inc) => inc.id !== id),
    }));
  };

  const handleApplySuspension = (suspensionData: Omit<SuspensionRecord, 'id' | 'timestamp'>) => {
    const newSuspension: SuspensionRecord = {
      ...suspensionData,
      id: 'susp_' + Date.now(),
      timestamp: Date.now(),
      isResumed: false,
    };

    setMatchState((prev) => {
      const suspensions = [...(prev.suspensions || []), newSuspension];
      const activeSuspension = suspensionData.type === 'momentary' ? newSuspension : null;
      return {
        ...prev,
        isTimerRunning: false, // pause match timer during suspension
        activeSuspension,
        suspensions,
      };
    });

    if (matchState.settings.soundEnabled) {
      playWhistleSound();
    }

    if (matchState.settings.voiceCallout) {
      speakScore(
        suspensionData.type === 'momentary'
          ? 'Partido suspendido momentáneamente'
          : 'Partido suspendido definitivamente'
      );
    }
  };

  const handleUpdateActiveSuspensionTimer = (remainingSeconds: number, isRunning: boolean) => {
    setMatchState((prev) => {
      if (!prev.activeSuspension) return prev;
      const updatedActive: SuspensionRecord = {
        ...prev.activeSuspension,
        timerRemainingSeconds: remainingSeconds,
        isTimerRunning: isRunning,
      };
      const updatedSuspensions = (prev.suspensions || []).map((s) =>
        s.id === updatedActive.id ? updatedActive : s
      );
      return {
        ...prev,
        activeSuspension: updatedActive,
        suspensions: updatedSuspensions,
      };
    });
  };

  const handleResumeMatchFromSuspension = () => {
    setMatchState((prev) => {
      if (!prev.activeSuspension) return prev;
      const resumedId = prev.activeSuspension.id;
      const updatedSuspensions = (prev.suspensions || []).map((s) =>
        s.id === resumedId
          ? { ...s, isResumed: true, resumedAt: Date.now(), isTimerRunning: false }
          : s
      );
      return {
        ...prev,
        activeSuspension: null,
        suspensions: updatedSuspensions,
        isTimerRunning: true, // Resume match timer
      };
    });

    if (matchState.settings.soundEnabled) {
      playWhistleSound();
    }

    if (matchState.settings.voiceCallout) {
      speakScore('Partido reanudado');
    }
  };

  const handleDeclareDefinitiveSuspension = () => {
    setMatchState((prev) => {
      if (!prev.activeSuspension) return prev;
      const targetId = prev.activeSuspension.id;
      const updatedSuspensions = (prev.suspensions || []).map((s) =>
        s.id === targetId
          ? { ...s, type: 'definitive' as SuspensionType, isResumed: false, isTimerRunning: false }
          : s
      );
      return {
        ...prev,
        activeSuspension: null,
        suspensions: updatedSuspensions,
        isTimerRunning: false,
      };
    });
  };

  // Update Match Report Details (referee, court, notes, tournament info)
  const handleUpdateMatchReportDetails = (details: {
    refereeName?: string;
    courtName?: string;
    refereeNotes?: string;
    tournamentName?: string;
    tournamentRound?: string;
  }) => {
    setMatchState((prev) => ({
      ...prev,
      refereeName: details.refereeName !== undefined ? details.refereeName : prev.refereeName,
      courtName: details.courtName !== undefined ? details.courtName : prev.courtName,
      refereeNotes: details.refereeNotes !== undefined ? details.refereeNotes : prev.refereeNotes,
      tournamentName: details.tournamentName !== undefined ? details.tournamentName : prev.tournamentName,
      tournamentRound: details.tournamentRound !== undefined ? details.tournamentRound : prev.tournamentRound,
    }));
  };

  return (
    <div className="bg-[#111317] text-[#e2e2e8] h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-between select-none overflow-hidden">
      {/* App container with responsive tablet & mobile boundaries */}
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-full flex flex-col justify-between bg-[#111317] relative shadow-2xl overflow-hidden">
        {/* Top Header */}
        <TopAppBar
          onOpenMatchInfo={() => setShowPlayersModal(true)}
          onOpenIncidents={() => setShowIncidentsModal(true)}
          tournamentName={matchState.tournamentName}
          tournamentRound={matchState.tournamentRound}
          isLive={matchState.isTimerRunning && !matchState.matchWinner}
          isNavHidden={isNavHidden}
          onToggleNavHidden={() => setIsNavHidden((prev) => !prev)}
          activeSuspension={matchState.activeSuspension}
          incidentsCount={(matchState.incidents?.length || 0) + (matchState.suspensions?.length || 0)}
        />

        {/* Secondary Action Nav (Inicio, Jugadores, Servicio, Médico, Advertencias, Incidencias) */}
        <ActionNav
          state={matchState}
          onOpenStart={() => setShowStartModal(true)}
          onOpenPlayers={() => setShowPlayersModal(true)}
          onOpenService={() => setShowServiceModal(true)}
          onOpenMedical={() => setShowMedicalModal(true)}
          onOpenWarnings={() => setShowWarningsModal(true)}
          onOpenIncidents={() => setShowIncidentsModal(true)}
          activeSuspension={matchState.activeSuspension}
        />

        {/* Main Content Area: Single-column on mobile, dual-column on tablet/desktop */}
        {(() => {
          const serverSelection = needsSetServerSelection(matchState);
          const isServerSelectionPending =
            serverSelection.needed &&
            !showStartModal &&
            !showResetModal &&
            !matchState.matchWinner;

          return (
            <main className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-3 lg:gap-4 p-1.5 sm:p-2.5 md:p-4 overflow-y-auto gap-1.5 sm:gap-2">
              {/* Active Suspension Alert Banner across all columns */}
              {matchState.activeSuspension && (
                <div className="md:col-span-12 bg-amber-950/80 border-2 border-amber-500/80 rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black shrink-0 animate-pulse">
                      ⏸️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] sm:text-xs font-black uppercase text-amber-400 tracking-wider">
                          Partido Suspendido Momentáneamente
                        </span>
                        {matchState.activeSuspension.timerRemainingSeconds !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                            ⏱️ {Math.floor((matchState.activeSuspension.timerRemainingSeconds || 0) / 60)}:
                            {String((matchState.activeSuspension.timerRemainingSeconds || 0) % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-amber-200/90 truncate font-medium">
                        Motivo: <span className="text-white font-semibold">{matchState.activeSuspension.reason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setShowIncidentsModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-amber-500/50 text-amber-300 text-[10px] sm:text-xs font-bold transition-all active:scale-95 flex-1 sm:flex-none text-center"
                    >
                      Gestionar Acta / Ajustes
                    </button>
                    <button
                      onClick={handleResumeMatchFromSuspension}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] sm:text-xs font-black transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-1 sm:flex-none text-center"
                    >
                      ▶ Reanudar Partido
                    </button>
                  </div>
                </div>
              )}

              {/* Left Column on Tablet / First Section on Mobile: Match Court & Controls */}
              <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-7">
                {/* Match Time & Interval (Service / Rest) Timer Controls */}
                <MatchTimer
                  seconds={matchState.matchTimeSeconds}
                  isRunning={matchState.isTimerRunning}
                  onTogglePlay={handleToggleTimer}
                  onResetTimer={() =>
                    setMatchState((prev) => ({ ...prev, matchTimeSeconds: 0 }))
                  }
                  intervalState={intervalState}
                  onToggleIntervalPlay={handleToggleIntervalPlay}
                  onResetInterval={handleResetInterval}
                  onSetIntervalMode={handleSetIntervalMode}
                />

                {/* Primary ScoreBoard (Team A vs Team B cards) */}
                <ScoreBoard state={matchState} onScorePoint={handleScorePoint} />

                {/* Mobile Only: Tipo de Punto / Elección de Servidor -> Sets del Partido -> Punto a Punto */}
                <div className="flex flex-col gap-1.5 sm:gap-2 md:hidden">
                  {isServerSelectionPending ? (
                    <SetServerSelectPanel
                      state={matchState}
                      servingTeam={serverSelection.team}
                      setNumber={serverSelection.setNumber}
                      isFirstGameOfSet={serverSelection.isFirstGameOfSet}
                      isSecondGameOfSet={serverSelection.isSecondGameOfSet}
                      onSelectServer={handleSelectSetServer}
                    />
                  ) : (
                    <PointTypeControls
                      state={matchState}
                      onAddPoint={handleScorePoint}
                      onToggleSides={handleToggleSides}
                      onRecordLet={handleRecordLet}
                      onToggleSecondServe={handleToggleSecondServe}
                      disabled={Boolean(matchState.matchWinner)}
                    />
                  )}

                  <PreviousSets
                    sets={matchState.sets}
                    currentSetIndex={matchState.currentSetIndex}
                    settings={matchState.settings}
                    matchWinner={matchState.matchWinner}
                    pointHistory={matchState.pointHistory}
                  />

                  <PuntoAPunto
                    pointHistory={matchState.pointHistory}
                    teamAName={matchState.teamAName}
                    teamBName={matchState.teamBName}
                    pointsA={matchState.pointsA}
                    pointsB={matchState.pointsB}
                    isTiebreak={matchState.isTiebreak}
                    currentSetIndex={matchState.currentSetIndex}
                    currentSetGamesCount={
                      (matchState.sets[matchState.currentSetIndex]?.teamA || 0) +
                      (matchState.sets[matchState.currentSetIndex]?.teamB || 0)
                    }
                  />
                </div>
              </div>

              {/* Right Column on Tablet: Tipo de Punto / Elección de Servidor -> Sets del Partido & Punto a Punto */}
              <div className="hidden md:flex md:col-span-5 md:flex-col md:gap-3">
                {isServerSelectionPending ? (
                  <SetServerSelectPanel
                    state={matchState}
                    servingTeam={serverSelection.team}
                    setNumber={serverSelection.setNumber}
                    isFirstGameOfSet={serverSelection.isFirstGameOfSet}
                    isSecondGameOfSet={serverSelection.isSecondGameOfSet}
                    onSelectServer={handleSelectSetServer}
                  />
                ) : (
                  <PointTypeControls
                    state={matchState}
                    onAddPoint={handleScorePoint}
                    onToggleSides={handleToggleSides}
                    onRecordLet={handleRecordLet}
                    onToggleSecondServe={handleToggleSecondServe}
                    disabled={Boolean(matchState.matchWinner)}
                  />
                )}

                <PreviousSets
                  sets={matchState.sets}
                  currentSetIndex={matchState.currentSetIndex}
                  settings={matchState.settings}
                  matchWinner={matchState.matchWinner}
                  pointHistory={matchState.pointHistory}
                />

                <PuntoAPunto
                  pointHistory={matchState.pointHistory}
                  teamAName={matchState.teamAName}
                  teamBName={matchState.teamBName}
                  pointsA={matchState.pointsA}
                  pointsB={matchState.pointsB}
                  isTiebreak={matchState.isTiebreak}
                  currentSetIndex={matchState.currentSetIndex}
                  currentSetGamesCount={
                    (matchState.sets[matchState.currentSetIndex]?.teamA || 0) +
                    (matchState.sets[matchState.currentSetIndex]?.teamB || 0)
                  }
                />
              </div>
            </main>
          );
        })()}

        {/* Bottom Navigation Bar (Undo, Reset, History, Settings) */}
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUndo={handleUndo}
          onReset={() => setShowResetModal(true)}
          canUndo={historyStack.length > 0}
          isNavHidden={isNavHidden}
          onToggleNavHidden={() => setIsNavHidden((prev) => !prev)}
        />

        {/* Modals & Overlays */}
        {showResetModal && (
          <ResetConfirmModal
            onClose={() => setShowResetModal(false)}
            onResetFullMatch={handleResetMatch}
            onResetCurrentGame={handleResetCurrentGame}
          />
        )}

        {showStartModal && (
          <MatchStartModal
            state={matchState}
            onClose={() => setShowStartModal(false)}
            onApplyStartConfig={handleApplyStartConfig}
            onSyncWarmupTimerToMain={(mode, sec) => handleSetIntervalMode(mode, sec)}
          />
        )}

        {showPlayersModal && (
          <PlayersModal
            state={matchState}
            onClose={() => setShowPlayersModal(false)}
            onSavePlayers={handleSavePlayers}
          />
        )}

        {showServiceModal && (
          <ServiceModal
            state={matchState}
            onClose={() => setShowServiceModal(false)}
            onSetServer={handleSetServer}
            onSetSetFirstServer={handleSetSetFirstServer}
            onToggleFirstServe={handleToggleFirstServe}
            onRecordAce={handleRecordAce}
            onRecordFault={handleRecordFault}
            onRecordDoubleFault={handleRecordDoubleFault}
            onRecordLet={handleRecordLet}
          />
        )}

        {showMedicalModal && (
          <MedicalModal
            state={matchState}
            onClose={() => setShowMedicalModal(false)}
            onRecordMedicalTimeout={handleRecordMedicalTimeout}
          />
        )}

        {showWarningsModal && (
          <WarningsModal
            state={matchState}
            onClose={() => setShowWarningsModal(false)}
            onAddWarning={handleAddWarning}
            onRemoveWarning={handleRemoveWarning}
          />
        )}

        {showIncidentsModal && (
          <IncidentsModal
            state={matchState}
            onClose={() => setShowIncidentsModal(false)}
            onApplySuspension={handleApplySuspension}
            onUpdateActiveSuspensionTimer={handleUpdateActiveSuspensionTimer}
            onResumeMatchFromSuspension={handleResumeMatchFromSuspension}
            onDeclareDefinitiveSuspension={handleDeclareDefinitiveSuspension}
            onAddIncident={handleAddIncident}
            onRemoveIncident={handleRemoveIncident}
          />
        )}

        {activeTab === 'history' && (
          <HistoryModal
            state={matchState}
            onClose={() => setActiveTab('live')}
            onUpdateMatchReportDetails={handleUpdateMatchReportDetails}
            onAddIncident={handleAddIncident}
            onRecordMedicalTimeout={handleRecordMedicalTimeout}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            state={matchState}
            onClose={() => setActiveTab('live')}
            onUpdateSettings={handleUpdateSettings}
            onResetMatch={handleResetMatch}
          />
        )}

        {showCourtSwitchModal && (
          <CourtSwitchModal
            state={matchState}
            gameNumber={matchState.sets.reduce((acc, s) => acc + s.teamA + s.teamB, 0)}
            onClose={() => setShowCourtSwitchModal(false)}
          />
        )}

        {matchState.matchWinner && (
          <MatchWonModal
            winner={matchState.matchWinner}
            state={matchState}
            onNewMatch={handleResetMatch}
            onOpenStats={() => setActiveTab('history')}
          />
        )}
      </div>
    </div>
  );
}
