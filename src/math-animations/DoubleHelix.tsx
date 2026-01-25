/**
 * Double Helix DNA Animation
 * A rotating 3D DNA structure with perspective and colored base pairs
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import {
  BLUE,
  RED,
  GREEN,
  YELLOW,
  WHITE,
  PURPLE,
  TEAL,
  ORANGE,
  PINK,
  TAU,
  PI,
  useCoordinates,
} from '../manim';

export interface DoubleHelixProps {
  startFrame?: number;
}

export const DoubleHelix: React.FC<DoubleHelixProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Animation progress (0 to 1)
  const drawProgress = interpolate(frame, [0, 180], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Rotation for 3D effect
  const rotation = interpolate(frame, [0, 300], [0, TAU], {
    extrapolateRight: 'extend',
  });

  // Generate helix points
  const numPoints = 200;
  const helixHeight = 6;
  const helixRadius = 1.5;
  const turns = 3;

  const generateHelixPath = (phase: number, color: string) => {
    const points: { x: number; y: number; z: number }[] = [];
    const visiblePoints = Math.floor(numPoints * drawProgress);

    for (let i = 0; i <= visiblePoints; i++) {
      const t = i / numPoints;
      const angle = t * turns * TAU + phase + rotation;
      const y = (t - 0.5) * helixHeight;
      const x = helixRadius * Math.cos(angle);
      const z = helixRadius * Math.sin(angle);
      points.push({ x, y, z });
    }

    // Convert to screen coordinates with perspective
    const screenPoints = points.map((p) => {
      const perspective = 1 / (1 - p.z * 0.15);
      const screenP = coords.toPixel({ x: p.x * perspective, y: p.y });
      return { ...screenP, z: p.z };
    });

    // Generate SVG path
    if (screenPoints.length < 2) return null;

    let pathD = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
    for (let i = 1; i < screenPoints.length; i++) {
      pathD += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
    }

    return (
      <path
        key={phase}
        d={pathD}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        opacity={0.9}
      />
    );
  };

  // Generate connecting "rungs" between helices
  const generateRungs = () => {
    const rungs: React.ReactNode[] = [];
    const numRungs = 20;
    const visibleRungs = Math.floor(numRungs * drawProgress);

    for (let i = 0; i <= visibleRungs; i++) {
      const t = i / numRungs;
      const angle = t * turns * TAU + rotation;
      const y = (t - 0.5) * helixHeight;

      const x1 = helixRadius * Math.cos(angle);
      const z1 = helixRadius * Math.sin(angle);
      const x2 = helixRadius * Math.cos(angle + PI);
      const z2 = helixRadius * Math.sin(angle + PI);

      const perspective1 = 1 / (1 - z1 * 0.15);
      const perspective2 = 1 / (1 - z2 * 0.15);

      const p1 = coords.toPixel({ x: x1 * perspective1, y });
      const p2 = coords.toPixel({ x: x2 * perspective2, y });

      // Color based on position (like base pairs)
      const colors = [
        [BLUE, YELLOW],
        [GREEN, RED],
        [PURPLE, ORANGE],
        [TEAL, PINK],
      ];
      const colorPair = colors[i % colors.length];

      rungs.push(
        <g key={`rung-${i}`}>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={(p1.x + p2.x) / 2}
            y2={(p1.y + p2.y) / 2}
            stroke={colorPair[0]}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={(p1.x + p2.x) / 2}
            y1={(p1.y + p2.y) / 2}
            x2={p2.x}
            y2={p2.y}
            stroke={colorPair[1]}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      );
    }

    return rungs;
  };

  // Title fade in
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        {/* Glow effect */}
        <defs>
          <filter id="glow-helix">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow-helix)">
          {generateRungs()}
          {generateHelixPath(0, BLUE)}
          {generateHelixPath(PI, RED)}
        </g>

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
          Double Helix
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default DoubleHelix;
