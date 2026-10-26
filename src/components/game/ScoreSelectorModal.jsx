import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  NORMAL_SCORES,
  DOUBLE_SCORES,
  TOKYO_SCORE,
  isScoreValidRaise,
} from '../../utils/tokyoLogic';
import { Flame, Send, AlertTriangle, Zap, X } from 'lucide-react';
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

  // Azione rapida a 1 tocco: Dichiara la verità e passa immediatamente!
  const handleQuickTruthConfirm = () => {
    if (!isActualValid) return;
    playClickSound();
    if (actualRoll === TOKYO_SCORE) {
      playTokyoSound();
    }
    onConfirmDeclaration(actualRoll);
  };

  const isBluffing = selectedScore && actualRoll && selectedScore !== actualRoll;

  const modalJSX = (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content score-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Intestazione */}
        <div className="selector-header">
          <div>
            <h3 className="selector-title">Scegli cosa dichiarare</h3>
            <p className="selector-subtitle">
              Passerai il bussolotto a <strong>{nextPlayerName}</strong>
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              className="icon-btn-close"
              onClick={onCancel}
              title="Chiudi e guarda il tavolo"
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Box Tiro Reale + Pulsante Rapido a 1 Tocco */}
        <div className="actual-roll-reminder">
          <div className="reminder-left">
            <span className="reminder-label">I tuoi dadi reali:</span>
            <span className="reminder-value">{actualRoll}</span>
          </div>
          {isActualValid ? (
            <button
              type="button"
              className="quick-truth-direct-btn pulse-green"
              onClick={handleQuickTruthConfirm}
              title="Dichiara il valore reale e passa direttamente il turno"
            >
              <Zap size={15} />
              <span>Dichiara Verità ({actualRoll}) &rarr;</span>
            </button>
          ) : (
            <span className="must-bluff-badge">
              Inferiore: devi bluffare!
            </span>
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

        {/* Area Scorrevole con le Opzioni di Punteggio */}
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

        {/* Footer FISSO in basso: Conferma e Passa */}
        <div className="selector-footer">
          {isBluffing && (
            <div className="bluff-indicator-hint">
              <AlertTriangle size={15} className="warning-text" />
              <span>Stai bluffando! Hai {actualRoll} ma dichiarerai {selectedScore}.</span>
            </div>
          )}

          <button
            type="button"
            className={`primary-btn confirm-declaration-btn pulse-glow ${!selectedScore ? 'btn-disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!selectedScore}
          >
            <Send size={18} />
            <span>
              {selectedScore
                ? `CONFERMA: ${selectedScore} ➔ Passa a ${nextPlayerName}`
                : 'Seleziona un valore sopra per confermare'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  // Utilizza createPortal per agganciare il modale al body ed evitare qualsiasi limitazione
  // di backdrop-filter o overflow dei container padre
  return typeof document !== 'undefined'
    ? createPortal(modalJSX, document.body)
    : modalJSX;
}
