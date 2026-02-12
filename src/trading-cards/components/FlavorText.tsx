import React from 'react';
import { sweepAngle, flavorShimmer } from '../styles/holo';

interface FlavorTextProps {
  frame: number;
  fps: number;
  text: string;
}

export const FlavorText: React.FC<FlavorTextProps> = ({ frame, fps, text }) => {
  const angle = sweepAngle(frame, fps, 0.85, [-20, 340]);

  return (
    <p
      style={{
        fontSize: 7,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        margin: '0 6px',
        lineHeight: 1.4,
        borderTop: '1px solid rgba(0,0,0,0.08)',
        paddingTop: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Prismatic glint overlay */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: flavorShimmer(angle),
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{text}</span>
    </p>
  );
};
