import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { startGame, updateRoomSettings, addBotPlayer, removeBotPlayer } from '../services/gameService';
import {
  Copy,
  Check,
  Share2,
  Users,
  Settings,
  Heart,
  Crown,
  Play,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Bot,
  Trash2,
} from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

export default function LobbyScreen() {
  const {
    roomCode,
    roomData,
    playerId,
    isHost,
    leaveRoomAction,
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [startingError, setStartingError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isAddingBot, setIsAddingBot] = useState(false);

  const handleAddBot = async () => {
    if (!isHost || isAddingBot || players.length >= 8) return;
    playClickSound();
    setIsAddingBot(true);
    try {
      await addBotPlayer(roomCode);
    } catch (err) {
      console.error('Errore aggiunta bot:', err);
    } finally {
      setIsAddingBot(false);
    }
  };

  const handleRemoveBot = async (botId) => {
    if (!isHost) return;
    playClickSound();
    try {
      await removeBotPlayer(roomCode, botId);
    } catch (err) {
      console.error('Errore rimozione bot:', err);
    }
  };

  if (!roomData) return null;

  const players = Object.values(roomData.players || {}).sort((a, b) => a.orderIndex - b.orderIndex);
  const settings = roomData.settings || { startingLives: 6, strictRaise: false };
  const canStart = players.length >= 2;

  const copyRoomCode = () => {
    playClickSound();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = async () => {
    playClickSound();
    const shareData = {
      title: 'Tokyo 21 - Gioca con me!',
      text: `Entra nella mia stanza di Tokyo 21! Codice stanza: ${roomCode}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        copyRoomCode();
      }
    } else {
      copyRoomCode();
    }
  };

  const handleUpdateLives = async (lives) => {
    if (!isHost) return;
    playClickSound();
    await updateRoomSettings(roomCode, { startingLives: lives });
  };

  const handleToggleStrictRaise = async (strict) => {
    if (!isHost) return;
    playClickSound();
    await updateRoomSettings(roomCode, { strictRaise: strict });
  };

  const handleStartGame = async () => {
    playClickSound();
    setStartingError('');

    if (players.length < 2) {
      setStartingError('Servono almeno 2 giocatori per iniziare la partita.');
      return;
    }

    setIsStarting(true);
    try {
      await startGame(roomCode);
    } catch (err) {
      setStartingError(err.message || 'Errore nell’avvio della partita.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="lobby-screen">
      {/* Intestazione Stanza e Codice Gigante */}
      <div className="glass-card room-code-card">
        <span className="room-code-label">CODICE STANZA</span>
        <div className="giant-code-display" onClick={copyRoomCode}>
          {roomCode}
        </div>
        <div className="share-actions-row">
          <button className="secondary-btn btn-sm" onClick={copyRoomCode}>
            {copied ? <Check size={16} className="gold-text" /> : <Copy size={16} />}
            <span>{copied ? 'Copiato!' : 'Copia Codice'}</span>
          </button>
          <button className="secondary-btn btn-sm" onClick={shareRoom}>
            <Share2 size={16} />
            <span>Condividi</span>
          </button>
        </div>
      </div>

      {/* Lista Giocatori Connessi */}
      <div className="glass-card players-card">
        <div className="card-header-row">
          <div className="card-title-with-icon">
            <Users size={18} className="gold-text" />
            <h3>Giocatori Connessi ({players.length})</h3>
          </div>
          <div className="players-header-actions">
            {isHost && (
              <button
                type="button"
                className="secondary-btn btn-sm add-bot-btn"
                onClick={handleAddBot}
                disabled={players.length >= 8 || isAddingBot}
                title="Aggiungi un giocatore bot gestito dall'IA"
              >
                <Bot size={15} className="gold-text" />
                <span>{isAddingBot ? 'Aggiunta...' : '+ Bot IA'}</span>
              </button>
            )}
            <span className="badge-chip min-players-badge">
              {players.length < 2 ? 'Min. 2' : 'Pronti!'}
            </span>
          </div>
        </div>

        <div className="players-list">
          {players.map((p) => {
            const isMe = p.id === playerId;
            return (
              <div key={p.id} className={`player-row ${isMe ? 'player-row-me' : ''}`}>
                <div className="player-info">
                  <span className="player-avatar-badge">{p.avatar || '🎲'}</span>
                  <div className="player-names">
                    <span className="player-nick">{p.nickname}</span>
                    <div className="player-tags">
                      {p.isHost && (
                        <span className="tag host-tag">
                          <Crown size={11} /> Host
                        </span>
                      )}
                      {p.isBot && (
                        <span className="tag bot-tag">
                          <Bot size={11} /> Bot IA
                        </span>
                      )}
                      {isMe && <span className="tag me-tag">Tu</span>}
                    </div>
                  </div>
                </div>
                <div className="player-status-slot">
                  {isHost && p.isBot ? (
                    <button
                      type="button"
                      className="remove-bot-btn"
                      onClick={() => handleRemoveBot(p.id)}
                      title="Rimuovi questo Bot"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <span className="ready-indicator">
                      <ShieldCheck size={16} className="gold-text" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impostazioni Partita */}
      <div className="glass-card settings-card">
        <div className="card-header-row">
          <div className="card-title-with-icon">
            <Settings size={18} className="gold-text" />
            <h3>Impostazioni Partita</h3>
          </div>
          {isHost ? (
            <span className="badge-chip host-only-badge">Modificabili da te</span>
          ) : (
            <span className="badge-chip read-only-badge">Solo Host</span>
          )}
        </div>

        {/* Vite Iniziali */}
        <div className="setting-row">
          <div className="setting-label-wrap">
            <Heart size={16} className="danger-text" />
            <span>Vite Iniziali per Giocatore:</span>
          </div>
          {isHost ? (
            <div className="lives-picker">
              {[3, 4, 5, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`chip-btn ${settings.startingLives === num ? 'chip-btn-active' : ''}`}
                  onClick={() => handleUpdateLives(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          ) : (
            <span className="setting-value-static">{settings.startingLives} vite</span>
          )}
        </div>

        {/* Regola di Rilancio */}
        <div className="setting-row">
          <div className="setting-label-wrap">
            <ArrowRight size={16} className="gold-text" />
            <span>Regola di Rilancio:</span>
          </div>
          {isHost ? (
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${!settings.strictRaise ? 'toggle-active' : ''}`}
                onClick={() => handleToggleStrictRaise(false)}
              >
                &ge; Uguale o superiore
              </button>
              <button
                type="button"
                className={`toggle-btn ${settings.strictRaise ? 'toggle-active' : ''}`}
                onClick={() => handleToggleStrictRaise(true)}
              >
                &gt; Strettamente sup.
              </button>
            </div>
          ) : (
            <span className="setting-value-static">
              {settings.strictRaise ? '> Strettamente superiore' : '≥ Uguale o superiore'}
            </span>
          )}
        </div>
      </div>

      {startingError && (
        <div className="alert-error-box">
          <AlertCircle size={18} />
          <span>{startingError}</span>
        </div>
      )}

      {/* Sezione Pulsante Avvio */}
      <div className="lobby-actions-footer">
        {isHost ? (
          <button
            type="button"
            className={`primary-btn start-game-btn pulse-glow ${!canStart ? 'btn-disabled' : ''}`}
            onClick={handleStartGame}
            disabled={!canStart || isStarting}
          >
            <Play size={20} fill="currentColor" />
            <span>
              {isStarting
                ? 'Avvio in corso...'
                : canStart
                ? 'Inizia Partita'
                : 'In attesa di almeno 2 giocatori...'}
            </span>
          </button>
        ) : (
          <div className="guest-waiting-box">
            <div className="pulse-dot"></div>
            <span>In attesa che l'Host avvii la partita...</span>
          </div>
        )}

        <button type="button" className="outline-btn leave-btn" onClick={leaveRoomAction}>
          Esci dalla Stanza
        </button>
      </div>
    </div>
  );
}
