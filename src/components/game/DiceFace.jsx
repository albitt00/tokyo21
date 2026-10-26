import React from 'react';

/**
 * Componente Dado 3D ad alta definizione con pips (pallini) realistici
 * @param {{ value: number, rolling?: boolean, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function DiceFace({ value = 1, rolling = false, size = 'md' }) {
  const clamped = Math.max(1, Math.min(6, Number(value) || 1));

  // Matrice dei pips per ciascuna faccia del dado (1 a 6)
  // Griglia 3x3: indici da 1 a 9
  // 1 2 3
  // 4 5 6
  // 7 8 9
  const getPipsForValue = (val) => {
    switch (val) {
      case 1:
        return [5];
      case 2:
        return [1, 9];
      case 3:
        return [1, 5, 9];
      case 4:
        return [1, 3, 7, 9];
      case 5:
        return [1, 3, 5, 7, 9];
      case 6:
        return [1, 3, 4, 6, 7, 9];
      default:
        return [5];
    }
  };

  const activePips = getPipsForValue(clamped);

  return (
    <div className={`dice-face dice-size-${size} ${rolling ? 'dice-rolling-anim' : ''}`}>
      <div className="dice-inner">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => (
          <div key={pos} className="pip-slot">
            {activePips.includes(pos) && <span className="dice-pip"></span>}
          </div>
        ))}
      </div>
    </div>
  );
}
