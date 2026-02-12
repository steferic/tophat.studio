import React from 'react';
import { sweepAngle, headerShimmer, energyEmoji } from '../styles/holo';
import type { EnergyType } from '../types';

interface CardHeaderProps {
  frame: number;
  fps: number;
  stage: string;
  name: string;
  hp: number;
  type: EnergyType;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  frame,
  fps,
  stage,
  name,
  hp,
  type,
}) => {
  const angle = sweepAngle(frame, fps, 1, [-30, 330]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 0 4px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
      }}
    >
      {/* Header shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: headerShimmer(angle),
          pointerEvents: 'none',
        }}
      />
      {/* Name group */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {stage}
        </span>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 17,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}
        >
          {name}
        </span>
      </div>
      {/* HP */}
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 2, position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#e02020' }}>
          {hp}
        </span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 700, color: '#e02020' }}>
          HP
        </span>
        <span style={{ fontSize: 12, marginLeft: 2 }}>{energyEmoji[type]}</span>
      </span>
    </div>
  );
};
