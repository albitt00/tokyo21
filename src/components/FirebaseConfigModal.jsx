import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  isFirebaseConfigured,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  resetFirebaseConfig,
} from '../firebase';
import { playClickSound } from '../utils/soundEffects';

export default function FirebaseConfigModal() {
  const { showConfigModal, setShowConfigModal } = useGame();
  const currentConfig = getActiveFirebaseConfig();
  const isConfigured = isFirebaseConfigured();

  const [rawInput, setRawInput] = useState(JSON.stringify(currentConfig, null, 2));
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);

  if (!showConfigModal) return null;

  const handleClose = () => {
    playClickSound();
    setShowConfigModal(false);
  };

  const handleSave = () => {
    playClickSound();
    setErrorMsg('');
    try {
      // Prova a fare il parse dell'input (accetta JSON o oggetto JavaScript)
      let parsed = null;
      let clean = rawInput.trim();

      // Se l'utente incolla const firebaseConfig = { ... };
      if (clean.includes('{')) {
        const jsonLike = clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
        // Pulizia per trasformare sintassi JS in JSON valido se mancano apici alle chiavi
        try {
          parsed = JSON.parse(jsonLike);
        } catch {
          // Tentativo con Function / eval sicuro in ambito chiuso
          const parseObj = new Function(`return ${jsonLike}`);
          parsed = parseObj();
        }
      }

      if (!parsed || !parsed.databaseURL || !parsed.apiKey) {
        throw new Error('La configurazione deve contenere almeno apiKey e databaseURL.');
      }

      saveCustomFirebaseConfig(parsed);
    } catch (err) {
      setErrorMsg(`Errore nella sintassi: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Vuoi ripristinare la configurazione predefinita?')) {
      resetFirebaseConfig();
    }
  };

  const copyRules = () => {
    const rulesJson = JSON.stringify(
      {
        rules: {
          rooms: {
            '.read': true,
            '.write': true,
          },
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(rulesJson);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Database className="gold-text" size={24} />
            <h2>Configurazione Firebase</h2>
          </div>
          <button className="icon-btn-close" onClick={handleClose} aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body config-body">
          {/* Stato Attuale */}
          <div className={`status-banner ${isConfigured ? 'status-connected' : 'status-fallback'}`}>
            {isConfigured ? (
              <>
                <CheckCircle size={22} className="status-icon success-icon" />
                <div>
                  <strong>Firebase Realtime Database Connesso!</strong>
                  <p>Il multiplayer in tempo reale tra diversi dispositivi è attivo.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={22} className="status-icon warning-icon" />
                <div>
                  <strong>In attesa di Firebase Credentials</strong>
                  <p>
                    L'app è funzionante in modalità locale multi-scheda. Per giocare tra smartphone diversi,
                    incolla qui sotto o nel file <code>src/firebase.js</code> la tua configurazione.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Istruzioni Rapide */}
          <div className="config-help-box">
            <h4>📋 Come configurare Firebase in 2 minuti:</h4>
            <ol>
              <li>
                Vai su{' '}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-highlight"
                >
                  Firebase Console <ExternalLink size={12} />
                </a>{' '}
                e crea un progetto gratuito.
              </li>
              <li>
                Vai su <strong>Build &gt; Realtime Database</strong> &gt; Crea database.
              </li>
              <li>
                Nelle <strong>Regole del Database</strong> imposta lettura/scrittura abilitata:
                <div className="rules-code-box">
                  <code>{`{\n  "rules": {\n    "rooms": {\n      ".read": true,\n      ".write": true\n    }\n  }\n}`}</code>
                  <button className="copy-mini-btn" onClick={copyRules}>
                    <Copy size={13} /> {copiedRules ? 'Copiato!' : 'Copia Regole'}
                  </button>
                </div>
              </li>
              <li>
                In <strong>Impostazioni Progetto &gt; Generale &gt; Le tue app</strong> aggiungi un'app Web (<code>&lt;/&gt;</code>) e incolla l'oggetto <code>firebaseConfig</code> qui sotto (oppure dentro <code>src/firebase.js</code>).
              </li>
            </ol>
          </div>

          {/* Input Configurazione */}
          <div className="config-input-group">
            <label htmlFor="firebase-config-input">
              <strong>Oggetto firebaseConfig (JSON o JavaScript):</strong>
            </label>
            <textarea
              id="firebase-config-input"
              rows={7}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Incolla qui l'oggetto firebaseConfig..."
              className="code-textarea"
            />
            {errorMsg && <p className="error-text">{errorMsg}</p>}
          </div>
        </div>

        <div className="modal-footer config-footer">
          <button className="outline-btn" onClick={handleReset} title="Ripristina file originale">
            <RotateCcw size={16} /> Reset
          </button>
          <button className="primary-btn" onClick={handleSave}>
            Salva &amp; Applica
          </button>
        </div>
      </div>
    </div>
  );
}
