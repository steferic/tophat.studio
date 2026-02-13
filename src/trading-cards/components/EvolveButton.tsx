import React, { useState } from 'react';

interface EvolveButtonProps {
  canEvolve: boolean;
  isEvolving: boolean;
  onEvolve: () => void;
}

export const EvolveButton: React.FC<EvolveButtonProps> = ({ canEvolve, isEvolving, onEvolve }) => {
  const [hovered, setHovered] = useState(false);

  if (!canEvolve && !isEvolving) return null;

  return (
    <button
      onClick={onEvolve}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isEvolving}
      title={isEvolving ? 'Evolving...' : 'Evolve!'}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: isEvolving
          ? 'rgba(59,130,246,0.7)'
          : hovered
            ? 'rgba(59,130,246,0.35)'
            : 'rgba(59,130,246,0.15)',
        color: isEvolving ? '#fff' : '#3b82f6',
        cursor: isEvolving ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        lineHeight: 1.6,
        animation: isEvolving ? 'evolve-pulse 0.6s ease-in-out infinite' : undefined,
      }}
    >
      {isEvolving ? '...' : 'EVOLVE'}
    </button>
  );
};
