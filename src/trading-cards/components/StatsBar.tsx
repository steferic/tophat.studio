import React from 'react';
import { sweepAngle, statsShimmer, energyEmoji } from '../styles/holo';
import type { EnergyType } from '../types';

interface StatsBarProps {
  frame: number;
  fps: number;
  weakness: { type: EnergyType; modifier: string };
  resistance: { type: EnergyType; modifier: string };
  retreatCost: number;
}

const StatItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span
      style={{
        fontSize: 6,
        textTransform: 'uppercase',
        color: '#888',
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
        color: '#333',
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
  const angle = sweepAngle(frame, fps, 1.5, [-30, 330]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        padding: '5px 0 3px',
        marginTop: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
      }}
    >
      {/* Chrome sliding highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: statsShimmer(angle),
          pointerEvents: 'none',
        }}
      />
      <StatItem label="weakness">
        <span style={{ fontSize: 11 }}>{energyEmoji[weakness.type]}</span> {weakness.modifier}
      </StatItem>
      <StatItem label="resistance">
        <span style={{ fontSize: 11 }}>{energyEmoji[resistance.type]}</span> {resistance.modifier}
      </StatItem>
      <StatItem label="retreat cost">
        {Array.from({ length: retreatCost }).map((_, i) => (
          <span key={i} style={{ fontSize: 11 }}>{energyEmoji.colorless}</span>
        ))}
      </StatItem>
    </div>
  );
};
