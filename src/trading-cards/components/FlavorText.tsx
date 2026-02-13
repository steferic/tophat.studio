import React from 'react';
import { sweepAngle, flavorShimmer } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';

interface FlavorTextProps {
  frame: number;
  fps: number;
  text: string;
}

export const FlavorText: React.FC<FlavorTextProps> = ({ frame, fps, text }) => {
  const theme = useCardTheme();
  const angle = sweepAngle(frame, fps, 0.85, [-20, 340]);
  const shimmer = theme.holo?.flavor?.(angle) ?? flavorShimmer(angle);

  return (
    <p
      style={{
        fontSize: 7,
        fontStyle: 'italic',
        color: theme.flavor.textColor,
        textAlign: 'center',
        margin: '0 6px',
        lineHeight: 1.4,
        borderTop: theme.flavor.borderTop,
        paddingTop: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Prismatic glint overlay */}
      {theme.holoEnabled && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: shimmer,
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{text}</span>
    </p>
  );
};
