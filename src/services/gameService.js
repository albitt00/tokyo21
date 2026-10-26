import { database, isFirebaseConfigured } from '../firebase';
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import {
  resolveDoubt,
  generateDiceRoll,
  getScoreFromDice,
  isScoreValidRaise,
} from '../utils/tokyoLogic';

// Canale Broadcast per fallback locale / testing multi-tab senza Firebase attivo
const mockBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('tokyo21_local_channel')
  : null;

/**
 * Genera un codice stanza di 4-5 caratteri alfanumerici univoco e leggibile
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Esclude 0, O, 1, I per evitare ambiguità
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Helper per ottenere la lista ordinata dei giocatori vivi (vite > 0)
 */
export function getAlivePlayers(players) {
  if (!players) return [];
  const list = Object.values(players);
  return list
    .filter((p) => (p.lives ?? 0) > 0)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

/**
 * Trova il giocatore successivo vivo in senso orario
 */
export function getNextAlivePlayer(players, currentId) {
  const alive = getAlivePlayers(players);
  if (alive.length === 0) return null;
  const currentIndex = alive.findIndex((p) => p.id === currentId);
  if (currentIndex === -1) return alive[0];
  const nextIndex = (currentIndex + 1) % alive.length;
  return alive[nextIndex];
}

// ============================================================================
// METODI PRINCIPALI REALTIME DATABASE
// ============================================================================

/**
 * Crea una nuova stanza di gioco su Firebase
 */
export async function createRoom(hostPlayer, initialSettings = {}) {
  const roomCode = generateRoomCode();
  const roomRef = ref(database, `rooms/${roomCode}`);

  const startingLives = initialSettings.startingLives ?? 6;
  const strictRaise = initialSettings.strictRaise ?? false;

  const roomData = {
    roomCode,
    status: 'LOBBY',
    createdAt: Date.now(),
    settings: {
      startingLives,
      strictRaise,
    },
    players: {
      [hostPlayer.id]: {
        id: hostPlayer.id,
        nickname: hostPlayer.nickname,
        avatar: hostPlayer.avatar || '🎲',
        lives: startingLives,
        isHost: true,
        orderIndex: 0,
        joinedAt: Date.now(),
        connected: true,
      },
    },
    gameState: {
      phase: 'FIRST_ROLL',
      currentTurnPlayerId: hostPlayer.id,
      previousPlayerId: null,
      actualRoll: null,
      diceValues: null,
      declaredValue: null,
      roundNumber: 1,
      lastRoundResult: null,
    },
  };

  if (isFirebaseConfigured()) {
    await set(roomRef, roomData);
    // Configura disconnessione
    try {
      const playerConnRef = ref(database, `rooms/${roomCode}/players/${hostPlayer.id}/connected`);
      onDisconnect(playerConnRef).set(false);
    } catch (e) {
      console.warn('onDisconnect non supportato:', e);
    }
  } else {
    // Salva localmente per mock fallback
    saveMockRoom(roomCode, roomData);
  }

  return roomCode;
}

/**
 * Entra in una stanza esistente
 */
export async function joinRoom(roomCode, player) {
  const code = roomCode.trim().toUpperCase();

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${code}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      throw new Error(`La stanza ${code} non esiste.`);
    }

    const roomData = snapshot.val();
    const existingPlayers = roomData.players || {};
    const playerExists = existingPlayers[player.id];

    if (roomData.status !== 'LOBBY' && !playerExists) {
      throw new Error('La partita è già iniziata! Non è possibile unirsi a partita in corso.');
    }

    const startingLives = roomData.settings?.startingLives ?? 6;
    const currentCount = Object.keys(existingPlayers).length;

    const updatedPlayerData = {
      id: player.id,
      nickname: player.nickname,
      avatar: player.avatar || '🎲',
      lives: playerExists ? playerExists.lives : startingLives,
      isHost: playerExists ? playerExists.isHost : false,
      orderIndex: playerExists ? playerExists.orderIndex : currentCount,
      joinedAt: playerExists ? playerExists.joinedAt : Date.now(),
      connected: true,
    };

    const playerRef = ref(database, `rooms/${code}/players/${player.id}`);
    await set(playerRef, updatedPlayerData);

    try {
      const connRef = ref(database, `rooms/${code}/players/${player.id}/connected`);
      onDisconnect(connRef).set(false);
    } catch (e) {
      console.warn(e);
    }

    return code;
  } else {
    // Mock mode
    const room = getMockRoom(code);
    if (!room) throw new Error(`La stanza ${code} non esiste in modalità locale.`);
    const existing = room.players || {};
    const playerExists = existing[player.id];
    const startingLives = room.settings?.startingLives ?? 6;
    const count = Object.keys(existing).length;

    room.players[player.id] = {
      id: player.id,
      nickname: player.nickname,
      avatar: player.avatar || '🎲',
      lives: playerExists ? playerExists.lives : startingLives,
      isHost: playerExists ? playerExists.isHost : false,
      orderIndex: playerExists ? playerExists.orderIndex : count,
      joinedAt: playerExists ? playerExists.joinedAt : Date.now(),
      connected: true,
    };
    saveMockRoom(code, room);
    return code;
  }
}

/**
 * Aggiorna le impostazioni della stanza (solo Host)
 */
export async function updateRoomSettings(roomCode, settings) {
  if (isFirebaseConfigured()) {
    const settingsRef = ref(database, `rooms/${roomCode}/settings`);
    await update(settingsRef, settings);
  } else {
    const room = getMockRoom(roomCode);
    if (room) {
      room.settings = { ...room.settings, ...settings };
      saveMockRoom(roomCode, room);
    }
  }
}

/**
 * Avvia la partita dalla Lobby (solo Host)
 */
export async function startGame(roomCode) {
  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val();
    const players = room.players || {};
    const playerList = Object.values(players).sort((a, b) => a.orderIndex - b.orderIndex);

    if (playerList.length < 2) {
      throw new Error('Servono almeno 2 giocatori per iniziare la partita.');
    }

    const startingLives = room.settings?.startingLives ?? 6;
    const updatedPlayers = {};
    playerList.forEach((p, idx) => {
      updatedPlayers[p.id] = {
        ...p,
        orderIndex: idx,
        lives: startingLives,
      };
    });

    const firstPlayer = playerList[0];

    await update(roomRef, {
      status: 'PLAYING',
      players: updatedPlayers,
      gameState: {
        phase: 'FIRST_ROLL',
        currentTurnPlayerId: firstPlayer.id,
        previousPlayerId: null,
        actualRoll: null,
        diceValues: null,
        declaredValue: null,
        roundNumber: 1,
        lastRoundResult: null,
      },
    });
  } else {
    const room = getMockRoom(roomCode);
    if (!room) return;
    const playerList = Object.values(room.players || {}).sort((a, b) => a.orderIndex - b.orderIndex);
    if (playerList.length < 2) throw new Error('Servono almeno 2 giocatori per iniziare.');
    const startingLives = room.settings?.startingLives ?? 6;
    playerList.forEach((p, idx) => {
      room.players[p.id] = { ...p, orderIndex: idx, lives: startingLives };
    });
    room.status = 'PLAYING';
    room.gameState = {
      phase: 'FIRST_ROLL',
      currentTurnPlayerId: playerList[0].id,
      previousPlayerId: null,
      actualRoll: null,
      diceValues: null,
      declaredValue: null,
      roundNumber: 1,
      lastRoundResult: null,
    };
    saveMockRoom(roomCode, room);
  }
}

/**
 * FASE 1: Primo lancio del round.
 * Il giocatore attivo ha tirato i dadi segreti, dichiara un valore e passa il bussolotto.
 */
export async function submitFirstRoll(roomCode, playerId, diceValues, actualRoll, declaredValue, nextPlayerId) {
  const updates = {
    'gameState/phase': 'DECISION',
    'gameState/currentTurnPlayerId': nextPlayerId,
    'gameState/previousPlayerId': playerId,
    'gameState/diceValues': diceValues,
    'gameState/actualRoll': actualRoll,
    'gameState/declaredValue': declaredValue,
    'gameState/lastRoundResult': null,
  };

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, updates);
  } else {
    const room = getMockRoom(roomCode);
    if (room) {
      room.gameState.phase = 'DECISION';
      room.gameState.currentTurnPlayerId = nextPlayerId;
      room.gameState.previousPlayerId = playerId;
      room.gameState.diceValues = diceValues;
      room.gameState.actualRoll = actualRoll;
      room.gameState.declaredValue = declaredValue;
      room.gameState.lastRoundResult = null;
      saveMockRoom(roomCode, room);
    }
  }
}

/**
 * FASE 2 -> ROLLING: Il giocatore attivo ha scelto "CREDO".
 * Lancia i propri dadi in segreto, sceglie una dichiarazione valida (>= o > della precedente) e passa al successivo.
 */
export async function submitAcceptAndRoll(roomCode, playerId, diceValues, actualRoll, declaredValue, nextPlayerId) {
  const updates = {
    'gameState/phase': 'DECISION',
    'gameState/currentTurnPlayerId': nextPlayerId,
    'gameState/previousPlayerId': playerId,
    'gameState/diceValues': diceValues,
    'gameState/actualRoll': actualRoll,
    'gameState/declaredValue': declaredValue,
  };

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, updates);
  } else {
    const room = getMockRoom(roomCode);
    if (room) {
      room.gameState.phase = 'DECISION';
      room.gameState.currentTurnPlayerId = nextPlayerId;
      room.gameState.previousPlayerId = playerId;
      room.gameState.diceValues = diceValues;
      room.gameState.actualRoll = actualRoll;
      room.gameState.declaredValue = declaredValue;
      saveMockRoom(roomCode, room);
    }
  }
}

/**
 * FASE 2 -> REVEAL: Il giocatore attivo ha scelto "DUBITO!".
 * Si alza il bussolotto per tutti, si confronta actualRoll con declaredValue e si scalano le vite.
 */
export async function submitDoubt(roomCode) {
  let roomData = null;

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    roomData = snap.val();
  } else {
    roomData = getMockRoom(roomCode);
  }

  if (!roomData || !roomData.gameState) return;

  const { gameState, players } = roomData;
  const doubterId = gameState.currentTurnPlayerId;
  const rollerId = gameState.previousPlayerId;
  const actualRoll = gameState.actualRoll;
  const declaredValue = gameState.declaredValue;

  const doubter = players[doubterId] || { nickname: 'Giocatore' };
  const roller = players[rollerId] || { nickname: 'Lanciatore' };

  // Calcola esito con logica Tokyo 21
  const result = resolveDoubt(
    actualRoll,
    declaredValue,
    rollerId,
    roller.nickname,
    doubterId,
    doubter.nickname
  );

  // Applica perdita vite al perdente
  const loser = players[result.loserId];
  const newLives = Math.max(0, (loser.lives || 0) - result.livesLost);

  const updates = {
    [`players/${result.loserId}/lives`]: newLives,
    'gameState/phase': 'REVEAL',
    'gameState/lastRoundResult': result,
  };

  // Controlla se la partita è finita (rimane 1 solo giocatore con vite > 0)
  const remainingAliveCount = Object.values(players).filter((p) => {
    if (p.id === result.loserId) return newLives > 0;
    return (p.lives || 0) > 0;
  }).length;

  if (remainingAliveCount <= 1) {
    updates['status'] = 'GAME_OVER';
  }

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, updates);
  } else {
    roomData.players[result.loserId].lives = newLives;
    roomData.gameState.phase = 'REVEAL';
    roomData.gameState.lastRoundResult = result;
    if (remainingAliveCount <= 1) {
      roomData.status = 'GAME_OVER';
    }
    saveMockRoom(roomCode, roomData);
  }
}

/**
 * Avvia il nuovo round dopo una rivelazione
 * Chi ha perso la vita (se è ancora in vita) o il successivo vivo inizia il nuovo round.
 */
export async function startNextRound(roomCode) {
  let roomData = null;

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    roomData = snap.val();
  } else {
    roomData = getMockRoom(roomCode);
  }

  if (!roomData) return;

  const { gameState, players } = roomData;
  const loserId = gameState.lastRoundResult?.loserId;
  const alivePlayers = getAlivePlayers(players);

  if (alivePlayers.length <= 1) {
    // Partita finita
    if (isFirebaseConfigured()) {
      await update(ref(database, `rooms/${roomCode}`), { status: 'GAME_OVER' });
    } else {
      roomData.status = 'GAME_OVER';
      saveMockRoom(roomCode, roomData);
    }
    return;
  }

  // Se il perdente è ancora vivo, inizia lui. Altrimenti il successivo giocatore vivo!
  let nextStarterId = loserId;
  const loserStillAlive = alivePlayers.some((p) => p.id === loserId);

  if (!loserStillAlive) {
    // Trova il giocatore successivo nell'ordine
    const allOrdered = Object.values(players).sort((a, b) => a.orderIndex - b.orderIndex);
    const loserIdx = allOrdered.findIndex((p) => p.id === loserId);
    let foundNext = null;
    for (let i = 1; i < allOrdered.length; i++) {
      const candidate = allOrdered[(loserIdx + i) % allOrdered.length];
      if ((candidate.lives || 0) > 0) {
        foundNext = candidate;
        break;
      }
    }
    nextStarterId = foundNext ? foundNext.id : alivePlayers[0].id;
  }

  const updates = {
    'gameState/phase': 'FIRST_ROLL',
    'gameState/currentTurnPlayerId': nextStarterId,
    'gameState/previousPlayerId': null,
    'gameState/actualRoll': null,
    'gameState/diceValues': null,
    'gameState/declaredValue': null,
    'gameState/roundNumber': (gameState.roundNumber || 1) + 1,
  };

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, updates);
  } else {
    roomData.gameState.phase = 'FIRST_ROLL';
    roomData.gameState.currentTurnPlayerId = nextStarterId;
    roomData.gameState.previousPlayerId = null;
    roomData.gameState.actualRoll = null;
    roomData.gameState.diceValues = null;
    roomData.gameState.declaredValue = null;
    roomData.gameState.roundNumber = (roomData.gameState.roundNumber || 1) + 1;
    saveMockRoom(roomCode, roomData);
  }
}

/**
 * Riavvia la partita (Host: Gioca Ancora o Torna in Lobby)
 */
export async function resetRoomToLobby(roomCode) {
  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    const room = snap.val();
    const startingLives = room.settings?.startingLives ?? 6;

    const resetPlayers = {};
    Object.values(room.players || {}).forEach((p) => {
      resetPlayers[p.id] = { ...p, lives: startingLives };
    });

    await update(roomRef, {
      status: 'LOBBY',
      players: resetPlayers,
      gameState: {
        phase: 'FIRST_ROLL',
        currentTurnPlayerId: Object.keys(resetPlayers)[0],
        previousPlayerId: null,
        actualRoll: null,
        diceValues: null,
        declaredValue: null,
        roundNumber: 1,
        lastRoundResult: null,
      },
    });
  } else {
    const room = getMockRoom(roomCode);
    if (!room) return;
    const startingLives = room.settings?.startingLives ?? 6;
    Object.keys(room.players).forEach((id) => {
      room.players[id].lives = startingLives;
    });
    room.status = 'LOBBY';
    saveMockRoom(roomCode, room);
  }
}

/**
 * Sottoscrizione in tempo reale allo stato della stanza.
 * Restituisce una funzione di pulizia (unsubscribe).
 */
export function subscribeToRoom(roomCode, callback, onError) {
  const code = roomCode.trim().toUpperCase();

  if (isFirebaseConfigured()) {
    const roomRef = ref(database, `rooms/${code}`);
    const listener = onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error('Firebase onValue error:', err);
        if (onError) onError(err);
      }
    );

    return () => {
      off(roomRef, 'value', listener);
    };
  } else {
    // Fallback Mock per test offline o prima di configurare Firebase
    const sendUpdate = () => {
      const room = getMockRoom(code);
      callback(room);
    };

    sendUpdate();

    const storageHandler = (e) => {
      if (e.key === `tokyo21_room_${code}`) {
        sendUpdate();
      }
    };
    window.addEventListener('storage', storageHandler);

    let channelHandler = null;
    if (mockBroadcast) {
      channelHandler = (e) => {
        if (e.data && e.data.roomCode === code) {
          sendUpdate();
        }
      };
      mockBroadcast.addEventListener('message', channelHandler);
    }

    return () => {
      window.removeEventListener('storage', storageHandler);
      if (mockBroadcast && channelHandler) {
        mockBroadcast.removeEventListener('message', channelHandler);
      }
    };
  }
}

// ============================================================================
// HELPERS MOCK / LOCALSTORAGE (PERMETTE IL TEST ANCHE SENZA FIREBASE SUBITO ATTIVO)
// ============================================================================

function getMockRoom(code) {
  if (typeof localStorage === 'undefined') return null;
  const data = localStorage.getItem(`tokyo21_room_${code}`);
  return data ? JSON.parse(data) : null;
}

function saveMockRoom(code, roomData) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`tokyo21_room_${code}`, JSON.stringify(roomData));
  if (mockBroadcast) {
    mockBroadcast.postMessage({ type: 'UPDATE_ROOM', roomCode: code });
  }
}
