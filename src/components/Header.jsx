import React from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, VolumeX, HelpCircle, LogOut } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

export default function Header() {
  const {
    roomCode,
    leaveRoomAction,
    soundOn,
    toggleSound,
    setShowRulesModal,
  } = useGame();

  const handleSound = () => {
    toggleSound();
    playClickSound();
  };

  const handleRules = () => {
    playClickSound();
    setShowRulesModal(true);
  };

  const handleLeave = () => {
    playClickSound();
    if (window.confirm('Vuoi davvero uscire dalla stanza?')) {
      leaveRoomAction();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-badge">
          <span className="logo-tokyo">TOKYO</span>
          <span className="logo-21">21</span>
        </div>
        {roomCode && (
          <div className="room-indicator" title="Stanza attiva">
            <span className="room-dot"></span>
            <span className="room-code-tag">{roomCode}</span>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Toggle Audio */}
        <button
          className="icon-btn"
          onClick={handleSound}
          title={soundOn ? 'Disattiva Audio' : 'Attiva Audio'}
          aria-label="Toggle Audio"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Regole di Gioco */}
        <button
          className="icon-btn"
          onClick={handleRules}
          title="Regole del Gioco"
          aria-label="Regole di Gioco"
        >
          <HelpCircle size={18} />
        </button>

        {/* Esci dalla Stanza */}
        {roomCode && (
          <button
            className="icon-btn icon-btn-danger"
            onClick={handleLeave}
            title="Esci dalla stanza"
            aria-label="Esci dalla stanza"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
