/**
 * Pendulum Wave
 * A series of pendulums with carefully tuned lengths creating mesmerizing wave patterns
 * Each pendulum has a slightly different period, creating interference patterns
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { WHITE, PI } from '../manim';

export interface PendulumWaveProps {
  startFrame?: number;
  numPendulums?: number;
}

export const PendulumWave: React.FC<PendulumWaveProps> = ({
  startFrame = 0,
  numPendulums = 15,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  // Time in seconds
  const time = frame / 60;

  // Cycle time - all pendulums realign after this many seconds
  const cycleTime = 60;

  // Calculate pendulum positions
  const pendulums: { x: number; y: number; angle: number; length: number; hue: number }[] = [];
  const topY = 120;
  const spacing = (width - 200) / (numPendulums - 1);
  const maxLength = height - 250;
  const minLength = maxLength * 0.5;

  for (let i = 0; i < numPendulums; i++) {
    // Each pendulum completes a different number of oscillations in the cycle time
    const oscillationsInCycle = 51 + i; // 51, 52, 53, ...
    const period = cycleTime / oscillationsInCycle;

    // Length based on position (longer pendulums at the edges)
    const length = minLength + (maxLength - minLength) * (1 - i / (numPendulums - 1));

    // Angle oscillation with damping at start
    const startDamping = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
    const maxAngle = PI / 4 * startDamping;
    const angle = maxAngle * Math.sin((2 * PI * time) / period);

    // Position of the bob
    const x = 100 + i * spacing;
    const bobX = x + length * Math.sin(angle);
    const bobY = topY + length * Math.cos(angle);

    // Color based on position in array
    const hue = (i / numPendulums) * 300 + 200;

    pendulums.push({
      x: bobX,
      y: bobY,
      angle,
      length,
      hue,
    });
  }

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-pendulum">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Support bar */}
        <line
          x1={50}
          y1={topY}
          x2={width - 50}
          y2={topY}
          stroke={WHITE}
          strokeWidth={4}
          opacity={0.5}
        />

        {/* Pendulum strings and bobs */}
        {pendulums.map((p, i) => {
          const anchorX = 100 + i * spacing;
          return (
            <g key={i}>
              {/* String */}
              <line
                x1={anchorX}
                y1={topY}
                x2={p.x}
                y2={p.y}
                stroke={WHITE}
                strokeWidth={1}
                opacity={0.3}
              />
              {/* Bob */}
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill={`hsl(${p.hue}, 70%, 55%)`}
                filter="url(#glow-pendulum)"
              />
            </g>
          );
        })}

        {/* Trail effect - connect bobs with a curve */}
        {pendulums.length > 1 && (
          <path
            d={`M ${pendulums[0].x} ${pendulums[0].y} ${pendulums
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(' ')}`}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Title */}
        <text
          x={width / 2}
          y={60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Pendulum Wave
        </text>

        {/* Info */}
        <text
          x={width / 2}
          y={height - 40}
          textAnchor="middle"
          fill={WHITE}
          fontSize={18}
          fontFamily="monospace"
          opacity={0.5}
        >
          {numPendulums} pendulums · T = 2π√(L/g)
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default PendulumWave;
