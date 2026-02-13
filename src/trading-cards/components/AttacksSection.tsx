import React from 'react';
import { holoAngle, attacksShimmer } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';
import { AttackRow, AttackDivider } from './AttackRow';
import type { AttackData } from '../types';

interface AttacksSectionProps {
  frame: number;
  fps: number;
  attacks: AttackData[];
  attackKeys: string[];
  activeAttack: string | null;
  onClickAttack?: (attackKey: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const AttacksSection: React.FC<AttacksSectionProps> = ({
  frame,
  fps,
  attacks,
  attackKeys,
  activeAttack,
  onClickAttack,
  disabled,
  style,
}) => {
  const theme = useCardTheme();
  const attacksAngle = holoAngle(frame, fps, 0.83);
  const shimmer = theme.holo?.attacks?.(attacksAngle) ?? attacksShimmer(attacksAngle);

  return (
    <div
      style={{
        background: theme.attacks.background,
        border: theme.attacks.border,
        borderRadius: 3,
        padding: '4px 8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {theme.holoEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: '-80%',
            background: shimmer,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {attacks.map((atk, i) => (
        <React.Fragment key={i}>
          {i > 0 && <AttackDivider />}
          <div
            onClick={() => onClickAttack?.(attackKeys[i])}
            style={{ cursor: onClickAttack && !disabled ? 'pointer' : 'default' }}
          >
            <AttackRow
              attack={atk}
              isActive={activeAttack === attackKeys[i]}
              disabled={disabled}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
