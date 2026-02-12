import React from 'react';
import type { BattlePhase, Side } from './types';

interface ArenaCenterHUDProps {
  phase: BattlePhase;
  turn: Side;
  turnNumber: number;
  leftName: string;
  rightName: string;
  isActiveCubed?: boolean;
}

const PHASE_LABELS: Record<BattlePhase, string> = {
  selecting: 'Select Attack',
  'animating-attack': 'Attacking!',
  'animating-hit': 'Hit!',
  resolving: '...',
  'turn-end': 'Next Turn',
  'game-over': 'Game Over',
};

export const ArenaCenterHUD: React.FC<ArenaCenterHUDProps> = ({
  phase,
  turn,
  turnNumber,
  leftName,
  rightName,
  isActiveCubed,
}) => {
  const activeName = turn === 'left' ? leftName : rightName;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 120,
        userSelect: 'none',
      }}
    >
      {/* Turn counter */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Turn {turnNumber}
      </span>

      {/* VS badge */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 20px rgba(255,200,50,0.5), 0 2px 4px rgba(0,0,0,0.5)',
          letterSpacing: 3,
        }}
      >
        VS
      </div>

      {/* Active player indicator */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: turn === 'left' ? '#4a9ec9' : '#22c55e',
            textShadow: `0 0 8px ${turn === 'left' ? 'rgba(74,158,201,0.5)' : 'rgba(34,197,94,0.5)'}`,
          }}
        >
          {activeName}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic',
          }}
        >
          {isActiveCubed && phase === 'selecting' ? 'Trapped in Cube!' : PHASE_LABELS[phase]}
        </span>
      </div>

      {/* Turn arrows */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontSize: 18,
            opacity: turn === 'left' ? 1 : 0.2,
            transition: 'opacity 0.3s',
          }}
        >
          ◀
        </span>
        <span
          style={{
            fontSize: 18,
            opacity: turn === 'right' ? 1 : 0.2,
            transition: 'opacity 0.3s',
          }}
        >
          ▶
        </span>
      </div>
    </div>
  );
};
