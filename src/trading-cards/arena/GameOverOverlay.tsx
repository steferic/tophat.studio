import React from 'react';
import type { Side } from './types';

interface GameOverOverlayProps {
  winner: Side | null;
  leftName: string;
  rightName: string;
  onRematch: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  winner,
  leftName,
  rightName,
  onRematch,
}) => {
  if (!winner) return null;

  const winnerName = winner === 'left' ? leftName : rightName;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        gap: 24,
      }}
    >
      {/* Winner announcement */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        Winner
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 30px rgba(255,200,50,0.6), 0 0 60px rgba(255,150,0,0.3)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {winnerName}
      </div>

      {/* Rematch button */}
      <button
        onClick={onRematch}
        style={{
          marginTop: 16,
          padding: '12px 36px',
          borderRadius: 24,
          border: '2px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          letterSpacing: 1,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
      >
        Rematch
      </button>
    </div>
  );
};
