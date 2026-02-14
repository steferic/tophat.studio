import React, { useState, useCallback } from 'react';
import { STATUS_REGISTRY, type StatusEffectBlueprint } from '../arena/statusRegistry';

const ALL_EFFECTS = Object.values(STATUS_REGISTRY);

interface StatusEffectButtonProps {
  onApply: (blueprint: StatusEffectBlueprint) => void;
}

/**
 * Button that cycles through the status effect registry.
 * Each click applies the current effect, then advances to the next.
 */
export const StatusEffectButton: React.FC<StatusEffectButtonProps> = ({ onApply }) => {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const current = ALL_EFFECTS[index % ALL_EFFECTS.length];

  const handleClick = useCallback(() => {
    onApply(current);
    setIndex((i) => (i + 1) % ALL_EFFECTS.length);
  }, [current, onApply]);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Apply: ${current.displayName}`}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: hovered ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.15)',
        color: '#a855f7',
        cursor: 'pointer',
        transition: 'background 0.15s',
        lineHeight: 1.6,
      }}
    >
      {current.icon} FX
    </button>
  );
};
