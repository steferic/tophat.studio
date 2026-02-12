import React from 'react';
import { energyEmoji } from '../styles/holo';
import type { AttackData } from '../types';

interface AttackRowProps {
  attack: AttackData;
  isActive: boolean;
  disabled?: boolean;
}

export const AttackRow: React.FC<AttackRowProps> = ({ attack, isActive, disabled }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 4px',
        margin: '0 -4px',
        borderRadius: 3,
        position: 'relative',
        zIndex: 1,
        background: isActive ? 'rgba(74,158,201,0.2)' : 'transparent',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Energy cost */}
      <div style={{ display: 'flex', gap: 1, minWidth: 44, justifyContent: 'center' }}>
        {attack.energyCost.map((type, i) => (
          <span key={i} style={{ fontSize: 13, lineHeight: 1 }}>
            {energyEmoji[type]}
          </span>
        ))}
      </div>
      {/* Attack info */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          {attack.name}
        </span>
        <p
          style={{
            fontSize: 7.5,
            color: '#666',
            margin: '1px 0 0',
            lineHeight: 1.3,
          }}
        >
          {attack.description}
        </p>
      </div>
      {/* Damage */}
      <span
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 20,
          fontWeight: 700,
          color: '#1a1a1a',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {attack.damage}
      </span>
    </div>
  );
};

export const AttackDivider: React.FC = () => (
  <div
    style={{
      height: 1,
      background: 'rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 1,
    }}
  />
);
