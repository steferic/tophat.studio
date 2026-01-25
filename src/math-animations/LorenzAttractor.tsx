/**
 * Lorenz Attractor
 * The famous chaotic system that produces the "butterfly" shape
 * Demonstrates sensitive dependence on initial conditions
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { WHITE } from '../manim';

export interface LorenzAttractorProps {
  startFrame?: number;
}

// Lorenz system parameters
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;

export const LorenzAttractor: React.FC<LorenzAttractorProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  // Generate Lorenz attractor points using Euler integration (memoized once)
  const points = useMemo(() => {
    const pts: { x: number; y: number; z: number }[] = [];
    let x = 0.1;
    let y = 0;
    let z = 0;
    const dt = 0.01; // Larger step = fewer points
    const numSteps = 3000; // Reduced from 10000

    for (let i = 0; i < numSteps; i++) {
      const dx = SIGMA * (y - x);
      const dy = x * (RHO - z) - y;
      const dz = x * y - BETA * z;

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      pts.push({ x, y, z });
    }

    return pts;
  }, []);

  // Animation progress
  const drawProgress = interpolate(frame, [0, 240], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // Rotation for 3D effect
  const rotationY = interpolate(frame, [0, 300], [0, Math.PI * 2], {
    extrapolateRight: 'extend',
  });
  const rotationX = Math.PI / 6;

  // Memoize trig values
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  // Get visible points and project them
  const visibleCount = Math.floor(points.length * drawProgress);

  // Build a single SVG path string (much faster than many <line> elements)
  const { pathD, currentPoint } = useMemo(() => {
    if (visibleCount < 2) return { pathD: '', currentPoint: null };

    const scale = 15;
    let path = '';
    let lastProjected = null;

    for (let i = 0; i < visibleCount; i++) {
      const p = points[i];

      // Rotate around Y axis
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;

      // Rotate around X axis
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      // Perspective projection
      const perspective = 1 / (1 - z2 * 0.005);
      const screenX = width / 2 + x1 * scale * perspective;
      const screenY = height / 2 - y2 * scale * perspective + 50;

      if (i === 0) {
        path = `M ${screenX.toFixed(1)} ${screenY.toFixed(1)}`;
      } else {
        path += ` L ${screenX.toFixed(1)} ${screenY.toFixed(1)}`;
      }

      lastProjected = { x: screenX, y: screenY };
    }

    return { pathD: path, currentPoint: lastProjected };
  }, [visibleCount, cosY, sinY, cosX, sinX, width, height, points]);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="lorenz-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Single path element instead of thousands of lines */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lorenz-gradient)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />

        {/* Current point */}
        {currentPoint && (
          <circle cx={currentPoint.x} cy={currentPoint.y} r={4} fill={WHITE} />
        )}

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
          Lorenz Attractor
        </text>

        {/* Parameters */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={20}
          fontFamily="monospace"
          opacity={0.6}
        >
          σ={SIGMA} ρ={RHO} β={BETA.toFixed(2)}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default LorenzAttractor;
