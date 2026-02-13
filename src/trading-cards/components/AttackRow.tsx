import React from 'react';
import { energyEmoji } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';
import type { AttackData } from '../types';

interface AttackRowProps {
  attack: AttackData;
  isActive: boolean;
  disabled?: boolean;
}

export const AttackRow: React.FC<AttackRowProps> = ({ attack, isActive, disabled }) => {
  const theme = useCardTheme();

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
        background: isActive ? theme.attacks.activeHighlight : 'transparent',
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
            fontFamily: theme.attacks.fontFamily,
            fontSize: 12,
            fontWeight: 700,
            color: theme.attacks.nameColor,
          }}
        >
          {attack.name}
        </span>
        <p
          style={{
            fontSize: 7.5,
            color: theme.attacks.descriptionColor,
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
          fontFamily: theme.attacks.fontFamily,
          fontSize: 20,
          fontWeight: 700,
          color: theme.attacks.damageColor,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {attack.damage}
      </span>
    </div>
  );
};

export const AttackDivider: React.FC = () => {
  const theme = useCardTheme();

  return (
    <div
      style={{
        height: 1,
        background: theme.attacks.dividerColor,
        position: 'relative',
        zIndex: 1,
      }}
    />
  );
};
