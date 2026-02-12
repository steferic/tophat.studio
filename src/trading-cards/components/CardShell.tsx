import React from 'react';
import { holoAngle, holoGradient, defaultCardShadow } from '../styles/holo';

interface CardShellProps {
  frame: number;
  fps: number;
  boxShadow?: string;
  transform?: string;
  children: React.ReactNode;
}

export const CardShell: React.FC<CardShellProps> = ({
  frame,
  fps,
  boxShadow = defaultCardShadow,
  transform,
  children,
}) => {
  const angle = holoAngle(frame, fps);

  return (
    <div
      style={{
        width: 350,
        height: 490,
        borderRadius: 12,
        padding: 6,
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(160deg, #e8d44d 0%, #d4a017 100%)',
        boxShadow,
        transform,
      }}
    >
      {/* Holographic shimmer overlay on card border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          background: holoGradient(angle),
          pointerEvents: 'none',
          zIndex: 3,
          mixBlendMode: 'screen',
        }}
      />
      {/* Card inner */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 7,
          background: 'linear-gradient(180deg, #4a9ec9 0%, #3a82ad 6%, #e2ecf2 6%, #e2ecf2 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '6px 10px 8px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
};
