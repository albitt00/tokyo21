import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw, LogOut, Award, Heart } from 'lucide-react';
import { playVictorySound, playClickSound } from '../../utils/soundEffects';
import { resetRoomToLobby } from '../../services/gameService';

export default function GameOverModal({
  roomCode,
  winner,
  isHost,
  onLeave,
}) {
  useEffect(() => {
    // Spara i coriandoli per celebrare la vittoria!
    playVictorySound();

    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const handleRestart = async () => {
    playClickSound();
    await resetRoomToLobby(roomCode);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content victory-modal">
        <div className="victory-crown-wrap">
          <Crown size={56} className="victory-crown-icon gold-text" />
        </div>

        <h2 className="victory-title">PARTITA CONCLUSA!</h2>
        <p className="victory-subtitle">Abbiamo un vincitore assoluto di Tokyo 21</p>

        <div className="winner-podium-card">
          <span className="winner-avatar">{winner?.avatar || '👑'}</span>
          <h3 className="winner-name">{winner?.nickname || 'Campione'}</h3>
          <div className="winner-stats-pill">
            <Heart size={14} className="danger-text" />
            <span>{winner?.lives ?? 1} vite rimaste</span>
          </div>
        </div>

        <div className="victory-actions">
          {isHost ? (
            <button
              type="button"
              className="primary-btn restart-btn pulse-glow"
              onClick={handleRestart}
            >
              <RotateCcw size={18} />
              <span>Gioca Ancora (Torna in Lobby)</span>
            </button>
          ) : (
            <div className="guest-waiting-box">
              <div className="pulse-dot"></div>
              <span>In attesa che l'Host avvii una nuova partita...</span>
            </div>
          )}

          <button type="button" className="outline-btn leave-gameover-btn" onClick={onLeave}>
            <LogOut size={16} /> Esci dalla Stanza
          </button>
        </div>
      </div>
    </div>
  );
}
