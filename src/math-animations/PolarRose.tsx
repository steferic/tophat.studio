/**
 * Polar Rose
 * Beautiful flower-like curves defined in polar coordinates
 * r = cos(kθ) creates k or 2k petals depending on whether k is odd or even
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { WHITE, TAU } from '../manim';

export interface PolarRoseProps {
  startFrame?: number;
}

export const PolarRose: React.FC<PolarRoseProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  // Animate k parameter for evolving patterns
  const k = interpolate(frame, [0, 300], [2, 7], {
    extrapolateRight: 'clamp',
  });

  // Draw progress
  const drawProgress = interpolate(frame, [0, 180], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const a = 280; // Amplitude
  const totalAngle = TAU;
  const numPoints = 400; // Reduced from 1000
  const visiblePoints = Math.floor(numPoints * drawProgress);

  const centerX = width / 2;
  const centerY = height / 2;

  // Build single path string (much faster than thousands of line elements)
  const pathD = useMemo(() => {
    if (visiblePoints < 2) return '';

    let path = '';
    for (let i = 0; i <= visiblePoints; i++) {
      const theta = (i / numPoints) * totalAngle;
      const r = a * Math.cos(k * theta);
      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);

      if (i === 0) {
        path = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return path;
  }, [visiblePoints, k, a, centerX, centerY, numPoints, totalAngle]);

  // Current drawing point
  const currentTheta = drawProgress * totalAngle;
  const currentR = a * Math.cos(k * currentTheta);
  const currentX = centerX + currentR * Math.cos(currentTheta);
  const currentY = centerY + currentR * Math.sin(currentTheta);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const circleOpacity = interpolate(frame, [0, 60], [0, 0.15], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="rose-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b9d" />
            <stop offset="50%" stopColor="#c44569" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <radialGradient id="roseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c44569" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle
          cx={centerX}
          cy={centerY}
          r={a}
          fill="url(#roseGradient)"
          opacity={drawProgress * 0.5}
        />

        {/* Reference circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={a}
          fill="none"
          stroke={WHITE}
          strokeWidth={1}
          opacity={circleOpacity}
          strokeDasharray="5,5"
        />

        {/* Single path element instead of thousands of lines */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#rose-gradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current point */}
        <circle cx={currentX} cy={currentY} r={6} fill={WHITE} />

        {/* Title */}
        <text
          x={width / 2}
          y={80}
          textAnchor="middle"
          fill={WHITE}
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Polar Rose
        </text>

        {/* Equation */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={24}
          fontFamily="monospace"
          opacity={0.6}
        >
          r = cos({k.toFixed(2)}θ)
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default PolarRose;
