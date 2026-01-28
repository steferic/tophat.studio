/**
 * Flow Field
 * Smooth particle flow using Perlin-like noise
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface FlowFieldProps {
  startFrame?: number;
  /** Number of particles */
  particleCount?: number;
  /** Trail length */
  trailLength?: number;
  /** Flow speed */
  speed?: number;
}

// Permutation table for Perlin noise
const permutation = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

// Double the permutation table
const p = [...permutation, ...permutation];

// Fade function for smooth interpolation
const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

// Linear interpolation
const lerp = (a: number, b: number, t: number): number => a + t * (b - a);

// Gradient function
const grad = (hash: number, x: number, y: number): number => {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
};

// 2D Perlin noise
const perlin2D = (x: number, y: number): number => {
  // Find unit grid cell
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  // Relative position in cell
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Fade curves
  const u = fade(xf);
  const v = fade(yf);

  // Hash coordinates of corners
  const aa = p[p[X] + Y];
  const ab = p[p[X] + Y + 1];
  const ba = p[p[X + 1] + Y];
  const bb = p[p[X + 1] + Y + 1];

  // Blend results from corners
  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

  return lerp(x1, x2, v);
};

// Flow field angle from noise
const getFlowAngle = (x: number, y: number, time: number, scale: number = 0.003): number => {
  const noise = perlin2D(x * scale + time * 0.2, y * scale);
  return noise * Math.PI * 2;
};

interface Particle {
  x: number;
  y: number;
  trail: { x: number; y: number }[];
}

// Simulate a single particle forward in time
const simulateParticle = (
  startX: number,
  startY: number,
  numSteps: number,
  time: number,
  width: number,
  height: number,
  speed: number,
  scale: number
): { x: number; y: number }[] => {
  const trail: { x: number; y: number }[] = [];
  let x = startX;
  let y = startY;

  for (let i = 0; i < numSteps; i++) {
    trail.push({ x, y });

    const angle = getFlowAngle(x, y, time, scale);
    x += Math.cos(angle) * speed;
    y += Math.sin(angle) * speed;

    // Wrap around edges
    if (x < 0) x += width;
    if (x > width) x -= width;
    if (y < 0) y += height;
    if (y > height) y -= height;
  }

  return trail;
};

export const FlowField: React.FC<FlowFieldProps> = ({
  startFrame = 0,
  particleCount = 300,
  trailLength = 50,
  speed = 2,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();
  const time = frame / fps;

  const noiseScale = 0.004;

  // Initialize particle starting positions (deterministic based on ID)
  const particleStarts = useMemo(() => {
    const starts: { x: number; y: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      // Use golden ratio for even distribution
      const golden = 1.618033988749895;
      const x = ((i * golden * 137.5) % width);
      const y = ((i * golden * 251.3) % height);
      starts.push({ x, y });
    }
    return starts;
  }, [particleCount, width, height]);

  // Simulate all particles
  const particles = useMemo(() => {
    return particleStarts.map((start, i) => {
      // Offset starting position by time to create continuous flow
      const offsetX = start.x + time * 30;
      const offsetY = start.y + time * 10;

      // Wrap the offset
      const wrappedX = ((offsetX % width) + width) % width;
      const wrappedY = ((offsetY % height) + height) % height;

      const trail = simulateParticle(
        wrappedX,
        wrappedY,
        trailLength,
        time,
        width,
        height,
        speed,
        noiseScale
      );

      return { id: i, trail };
    });
  }, [particleStarts, time, trailLength, width, height, speed, noiseScale]);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        {/* Particle trails */}
        {particles.map((particle) => {
          if (particle.trail.length < 2) return null;

          // Create smooth path using quadratic curves
          let pathD = `M ${particle.trail[0].x} ${particle.trail[0].y}`;
          for (let i = 1; i < particle.trail.length - 1; i++) {
            const curr = particle.trail[i];
            const next = particle.trail[i + 1];
            const midX = (curr.x + next.x) / 2;
            const midY = (curr.y + next.y) / 2;
            pathD += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
          }
          // Final segment
          const last = particle.trail[particle.trail.length - 1];
          pathD += ` L ${last.x} ${last.y}`;

          // Color based on particle position for subtle variation
          const hue = 190 + (particle.id % 40); // Cyan to blue range

          return (
            <g key={particle.id}>
              {/* Trail with gradient opacity */}
              <path
                d={pathD}
                fill="none"
                stroke={`hsl(${hue}, 70%, 55%)`}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeOpacity={0.6}
              />
              {/* Bright head */}
              <circle
                cx={last.x}
                cy={last.y}
                r={2}
                fill={`hsl(${hue}, 80%, 70%)`}
              />
            </g>
          );
        })}

        {/* Title */}
        <text
          x={width / 2}
          y={70}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={56}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Flow Field
        </text>

        {/* Subtitle */}
        <text
          x={width / 2}
          y={110}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={24}
          fontFamily="system-ui"
          opacity={titleOpacity}
        >
          Perlin Noise Vector Field
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default FlowField;
