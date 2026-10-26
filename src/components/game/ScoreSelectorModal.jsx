import React, { useState } from 'react';
import {
  NORMAL_SCORES,
  DOUBLE_SCORES,
  TOKYO_SCORE,
  isScoreValidRaise,
  formatScoreLabel,
} from '../../utils/tokyoLogic';
import { Flame, Check, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { playClickSound, playTokyoSound } from '../../utils/soundEffects';

export default function ScoreSelectorModal({
  isOpen,
  actualRoll,
  previousDeclaredValue,
  strictRaise = false,
  nextPlayerName = 'Giocatore',
  onConfirmDeclaration,
  onCancel,
}) {
  if (!isOpen) return null;

  // Seleziona di default il tiro reale se è una dichiarazione valida, altrimenti null
  const isActualValid = isScoreValidRaise(actualRoll, previousDeclaredValue, strictRaise);
  const [selectedScore, setSelectedScore] = useState(isActualValid ? actualRoll : null);

  const handleSelect = (score) => {
    if (!isScoreValidRaise(score, previousDeclaredValue, strictRaise)) return;
    playClickSound();
    if (score === TOKYO_SCORE) {
      playTokyoSound();
    }
    setSelectedScore(score);
  };

  const handleConfirm = () => {
    if (!selectedScore) return;
    playClickSound();
    onConfirmDeclaration(selectedScore);
  };

  const isBluffing = selectedScore && actualRoll && selectedScore !== actualRoll;

  return (
    <div className="modal-backdrop">
      <div className="modal-content score-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <div>
            <h3 className="selector-title">Cosa vuoi dichiarare?</h3>
            <p className="selector-subtitle">
              Puoi dire la verità o bluffare! Passerai il bussolotto a <strong>{nextPlayerName}</strong>.
            </p>
          </div>
        </div>

        {/* Banner promemoria tiro reale */}
        <div className="actual-roll-reminder">
          <div className="reminder-left">
            <span className="reminder-label">I tuoi dadi reali:</span>
            <span className="reminder-value">{actualRoll}</span>
          </div>
          {isActualValid && (
            <button
              type="button"
              className={`truth-quick-btn ${selectedScore === actualRoll ? 'truth-selected' : ''}`}
              onClick={() => handleSelect(actualRoll)}
            >
              <Check size={14} /> Dichiara Verità ({actualRoll})
            </button>
          )}
        </div>

        {/* Informazione sulla regola del turno */}
        {previousDeclaredValue && (
          <div className="raise-rule-note">
            <span>
              Valore da battere: <strong>{previousDeclaredValue}</strong> ({strictRaise ? 'Regola: > Strettamente superiore' : 'Regola: ≥ Uguale o superiore'})
            </span>
          </div>
        )}

        <div className="selector-scroll-area">
          {/* SEZIONE 3: TOKYO 21 (SPECIALE IN CIMA) */}
          <div className="category-group tokyo-category">
            <div className="category-header">
              <span className="category-title gold-text">
                <Flame size={16} /> TOKYO 21 (Punteggio Massimo)
              </span>
            </div>
            {(() => {
              const isValid = isScoreValidRaise(TOKYO_SCORE, previousDeclaredValue, strictRaise);
              const isSelected = selectedScore === TOKYO_SCORE;
              return (
                <button
                  type="button"
                  className={`tokyo-hero-btn ${isSelected ? 'tokyo-selected' : ''} ${
                    !isValid ? 'btn-disabled' : ''
                  }`}
                  onClick={() => handleSelect(TOKYO_SCORE)}
                  disabled={!isValid}
                >
                  <Flame size={20} className="flame-left" />
                  <span className="tokyo-btn-text">DICHIARA TOKYO (21)</span>
                  <Flame size={20} className="flame-right" />
                </button>
              );
            })()}
          </div>

          {/* SEZIONE 2: DOPPIE */}
          <div className="category-group">
            <div className="category-header">
              <span className="category-title">⭐ Doppie (battono tutti i normali)</span>
            </div>
            <div className="chips-grid doubles-grid">
              {DOUBLE_SCORES.map((score) => {
                const isValid = isScoreValidRaise(score, previousDeclaredValue, strictRaise);
                const isSelected = selectedScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    className={`score-select-chip chip-double ${
                      isSelected ? 'chip-selected' : ''
                    } ${!isValid ? 'chip-disabled' : ''}`}
                    onClick={() => handleSelect(score)}
                    disabled={!isValid}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEZIONE 1: PUNTEGGI NORMALI */}
          <div className="category-group">
            <div className="category-header">
              <span className="category-title">🎲 Punteggi Normali</span>
            </div>
            <div className="chips-grid normals-grid">
              {NORMAL_SCORES.map((score) => {
                const isValid = isScoreValidRaise(score, previousDeclaredValue, strictRaise);
                const isSelected = selectedScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    className={`score-select-chip ${isSelected ? 'chip-selected' : ''} ${
                      !isValid ? 'chip-disabled' : ''
                    }`}
                    onClick={() => handleSelect(score)}
                    disabled={!isValid}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con conferma dichiarazione */}
        <div className="selector-footer">
          {isBluffing && (
            <div className="bluff-indicator-hint">
              <AlertTriangle size={15} className="warning-text" />
              <span>Stai bluffando! Hai {actualRoll} ma dichiarerai {selectedScore}.</span>
            </div>
          )}

          <button
            type="button"
            className="primary-btn confirm-declaration-btn pulse-glow"
            onClick={handleConfirm}
            disabled={!selectedScore}
          >
            <Send size={18} />
            <span>
              {selectedScore
                ? `Dichiara ${selectedScore} e Passa a ${nextPlayerName}`
                : 'Seleziona un valore da dichiarare'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
