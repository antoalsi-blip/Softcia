import { MatchState, PointRecord, PointScore, PointType, SetScore, Team } from '../types';

export const INITIAL_SET: SetScore = {
  setNumber: 1,
  teamA: 0,
  teamB: 0,
  isCompleted: false,
  firstServerTeam: 'teamA',
  firstServerA: 0,
};

export const INITIAL_MATCH_STATE: MatchState = {
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAPlayers: [
    { name: 'Jugador A1', hand: 'right', position: 'drive' },
    { name: 'Jugador A2', hand: 'right', position: 'reves' },
  ],
  teamBPlayers: [
    { name: 'Jugador B1', hand: 'right', position: 'drive' },
    { name: 'Jugador B2', hand: 'right', position: 'reves' },
  ],
  currentServer: 'teamA',
  currentServerPlayerIndex: 0,
  firstServe: true,
  pointsA: '0',
  pointsB: '0',
  isStarPoint: false,
  starPointStage: 0,
  isTiebreak: false,
  isSuperTiebreak: false,
  tiebreakA: 0,
  tiebreakB: 0,
  sidesSwapped: false,
  currentSetIndex: 0,
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
  matchTimeSeconds: 0,
  isTimerRunning: true,
  startTime: Date.now(),
  endTime: undefined,
  pointHistory: [],
  warnings: [],
  medicalRecords: [],
  incidents: [],
  matchWinner: null,
  tournamentName: '',
  tournamentRound: '',
  courtName: 'Pista Central',
  refereeName: '',
  refereeNotes: '',
  tossInfo: {
    winnerTeam: 'teamA',
    choice: 'serve',
    firstServingTeam: 'teamA',
    firstServerPlayerIndex: 0,
  },
  settings: {
    scoringMode: 'golden_point', // Default to official Padel Golden Point (Punto de Oro)
    matchFormat: 'best_of_3', // 'best_of_3' | 'two_sets_super_tie' | 'best_of_5' | 'best_of_1'
    bestOfSets: 3,
    tiebreakPoints: 7,
    tiebreakAtGames: 6,
    soundEnabled: true,
    voiceCallout: true,
    courtChangeReminder: true,
    ballChange: {
      enabled: true,
      pattern: '7_9', // Official FIP / Premier Padel standard (7 first, then every 9 games)
      firstChangeGames: 7,
      subsequentChangeGames: 9,
    },
  },
};

/**
 * Returns the text representation of standard padel points for speech
 */
export function getScoreAnnouncement(
  pointsA: string,
  pointsB: string,
  teamAName: string,
  teamBName: string,
  isTiebreak: boolean,
  scoringMode: 'golden_point' | 'star_point' | 'advantage',
  isStarPoint?: boolean,
  isSuperTiebreak?: boolean,
  starPointStage?: number
): string {
  if (isSuperTiebreak) {
    return `Super Tie-break: ${pointsA} a ${pointsB}`;
  }
  if (isTiebreak) {
    return `${pointsA} a ${pointsB}`;
  }
  if (scoringMode === 'star_point') {
    if (pointsA === 'deuce 1' && pointsB === 'deuce 1') return 'Deuce 1';
    if (pointsA === 'deuce 2' && pointsB === 'deuce 2') return 'Deuce 2';
    if (pointsA === 'SP' && pointsB === 'SP' || isStarPoint) return 'Star Point, Punto Estrella';
    if (pointsA === 'AD 1') return `Ventaja 1 ${teamAName}`;
    if (pointsB === 'AD 1') return `Ventaja 1 ${teamBName}`;
    if (pointsA === 'AD 02' || pointsA === 'AD 2') return `Ventaja 2 ${teamAName}`;
    if (pointsB === 'AD 02' || pointsB === 'AD 2') return `Ventaja 2 ${teamBName}`;
  }
  if (
    (pointsA === '40' && pointsB === '40') ||
    (pointsA === 'deuce 1' && pointsB === 'deuce 1') ||
    (pointsA === 'deuce 2' && pointsB === 'deuce 2') ||
    (pointsA === 'SP' && pointsB === 'SP')
  ) {
    if (scoringMode === 'golden_point') return 'Punto de Oro';
    if (scoringMode === 'star_point') {
      if (isStarPoint || pointsA === 'SP') return 'Star Point, Punto Estrella';
      if (starPointStage === 2 || pointsA === 'deuce 2') return 'Deuce 2';
      return 'Deuce 1';
    }
    return 'Iguales';
  }
  if (pointsA === 'AD') return `Ventaja ${teamAName}`;
  if (pointsB === 'AD') return `Ventaja ${teamBName}`;
  
  const map: Record<string, string> = { '0': 'Cero', '15': 'Quince', '30': 'Treinta', '40': 'Cuarenta' };
  return `${map[pointsA] || pointsA} - ${map[pointsB] || pointsB}`;
}

/**
 * Check if court switch is needed
 */
export function shouldSwitchCourts(
  currentSet: SetScore,
  isTiebreak: boolean,
  tiebreakA: number,
  tiebreakB: number
): boolean {
  if (isTiebreak) {
    const totalPoints = tiebreakA + tiebreakB;
    return totalPoints > 0 && totalPoints % 6 === 0;
  }
  const totalGames = currentSet.teamA + currentSet.teamB;
  return totalGames > 0 && totalGames % 2 !== 0;
}

/**
 * Adds a point to the winning team and returns the updated MatchState
 */
export function addPoint(
  state: MatchState,
  winner: Team,
  pointType: PointType = 'normal'
): { newState: MatchState; event: 'point' | 'game' | 'set' | 'match'; courtSwitch: boolean } {
  if (state.matchWinner) {
    return { newState: state, event: 'point', courtSwitch: false };
  }

  // Clone state
  const newState: MatchState = JSON.parse(JSON.stringify(state));
  const currentSet = newState.sets[newState.currentSetIndex];
  if (currentSet) {
    currentSet.pointsCount = (currentSet.pointsCount || 0) + 1;
  }
  let event: 'point' | 'game' | 'set' | 'match' = 'point';
  let courtSwitch = false;
  let gameWonBy: Team | undefined;
  let setWonBy: Team | undefined;
  let matchWonBy: Team | undefined;

  // Handle Tiebreak scoring
  if (newState.isTiebreak) {
    if (winner === 'teamA') {
      newState.tiebreakA += 1;
    } else {
      newState.tiebreakB += 1;
    }

    const tA = newState.tiebreakA;
    const tB = newState.tiebreakB;
    const isSuperTiebreak = Boolean(
      newState.isSuperTiebreak ||
      (newState.settings.matchFormat === 'two_sets_super_tie' && newState.currentSetIndex === 2)
    );
    const targetPoints = isSuperTiebreak ? 10 : newState.settings.tiebreakPoints;

    // Check if Tiebreak is won
    if ((tA >= targetPoints || tB >= targetPoints) && Math.abs(tA - tB) >= 2) {
      // Set won via tiebreak
      const tiebreakWinner: Team = tA > tB ? 'teamA' : 'teamB';
      currentSet.tiebreakA = tA;
      currentSet.tiebreakB = tB;
      
      if (isSuperTiebreak) {
        currentSet.isSuperTiebreak = true;
        currentSet.teamA = tiebreakWinner === 'teamA' ? 1 : 0;
        currentSet.teamB = tiebreakWinner === 'teamB' ? 1 : 0;
      } else {
        if (tiebreakWinner === 'teamA') {
          currentSet.teamA += 1;
        } else {
          currentSet.teamB += 1;
        }
      }
      
      currentSet.isCompleted = true;
      currentSet.winner = tiebreakWinner;
      gameWonBy = tiebreakWinner;
      setWonBy = tiebreakWinner;
      event = 'set';

      // Check match victory
      const setsWonA = newState.sets.filter((s) => s.winner === 'teamA').length;
      const setsWonB = newState.sets.filter((s) => s.winner === 'teamB').length;

      let matchOver = false;
      if (newState.settings.matchFormat === 'two_sets_super_tie') {
        if (setsWonA === 2 || (isSuperTiebreak && tiebreakWinner === 'teamA')) {
          newState.matchWinner = 'teamA';
          matchWonBy = 'teamA';
          matchOver = true;
        } else if (setsWonB === 2 || (isSuperTiebreak && tiebreakWinner === 'teamB')) {
          newState.matchWinner = 'teamB';
          matchWonBy = 'teamB';
          matchOver = true;
        }
      } else {
        const setsRequired = Math.ceil(newState.settings.bestOfSets / 2);
        if (setsWonA >= setsRequired) {
          newState.matchWinner = 'teamA';
          matchWonBy = 'teamA';
          matchOver = true;
        } else if (setsWonB >= setsRequired) {
          newState.matchWinner = 'teamB';
          matchWonBy = 'teamB';
          matchOver = true;
        }
      }

      if (matchOver) {
        event = 'match';
        newState.isTimerRunning = false;
        newState.isTiebreak = false;
        newState.isSuperTiebreak = false;
        if (!newState.endTime) {
          newState.endTime = Date.now();
        }
      } else {
        // Start next set
        newState.currentSetIndex += 1;
        const isNextSuperTie =
          newState.settings.matchFormat === 'two_sets_super_tie' &&
          newState.currentSetIndex === 2 &&
          setsWonA === 1 &&
          setsWonB === 1;

        // In tiebreak, the team that received the first point of the tiebreak serves game 1 of the new set
        const nextServingTeam: Team = newState.currentServer === 'teamA' ? 'teamB' : 'teamA';
        newState.currentServer = nextServingTeam;

        newState.sets.push({
          setNumber: newState.currentSetIndex + 1,
          teamA: 0,
          teamB: 0,
          isCompleted: false,
          isSuperTiebreak: isNextSuperTie,
          firstServerTeam: nextServingTeam,
        });

        if (isNextSuperTie) {
          newState.isTiebreak = true;
          newState.isSuperTiebreak = true;
          newState.tiebreakA = 0;
          newState.tiebreakB = 0;
        } else {
          newState.isTiebreak = false;
          newState.isSuperTiebreak = false;
          newState.tiebreakA = 0;
          newState.tiebreakB = 0;
        }
      }

      newState.isStarPoint = false;
      newState.pointsA = '0';
      newState.pointsB = '0';
    } else {
      // Check tiebreak court switch
      const totalTiebreakPoints = tA + tB;
      if (totalTiebreakPoints > 0 && totalTiebreakPoints % 6 === 0) {
        courtSwitch = true;
        newState.sidesSwapped = !newState.sidesSwapped;
      }
      // Tiebreak serve rotation: 1st point server 1, then alternate every 2 points
      updateTiebreakServer(newState);
    }
  } else {
    // Normal game scoring
    const pA = newState.pointsA;
    const pB = newState.pointsB;

    let wonGame = false;
    let newPA: PointScore = pA;
    let newPB: PointScore = pB;

    if (newState.settings.scoringMode === 'golden_point') {
      // Golden point rules: at 40-40, next point wins directly
      if (pA === '40' && pB === '40') {
        wonGame = true;
      } else if (winner === 'teamA') {
        if (pA === '0') newPA = '15';
        else if (pA === '15') newPA = '30';
        else if (pA === '30') newPA = '40';
        else if (pA === '40') wonGame = true;
      } else {
        if (pB === '0') newPB = '15';
        else if (pB === '15') newPB = '30';
        else if (pB === '30') newPB = '40';
        else if (pB === '40') wonGame = true;
      }
    } else if (newState.settings.scoringMode === 'star_point') {
      // Star Point (Punto Estrella):
      // 1. Primer 40-40 -> "deuce 1"
      // 2. Primera ventaja -> "AD 1"
      //    - Si el equipo con AD 1 anota -> Gana el juego
      //    - Si el rival empata -> Segundo iguales "deuce 2"
      // 3. Segunda ventaja -> "AD 02"
      //    - Si el equipo con AD 02 anota -> Gana el juego
      //    - Si el rival empata -> Tercer iguales "SP" (Star Point)
      // 4. En el tercer iguales "SP" -> Quien gane este punto gana el juego directamente.
      
      const isDeuce1 = (pA === 'deuce 1' && pB === 'deuce 1') || (pA === '40' && pB === '40' && (!newState.starPointStage || newState.starPointStage === 1));
      const isDeuce2 = (pA === 'deuce 2' && pB === 'deuce 2') || (newState.starPointStage === 2 && (pA === '40' || pA === 'deuce 2') && (pB === '40' || pB === 'deuce 2'));
      const isSP = (pA === 'SP' && pB === 'SP') || Boolean(newState.isStarPoint) || newState.starPointStage === 3;
      const isAD1 = pA === 'AD 1' || pB === 'AD 1' || (pA === 'AD' && newState.starPointStage === 1) || (pB === 'AD' && newState.starPointStage === 1);
      const isAD02 = pA === 'AD 02' || pB === 'AD 02' || pA === 'AD 2' || pB === 'AD 2' || (pA === 'AD' && newState.starPointStage === 2) || (pB === 'AD' && newState.starPointStage === 2);

      if (isSP) {
        // En el 3er iguales SP: quien anote gana el juego de inmediato
        wonGame = true;
        newState.isStarPoint = false;
        newState.starPointStage = 0;
      } else if (isAD1) {
        if ((pA === 'AD 1' || pA === 'AD') && winner === 'teamA') {
          wonGame = true;
          newState.isStarPoint = false;
          newState.starPointStage = 0;
        } else if ((pB === 'AD 1' || pB === 'AD') && winner === 'teamB') {
          wonGame = true;
          newState.isStarPoint = false;
          newState.starPointStage = 0;
        } else {
          // El rival empata -> Segundo iguales deuce 2
          newState.starPointStage = 2;
          newState.isStarPoint = false;
          newPA = 'deuce 2';
          newPB = 'deuce 2';
        }
      } else if (isAD02) {
        if ((pA === 'AD 02' || pA === 'AD 2' || pA === 'AD') && winner === 'teamA') {
          wonGame = true;
          newState.isStarPoint = false;
          newState.starPointStage = 0;
        } else if ((pB === 'AD 02' || pB === 'AD 2' || pB === 'AD') && winner === 'teamB') {
          wonGame = true;
          newState.isStarPoint = false;
          newState.starPointStage = 0;
        } else {
          // El rival empata -> Tercer iguales SP (Star Point)
          newState.starPointStage = 3;
          newState.isStarPoint = true;
          newPA = 'SP';
          newPB = 'SP';
        }
      } else if (isDeuce2) {
        // Desde Deuce 2 -> Segunda ventaja AD 02
        newState.starPointStage = 2;
        if (winner === 'teamA') {
          newPA = 'AD 02';
          newPB = '40';
        } else {
          newPA = '40';
          newPB = 'AD 02';
        }
      } else if (isDeuce1) {
        // Desde Deuce 1 -> Primera ventaja AD 1
        newState.starPointStage = 1;
        if (winner === 'teamA') {
          newPA = 'AD 1';
          newPB = '40';
        } else {
          newPA = '40';
          newPB = 'AD 1';
        }
      } else if (winner === 'teamA') {
        if (pA === '0') newPA = '15';
        else if (pA === '15') newPA = '30';
        else if (pA === '30') {
          if (pB === '40') {
            // Empata a 40 -> Primer 40 iguales: deuce 1
            newState.starPointStage = 1;
            newPA = 'deuce 1';
            newPB = 'deuce 1';
          } else {
            newPA = '40';
          }
        } else if (pA === '40') {
          wonGame = true;
        }
      } else {
        if (pB === '0') newPB = '15';
        else if (pB === '15') newPB = '30';
        else if (pB === '30') {
          if (pA === '40') {
            // Empata a 40 -> Primer 40 iguales: deuce 1
            newState.starPointStage = 1;
            newPA = 'deuce 1';
            newPB = 'deuce 1';
          } else {
            newPB = '40';
          }
        } else if (pB === '40') {
          wonGame = true;
        }
      }
    } else {
      // Advantage (Deuce) rules: unlimited deuces until 2 points clear
      if (pA === '40' && pB === '40') {
        if (winner === 'teamA') newPA = 'AD';
        else newPB = 'AD';
      } else if (pA === 'AD') {
        if (winner === 'teamA') wonGame = true;
        else {
          newPA = '40';
          newPB = '40';
        }
      } else if (pB === 'AD') {
        if (winner === 'teamB') wonGame = true;
        else {
          newPA = '40';
          newPB = '40';
        }
      } else if (winner === 'teamA') {
        if (pA === '0') newPA = '15';
        else if (pA === '15') newPA = '30';
        else if (pA === '30') newPA = '40';
        else if (pA === '40') wonGame = true;
      } else {
        if (pB === '0') newPB = '15';
        else if (pB === '15') newPB = '30';
        else if (pB === '30') newPB = '40';
        else if (pB === '40') wonGame = true;
      }
    }

    if (wonGame) {
      gameWonBy = winner;
      event = 'game';
      newState.pointsA = '0';
      newState.pointsB = '0';
      newState.isStarPoint = false;
      newState.starPointStage = 0;

      if (winner === 'teamA') {
        currentSet.teamA += 1;
      } else {
        currentSet.teamB += 1;
      }

      // Check if set is won or entered tiebreak
      const gA = currentSet.teamA;
      const gB = currentSet.teamB;

      if (gA === 6 && gB === 6 && newState.settings.tiebreakAtGames === 6) {
        // Enter tiebreak
        newState.isTiebreak = true;
        newState.isStarPoint = false;
        newState.tiebreakA = 0;
        newState.tiebreakB = 0;
      } else if ((gA >= 6 || gB >= 6) && Math.abs(gA - gB) >= 2) {
        // Set completed normally
        setWonBy = gA > gB ? 'teamA' : 'teamB';
        currentSet.isCompleted = true;
        currentSet.winner = setWonBy;
        event = 'set';

        const setsWonA = newState.sets.filter((s) => s.winner === 'teamA').length;
        const setsWonB = newState.sets.filter((s) => s.winner === 'teamB').length;

        let matchOver = false;
        if (newState.settings.matchFormat === 'two_sets_super_tie') {
          if (setsWonA === 2) {
            newState.matchWinner = 'teamA';
            matchWonBy = 'teamA';
            matchOver = true;
          } else if (setsWonB === 2) {
            newState.matchWinner = 'teamB';
            matchWonBy = 'teamB';
            matchOver = true;
          }
        } else {
          const setsRequired = Math.ceil(newState.settings.bestOfSets / 2);
          if (setsWonA >= setsRequired) {
            newState.matchWinner = 'teamA';
            matchWonBy = 'teamA';
            matchOver = true;
          } else if (setsWonB >= setsRequired) {
            newState.matchWinner = 'teamB';
            matchWonBy = 'teamB';
            matchOver = true;
          }
        }

        if (matchOver) {
          event = 'match';
          newState.isTimerRunning = false;
          if (!newState.endTime) {
            newState.endTime = Date.now();
          }
        } else {
          // Add next set
          newState.currentSetIndex += 1;
          const isNextSuperTie =
            newState.settings.matchFormat === 'two_sets_super_tie' &&
            newState.currentSetIndex === 2 &&
            setsWonA === 1 &&
            setsWonB === 1;

          // The team that received in the last game serves in game 1 of the new set
          const nextServingTeam: Team = state.currentServer === 'teamA' ? 'teamB' : 'teamA';
          newState.currentServer = nextServingTeam;

          newState.sets.push({
            setNumber: newState.currentSetIndex + 1,
            teamA: 0,
            teamB: 0,
            isCompleted: false,
            isSuperTiebreak: isNextSuperTie,
            firstServerTeam: nextServingTeam,
          });

          if (isNextSuperTie) {
            newState.isTiebreak = true;
            newState.isSuperTiebreak = true;
            newState.tiebreakA = 0;
            newState.tiebreakB = 0;
          }
        }
      }

      // Check court switch after game
      const totalGames = currentSet.teamA + currentSet.teamB;
      if (totalGames % 2 !== 0 && !newState.matchWinner) {
        courtSwitch = true;
        newState.sidesSwapped = !newState.sidesSwapped;
      }

      // Rotate serving team and player if set did not end just now
      if (event === 'game') {
        rotateGameServer(newState);
      }
    } else {
      newState.pointsA = newPA;
      newState.pointsB = newPB;
    }
  }

  // Reset 1st/2nd serve
  newState.firstServe = true;

  // Log point to pointHistory
  const record: PointRecord = {
    id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    winner,
    server: state.currentServer,
    serverPlayerName:
      state.currentServer === 'teamA'
        ? state.teamAPlayers[state.currentServerPlayerIndex]?.name
        : state.teamBPlayers[state.currentServerPlayerIndex]?.name,
    pointType,
    timestamp: Date.now(),
    scoreAfter: {
      pointsA: newState.isTiebreak ? String(newState.tiebreakA) : newState.pointsA,
      pointsB: newState.isTiebreak ? String(newState.tiebreakB) : newState.pointsB,
      gamesA: newState.sets[newState.currentSetIndex]?.teamA || 0,
      gamesB: newState.sets[newState.currentSetIndex]?.teamB || 0,
      setIndex: newState.currentSetIndex,
      isTiebreak: newState.isTiebreak,
      isSuperTiebreak: newState.isSuperTiebreak,
      isStarPoint: newState.isStarPoint,
      starPointStage: newState.starPointStage,
      sidesSwapped: newState.sidesSwapped,
    },
    gameWon: gameWonBy,
    setWon: setWonBy,
    matchWon: matchWonBy,
  };

  newState.pointHistory.push(record);

  return { newState, event, courtSwitch };
}

/**
 * Manually toggle court sides
 */
export function toggleCourtSides(state: MatchState): MatchState {
  return {
    ...state,
    sidesSwapped: !state.sidesSwapped,
  };
}

/**
 * Calculates which player of a team should serve for a given set and game count
 */
export function getServingPlayerIndex(
  state: MatchState,
  team: Team,
  setIndex: number
): 0 | 1 {
  const currentSet = state.sets[setIndex];
  if (!currentSet) return 0;

  const totalGames = currentSet.teamA + currentSet.teamB;
  const firstServerTeam = currentSet.firstServerTeam || 'teamA';

  if (team === 'teamA') {
    const firstA = currentSet.firstServerA ?? 0;
    // Calculate how many times Team A has served in this set prior to this game
    const gamesServedBefore =
      firstServerTeam === 'teamA'
        ? Math.floor(totalGames / 2)
        : Math.floor((totalGames - 1) / 2);

    return gamesServedBefore % 2 === 0 ? firstA : ((1 - firstA) as 0 | 1);
  } else {
    const firstB = currentSet.firstServerB ?? 0;
    // Calculate how many times Team B has served in this set prior to this game
    const gamesServedBefore =
      firstServerTeam === 'teamB'
        ? Math.floor(totalGames / 2)
        : Math.floor((totalGames - 1) / 2);

    return gamesServedBefore % 2 === 0 ? firstB : ((1 - firstB) as 0 | 1);
  }
}

/**
 * Updates the serving player and team during a tiebreak
 */
export function updateTiebreakServer(state: MatchState) {
  const currentSet = state.sets[state.currentSetIndex];
  const totalPoints = state.tiebreakA + state.tiebreakB;

  const firstServerTeamInSet = currentSet?.firstServerTeam || 'teamA';
  const startTiebreakTeam: Team = firstServerTeamInSet;

  const firstA = currentSet?.firstServerA ?? 0;
  const firstB = currentSet?.firstServerB ?? 0;

  // 4-step cycle: Point 1 (1 pt), Points 2-3 (2 pts), Points 4-5 (2 pts), Points 6-7 (2 pts)...
  const cycleIndex = Math.floor((totalPoints + 1) / 2) % 4;

  if (startTiebreakTeam === 'teamA') {
    if (cycleIndex === 0) {
      state.currentServer = 'teamA';
      state.currentServerPlayerIndex = firstA;
    } else if (cycleIndex === 1) {
      state.currentServer = 'teamB';
      state.currentServerPlayerIndex = firstB;
    } else if (cycleIndex === 2) {
      state.currentServer = 'teamA';
      state.currentServerPlayerIndex = (1 - firstA) as 0 | 1;
    } else {
      state.currentServer = 'teamB';
      state.currentServerPlayerIndex = (1 - firstB) as 0 | 1;
    }
  } else {
    if (cycleIndex === 0) {
      state.currentServer = 'teamB';
      state.currentServerPlayerIndex = firstB;
    } else if (cycleIndex === 1) {
      state.currentServer = 'teamA';
      state.currentServerPlayerIndex = firstA;
    } else if (cycleIndex === 2) {
      state.currentServer = 'teamB';
      state.currentServerPlayerIndex = (1 - firstB) as 0 | 1;
    } else {
      state.currentServer = 'teamA';
      state.currentServerPlayerIndex = (1 - firstA) as 0 | 1;
    }
  }
}

/**
 * Rotates server to the opposite team after a normal game and applies the established player rotation
 */
export function rotateGameServer(state: MatchState) {
  state.currentServer = state.currentServer === 'teamA' ? 'teamB' : 'teamA';

  const currentSet = state.sets[state.currentSetIndex];
  if (!currentSet) return;

  if (state.currentServer === 'teamA') {
    if (currentSet.firstServerA !== undefined) {
      state.currentServerPlayerIndex = getServingPlayerIndex(
        state,
        'teamA',
        state.currentSetIndex
      );
    }
  } else {
    if (currentSet.firstServerB !== undefined) {
      state.currentServerPlayerIndex = getServingPlayerIndex(
        state,
        'teamB',
        state.currentSetIndex
      );
    }
  }
}

/**
 * Checks if the user needs to select which player will serve for the current serving team in the current set
 */
export function needsSetServerSelection(state: MatchState): {
  needed: boolean;
  team: Team;
  isFirstGameOfSet: boolean;
  isSecondGameOfSet: boolean;
  setNumber: number;
} {
  if (state.matchWinner) {
    return {
      needed: false,
      team: 'teamA',
      isFirstGameOfSet: false,
      isSecondGameOfSet: false,
      setNumber: 1,
    };
  }

  const currentSet = state.sets[state.currentSetIndex];
  if (!currentSet) {
    return {
      needed: false,
      team: 'teamA',
      isFirstGameOfSet: false,
      isSecondGameOfSet: false,
      setNumber: 1,
    };
  }

  const totalGames = currentSet.teamA + currentSet.teamB;
  const isFirstGame = totalGames === 0;
  const isSecondGame = totalGames === 1;

  if (state.currentServer === 'teamA') {
    if (currentSet.firstServerA === undefined) {
      return {
        needed: true,
        team: 'teamA',
        isFirstGameOfSet: isFirstGame,
        isSecondGameOfSet: isSecondGame,
        setNumber: currentSet.setNumber,
      };
    }
  } else {
    if (currentSet.firstServerB === undefined) {
      return {
        needed: true,
        team: 'teamB',
        isFirstGameOfSet: isFirstGame,
        isSecondGameOfSet: isSecondGame,
        setNumber: currentSet.setNumber,
      };
    }
  }

  return {
    needed: false,
    team: state.currentServer,
    isFirstGameOfSet: isFirstGame,
    isSecondGameOfSet: isSecondGame,
    setNumber: currentSet.setNumber,
  };
}

/**
 * Calculates total games played in the entire match so far across all sets
 */
export function getTotalMatchGames(state: MatchState): number {
  let total = 0;
  state.sets.forEach((set, index) => {
    if (index < state.currentSetIndex) {
      total += set.teamA + set.teamB;
    }
  });
  const currentSet = state.sets[state.currentSetIndex];
  if (currentSet) {
    total += currentSet.teamA + currentSet.teamB;
  }
  return total;
}

export interface BallChangeStatus {
  enabled: boolean;
  totalMatchGames: number;
  currentBallGames: number; // Games played with current ball batch
  ballCapacity: number; // Total games this ball batch lasts (e.g. 7 or 9)
  gamesRemaining: number; // Games until next ball change
  nextChangeAtTotalGames: number | null; // Total match game count threshold for next change
  isChangeDueNow: boolean; // True if next game should be played with new balls (or change happened just now)
  badgeText: string;
  detailText: string;
  schedulePreview: number[]; // List of match game thresholds (e.g. [7, 16, 25, 34])
}

/**
 * Calculates the ball change schedule and current status based on rules
 */
export function getBallChangeStatus(state: MatchState): BallChangeStatus {
  const ballChange = state.settings.ballChange;
  const totalGames = getTotalMatchGames(state);

  if (!ballChange || !ballChange.enabled || ballChange.pattern === 'none') {
    return {
      enabled: false,
      totalMatchGames: totalGames,
      currentBallGames: totalGames,
      ballCapacity: 0,
      gamesRemaining: 0,
      nextChangeAtTotalGames: null,
      isChangeDueNow: false,
      badgeText: 'Sin cambio de bolas',
      detailText: 'Mismas bolas durante todo el partido',
      schedulePreview: [],
    };
  }

  // Set-based ball change patterns
  if (ballChange.pattern === 'every_set') {
    const currentSet = state.sets[state.currentSetIndex];
    const gamesInCurrentSet = currentSet ? currentSet.teamA + currentSet.teamB : 0;
    const isChangeDueNow = gamesInCurrentSet === 0 && state.currentSetIndex > 0;
    return {
      enabled: true,
      totalMatchGames: totalGames,
      currentBallGames: gamesInCurrentSet,
      ballCapacity: 6,
      gamesRemaining: isChangeDueNow ? 0 : 1,
      nextChangeAtTotalGames: null,
      isChangeDueNow,
      badgeText: isChangeDueNow ? '¡Cambio de Bolas!' : `Bolas Set ${state.currentSetIndex + 1}`,
      detailText: isChangeDueNow
        ? '¡Bolas nuevas para el inicio del Set!'
        : `Bolas nuevas al inicio de cada set`,
      schedulePreview: [],
    };
  }

  if (ballChange.pattern === 'every_2_sets') {
    const isChangeDueNow =
      state.currentSetIndex === 2 &&
      (state.sets[2]?.teamA + state.sets[2]?.teamB === 0);
    return {
      enabled: true,
      totalMatchGames: totalGames,
      currentBallGames: totalGames,
      ballCapacity: 12,
      gamesRemaining: isChangeDueNow ? 0 : 1,
      nextChangeAtTotalGames: null,
      isChangeDueNow,
      badgeText: isChangeDueNow ? '¡Cambio de Bolas!' : 'Bolas (Cada 2 sets)',
      detailText: isChangeDueNow
        ? '¡Bolas nuevas para el 3º Set!'
        : 'Cambio de bolas cada 2 sets',
      schedulePreview: [],
    };
  }

  // Game-based patterns (7_9, 9_11, custom)
  let firstChange = ballChange.firstChangeGames || 7;
  let interval = ballChange.subsequentChangeGames || 9;

  if (ballChange.pattern === '7_9') {
    firstChange = 7;
    interval = 9;
  } else if (ballChange.pattern === '9_11') {
    firstChange = 9;
    interval = 11;
  }

  // Build schedule preview (first 6 thresholds)
  const schedulePreview: number[] = [];
  let t = firstChange;
  for (let i = 0; i < 6; i++) {
    schedulePreview.push(t);
    t += interval;
  }

  let currentBallGames = 0;
  let ballCapacity = firstChange;
  let gamesRemaining = 0;
  let nextChangeAtTotalGames = firstChange;
  let isChangeDueNow = false;

  if (totalGames === 0) {
    currentBallGames = 0;
    ballCapacity = firstChange;
    gamesRemaining = firstChange;
    nextChangeAtTotalGames = firstChange;
    isChangeDueNow = false;
  } else if (totalGames < firstChange) {
    currentBallGames = totalGames;
    ballCapacity = firstChange;
    gamesRemaining = firstChange - totalGames;
    nextChangeAtTotalGames = firstChange;
    isChangeDueNow = false;
  } else if (totalGames === firstChange) {
    // Just reached 1st ball change (game 7 finished) -> new balls for game 8!
    currentBallGames = 0;
    ballCapacity = interval;
    gamesRemaining = interval;
    nextChangeAtTotalGames = firstChange + interval;
    isChangeDueNow = true;
  } else {
    const offset = totalGames - firstChange;
    const remainder = offset % interval;
    ballCapacity = interval;

    if (remainder === 0) {
      // Exactly at subsequent ball change threshold (game 16, 25, 34...)
      currentBallGames = 0;
      gamesRemaining = interval;
      nextChangeAtTotalGames = totalGames + interval;
      isChangeDueNow = true;
    } else {
      currentBallGames = remainder;
      gamesRemaining = interval - remainder;
      nextChangeAtTotalGames = totalGames + gamesRemaining;
      isChangeDueNow = false;
    }
  }

  const badgeText = isChangeDueNow
    ? '¡CAMBIO DE BOLAS!'
    : `Bolas: ${currentBallGames}/${ballCapacity} jgs`;

  const detailText = isChangeDueNow
    ? '¡Juego con Bolas Nuevas!'
    : `Próximo cambio en ${gamesRemaining} juego${gamesRemaining > 1 ? 's' : ''} (Juego total #${nextChangeAtTotalGames})`;

  return {
    enabled: true,
    totalMatchGames: totalGames,
    currentBallGames,
    ballCapacity,
    gamesRemaining,
    nextChangeAtTotalGames,
    isChangeDueNow,
    badgeText,
    detailText,
    schedulePreview,
  };
}

/**
 * Creates a comprehensive snapshot of the exact game situation at the moment of match suspension.
 */
export function createSuspensionSnapshot(state: MatchState): import('../types').SuspensionStateSnapshot {
  const currentSet = state.sets[state.currentSetIndex] || { teamA: 0, teamB: 0, setNumber: state.currentSetIndex + 1 };
  const setNumber = state.currentSetIndex + 1;

  // Format score display e.g. "Set 2 (6-4, 3-2, 30-15)"
  const previousSetsStr = state.sets
    .slice(0, state.currentSetIndex)
    .map((s) => `${s.teamA}-${s.teamB}`)
    .join(', ');
  
  let currentScoreStr = '';
  if (state.isTiebreak) {
    currentScoreStr = `TB ${state.tiebreakA}-${state.tiebreakB}`;
  } else {
    currentScoreStr = `${state.pointsA}-${state.pointsB}`;
  }

  const scoreDisplay = previousSetsStr
    ? `Set ${setNumber} (${previousSetsStr}, ${currentSet.teamA}-${currentSet.teamB}, ${currentScoreStr})`
    : `Set ${setNumber} (${currentSet.teamA}-${currentSet.teamB}, ${currentScoreStr})`;

  // Calculate serve side (deuce / right vs ad / left)
  let serveSide: 'deuce' | 'ad' = 'deuce';
  if (state.isTiebreak) {
    const totalTbPoints = (state.tiebreakA || 0) + (state.tiebreakB || 0);
    serveSide = totalTbPoints % 2 === 0 ? 'deuce' : 'ad';
  } else {
    const pointValueMap: Record<string, number> = { '0': 0, '15': 1, '30': 2, '40': 3, 'AD': 4, 'SP': 4 };
    const ptA = pointValueMap[state.pointsA] ?? 0;
    const ptB = pointValueMap[state.pointsB] ?? 0;
    const totalPts = ptA + ptB;
    serveSide = totalPts % 2 === 0 ? 'deuce' : 'ad';
  }

  // Server player details
  const serverTeamPlayers = state.currentServer === 'teamA' ? state.teamAPlayers : state.teamBPlayers;
  const serverPlayer = serverTeamPlayers[state.currentServerPlayerIndex] || serverTeamPlayers[0];
  const receiverTeamPlayers = state.currentServer === 'teamA' ? state.teamBPlayers : state.teamAPlayers;
  
  // Receiver depends on serve side (Drive player receives from deuce side, Reves player receives from ad side)
  const receiverPlayer = receiverTeamPlayers.find((p) =>
    serveSide === 'deuce' ? p.position === 'drive' : p.position === 'reves'
  ) || receiverTeamPlayers[0];

  // Court sides
  const teamOnLeft = state.sidesSwapped ? state.teamBName : state.teamAName;
  const teamOnRight = state.sidesSwapped ? state.teamAName : state.teamBName;

  // Format match time
  const minutes = Math.floor(state.matchTimeSeconds / 60);
  const seconds = state.matchTimeSeconds % 60;
  const matchTimeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    setIndex: state.currentSetIndex,
    setNumber,
    scoreDisplay,
    gamesA: currentSet.teamA,
    gamesB: currentSet.teamB,
    pointsA: String(state.pointsA),
    pointsB: String(state.pointsB),
    isTiebreak: state.isTiebreak,
    tiebreakScore: state.isTiebreak ? `${state.tiebreakA}-${state.tiebreakB}` : undefined,
    serverTeam: state.currentServer,
    serverTeamName: state.currentServer === 'teamA' ? state.teamAName : state.teamBName,
    serverPlayerName: serverPlayer?.name || 'Servidor',
    serverPlayerPosition: serverPlayer?.position,
    serveSide,
    receiverPlayerName: receiverPlayer?.name,
    courtSides: {
      teamOnLeft,
      teamOnRight,
    },
    playersPositions: {
      teamA: [
        { name: state.teamAPlayers[0]?.name || 'Jugador A1', position: state.teamAPlayers[0]?.position || 'drive' },
        { name: state.teamAPlayers[1]?.name || 'Jugador A2', position: state.teamAPlayers[1]?.position || 'reves' },
      ],
      teamB: [
        { name: state.teamBPlayers[0]?.name || 'Jugador B1', position: state.teamBPlayers[0]?.position || 'drive' },
        { name: state.teamBPlayers[1]?.name || 'Jugador B2', position: state.teamBPlayers[1]?.position || 'reves' },
      ],
    },
    matchTimeFormatted,
  };
}

