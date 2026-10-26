import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';
import { TOKYO_SCORE, DOUBLE_SCORES, formatScoreLabel } from '../../utils/tokyoLogic';

export default function DeclaredBadge({
  declaredValue,
  previousPlayerName,
  phase,
  isMyTurn,
}) {
  if (!declaredValue || phase === 'FIRST_ROLL') {
    return (
      <div className="declared-banner banner-neutral">
        <span className="banner-subtext">Primo lancio del round</span>
        <span className="banner-main-text">Il bussolotto deve ancora essere lanciato</span>
      </div>
    );
  }

  const isTokyo = declaredValue === TOKYO_SCORE;
  const isDouble = DOUBLE_SCORES.includes(declaredValue);

  return (
    <div className={`declared-banner ${isTokyo ? 'banner-tokyo' : isDouble ? 'banner-double' : 'banner-standard'}`}>
      <div className="declared-speaker">
        <span className="speaker-name">{previousPlayerName || 'Giocatore precedente'}</span>
        <span className="speaker-verb">ha dichiarato:</span>
      </div>

      <div className="declared-score-showcase">
        {isTokyo && <Flame size={24} className="tokyo-flame-icon flame-left" />}
        <span className="declared-digits">{declaredValue}</span>
        {isTokyo && <Flame size={24} className="tokyo-flame-icon flame-right" />}
      </div>

      <div className="declared-subinfo">
        {isTokyo ? (
          <span className="tokyo-warning-chip">🔥 TOKYO 21! Punteggio massimo assoluto!</span>
        ) : isDouble ? (
          <span className="double-info-chip">Doppia {declaredValue} (batte tutti i normali)</span>
        ) : (
          <span className="normal-info-chip">Punteggio Standard</span>
        )}
      </div>
    </div>
  );
}
