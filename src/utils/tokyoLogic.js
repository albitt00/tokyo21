/**
 * Regole del gioco Tokyo 21 (Mia / Mexico / 21)
 *
 * Gerarchia dei punteggi (dal più basso al più alto):
 * 1. Punteggi Normali: 31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65
 * 2. Doppie: 11, 22, 33, 44, 55, 66 (battono tutti i punteggi normali)
 * 3. TOKYO (21): il punteggio assoluto più alto
 */

export const NORMAL_SCORES = [
  '31', '32', '41', '42', '43', '51', '52', '53', '54', '61', '62', '63', '64', '65',
];

export const DOUBLE_SCORES = ['11', '22', '33', '44', '55', '66'];

export const TOKYO_SCORE = '21';

export const ALL_SCORES = [...NORMAL_SCORES, ...DOUBLE_SCORES, TOKYO_SCORE];

/**
 * Ottiene il punteggio di Tokyo a partire da due dadi a 6 facce.
 * La cifra più alta viene sempre posizionata per prima (es. [3, 5] -> "53", [1, 2] -> "21").
 * @param {number} d1 - Valore del dado 1 (1-6)
 * @param {number} d2 - Valore del dado 2 (1-6)
 * @returns {string} punteggio ordinato
 */
export function getScoreFromDice(d1, d2) {
  const high = Math.max(d1, d2);
  const low = Math.min(d1, d2);
  return `${high}${low}`;
}

/**
 * Genera un nuovo lancio di 2 dadi casuali [1-6, 1-6]
 * @returns {[number, number]}
 */
export function generateDiceRoll() {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return [d1, d2];
}

/**
 * Restituisce il rango (indice gerarchico da 0 a 20) di un punteggio.
 * @param {string|number} score
 * @returns {number} 0-20 oppure -1 se invalido
 */
export function getScoreRank(score) {
  return ALL_SCORES.indexOf(String(score));
}

/**
 * Confronta due punteggi secondo la gerarchia di Tokyo 21.
 * @param {string|number} scoreA
 * @param {string|number} scoreB
 * @returns {number} > 0 se scoreA batte scoreB, < 0 se scoreB batte scoreA, 0 se pari
 */
export function compareScores(scoreA, scoreB) {
  const rankA = getScoreRank(scoreA);
  const rankB = getScoreRank(scoreB);
  return rankA - rankB;
}

/**
 * Verifica se una dichiarazione è un rilancio valido rispetto al valore precedente.
 * @param {string} declaredScore - Il valore che si vuole dichiarare
 * @param {string|null} previousDeclaredScore - Il valore dichiarato precedentemente (o null al primo lancio)
 * @param {boolean} strictRaise - Se true richiede strettamente superiore (>), altrimenti uguale o superiore (>=)
 * @returns {boolean}
 */
export function isScoreValidRaise(declaredScore, previousDeclaredScore, strictRaise = false) {
  const newRank = getScoreRank(declaredScore);
  if (newRank === -1) return false;

  // Primo lancio del round: qualsiasi valore è valido
  if (!previousDeclaredScore) return true;

  const prevRank = getScoreRank(previousDeclaredScore);
  if (prevRank === -1) return true;

  // Se il precedente era TOKYO (21), è il punteggio massimo:
  // anche in modalità stretta, l'unica possibilità di dichiarazione per chi accetta il Tokyo è pareggiarlo con Tokyo (21)
  if (previousDeclaredScore === TOKYO_SCORE) {
    return declaredScore === TOKYO_SCORE;
  }

  if (strictRaise) {
    return newRank > prevRank;
  }
  return newRank >= prevRank;
}

/**
 * Restituisce la lista di tutti i valori dichiarabili in base al valore precedente e alle regole.
 * @param {string|null} previousDeclaredScore
 * @param {boolean} strictRaise
 * @returns {string[]}
 */
export function getAvailableScores(previousDeclaredScore, strictRaise = false) {
  return ALL_SCORES.filter((s) => isScoreValidRaise(s, previousDeclaredScore, strictRaise));
}

/**
 * Risolve la fase di DUBITO! determinando chi perde vite e quante.
 *
 * Regole:
 * - Se valoreReale >= valoreDichiarato: Chi ha dubitato perde 1 vita (o 2 se era Tokyo 21)
 * - Se valoreReale < valoreDichiarato: Chi ha lanciato (bluff) perde 1 vita (o 2 se era Tokyo 21)
 *
 * @param {string} actualRoll - Il valore reale presente sotto al bussolotto
 * @param {string} declaredValue - Il valore dichiarato dal lanciatore
 * @param {string} rollerId - ID del lanciatore (previousPlayerId)
 * @param {string} rollerName - Nome del lanciatore
 * @param {string} doubterId - ID di chi ha dubitato (currentTurnPlayerId)
 * @param {string} doubterName - Nome di chi ha dubitato
 * @returns {{
 *   wasBluff: boolean,
 *   isTruth: boolean,
 *   loserId: string,
 *   loserName: string,
 *   winnerId: string,
 *   winnerName: string,
 *   livesLost: number,
 *   actualRoll: string,
 *   declaredValue: string,
 *   isTokyo: boolean,
 *   summaryMessage: string
 * }}
 */
export function resolveDoubt(actualRoll, declaredValue, rollerId, rollerName, doubterId, doubterName) {
  const cmp = compareScores(actualRoll, declaredValue);
  const isTruth = cmp >= 0; // Il lanciatore aveva almeno quanto dichiarato (o meglio!)
  const wasBluff = !isTruth; // Il lanciatore ha bluffato (aveva meno)

  const isTokyo = declaredValue === TOKYO_SCORE;
  const livesLost = 1; // Chi perde il confronto perde 1 vita anche su Tokyo 21

  let loserId;
  let loserName;
  let winnerId;
  let winnerName;
  let summaryMessage = '';

  if (wasBluff) {
    // Bluff scoperto! Chi ha lanciato perde 1 vita
    loserId = rollerId;
    loserName = rollerName;
    winnerId = doubterId;
    winnerName = doubterName;

    summaryMessage = isTokyo
      ? `Bluff scoperto su TOKYO 21! ${rollerName} aveva ${actualRoll} ma ha dichiarato ${declaredValue}. Perde 1 vita!`
      : `Bluff scoperto! ${rollerName} aveva ${actualRoll} ma ha dichiarato ${declaredValue}. Perde 1 vita!`;
  } else {
    // Era vero (o persino superiore)! Chi ha dubitato perde 1 vita
    loserId = doubterId;
    loserName = doubterName;
    winnerId = rollerId;
    winnerName = rollerName;

    summaryMessage = isTokyo
      ? `Era davvero TOKYO 21! ${doubterName} ha dubitato a torto e perde 1 vita!`
      : `${rollerName} diceva la verità (${actualRoll} >= ${declaredValue}). ${doubterName} perde 1 vita!`;
  }

  return {
    wasBluff,
    isTruth,
    loserId,
    loserName,
    winnerId,
    winnerName,
    livesLost,
    actualRoll,
    declaredValue,
    isTokyo,
    summaryMessage,
  };
}

/**
 * Etichetta formattata per mostrare il punteggio
 * @param {string} score
 * @returns {string}
 */
export function formatScoreLabel(score) {
  if (score === TOKYO_SCORE) return 'TOKYO (21) 🔥';
  if (DOUBLE_SCORES.includes(score)) return `Doppia ${score}`;
  return score;
}
