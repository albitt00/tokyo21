import { useEffect, useRef } from 'react';
import {
  generateDiceRoll,
  getScoreFromDice,
} from '../utils/tokyoLogic.js';
import {
  decideToDoubt,
  decideWhatToDeclare,
} from '../botLogic.js';
import {
  submitFirstRoll,
  submitAcceptAndRoll,
  submitDoubt,
  startNextRound,
  getNextAlivePlayer,
} from '../services/gameService.js';
import {
  playDiceRollSound,
  playCupLiftSound,
  playDoubtSound,
} from '../utils/soundEffects.js';

/**
 * Hook per la gestione autonoma dei turni dei Bot IA in partita.
 */
export function useBotManager({
  roomCode,
  roomData,
  playerId,
}) {
  const lastProcessedTurnRef = useRef('');

  const status = roomData?.status;
  const gameState = roomData?.gameState || {};
  const players = roomData?.players || {};
  const settings = roomData?.settings || { strictRaise: false };

  const {
    phase = 'FIRST_ROLL',
    currentTurnPlayerId,
    declaredValue,
    roundNumber = 1,
  } = gameState;

  const currentTurnPlayer = players[currentTurnPlayerId];
  const isBotTurn = Boolean(
    status === 'PLAYING' &&
    currentTurnPlayer &&
    currentTurnPlayer.isBot &&
    (currentTurnPlayer.lives ?? 0) > 0
  );

  // Calcolo sincrono del messaggio di stato (senza setState in useEffect)
  let botActionMessage = '';
  if (isBotTurn) {
    if (phase === 'FIRST_ROLL') {
      botActionMessage = `${currentTurnPlayer.nickname} sta preparando il lancio...`;
    } else if (phase === 'DECISION') {
      botActionMessage = `${currentTurnPlayer.nickname} sta decidendo se credere o dubitare...`;
    }
  }

  // Determina se questo client è il "pilota" autorizzato ad inviare comandi per i bot.
  const aliveHumans = Object.values(players)
    .filter((p) => !p.isBot && (p.lives ?? 0) > 0 && p.connected !== false)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const anyHumans = Object.values(players)
    .filter((p) => !p.isBot && p.connected !== false)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const isBotDriver = aliveHumans.length > 0
    ? aliveHumans[0].id === playerId
    : anyHumans.length > 0 && anyHumans[0].id === playerId;

  useEffect(() => {
    if (!isBotTurn || !isBotDriver) {
      return;
    }

    const turnKey = `${roundNumber}_${phase}_${currentTurnPlayerId}_${declaredValue || 'none'}`;
    if (lastProcessedTurnRef.current === turnKey) {
      return;
    }

    let isMounted = true;
    let timerId = null;

    if (phase === 'FIRST_ROLL') {
      lastProcessedTurnRef.current = turnKey;

      timerId = setTimeout(async () => {
        if (!isMounted) return;
        try {
          playDiceRollSound();
          const dice = generateDiceRoll();
          const actualRoll = getScoreFromDice(dice[0], dice[1]);
          const chosenDeclaration = decideWhatToDeclare(actualRoll, null, settings.strictRaise);
          const nextPlayer = getNextAlivePlayer(players, currentTurnPlayerId);

          if (nextPlayer) {
            await submitFirstRoll(
              roomCode,
              currentTurnPlayerId,
              dice,
              actualRoll,
              chosenDeclaration,
              nextPlayer.id
            );
          }
        } catch (err) {
          console.error('Errore esecuzione bot FIRST_ROLL:', err);
        }
      }, 1600);
    } else if (phase === 'DECISION') {
      lastProcessedTurnRef.current = turnKey;

      timerId = setTimeout(async () => {
        if (!isMounted) return;
        try {
          const wantsToDoubt = decideToDoubt(declaredValue, settings.strictRaise);

          if (wantsToDoubt) {
            playDoubtSound();
            playCupLiftSound();
            await submitDoubt(roomCode);
          } else {
            playDiceRollSound();
            const dice = generateDiceRoll();
            const actualRoll = getScoreFromDice(dice[0], dice[1]);
            const chosenDeclaration = decideWhatToDeclare(
              actualRoll,
              declaredValue,
              settings.strictRaise
            );
            const nextPlayer = getNextAlivePlayer(players, currentTurnPlayerId);

            if (nextPlayer) {
              await submitAcceptAndRoll(
                roomCode,
                currentTurnPlayerId,
                dice,
                actualRoll,
                chosenDeclaration,
                nextPlayer.id
              );
            }
          }
        } catch (err) {
          console.error('Errore esecuzione bot DECISION:', err);
        }
      }, 1900);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [
    isBotTurn,
    isBotDriver,
    phase,
    currentTurnPlayerId,
    declaredValue,
    roundNumber,
    roomCode,
    players,
    settings.strictRaise,
  ]);

  // Se tutti i giocatori vivi sono bot e siamo in REVEAL, avanza automaticamente il round
  useEffect(() => {
    if (status !== 'PLAYING' || phase !== 'REVEAL' || !isBotDriver) return;

    const aliveHumansCount = Object.values(players).filter(
      (p) => !p.isBot && (p.lives ?? 0) > 0
    ).length;

    if (aliveHumansCount === 0) {
      const timer = setTimeout(() => {
        startNextRound(roomCode).catch(console.error);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, phase, isBotDriver, players, roomCode]);

  return {
    botActionMessage,
    isBotDriver,
  };
}
