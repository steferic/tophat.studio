/**
 * Trefoil Knot
 * The simplest non-trivial mathematical knot, a beautiful 3D curve
 * Parametric equations create a continuously looping structure
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { WHITE, TAU } from '../manim';

export interface TrefoilKnotProps {
  startFrame?: number;
}

export const TrefoilKnot: React.FC<TrefoilKnotProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  // Animation progress
  const drawProgress = interpolate(frame, [0, 180], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Rotation angles
  const rotationY = interpolate(frame, [0, 300], [0, TAU], {
    extrapolateRight: 'extend',
  });
  const rotationX = interpolate(frame, [0, 300], [0, TAU * 0.3], {
    extrapolateRight: 'extend',
  });

  // Trefoil knot parametric equations
  // x(t) = sin(t) + 2*sin(2t)
  // y(t) = cos(t) - 2*cos(2t)
  // z(t) = -sin(3t)
  const scale = 100;
  const numPoints = 500;
  const visiblePoints = Math.floor(numPoints * drawProgress);

  // Generate 3D points
  const points3D: { x: number; y: number; z: number; t: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * TAU;
    points3D.push({
      x: (Math.sin(t) + 2 * Math.sin(2 * t)) * scale,
      y: (Math.cos(t) - 2 * Math.cos(2 * t)) * scale,
      z: -Math.sin(3 * t) * scale,
      t: i / numPoints,
    });
  }

  // 3D rotation and projection
  const project = (p: { x: number; y: number; z: number; t: number }) => {
    // Rotate around Y axis
    let x1 = p.x * Math.cos(rotationY) - p.z * Math.sin(rotationY);
    let z1 = p.x * Math.sin(rotationY) + p.z * Math.cos(rotationY);

    // Rotate around X axis
    let y2 = p.y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
    let z2 = p.y * Math.sin(rotationX) + z1 * Math.cos(rotationX);

    // Perspective projection
    const fov = 500;
    const perspective = fov / (fov + z2);

    return {
      x: width / 2 + x1 * perspective,
      y: height / 2 + y2 * perspective,
      z: z2,
      t: p.t,
      scale: perspective,
    };
  };

  // Project all points
  const projectedPoints = points3D.map(project);

  // Sort by z-depth for proper rendering (painter's algorithm)
  const sortedIndices = Array.from({ length: visiblePoints }, (_, i) => i);
  sortedIndices.sort((a, b) => projectedPoints[a].z - projectedPoints[b].z);

  // Generate tube segments with depth-based rendering
  const segments: React.ReactNode[] = [];

  for (let idx = 1; idx < visiblePoints; idx++) {
    const i = sortedIndices[idx];
    if (i === 0) continue;

    const p1 = projectedPoints[i - 1];
    const p2 = projectedPoints[i];

    // Color based on parameter t (rainbow)
    const hue = (p2.t * 360 + 60) % 360;

    // Thickness based on depth
    const thickness = 8 * p2.scale;

    // Brightness based on depth (closer = brighter)
    const brightness = 40 + 30 * p2.scale;

    segments.push(
      <line
        key={i}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={`hsl(${hue}, 80%, ${brightness}%)`}
        strokeWidth={Math.max(1, thickness)}
        strokeLinecap="round"
      />
    );
  }

  // Add specular highlights on the "front" parts
  const highlights: React.ReactNode[] = [];
  for (let i = 1; i < visiblePoints; i += 5) {
    const p = projectedPoints[i];
    if (p.z > 50) {
      highlights.push(
        <circle
          key={`h-${i}`}
          cx={p.x}
          cy={p.y}
          r={2 * p.scale}
          fill="white"
          opacity={0.3 * (p.z / 100)}
        />
      );
    }
  }

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-knot">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="knotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={350}
          fill="url(#knotGlow)"
          opacity={drawProgress}
        />

        {/* The knot */}
        <g filter="url(#glow-knot)">{segments}</g>

        {/* Highlights */}
        {highlights}

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
          Trefoil Knot
        </text>

        {/* Info */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={18}
          fontFamily="monospace"
          opacity={0.5}
        >
          x = sin(t) + 2sin(2t) · y = cos(t) - 2cos(2t) · z = -sin(3t)
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default TrefoilKnot;
