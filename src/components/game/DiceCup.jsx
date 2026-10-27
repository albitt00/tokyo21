import React from 'react';
import DiceFace from './DiceFace';
import { Eye, Lock, Dices } from 'lucide-react';

/**
 * Bussolotto per il gioco di Tokyo 21 con animazione di suspense
 */
export default function DiceCup({
  diceValues = [1, 1],
  actualRoll = '11',
  isRevealed = false,
  isRollerPeeking = false,
  isRolling = false,
  activePlayerName = 'Giocatore',
  _isMyTurn = false,
}) {
  const showDice = (isRevealed || isRollerPeeking) && !isRolling;

  return (
    <div className="dice-cup-arena">
      <div className="arena-felt-table">
        {/* Feltro da gioco con cerchio dorato */}
        <div className="felt-ring">
          {/* Rendering condizionale: durante isRolling mostra l'animazione di scuotimento, altrimenti dadi fissi */}
          {isRolling ? (
            <div className="rolling-dice-ghost-wrap">
              <div className="rolling-dice-pair-anim">
                <div className="ghost-die die-1">🎲</div>
                <div className="ghost-die die-2">🎲</div>
              </div>
              <span className="rolling-pulse-text">Dadi in scuotimento...</span>
            </div>
          ) : (
            <div className={`table-dice-layer ${showDice ? 'dice-visible' : 'dice-hidden'}`}>
              {diceValues && diceValues.length === 2 ? (
                <div className="dice-pair">
                  <DiceFace value={diceValues[0]} size="lg" />
                  <DiceFace value={diceValues[1]} size="lg" />
                </div>
              ) : (
                <div className="empty-dice-placeholder">
                  <span>Dadi nel bussolotto</span>
                </div>
              )}
              {showDice && actualRoll && (
                <div className="real-roll-tag">
                  <span>Valore Reale: </span>
                  <strong>{actualRoll}</strong>
                </div>
              )}
            </div>
          )}

          {/* Il Bussolotto (Cup) 3D con scuotimento e ombra dinamica */}
          <div
            className={`bussolotto-cup ${isRevealed ? 'cup-lifted' : 'cup-closed'} ${
              isRolling ? 'cup-shaking' : ''
            }`}
          >
            <div className="cup-rim"></div>
            <div className="cup-body">
              <div className="cup-emblem">🏺</div>
              <div className="cup-label">TOKYO 21</div>
            </div>
            <div className={`cup-shadow ${isRolling ? 'cup-shadow-shaking' : ''}`}></div>
          </div>
        </div>

        {/* Etichetta di stato sotto il bussolotto */}
        <div className="cup-status-strip">
          {isRolling ? (
            <div className="status-rolling-pill">
              <Dices size={15} className="spinning-dice-icon" />
              <span>Scuotimento bussolotto in corso...</span>
            </div>
          ) : isRevealed ? (
            <div className="status-revealed-pill">
              <Eye size={14} className="gold-text" />
              <span>Bussolotto Alzato! Dadi svelati a tutti</span>
            </div>
          ) : isRollerPeeking ? (
            <div className="status-secret-pill">
              <Eye size={14} className="gold-text" />
              <span>Solo tu vedi questi dadi! Scegli cosa dichiarare</span>
            </div>
          ) : (
            <div className="status-hidden-pill">
              <Lock size={14} />
              <span>Bussolotto chiuso &bull; {activePlayerName} ha il turno</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
