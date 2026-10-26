import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { createRoom, joinRoom } from '../services/gameService';
import { PlusCircle, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

const AVATARS = ['🎲', '🦊', '🐉', '🥷', '👑', '🦁', '🐯', '⚡', '🍀', '🔥'];

export default function HomeScreen() {
  const {
    playerId,
    nickname,
    updateNickname,
    avatar,
    updateAvatar,
    setRoomCode,
  } = useGame();

  const [inputNick, setInputNick] = useState(nickname || '');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAvatarSelect = (emoji) => {
    playClickSound();
    updateAvatar(emoji);
  };

  const handleCreateRoom = async () => {
    playClickSound();
    setErrorMessage('');

    const finalNick = inputNick.trim();
    if (!finalNick) {
      setErrorMessage('Inserisci prima il tuo nickname!');
      return;
    }

    updateNickname(finalNick);
    setLoading(true);

    try {
      const code = await createRoom({
        id: playerId,
        nickname: finalNick,
        avatar,
      });
      setRoomCode(code);
    } catch (err) {
      setErrorMessage(err.message || 'Impossibile creare la stanza.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    playClickSound();
    setErrorMessage('');

    const finalNick = inputNick.trim();
    if (!finalNick) {
      setErrorMessage('Inserisci prima il tuo nickname!');
      return;
    }

    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setErrorMessage('Inserisci un codice stanza valido!');
      return;
    }

    updateNickname(finalNick);
    setLoading(true);

    try {
      const confirmedCode = await joinRoom(cleanCode, {
        id: playerId,
        nickname: finalNick,
        avatar,
      });
      setRoomCode(confirmedCode);
    } catch (err) {
      setErrorMessage(err.message || 'Impossibile entrare nella stanza.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-screen">
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-dice-icons">
          <span className="hero-dice-left">🎲</span>
          <span className="hero-dice-center">21</span>
          <span className="hero-dice-right">🎲</span>
        </div>
        <h1 className="hero-title">Tokyo 21</h1>
        <p className="hero-subtitle">
          Il leggendario gioco di dadi &amp; bluff multiplayer in tempo reale
        </p>
      </div>

      {/* Form Profilo Giocatore */}
      <div className="glass-card profile-card">
        <label className="card-label" htmlFor="player-nickname">
          Il tuo Nickname
        </label>
        <div className="nickname-input-wrap">
          <span className="current-avatar">{avatar}</span>
          <input
            id="player-nickname"
            type="text"
            className="text-input"
            placeholder="Es. Marco, Il Lupo, Jack..."
            maxLength={18}
            value={inputNick}
            onChange={(e) => setInputNick(e.target.value)}
          />
        </div>

        {/* Selezione Rapida Avatar */}
        <div className="avatar-picker-label">Scegli il tuo avatar:</div>
        <div className="avatar-grid">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`avatar-option-btn ${avatar === emoji ? 'avatar-active' : ''}`}
              onClick={() => handleAvatarSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="alert-error-box">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Azioni Stanza */}
      <div className="room-actions-group">
        {/* Crea Stanza */}
        <button
          type="button"
          className="primary-btn create-room-btn pulse-glow"
          onClick={handleCreateRoom}
          disabled={loading}
        >
          <PlusCircle size={20} />
          <span>{loading ? 'Creazione in corso...' : 'Crea Nuova Stanza'}</span>
        </button>

        <div className="or-divider">
          <span>OPPURE</span>
        </div>

        {/* Entra in Stanza */}
        <form className="glass-card join-room-form" onSubmit={handleJoinRoom}>
          <label className="card-label" htmlFor="room-code-input">
            Entra in una Stanza Esistente
          </label>
          <div className="join-input-group">
            <input
              id="room-code-input"
              type="text"
              className="text-input code-input"
              placeholder="CODICE (es. 7K4A)"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            />
            <button
              type="submit"
              className="primary-btn join-btn"
              disabled={loading || !inputCode.trim()}
            >
              <LogIn size={18} />
              <span>Entra</span>
            </button>
          </div>
        </form>
      </div>

      <div className="home-footer-hint">
        <Sparkles size={14} className="gold-text" />
        <span>Mobile-First: Condividi il codice con i tuoi amici dal telefono!</span>
      </div>
    </div>
  );
}
