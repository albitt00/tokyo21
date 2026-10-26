import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/**
 * =========================================================================
 * ⚙️ CONFIGURAZIONE FIREBASE REALTIME DATABASE (SDK v10+)
 * =========================================================================
 */

export const defaultFirebaseConfig = {
  apiKey: "AIzaSyDGOJB2o3ucc_SmMbF1P7PZew_e7V6F_qI",
  authDomain: "tokyo21-41f07.firebaseapp.com",
  databaseURL: "https://tokyo21-41f07-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tokyo21-41f07",
  storageBucket: "tokyo21-41f07.firebasestorage.app",
  messagingSenderId: "281232203858",
  appId: "1:281232203858:web:356869ef00136f77127f8b"
};

/**
 * Verifica se la configurazione corrente è valida e non è solo il placeholder di default.
 */
export function isConfigPlaceholder(config) {
  if (!config) return true;
  return (
    !config.apiKey ||
    config.apiKey.includes('INCOLLA_QUI') ||
    !config.databaseURL ||
    config.databaseURL.includes('tuo-progetto')
  );
}

/**
 * Recupera la configurazione:
 * 1. Da localStorage se salvata dall'utente tramite UI
 * 2. Oppure da defaultFirebaseConfig definita sopra
 */
export function getActiveFirebaseConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tokyo21_firebase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.databaseURL && !isConfigPlaceholder(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.warn('Errore lettura configurazione Firebase da localStorage:', e);
      }
    }
  }
  return defaultFirebaseConfig;
}

let appInstance = null;
let dbInstance = null;

export function initFirebase(config = getActiveFirebaseConfig()) {
  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(config);
    }
    dbInstance = getDatabase(appInstance);
    return { app: appInstance, db: dbInstance, isConfigured: !isConfigPlaceholder(config) };
  } catch (error) {
    console.warn('Inizializzazione Firebase fallita (necessaria configurazione):', error);
    return { app: null, db: null, isConfigured: false, error };
  }
}

// Inizializza le istanze attive
const currentConfig = getActiveFirebaseConfig();
export const firebaseConfig = currentConfig;
const initResult = initFirebase(currentConfig);

export const app = initResult.app;
export const database = initResult.db;

export function isFirebaseConfigured() {
  return !isConfigPlaceholder(getActiveFirebaseConfig()) && database !== null;
}

/**
 * Permette di salvare una nuova configurazione da interfaccia grafica
 */
export function saveCustomFirebaseConfig(configObj) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tokyo21_firebase_config', JSON.stringify(configObj));
    window.location.reload();
  }
}

/**
 * Resetta la configurazione salvata in localStorage
 */
export function resetFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tokyo21_firebase_config');
    window.location.reload();
  }
}