/**
 * Spirograph (Hypotrochoid)
 * Mathematical curves produced by rolling a circle inside another circle
 * Creates beautiful geometric patterns
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { WHITE, TAU } from '../manim';

export interface SpirographProps {
  startFrame?: number;
}

// Greatest common divisor
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export const Spirograph: React.FC<SpirographProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  // Spirograph parameters
  // R = radius of fixed circle, r = radius of rolling circle, d = distance from center of rolling circle
  const R = 300; // Fixed circle radius
  const r = 75; // Rolling circle radius (R/r ratio affects pattern complexity)
  const d = 100; // Pen distance from rolling circle center

  // Calculate how many rotations needed for complete pattern
  const loopsNeeded = r / gcd(R, r);
  const totalAngle = TAU * loopsNeeded;

  // Animation progress
  const drawProgress = interpolate(frame, [0, 240], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Generate hypotrochoid points
  // x(t) = (R-r)*cos(t) + d*cos((R-r)/r * t)
  // y(t) = (R-r)*sin(t) - d*sin((R-r)/r * t)
  const numPoints = 2000;
  const visiblePoints = Math.floor(numPoints * drawProgress);

  const points: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= visiblePoints; i++) {
    const t = (i / numPoints) * totalAngle;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    points.push({ x, y, t: i / numPoints });
  }

  // Current position for animated circle
  const currentT = drawProgress * totalAngle;
  const rollingCenterX = (R - r) * Math.cos(currentT);
  const rollingCenterY = (R - r) * Math.sin(currentT);
  const penX = rollingCenterX + d * Math.cos(((R - r) / r) * currentT);
  const penY = rollingCenterY - d * Math.sin(((R - r) / r) * currentT);

  // Convert to screen coordinates
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 1;

  const screenPoints = points.map((p) => ({
    x: centerX + p.x * scale,
    y: centerY + p.y * scale,
    t: p.t,
  }));

  // Generate gradient path segments
  const pathSegments: React.ReactNode[] = [];
  for (let i = 1; i < screenPoints.length; i++) {
    const hue = (screenPoints[i].t * 360 + 180) % 360;
    pathSegments.push(
      <line
        key={i}
        x1={screenPoints[i - 1].x}
        y1={screenPoints[i - 1].y}
        x2={screenPoints[i].x}
        y2={screenPoints[i].y}
        stroke={`hsl(${hue}, 85%, 60%)`}
        strokeWidth={2}
        strokeLinecap="round"
      />
    );
  }

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const mechanismOpacity = interpolate(frame, [0, 60], [0, 0.4], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-spiro">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fixed outer circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={R}
          fill="none"
          stroke={WHITE}
          strokeWidth={1}
          opacity={mechanismOpacity * 0.5}
        />

        {/* Rolling inner circle */}
        <circle
          cx={centerX + rollingCenterX * scale}
          cy={centerY + rollingCenterY * scale}
          r={r}
          fill="none"
          stroke={WHITE}
          strokeWidth={1}
          opacity={mechanismOpacity}
        />

        {/* Line from rolling circle center to pen */}
        <line
          x1={centerX + rollingCenterX * scale}
          y1={centerY + rollingCenterY * scale}
          x2={centerX + penX * scale}
          y2={centerY + penY * scale}
          stroke={WHITE}
          strokeWidth={1}
          opacity={mechanismOpacity}
        />

        {/* The drawn curve */}
        <g filter="url(#glow-spiro)">{pathSegments}</g>

        {/* Pen point */}
        <circle
          cx={centerX + penX * scale}
          cy={centerY + penY * scale}
          r={5}
          fill={WHITE}
        />

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
          Spirograph
        </text>

        {/* Parameters */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={18}
          fontFamily="monospace"
          opacity={0.5}
        >
          R={R} r={r} d={d} · Hypotrochoid
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default Spirograph;
