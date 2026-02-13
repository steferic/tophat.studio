import React from 'react';
import { sweepAngle, statsShimmer, energyEmoji } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';
import type { EnergyType } from '../types';

interface StatsBarProps {
  frame: number;
  fps: number;
  weakness: { type: EnergyType; modifier: string };
  resistance: { type: EnergyType; modifier: string };
  retreatCost: number;
}

const StatItem: React.FC<{ label: string; labelColor: string; valueColor: string; children: React.ReactNode }> = ({
  label,
  labelColor,
  valueColor,
  children,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span
      style={{
        fontSize: 6,
        textTransform: 'uppercase',
        color: labelColor,
        letterSpacing: 0.5,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: valueColor,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        marginTop: 1,
      }}
    >
      {children}
    </span>
  </div>
);

export const StatsBar: React.FC<StatsBarProps> = ({
  frame,
  fps,
  weakness,
  resistance,
  retreatCost,
}) => {
  const theme = useCardTheme();
  const angle = sweepAngle(frame, fps, 1.5, [-30, 330]);
  const shimmer = theme.holo?.stats?.(angle) ?? statsShimmer(angle);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: theme.stats.borderTop,
        padding: '5px 0 3px',
        marginTop: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
      }}
    >
      {/* Chrome sliding highlight */}
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
      <StatItem label="weakness" labelColor={theme.stats.labelColor} valueColor={theme.stats.valueColor}>
        <span style={{ fontSize: 11 }}>{energyEmoji[weakness.type]}</span> {weakness.modifier}
      </StatItem>
      <StatItem label="resistance" labelColor={theme.stats.labelColor} valueColor={theme.stats.valueColor}>
        <span style={{ fontSize: 11 }}>{energyEmoji[resistance.type]}</span> {resistance.modifier}
      </StatItem>
      <StatItem label="retreat cost" labelColor={theme.stats.labelColor} valueColor={theme.stats.valueColor}>
        {Array.from({ length: retreatCost }).map((_, i) => (
          <span key={i} style={{ fontSize: 11 }}>{energyEmoji.colorless}</span>
        ))}
      </StatItem>
    </div>
  );
};
