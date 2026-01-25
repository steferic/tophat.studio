/**
 * Flow Field
 * Particles moving through a vector field with curl noise
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface FlowFieldProps {
  startFrame?: number;
}

// Simple noise function for flow field
const noise2D = (x: number, y: number, seed: number = 0): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
};

// Curl noise for divergence-free flow
const curlNoise = (x: number, y: number, time: number, scale: number = 0.003): { vx: number; vy: number } => {
  const eps = 0.0001;

  // Sample noise at nearby points
  const n1 = noise2D(x * scale, (y + eps) * scale, time);
  const n2 = noise2D(x * scale, (y - eps) * scale, time);
  const n3 = noise2D((x + eps) * scale, y * scale, time);
  const n4 = noise2D((x - eps) * scale, y * scale, time);

  // Curl = (dN/dy, -dN/dx)
  const vx = (n1 - n2) / (2 * eps) * 50;
  const vy = -(n3 - n4) / (2 * eps) * 50;

  return { vx, vy };
};

interface Particle {
  id: number;
  trail: { x: number; y: number }[];
}

export const FlowField: React.FC<FlowFieldProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();
  const time = frame / fps;

  const numParticles = 200;
  const trailLength = 30;

  // Simulate particles through the flow field
  const particles = useMemo(() => {
    const result: Particle[] = [];

    for (let i = 0; i < numParticles; i++) {
      // Deterministic starting position based on particle ID
      const startX = ((i * 97) % width);
      const startY = ((i * 131) % height);

      const trail: { x: number; y: number }[] = [];
      let x = startX;
      let y = startY;

      // Simulate backwards in time to get trail
      const dt = 0.05;
      const currentTime = time * 0.3; // Slow down time evolution

      for (let t = 0; t < trailLength; t++) {
        const simTime = currentTime - t * dt;
        const { vx, vy } = curlNoise(x, y, simTime);

        trail.unshift({ x, y });

        // Move backwards
        x -= vx * dt * 60;
        y -= vy * dt * 60;

        // Wrap around
        if (x < 0) x += width;
        if (x > width) x -= width;
        if (y < 0) y += height;
        if (y > height) y -= height;
      }

      result.push({ id: i, trail });
    }

    return result;
  }, [time, width, height, numParticles, trailLength]);

  // Vector field arrows (sparse grid)
  const arrows = useMemo(() => {
    const result: { x: number; y: number; angle: number; magnitude: number }[] = [];
    const gridSize = 80;

    for (let x = gridSize / 2; x < width; x += gridSize) {
      for (let y = gridSize / 2; y < height; y += gridSize) {
        const { vx, vy } = curlNoise(x, y, time * 0.3);
        const angle = Math.atan2(vy, vx);
        const magnitude = Math.sqrt(vx * vx + vy * vy);

        result.push({ x, y, angle, magnitude });
      }
    }

    return result;
  }, [time, width, height]);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const arrowOpacity = interpolate(frame, [0, 60], [0, 0.3], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Vector field arrows */}
        {arrows.map((arrow, i) => {
          const length = Math.min(arrow.magnitude * 2, 25);
          return (
            <g
              key={i}
              transform={`translate(${arrow.x}, ${arrow.y}) rotate(${(arrow.angle * 180) / Math.PI})`}
              opacity={arrowOpacity}
            >
              <line x1={-length / 2} y1={0} x2={length / 2} y2={0} stroke="#475569" strokeWidth={1} />
              <polygon points={`${length / 2},0 ${length / 2 - 5},-3 ${length / 2 - 5},3`} fill="#475569" />
            </g>
          );
        })}

        {/* Particle trails */}
        {particles.map((particle) => {
          if (particle.trail.length < 2) return null;

          const pathD = particle.trail
            .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
            .join(' ');

          // Color based on particle ID for variety
          const hue = (particle.id * 37) % 60 + 170; // Cyan to blue range

          return (
            <g key={particle.id}>
              <path
                d={pathD}
                fill="none"
                stroke={`hsl(${hue}, 80%, 60%)`}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.6}
              />
              {/* Head of particle */}
              <circle
                cx={particle.trail[particle.trail.length - 1].x}
                cy={particle.trail[particle.trail.length - 1].y}
                r={3}
                fill={`hsl(${hue}, 80%, 70%)`}
              />
            </g>
          );
        })}

        {/* Title */}
        <text
          x={width / 2}
          y={80}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Flow Field
        </text>

        {/* Info */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={20}
          fontFamily="monospace"
        >
          Particles following curl noise · Divergence-free velocity field
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default FlowField;
