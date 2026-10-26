import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import PlayerRoster from './game/PlayerRoster';
import DiceCup from './game/DiceCup';
import DeclaredBadge from './game/DeclaredBadge';
import GameControls from './game/GameControls';
import GameOverModal from './game/GameOverModal';

export default function GameScreen() {
  const {
    roomCode,
    roomData,
    playerId,
    isHost,
    leaveRoomAction,
  } = useGame();

  // Stato locale per i dadi appena lanciati dal giocatore di turno (prima di passare)
  const [localDiceState, setLocalDiceState] = useState(null);

  if (!roomData) return null;

  const { status, gameState = {}, players = {} } = roomData;
  const {
    phase = 'FIRST_ROLL',
    currentTurnPlayerId,
    previousPlayerId,
    declaredValue,
    actualRoll,
    diceValues,
    roundNumber = 1,
  } = gameState;

  const isMyTurn = currentTurnPlayerId === playerId;
  const isRevealed = phase === 'REVEAL';
  const isRollerPeeking = isMyTurn && localDiceState?.isPeeking;

  // Dadi da mostrare nel bussolotto:
  // Se svelato (REVEAL): i dadi registrati in gameState.diceValues
  // Se sto sbirciando il mio lancio: i dadi in localDiceState.diceValues
  // Altrimenti: dadi nascosti / chiusi
  const displayDiceValues = isRevealed
    ? diceValues
    : isRollerPeeking
    ? localDiceState?.diceValues
    : null;

  const displayActualRoll = isRevealed
    ? actualRoll
    : isRollerPeeking
    ? localDiceState?.actualRoll
    : null;

  const currentTurnPlayer = players[currentTurnPlayerId] || { nickname: 'Giocatore' };
  const previousPlayer = players[previousPlayerId] || null;

  // Trova il vincitore se status è GAME_OVER
  const alivePlayers = Object.values(players).filter((p) => (p.lives ?? 0) > 0);
  const winner = alivePlayers.length === 1 ? alivePlayers[0] : null;

  return (
    <div className="game-screen">
      {/* Intestazione del Turno e Round */}
      <div className="game-top-bar">
        <div className="round-badge">
          <span>ROUND {roundNumber}</span>
        </div>
        <div className="table-status-msg">
          {phase === 'FIRST_ROLL' && 'Inizio Round: Primo Lancio'}
          {phase === 'DECISION' && 'Decisione Ricevente'}
          {phase === 'REVEAL' && 'Esito del Round'}
        </div>
      </div>

      {/* Roster dei Giocatori (Barra superiore scrollabile con vite e turni) */}
      <PlayerRoster
        players={players}
        currentTurnPlayerId={currentTurnPlayerId}
        previousPlayerId={previousPlayerId}
        myPlayerId={playerId}
        phase={phase}
      />

      {/* Tavolo Centrale: Bussolotto 3D e Dichiarazione */}
      <div className="game-center-table">
        <DiceCup
          diceValues={displayDiceValues}
          actualRoll={displayActualRoll}
          isRevealed={isRevealed}
          isRollerPeeking={Boolean(isRollerPeeking)}
          isRolling={false}
          activePlayerName={currentTurnPlayer.nickname}
          isMyTurn={isMyTurn}
        />

        <DeclaredBadge
          declaredValue={declaredValue}
          previousPlayerName={previousPlayer ? previousPlayer.nickname : ''}
          phase={phase}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Controlli di Gioco Contestuali in Basso */}
      <div className="game-bottom-controls">
        <GameControls
          roomCode={roomCode}
          roomData={roomData}
          playerId={playerId}
          localDiceState={localDiceState}
          setLocalDiceState={setLocalDiceState}
        />
      </div>

      {/* Modale Fine Partita / Vittoria */}
      {status === 'GAME_OVER' && (
        <GameOverModal
          roomCode={roomCode}
          winner={winner}
          isHost={isHost}
          onLeave={leaveRoomAction}
        />
      )}
    </div>
  );
}
