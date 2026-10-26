import React, { useState, useEffect } from 'react';
import {
  generateDiceRoll,
  getScoreFromDice,
  isScoreValidRaise,
  TOKYO_SCORE,
} from '../../utils/tokyoLogic';
import {
  submitFirstRoll,
  submitAcceptAndRoll,
  submitDoubt,
  startNextRound,
  getNextAlivePlayer,
} from '../../services/gameService';
import {
  playDiceRollSound,
  playCupLiftSound,
  playDoubtSound,
  playLoseLifeSound,
  playClickSound,
} from '../../utils/soundEffects';
import ScoreSelectorModal from './ScoreSelectorModal';
import {
  Dices,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Flame,
  ShieldX,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';

export default function GameControls({
  roomCode,
  roomData,
  playerId,
  onLocalDiceRolled,
  localDiceState,
  setLocalDiceState,
}) {
  const gameState = roomData?.gameState || {};
  const players = roomData?.players || {};
  const settings = roomData?.settings || { strictRaise: false };

  const {
    phase = 'FIRST_ROLL',
    currentTurnPlayerId,
    previousPlayerId,
    declaredValue,
    actualRoll,
    lastRoundResult,
  } = gameState;

  const isMyTurn = currentTurnPlayerId === playerId;
  const currentTurnPlayer = players[currentTurnPlayerId] || { nickname: 'Giocatore' };
  const previousPlayer = players[previousPlayerId] || { nickname: 'Precedente' };

  // Prossimo giocatore vivo a cui passare il bussolotto
  const nextPlayer = getNextAlivePlayer(players, playerId);
  const nextPlayerName = nextPlayer ? nextPlayer.nickname : 'Prossimo Giocatore';

  // Stato modale selettore dichiarazione
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Azione: Primo Lancio del Round
  const handleFirstRollDice = () => {
    playDiceRollSound();
    const dice = generateDiceRoll();
    const rollScore = getScoreFromDice(dice[0], dice[1]);

    setLocalDiceState({
      diceValues: dice,
      actualRoll: rollScore,
      isPeeking: true,
      mode: 'FIRST_ROLL',
    });

    onLocalDiceRolled?.(dice, rollScore);
    setShowScoreModal(true);
  };

  // 2. Azione: CREDO (Accetta e Rilancia)
  const handleCredoAccept = () => {
    playDiceRollSound();
    const dice = generateDiceRoll();
    const rollScore = getScoreFromDice(dice[0], dice[1]);

    setLocalDiceState({
      diceValues: dice,
      actualRoll: rollScore,
      isPeeking: true,
      mode: 'ROLLING',
    });

    onLocalDiceRolled?.(dice, rollScore);
    setShowScoreModal(true);
  };

  // Conferma Dichiarazione dal Modale
  const handleConfirmDeclaration = async (chosenDeclaration) => {
    if (!nextPlayer) return;
    setIsSubmitting(true);
    setShowScoreModal(false);

    try {
      if (localDiceState?.mode === 'FIRST_ROLL' || phase === 'FIRST_ROLL') {
        await submitFirstRoll(
          roomCode,
          playerId,
          localDiceState.diceValues,
          localDiceState.actualRoll,
          chosenDeclaration,
          nextPlayer.id
        );
      } else {
        await submitAcceptAndRoll(
          roomCode,
          playerId,
          localDiceState.diceValues,
          localDiceState.actualRoll,
          chosenDeclaration,
          nextPlayer.id
        );
      }
      // Reset stato locale
      setLocalDiceState(null);
    } catch (err) {
      console.error('Errore invio dichiarazione:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Azione: DUBITO! (Alza il Bussolotto)
  const handleDubito = async () => {
    playDoubtSound();
    playCupLiftSound();
    setIsSubmitting(true);

    try {
      await submitDoubt(roomCode);
    } catch (err) {
      console.error('Errore durante Dubito:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Azione: Prossimo Round
  const handleNextRound = async () => {
    playClickSound();
    setIsSubmitting(true);
    try {
      await startNextRound(roomCode);
    } catch (err) {
      console.error('Errore avvio prossimo round:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Riproduci suono perdita vita quando si entra in REVEAL
  useEffect(() => {
    if (phase === 'REVEAL' && lastRoundResult) {
      playLoseLifeSound();
    }
  }, [phase, lastRoundResult]);

  return (
    <div className="game-controls-container">
      {/* =========================================================================
          FASE 1: FIRST_ROLL
         ========================================================================= */}
      {phase === 'FIRST_ROLL' && (
        <div className="controls-phase-wrap">
          {isMyTurn ? (
            <div className="my-turn-actions">
              <span className="turn-action-prompt">
                Tocca a te iniziare il round! Lancia i dadi sotto il bussolotto:
              </span>
              {!localDiceState ? (
                <button
                  type="button"
                  className="primary-btn roll-action-btn pulse-glow"
                  onClick={handleFirstRollDice}
                  disabled={isSubmitting}
                >
                  <Dices size={24} />
                  <span>Lancia i Dadi</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn pass-action-btn pulse-glow"
                  onClick={() => setShowScoreModal(true)}
                  disabled={isSubmitting}
                >
                  <Send size={20} />
                  <span>Scegli cosa dichiarare e passa a {nextPlayerName}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="waiting-turn-box">
              <div className="pulse-dot"></div>
              <span>
                In attesa che <strong>{currentTurnPlayer.nickname}</strong> lanci i dadi...
              </span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FASE 2: DECISION
         ========================================================================= */}
      {phase === 'DECISION' && (
        <div className="controls-phase-wrap">
          {isMyTurn ? (
            localDiceState ? (
              <div className="my-turn-actions">
                <span className="turn-action-prompt">
                  Hai accettato! Dadi reali: <strong>{localDiceState.actualRoll}</strong>. Ora scegli cosa dichiarare:
                </span>
                <button
                  type="button"
                  className="primary-btn pass-action-btn pulse-glow"
                  onClick={() => setShowScoreModal(true)}
                  disabled={isSubmitting}
                >
                  <Send size={20} />
                  <span>Scegli cosa dichiarare e Passa a {nextPlayerName}</span>
                </button>
              </div>
            ) : (
              <div className="decision-actions-grid">
                <span className="decision-headline">
                  <strong>{previousPlayer.nickname}</strong> ti passa il bussolotto con{' '}
                  <span className="gold-text bold-value">{declaredValue}</span>. Cosa fai?
                </span>

                <div className="decision-buttons-row">
                  {/* DUBITO! */}
                  <button
                    type="button"
                    className="danger-btn dubito-btn pulse-red"
                    onClick={handleDubito}
                    disabled={isSubmitting}
                  >
                    <AlertOctagon size={22} />
                    <div className="btn-text-col">
                      <span className="btn-main-label">DUBITO!</span>
                      <span className="btn-sub-label">Alza il bussolotto</span>
                    </div>
                  </button>

                  {/* CREDO */}
                  <button
                    type="button"
                    className="credo-btn pulse-green"
                    onClick={handleCredoAccept}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 size={22} />
                    <div className="btn-text-col">
                      <span className="btn-main-label">CREDO</span>
                      <span className="btn-sub-label">Accetta &amp; Rilancia</span>
                    </div>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="waiting-turn-box">
              <div className="pulse-dot"></div>
              <span>
                In attesa della decisione di <strong>{currentTurnPlayer.nickname}</strong>...
              </span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FASE 3: REVEAL (RIVELAZIONE E PENALITÀ)
         ========================================================================= */}
      {phase === 'REVEAL' && lastRoundResult && (
        <div className="controls-phase-wrap reveal-outcome-card">
          <div className="outcome-header">
            {lastRoundResult.wasBluff ? (
              <div className="outcome-badge outcome-bluff">
                <ShieldX size={20} />
                <span>BLUFF SCOPERTO!</span>
              </div>
            ) : (
              <div className="outcome-badge outcome-truth">
                <ShieldCheck size={20} />
                <span>ERA LA VERITÀ!</span>
              </div>
            )}
          </div>

          <div className="outcome-details">
            <p className="outcome-summary">{lastRoundResult.summaryMessage}</p>

            <div className="comparison-chips">
              <div className="comp-chip">
                <span className="comp-label">Dadi Reali</span>
                <span className="comp-val">{lastRoundResult.actualRoll}</span>
              </div>
              <span className="comp-vs">vs</span>
              <div className="comp-chip">
                <span className="comp-label">Dichiarato</span>
                <span className="comp-val gold-text">{lastRoundResult.declaredValue}</span>
              </div>
            </div>

            {lastRoundResult.isTokyo && (
              <div className="tokyo-penalty-banner">
                <Flame size={18} className="gold-text" />
                <span>Regola Speciale Tokyo 21: Perde ben 2 vite!</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="primary-btn next-round-btn pulse-glow"
            onClick={handleNextRound}
            disabled={isSubmitting}
          >
            <ArrowRight size={20} />
            <span>Prossimo Round</span>
          </button>
        </div>
      )}

      {/* Modale di selezione dichiarazione */}
      {localDiceState && (
        <ScoreSelectorModal
          isOpen={showScoreModal}
          actualRoll={localDiceState.actualRoll}
          previousDeclaredValue={phase === 'FIRST_ROLL' ? null : declaredValue}
          strictRaise={settings.strictRaise}
          nextPlayerName={nextPlayerName}
          onConfirmDeclaration={handleConfirmDeclaration}
          onCancel={() => setShowScoreModal(false)}
        />
      )}
    </div>
  );
}
