import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import RulesModal from './components/RulesModal';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import { AlertCircle, RotateCcw } from 'lucide-react';
import './App.css';

function MainAppContent() {
  const {
    roomCode,
    roomData,
    loadingRoom,
    roomError,
    leaveRoomAction,
  } = useGame();

  return (
    <div className="mobile-app-container">
      <Header />

      <main className="app-main-content">
        {loadingRoom && !roomData && (
          <div className="loading-state-box">
            <div className="spinner"></div>
            <p>Caricamento della stanza...</p>
          </div>
        )}

        {roomError && (
          <div className="room-error-banner">
            <AlertCircle size={20} className="warning-text" />
            <p>{roomError}</p>
            <button className="primary-btn btn-sm" onClick={leaveRoomAction}>
              <RotateCcw size={14} /> Torna alla Home
            </button>
          </div>
        )}

        {!roomCode || !roomData ? (
          <HomeScreen />
        ) : roomData.status === 'LOBBY' ? (
          <LobbyScreen />
        ) : (
          <GameScreen />
        )}
      </main>

      {/* Modali Globali */}
      <RulesModal />
      <FirebaseConfigModal />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}
