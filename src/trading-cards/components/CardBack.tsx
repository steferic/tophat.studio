import React from 'react';
import { useCardTheme } from '../styles/CardThemeContext';

interface CardBackProps {
  onFlip?: () => void;
}

/**
 * Back face of a trading card. Reads dimensions from the card theme.
 */
export const CardBack: React.FC<CardBackProps> = ({ onFlip }) => {
  const theme = useCardTheme();

  return (
    <div
      style={{
        width: theme.shell.width,
        height: theme.shell.height,
        borderRadius: theme.shell.borderRadius,
        padding: theme.shell.borderPadding,
        flexShrink: 0,
        background: 'linear-gradient(160deg, #e8d44d 0%, #d4a017 100%)',
        boxShadow: theme.shell.boxShadow,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: theme.shell.innerBorderRadius,
          background:
            'linear-gradient(135deg, #1a237e 0%, #283593 25%, #1565c0 50%, #283593 75%, #1a237e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '3px solid rgba(255,215,0,0.4)',
          boxSizing: 'border-box',
        }}
      >
        {/* Decorative border lines */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '2px solid rgba(255,215,0,0.25)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            border: '1px solid rgba(255,215,0,0.15)',
            borderRadius: 3,
            pointerEvents: 'none',
          }}
        />

        {/* Center design */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '3px solid rgba(255,215,0,0.5)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px solid rgba(255,215,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.15) 60%, transparent 100%)',
                  border: '2px solid rgba(255,215,0,0.5)',
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              color: 'rgba(255,215,0,0.6)',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            TopHat Software
          </div>
        </div>

        {/* Corner accents */}
        {[
          { top: 20, left: 20 },
          { top: 20, right: 20 },
          { bottom: 20, left: 20 },
          { bottom: 20, right: 20 },
        ].map((pos, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              ...pos,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)',
            } as React.CSSProperties}
          />
        ))}

        {onFlip && (
          <button
            onClick={onFlip}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              padding: '3px 8px',
              fontSize: 9,
              fontWeight: 700,
              border: '1px solid rgba(255,215,0,0.4)',
              borderRadius: 4,
              background: 'rgba(255,215,0,0.15)',
              color: '#e8d44d',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            FLIP
          </button>
        )}
      </div>
    </div>
  );
};
