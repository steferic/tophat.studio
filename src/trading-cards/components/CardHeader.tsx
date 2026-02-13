import React from 'react';
import { sweepAngle, headerShimmer, energyEmoji } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';
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
  const theme = useCardTheme();
  const angle = sweepAngle(frame, fps, 1, [-30, 330]);
  const shimmer = theme.holo?.header?.(angle) ?? headerShimmer(angle);

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
      {theme.holoEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: shimmer,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Name group */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            color: theme.header.stageColor,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {stage}
        </span>
        <span
          style={{
            fontFamily: theme.header.fontFamily,
            fontSize: 17,
            fontWeight: 700,
            color: theme.header.nameColor,
            textShadow: theme.header.nameTextShadow,
          }}
        >
          {name}
        </span>
      </div>
      {/* HP */}
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 2, position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: theme.header.fontFamily, fontSize: 16, fontWeight: 700, color: theme.header.hpColor }}>
          {hp}
        </span>
        <span style={{ fontFamily: theme.header.fontFamily, fontSize: 9, fontWeight: 700, color: theme.header.hpColor }}>
          HP
        </span>
        <span style={{ fontSize: 12, marginLeft: 2 }}>{energyEmoji[type]}</span>
      </span>
    </div>
  );
};
