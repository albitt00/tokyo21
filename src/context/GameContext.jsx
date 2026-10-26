import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToRoom, joinRoom } from '../services/gameService';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  // 1. Inizializzazione o recupero Player ID univoco
  const [playerId] = useState(() => {
    let id = localStorage.getItem('tokyo21_playerId');
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('tokyo21_playerId', id);
    }
    return id;
  });

  // 2. Nickname persistente
  const [nickname, setNicknameState] = useState(() => {
    return localStorage.getItem('tokyo21_nickname') || '';
  });

  const updateNickname = useCallback((name) => {
    const trimmed = name.trim();
    setNicknameState(trimmed);
    localStorage.setItem('tokyo21_nickname', trimmed);
  }, []);

  // 3. Avatar emoji persistente
  const [avatar, setAvatarState] = useState(() => {
    return localStorage.getItem('tokyo21_avatar') || '🎲';
  });

  const updateAvatar = useCallback((emoji) => {
    setAvatarState(emoji);
    localStorage.setItem('tokyo21_avatar', emoji);
  }, []);

  // 4. Stanza corrente
  const [roomCode, setRoomCodeState] = useState(() => {
    return localStorage.getItem('tokyo21_roomCode') || '';
  });

  const setRoomCode = useCallback((code) => {
    const formatted = code ? code.trim().toUpperCase() : '';
    setRoomCodeState(formatted);
    if (formatted) {
      localStorage.setItem('tokyo21_roomCode', formatted);
    } else {
      localStorage.removeItem('tokyo21_roomCode');
    }
  }, []);

  // 5. Suono abilitato / disabilitato
  const [soundOn, setSoundOnState] = useState(() => isSoundEnabled());

  const toggleSound = useCallback(() => {
    setSoundOnState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  // 6. Modali globali (Regole, Configurazione Firebase)
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 7. Sottoscrizione Realtime alla Stanza
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);

  useEffect(() => {
    if (!roomCode) {
      setRoomData(null);
      setRoomError(null);
      return;
    }

    setLoadingRoom(true);
    setRoomError(null);

    const unsubscribe = subscribeToRoom(
      roomCode,
      (data) => {
        setLoadingRoom(false);
        if (!data) {
          // La stanza non esiste più o è stata eliminata
          setRoomError('Stanza non trovata o terminata.');
          setRoomData(null);
          return;
        }
        setRoomData(data);
        setRoomError(null);

        // Se l'utente era già in questa stanza ma dopo refresh si riconnette:
        if (data.players && data.players[playerId] && !data.players[playerId].connected) {
          // Riconnessione silenziosa
          joinRoom(roomCode, { id: playerId, nickname: nickname || data.players[playerId].nickname, avatar }).catch(() => {});
        }
      },
      (err) => {
        setLoadingRoom(false);
        setRoomError(err?.message || 'Errore di connessione a Firebase.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomCode, playerId, nickname, avatar]);

  // Uscita dalla stanza
  const leaveRoomAction = useCallback(() => {
    setRoomCode('');
    setRoomData(null);
  }, [setRoomCode]);

  // Informazioni del giocatore locale
  const localPlayer = roomData?.players?.[playerId] || null;
  const isHost = localPlayer?.isHost ?? false;

  const value = {
    playerId,
    nickname,
    updateNickname,
    avatar,
    updateAvatar,
    roomCode,
    setRoomCode,
    roomData,
    loadingRoom,
    roomError,
    leaveRoomAction,
    localPlayer,
    isHost,
    soundOn,
    toggleSound,
    showRulesModal,
    setShowRulesModal,
    showConfigModal,
    setShowConfigModal,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve essere utilizzato all’interno di un GameProvider');
  }
  return context;
}
