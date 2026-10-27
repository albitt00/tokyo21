import React from 'react';
import { Heart, Skull, Crown } from 'lucide-react';

export default function PlayerRoster({
  players = {},
  currentTurnPlayerId,
  previousPlayerId,
  myPlayerId,
  phase,
}) {
  const playerList = Object.values(players).sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="roster-container">
      <div className="roster-scroll">
        {playerList.map((player) => {
          const isCurrentTurn = player.id === currentTurnPlayerId;
          const isPrevious = player.id === previousPlayerId;
          const isMe = player.id === myPlayerId;
          const isAlive = (player.lives ?? 0) > 0;

          // Chi ha il bussolotto in mano?
          // Se phase è REVEAL o DECISION, il bussolotto è stato passato al currentTurnPlayerId da previousPlayerId
          const holdsCup = isCurrentTurn;

          return (
            <div
              key={player.id}
              className={`player-chip ${isCurrentTurn ? 'chip-active-turn' : ''} ${
                !isAlive ? 'chip-eliminated' : ''
              } ${isMe ? 'chip-is-me' : ''}`}
            >
              <div className="chip-avatar-wrap">
                <span className="chip-avatar">{player.avatar || '🎲'}</span>
                {holdsCup && isAlive && (
                  <span className="cup-indicator-icon" title="Ha il bussolotto">
                    🏺
                  </span>
                )}
                {player.isHost && (
                  <span className="host-crown-mini" title="Host">
                    <Crown size={10} />
                  </span>
                )}
              </div>

              <div className="chip-details">
                <div className="chip-name-row">
                  <span className="chip-nickname">{player.nickname}</span>
                  {player.isBot && <span className="chip-bot-tag">BOT</span>}
                  {isMe && <span className="chip-me-tag">Tu</span>}
                </div>

                <div className="chip-lives-row">
                  {isAlive ? (
                    <div className="lives-counter" title={`${player.lives} vite rimaste`}>
                      <Heart size={12} className="heart-icon filled-heart" />
                      <span className="lives-count-num">{player.lives}</span>
                    </div>
                  ) : (
                    <div className="eliminated-badge">
                      <Skull size={11} /> Eliminato
                    </div>
                  )}
                </div>
              </div>

              {isCurrentTurn && isAlive && <div className="turn-pulse-glow"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
