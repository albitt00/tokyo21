import React from 'react';
import { useGame } from '../context/GameContext';
import { X, Flame, ShieldAlert, Award, Dice5 } from 'lucide-react';
import { NORMAL_SCORES, DOUBLE_SCORES, TOKYO_SCORE } from '../utils/tokyoLogic';
import { playClickSound } from '../utils/soundEffects';

export default function RulesModal() {
  const { showRulesModal, setShowRulesModal } = useGame();

  if (!showRulesModal) return null;

  const handleClose = () => {
    playClickSound();
    setShowRulesModal(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Award className="gold-text" size={24} />
            <h2>Regole di Tokyo 21</h2>
          </div>
          <button className="icon-btn-close" onClick={handleClose} aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body rules-body">
          {/* Obiettivo */}
          <section className="rules-section">
            <h3 className="section-title">
              <Dice5 size={18} className="gold-text" /> Scopo del Gioco
            </h3>
            <p>
              Tokyo 21 è un gioco di dadi a eliminazione, bluff e sangue freddo. Si gioca con 2 dadi a 6 facce.
              L'ultimo giocatore a rimanere con almeno una vita vince la partita!
            </p>
          </section>

          {/* Gerarchia Punteggi */}
          <section className="rules-section">
            <h3 className="section-title">
              <Flame size={18} className="gold-text" /> Gerarchia dei Punteggi (dal più basso al più alto)
            </h3>
            <p className="rules-note">
              Ogni lancio si legge sempre posizionando <strong>la cifra più alta per prima</strong> (es. 3 e 5 = <strong>53</strong>).
            </p>

            <div className="rank-group">
              <span className="rank-label rank-label-tokyo">🔥 3. TOKYO 21 (Punteggio Massimo Assoluto)</span>
              <div className="score-chips">
                <span className="score-chip score-chip-tokyo">{TOKYO_SCORE} (Tokyo)</span>
              </div>
              <p className="rank-desc">Batte qualsiasi doppia e qualsiasi punteggio normale.</p>
            </div>

            <div className="rank-group">
              <span className="rank-label rank-label-doubles">⭐ 2. Doppie (Batte tutti i normali)</span>
              <div className="score-chips">
                {DOUBLE_SCORES.map((s) => (
                  <span key={s} className="score-chip score-chip-double">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rank-group">
              <span className="rank-label rank-label-normal">🎲 1. Punteggi Normali (In ordine crescente)</span>
              <div className="score-chips">
                {NORMAL_SCORES.map((s) => (
                  <span key={s} className="score-chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Dinamica del Turno */}
          <section className="rules-section">
            <h3 className="section-title">
              <ShieldAlert size={18} className="gold-text" /> Dinamica del Turno
            </h3>
            <ol className="rules-steps">
              <li>
                <strong>Primo Lancio</strong>: Il giocatore lancia i dadi in segreto sotto il bussolotto.
                Vede il risultato reale solo lui e dichiara un valore a voce (può dire la verità o bluffare) passando il bussolotto al giocatore successivo.
              </li>
              <li>
                <strong>Decisione di chi riceve</strong>:
                <ul>
                  <li>
                    <strong>CREDO (Accetta)</strong>: Ritiene vera la dichiarazione (o accetta il rischio), lancia a sua volta in segreto e <strong>DEVE dichiarare un valore uguale o superiore (o strettamente superiore in base alla stanza)</strong> rispetto a quanto ricevuto!
                  </li>
                  <li>
                    <strong>DUBITO! (Alza il bussolotto)</strong>: Pensa che l'altro stia bluffando e scopre i dadi per tutti!
                  </li>
                </ul>
              </li>
              <li>
                <strong>Penalità e Vite</strong>:
                <ul>
                  <li>Se i dadi reali sono <strong>uguali o superiori</strong> al dichiarato: chi ha <em>dubitato</em> perde <strong>1 vita</strong>.</li>
                  <li>Se i dadi reali sono <strong>inferiori</strong> al dichiarato (bluff): chi ha <em>lanciato</em> perde <strong>1 vita</strong>.</li>
                  <li>
                    <strong className="gold-text">Tokyo 21</strong>: è il punteggio massimo assoluto e batte qualsiasi combinazione (chi perde il round perde sempre 1 vita).
                  </li>
                </ul>
              </li>
              <li>
                <strong>Nuovo Round</strong>: Chi ha perso la vita inizia il nuovo round (se eliminato, tocca al successivo vivo).
              </li>
            </ol>
          </section>
        </div>

        <div className="modal-footer">
          <button className="primary-btn" onClick={handleClose}>
            Ho capito, giochiamo!
          </button>
        </div>
      </div>
    </div>
  );
}
