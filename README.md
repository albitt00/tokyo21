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
    - **🔥 TOKYO 21**: È il punteggio massimo assoluto (chi perde il round perde 1 vita).
  - Chi ha perso la vita (se è ancora in gioco, altrimenti il successivo giocatore vivo) inizia il nuovo round.
- **Fine Partita (`GAME_OVER`)**:
  - A 0 vite il giocatore è eliminato e diventa spettatore.
  - L'ultimo giocatore con almeno 1 vita vince la partita con podio e coriandoli!

---

