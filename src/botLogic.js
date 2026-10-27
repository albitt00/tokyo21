/**
 * @file botLogic.js
 * Logica decisionale e intelligenza artificiale per il bot di "Tokyo 21".
 *
 * Questo modulo contiene funzioni pure e indipendenti da React (senza hooks o stato),
 * progettate per simulare il comportamento di un giocatore umano. Include calibrazioni
 * realistiche per:
 * - Valutazione del rischio e chiamata "Dubito" / "Credo".
 * - Bluff al rialzo quando il tiro è vincente (10% delle volte).
 * - Bluff conservativo e credibile quando il tiro è perdente (dichiarazione minima o +1 gradino).
 */

/**
 * Gerarchia immutabile di tutti i possibili punteggi di Tokyo 21,
 * ordinati in modo strettamente crescente dal più basso al più alto.
 *
 * Indici e categorie:
 * - 0 - 8   : Punteggi normali bassi ("31" - "54")
 * - 9 - 13  : Punteggi normali medi/alti ("61" - "65")
 * - 14 - 18 : Coppie/Doppie ("11" - "55")
 * - 19      : Coppia massima ("66")
 * - 20      : TOKYO ("21", punteggio assoluto più alto del gioco)
 *
 * @type {readonly string[]}
 */
export const SCORE_HIERARCHY = Object.freeze([
  '31', '32', '41', '42', '43', '51', '52', '53', '54',
  '61', '62', '63', '64', '65',
  '11', '22', '33', '44', '55', '66',
  '21',
]);

/**
 * Parametri di configurazione e probabilità del Bot.
 *
 * Modificando questi valori è possibile tarare la difficoltà e l'aggressività del bot:
 * - Per rendere il bot più "ingenuo": riduci le percentuali di DUBITO e di bluff.
 * - Per renderlo più "squalo / aggressivo": aumenta la frequenza di DUBITO e il bluff al rialzo.
 */
export const BOT_CONFIG = {
  /**
   * Probabilità base di dubitare quando il bot riceve il bussolotto.
   */
  DOUBT_PROBABILITIES: {
    // Valori bassi (da "31" a "54"): probabilità 0% (il bot si fida sempre)
    LOW: 0.0,

    // Valori medi (da "61" a "65"): probabilità 15%
    MEDIUM: 0.15,

    // Doppie da "11" a "55": probabilità crescente dal 30% ("11") al 50% ("55")
    DOUBLES_MIN: 0.30,
    DOUBLES_MAX: 0.50,

    // Doppia "66": probabilità 65% (punteggio molto forte, facile sia un bluff)
    SIX_SIX: 0.65,

    // TOKYO "21": probabilità 75% (essendo il massimo e costando 2 vite, il bot rischia di smascherare)
    TOKYO: 0.75,
  },

  /**
   * Incremento opzionale alla probabilità di dubitare se la modalità di gioco
   * impone "strictRaise" (> strettamente superiore). In tale modalità accettare
   * un punteggio alto è più penalizzante per il bot poiché non può pareggiare.
   */
  STRICT_RAISE_DOUBT_MODIFIER: 0.05,

  /**
   * Scenario 1: Tiro Vincente (actualRoll soddisfa il requisito minimo).
   */
  WINNING_ROLL: {
    // 90% delle volte dice semplicemente la verità
    TRUTH_RATE: 0.90,

    // 10% delle volte tenta un bluff al rialzo per mettere sotto pressione il prossimo giocatore
    BLUFF_RATE: 0.10,

    // Nel bluff al rialzo: probabilità di salire di 1 gradino (70%) oppure 2 gradini (30%)
    STEP_ONE_CHANCE: 0.70,
  },

  /**
   * Scenario 2: Tiro Perdente (actualRoll < minimumRequiredValue) -> Bluff Obbligato.
   */
  LOSING_ROLL_BLUFF: {
    // Preferisce dichiarare esattamente il valore minimo consentito (75% delle volte)
    EXACT_MINIMUM_RATE: 0.75,

    // Al massimo sale di 1 solo gradino sopra il minimo consentito (25% delle volte)
    NEXT_STEP_RATE: 0.25,
  },
};

/**
 * Restituisce l'indice di un punteggio all'interno della gerarchia SCORE_HIERARCHY.
 *
 * @param {string|number|null|undefined} score - Il punteggio da cercare (es. "42", 42, "21").
 * @returns {number} L'indice da 0 a 20, oppure -1 se non valido o non trovato.
 */
export function getScoreIndex(score) {
  if (score === null || score === undefined) return -1;
  const cleanScore = String(score).trim();
  return SCORE_HIERARCHY.indexOf(cleanScore);
}

/**
 * Calcola la probabilità teorica (compresa tra 0.0 e 1.0) che il bot dubiti
 * della dichiarazione dell'avversario.
 *
 * Suddivisione delle fasce:
 * - Basso ("31" - "54"): 0% (0.0) -> crede sempre.
 * - Medio ("61" - "65"): 15% (0.15).
 * - Doppie ("11" - "55"): progressione lineare dal 30% ("11") al 50% ("55") con passo del 5%.
 * - Coppia "66": 65% (0.65).
 * - TOKYO "21": 75% (0.75).
 *
 * @param {string|number} declaredValue - Il punteggio dichiarato dal giocatore precedente.
 * @param {boolean} [strictRaise=false] - Se true, applica un piccolo bonus di dubbio dovuto alla regola '>'.
 * @returns {number} Valore numerico tra 0 e 1 che rappresenta la probabilità di dubitare.
 */
export function getDoubtProbability(declaredValue, strictRaise = false) {
  const index = getScoreIndex(declaredValue);

  // Se il valore dichiarato è sconosciuto o non valido, non dubita per sicurezza
  if (index === -1) {
    return 0.0;
  }

  const val = SCORE_HIERARCHY[index];
  let probability = 0.0;

  // 1. Fascia Bassa: da "31" a "54" (indici da 0 a 8)
  if (index <= 8) {
    probability = BOT_CONFIG.DOUBT_PROBABILITIES.LOW; // 0%
  }
  // 2. Fascia Media: da "61" a "65" (indici da 9 a 13)
  else if (index <= 13) {
    probability = BOT_CONFIG.DOUBT_PROBABILITIES.MEDIUM; // 15%
  }
  // 3. Doppie da "11" a "55" (indici da 14 a 18): incremento lineare 30% -> 50%
  else if (index <= 18) {
    // "11" -> step 0 (30%)
    // "22" -> step 1 (35%)
    // "33" -> step 2 (40%)
    // "44" -> step 3 (45%)
    // "55" -> step 4 (50%)
    const doubleStep = index - 14;
    const stepSize =
      (BOT_CONFIG.DOUBT_PROBABILITIES.DOUBLES_MAX - BOT_CONFIG.DOUBT_PROBABILITIES.DOUBLES_MIN) / 4;
    probability = BOT_CONFIG.DOUBT_PROBABILITIES.DOUBLES_MIN + doubleStep * stepSize;
  }
  // 4. Doppia "66" (indice 19)
  else if (val === '66' || index === 19) {
    probability = BOT_CONFIG.DOUBT_PROBABILITIES.SIX_SIX; // 65%
  }
  // 5. TOKYO "21" (indice 20)
  else if (val === '21' || index === 20) {
    probability = BOT_CONFIG.DOUBT_PROBABILITIES.TOKYO; // 75%
  }

  // Se strictRaise è attivo e la probabilità base non è zero (cioè non è un punteggio basso),
  // aumentiamo leggermente il dubbio poiché battere il punteggio è più difficile non potendo pareggiare.
  if (strictRaise && probability > 0) {
    probability = Math.min(1.0, probability + BOT_CONFIG.STRICT_RAISE_DOUBT_MODIFIER);
  }

  return probability;
}

/**
 * Funzione 1: decideToDoubt(declaredValue, strictRaise)
 *
 * Simula la decisione del bot quando riceve il bussolotto coperto.
 * Determina se cliccare su "Dubito" (true) oppure "Credo" (false).
 *
 * Calibrazione delle probabilità:
 * - "31" a "54" : 0%   (ci crede sempre, nessun rischio di dubitare)
 * - "61" a "65" : 15%  (dubita raramente)
 * - "11" a "55" : 30% - 50% crescente (30%, 35%, 40%, 45%, 50%)
 * - "66"        : 65%  (spesso percepito come bluff)
 * - "21" (TOKYO): 75%  (penalità doppia, alta tendenza a rischiare la chiamata)
 *
 * @param {string|number} declaredValue - Il punteggio dichiarato dal giocatore precedente.
 * @param {boolean} [strictRaise=false] - Se true, la stanza richiede rilanci strettamente superiori (>).
 * @returns {boolean} true per Dubitare, false per Credere.
 *
 * @example
 * decideToDoubt("42"); // false (probabilità 0%)
 * decideToDoubt("66"); // true nel ~65% dei casi
 * decideToDoubt("21"); // true nel ~75% dei casi
 */
export function decideToDoubt(declaredValue, strictRaise = false) {
  const probability = getDoubtProbability(declaredValue, strictRaise);

  // Casi limite deterministici
  if (probability <= 0) return false;
  if (probability >= 1) return true;

  // Decisione con componente stocastica umana
  return Math.random() < probability;
}

/**
 * Funzione 2: decideWhatToDeclare(actualRoll, minimumRequiredValue, strictRaise)
 *
 * Si attiva dopo che il bot ha tirato i propri dadi. In base al risultato reale ottenuto
 * (sotto il bussolotto) e al vincolo da rispettare, decide quale valore dichiarare ad alta voce.
 *
 * Regola base del gioco:
 * Deve sempre restituire un valore con indice >= (o > con strictRaise) rispetto all'indice
 * di minimumRequiredValue nella gerarchia SCORE_HIERARCHY. Se è il primo a tirare,
 * minimumRequiredValue è nullo e il vincolo parte da indice 0.
 *
 * Scenari gestiti:
 * 1. Tiro vincente (actualRoll >= minimumRequiredValue):
 *    - 90% dei casi: dice la verità restituendo `actualRoll`.
 *    - 10% dei casi: "bluff al rialzo", dichiara un valore leggermente superiore (+1 o +2 gradini)
 *      per mettere in difficoltà il giocatore successivo.
 * 2. Tiro perdente (actualRoll < minimumRequiredValue) -> Bluff Obbligato:
 *    - Il bot è costretto a mentire.
 *    - Sceglie in modo intelligente e realistico: preferisce dichiarare esattamente il minimo
 *      richiesto (o il minimo valido se strictRaise) o al massimo il gradino immediatamente successivo (+1).
 *      Non spara mai un "21" casuale se il minimo richiesto era "42".
 *
 * @param {string|number} actualRoll - Il valore reale dei dadi tirati (es. "53", "21").
 * @param {string|number|null} [minimumRequiredValue=null] - Il valore minimo da superare o pareggiare.
 *                                                          Passare null/undefined se è il primo tiro del round.
 * @param {boolean} [strictRaise=false] - Se true, la regola impone un valore strettamente superiore (>).
 * @returns {string} La stringa del punteggio scelto da dichiarare (es. "53", "61", "21").
 *
 * @example
 * // Tiro vincente reale "53" con minimo "42": 90% dirà "53", 10% dirà "54" o "61"
 * decideWhatToDeclare("53", "42");
 *
 * // Tiro perdente reale "31" con minimo "42": 75% dirà "42", 25% dirà "43"
 * decideWhatToDeclare("31", "42");
 *
 * // Primo lancio del round: nessun minimo imposto
 * decideWhatToDeclare("62", null);
 */
export function decideWhatToDeclare(actualRoll, minimumRequiredValue = null, strictRaise = false) {
  const maxIndex = SCORE_HIERARCHY.length - 1;

  // Normalizza il tiro reale
  const actualStr = String(actualRoll).trim();
  const rawActualIndex = getScoreIndex(actualStr);
  const safeActualIndex = rawActualIndex === -1 ? 0 : rawActualIndex;

  // Gestione del primo lancio del round (minimumRequiredValue è null, undefined o vuoto)
  const isFirstRoll =
    minimumRequiredValue === null ||
    minimumRequiredValue === undefined ||
    minimumRequiredValue === '';

  const minRequiredIndex = isFirstRoll ? 0 : getScoreIndex(minimumRequiredValue);
  const safeMinRequiredIndex = minRequiredIndex === -1 ? 0 : minRequiredIndex;

  // Calcolo dell'indice minimo consentito dal regolamento per questo turno
  let minAllowedIndex = safeMinRequiredIndex;
  if (!isFirstRoll && strictRaise && minAllowedIndex < maxIndex) {
    minAllowedIndex += 1;
  }

  // Determina se il tiro ottenuto è vincente
  let isWinningRoll;
  if (isFirstRoll) {
    // Nel primo lancio qualsiasi tiro è valido e vincente
    isWinningRoll = true;
  } else if (strictRaise) {
    // Con rilancio stretto deve essere strettamente maggiore (oppure Tokyo su Tokyo se già al massimo)
    isWinningRoll =
      safeActualIndex > safeMinRequiredIndex ||
      (safeMinRequiredIndex === maxIndex && safeActualIndex === maxIndex);
  } else {
    // Modalità standard: tiro reale uguale o superiore al minimo richiesto
    isWinningRoll = safeActualIndex >= safeMinRequiredIndex;
  }

  // ===========================================================================
  // SCENARIO 1: Tiro vincente (actualRoll soddisfa il requisito)
  // ===========================================================================
  if (isWinningRoll) {
    // 10% di probabilità di bluff al rialzo
    const wantsToBluff = Math.random() < BOT_CONFIG.WINNING_ROLL.BLUFF_RATE;

    // Se non bluffa o se il tiro reale è già il punteggio massimo (TOKYO "21"), dice la verità
    if (!wantsToBluff || safeActualIndex >= maxIndex) {
      return SCORE_HIERARCHY[safeActualIndex];
    }

    // Bluff al rialzo: alza leggermente (+1 gradino nel 70% dei casi, +2 gradini nel 30%)
    const step = Math.random() < BOT_CONFIG.WINNING_ROLL.STEP_ONE_CHANCE ? 1 : 2;
    const bluffIndex = Math.min(safeActualIndex + step, maxIndex);

    return SCORE_HIERARCHY[bluffIndex];
  }

  // ===========================================================================
  // SCENARIO 2: Tiro perdente (actualRoll < minimumRequiredValue) -> Bluff Obbligato
  // ===========================================================================
  // Il bot mente con discrezione e plausibilità per non insospettire gli avversari:
  // - 75% dei casi: dichiara esattamente il valore minimo consentito
  // - 25% dei casi: alza di 1 solo gradino sopra il minimo consentito
  const shouldRaiseOneStep = Math.random() < BOT_CONFIG.LOSING_ROLL_BLUFF.NEXT_STEP_RATE;

  let chosenIndex = minAllowedIndex;
  if (shouldRaiseOneStep && minAllowedIndex < maxIndex) {
    chosenIndex = minAllowedIndex + 1;
  }

  return SCORE_HIERARCHY[chosenIndex];
}

// Esportazione default con tutte le utilità e costanti del modulo
export default {
  SCORE_HIERARCHY,
  BOT_CONFIG,
  getScoreIndex,
  getDoubtProbability,
  decideToDoubt,
  decideWhatToDeclare,
};
