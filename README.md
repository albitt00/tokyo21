# 🎲 Tokyo 21 — Web App Multiplayer in Tempo Reale

Web app mobile-first in tempo reale per giocare al celebre gioco di dadi **"Tokyo 21"** (conosciuto anche come *Mia*, *Mexico* o *21*) con gli amici su qualsiasi smartphone o desktop, pronta per il deploy su **GitHub Pages** e sincronizzata tramite **Firebase Realtime Database (SDK v10+ modulare)**.

---

## 🌟 Caratteristiche Principali

- **📱 Rigorosamente Mobile-First**: Progettata come app nativa per smartphone (max-width 480px centrata su schermi desktop, altezza dinamica `100dvh`, pulsanti grandi ottimizzati per il pollice).
- **🍸 Stile "Dark Lounge / Tavolo da Gioco"**: Feltro verde scuro da casinò, accenti oro e neon, bussolotto 3D animato, dadi realistici con pips ad alta definizione e icone chiare per le vite.
- **🔄 Sessione Persistente**: Salva `playerId` (generato con `crypto.randomUUID()`), `nickname` e `currentRoomCode` in `localStorage`. In caso di refresh della pagina o cambio app dal telefono, il giocatore rientra automaticamente al suo posto senza perdere né turno né vite.
- **⚡ Multiplayer Realtime**: Firebase Realtime Database SDK v10+ modulare (`firebase/app`, `firebase/database`). Supporta anche una modalità locale istantanea via `BroadcastChannel` / `localStorage` per testare l'app subito su più schede.
- **🔊 Effetti Sonori Integrati**: Audio sintetizzato tramite Web Audio API nativa (agitazione bussolotto, rotolamento dadi, alzata bussolotto, allarme DUBITO!, perdita vita, fanfara TOKYO 21 e coriandoli di vittoria con `canvas-confetti`). Muto/Audio attivabile con un tocco.
- **🚀 GitHub Pages Ready**: Configurato con percorsi relativi (`base: './'`) in `vite.config.js` e gestione dello stato senza router lato server per eliminare qualsiasi rischio di errore 404 al refresh.

---

## 📜 Regole Complete di "Tokyo 21"

Si gioca con **2 dadi a 6 facce**. Ogni lancio viene letto ordinando sempre la **cifra più alta per prima** (es. 3 e 5 &rarr; **53**).

### 🏆 Gerarchia dei Punteggi (dal più basso al più alto):
1. **Punteggi Normali** (crescente):  
   `31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65`
2. **Doppie** (battono qualsiasi punteggio normale, in ordine crescente):  
   `11, 22, 33, 44, 55, 66`
3. **🔥 TOKYO (`21`)**:  
   Il punteggio massimo assoluto! Batte qualsiasi doppia e qualsiasi punteggio normale.

### 🔄 Dinamica del Turno:
- **FASE 1: Primo Lancio del Round (`FIRST_ROLL`)**:
  - Il giocatore attivo lancia i dadi in segreto (solo lui vede il valore reale sul proprio schermo, gli altri vedono il bussolotto chiuso).
  - Sceglie cosa **Dichiarare** tramite il selettore rapido (può dire la verità o bluffare) e passa il bussolotto al giocatore successivo.
- **FASE 2: Decisione del Giocatore Ricevente (`DECISION`)**:
  - Il giocatore riceve la dichiarazione e ha due scelte:
    1. **CREDO (Accetta e Rilancia)**: Accetta la dichiarazione senza guardare i dadi precedenti, lancia i propri dadi in segreto e **DEVE dichiarare un valore &ge; (oppure &gt; in base all'impostazione della stanza)** rispetto alla dichiarazione precedente. Se il precedente ha dichiarato `21`, può solo dichiarare `21`.
    2. **DUBITO! (Alza il Bussolotto)**: Ritiene che il lanciatore stia bluffando e scopre i dadi per tutti.
- **FASE 3: Rivelazione e Penalità (`REVEAL`)**:
  - Il bussolotto si alza per tutti i giocatori mostrando il valore reale dei dadi:
    - Se `valoreReale >= valoreDichiarato`: chi ha **dubitato** perde **1 vita**.
    - Se `valoreReale < valoreDichiarato` (bluff scoperto): chi ha **lanciato** perde **1 vita**.
    - **⚠️ REGOLA SPECIALE TOKYO 21**: Se il valore dichiarato era `21` (Tokyo), chi perde il confronto **perde 2 vite invece di 1!**
  - Chi ha perso la vita (se è ancora in gioco, altrimenti il successivo giocatore vivo) inizia il nuovo round.
- **Fine Partita (`GAME_OVER`)**:
  - A 0 vite il giocatore è eliminato e diventa spettatore.
  - L'ultimo giocatore con almeno 1 vita vince la partita con podio e coriandoli!

---

## ⚙️ Configurazione Firebase Realtime Database

L'applicazione include un file isolato `src/firebase.js`.

### 1. Crea il Database su Firebase Console
1. Accedi alla [Firebase Console](https://console.firebase.google.com/) e crea un nuovo progetto (gratuito Spark plan).
2. Nel menu laterale seleziona **Build** &gt; **Realtime Database** &gt; clicca su **Crea database** (scegli la regione desiderata, es. *europe-west1* o *us-central1*).
3. Nella scheda **Regole (Rules)**, incolla queste regole per consentire a tutti i partecipanti della stanza di leggere e scrivere:
   ```json
   {
     "rules": {
       "rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
   Clicca su **Pubblica**.

### 2. Inserisci la tua Configurazione Firebase
Puoi inserire la configurazione in due modi:

#### Opzione A: Nel file `src/firebase.js`
Apri `src/firebase.js` e sostituisci l'oggetto `defaultFirebaseConfig` con le tue credenziali da **Impostazioni Progetto &gt; Generale &gt; Le tue app (Web `</>`)**:
```javascript
export const defaultFirebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tuo-progetto.firebaseapp.com",
  databaseURL: "https://tuo-progetto-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tuo-progetto",
  storageBucket: "tuo-progetto.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

#### Opzione B: Direttamente dall'interfaccia grafica
Clicca sull'icona del **Database** in alto a destra nell'header dell'app per aprire il modale di configurazione e incollare il tuo oggetto `firebaseConfig`. Viene salvato istantaneamente in `localStorage`.

---

## 💻 Sviluppo Locale

1. **Installazione dipendenze**:
   ```bash
   npm install
   ```

2. **Avvio server di sviluppo**:
   ```bash
   npm run dev
   ```
   Apri `http://localhost:5173` nel browser o scansionalo dal telefono sulla stessa rete Wi-Fi.

3. **Verifica build**:
   ```bash
   npm run build
   ```

---

## 🚀 Deploy su GitHub Pages

L'app è predisposta per il deploy su GitHub Pages senza bisogno di configurazioni complesse.

### Metodo 1: Tramite lo script automatico `gh-pages` (Consigliato)
1. Nel file `package.json` aggiungi la proprietà `"homepage"` col tuo URL GitHub Pages (opzionale ma consigliato):
   ```json
   "homepage": "https://<tuo-username>.github.io/<nome-repository>"
   ```
2. Esegui il comando di deploy:
   ```bash
   npm run deploy
   ```
   Questo comando eseguirà in automatico `npm run build` e pubblicherà la cartella `dist` sul branch `gh-pages`.
3. Vai su GitHub nel tuo repository &gt; **Settings** &gt; **Pages** &gt; sotto **Source** seleziona il branch `gh-pages` e la cartella `/ (root)` &gt; Salva.

### Metodo 2: Tramite GitHub Actions
Crea il file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 📁 Struttura del Progetto

```
tokyo21/
├── index.html                   # Entry point HTML con viewport mobile-first
├── vite.config.js               # Configurazione Vite con base: './'
├── package.json                 # Dipendenze e script di deploy
├── src/
│   ├── main.jsx                 # Bootstrap React
│   ├── index.css                # Variabili CSS, reset e tema Dark Lounge
│   ├── App.jsx                  # Coordinatore viste (Home / Lobby / Gioco)
│   ├── App.css                  # Stili completi, layout 480px e animazioni
│   ├── firebase.js              # Configurazione Firebase SDK v10+ isolata
│   ├── context/
│   │   └── GameContext.jsx      # Stato globale e persistenza localStorage
│   ├── services/
│   │   └── gameService.js       # Operazioni Realtime Database (create, join, roll, doubt)
│   ├── utils/
│   │   ├── tokyoLogic.js        # Regole, gerarchia punteggi, comparatore e resolveDoubt
│   │   └── soundEffects.js      # Effetti sonori sintetizzati Web Audio API
│   └── components/
│       ├── Header.jsx           # Logo, room code, toggle audio, regole e config
│       ├── HomeScreen.jsx       # Nickname, avatar picker, crea ed entra in stanza
│       ├── LobbyScreen.jsx      # Codice stanza gigante, lista giocatori, impostazioni
│       ├── GameScreen.jsx       # Tavolo da gioco principale
│       ├── RulesModal.jsx       # Modale guida interattiva con cheat sheet punteggi
│       ├── FirebaseConfigModal.jsx # Modale per incollare e testare credenziali Firebase
│       └── game/
│           ├── PlayerRoster.jsx # Barra superiore con ordine di turno, vite e chi ha il bussolotto
│           ├── DiceCup.jsx      # Bussolotto 3D (chiuso, scuotimento, alzata, sbirciata)
│           ├── DiceFace.jsx     # Dado 3D con pallini/pips realistici
│           ├── DeclaredBadge.jsx# Visualizzazione ultima dichiarazione (evidenziatore Tokyo 21)
│           ├── GameControls.jsx # Pulsanti contestuali (Lancia, Credo, Dubito!, Prossimo Round)
│           ├── ScoreSelectorModal.jsx # Selettore visuale rapido (Normali, Doppie, TOKYO 21)
│           └── GameOverModal.jsx# Podio vincitore con coriandoli e riavvio
```

---

## 🎮 Buon divertimento con Tokyo 21!
