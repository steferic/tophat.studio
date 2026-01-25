/**
 * Lissajous Curves with Trails
 * Rainbow-colored parametric curves that evolve over time
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import {
  WHITE,
  TAU,
  PI,
  useCoordinates,
} from '../manim';

export interface LissajousCurvesProps {
  startFrame?: number;
}

export const LissajousCurves: React.FC<LissajousCurvesProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Lissajous parameters that evolve over time
  const a = 3;
  const b = interpolate(frame, [0, 300], [2, 5], { extrapolateRight: 'clamp' });
  const delta = interpolate(frame, [0, 300], [0, PI], { extrapolateRight: 'clamp' });

  // Generate the curve
  const numPoints = 500;
  const progress = interpolate(frame, [0, 120], [0, 1], { extrapolateRight: 'clamp' });
  const visiblePoints = Math.floor(numPoints * progress);

  const points: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= visiblePoints; i++) {
    const t = (i / numPoints) * TAU * 2;
    points.push({
      x: 3 * Math.sin(a * t + delta),
      y: 3 * Math.sin(b * t),
      t: i / numPoints,
    });
  }

  // Convert to screen coordinates
  const screenPoints = points.map((p) => ({
    ...coords.toPixel(p),
    t: p.t,
  }));

  // Generate gradient path segments
  const pathSegments: React.ReactNode[] = [];
  for (let i = 1; i < screenPoints.length; i++) {
    const hue = (screenPoints[i].t * 360 + frame) % 360;
    pathSegments.push(
      <line
        key={i}
        x1={screenPoints[i - 1].x}
        y1={screenPoints[i - 1].y}
        x2={screenPoints[i].x}
        y2={screenPoints[i].y}
        stroke={`hsl(${hue}, 80%, 60%)`}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }

  // Current point indicator
  const currentPoint = screenPoints[screenPoints.length - 1];

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-lissajous">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow-lissajous)">{pathSegments}</g>

        {/* Current point */}
        {currentPoint && (
          <circle cx={currentPoint.x} cy={currentPoint.y} r={8} fill={WHITE} />
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
          Lissajous Curves
        </text>

        {/* Parameters display */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill={WHITE}
          fontSize={24}
          fontFamily="monospace"
          opacity={0.7}
        >
          a={a} b={b.toFixed(2)} δ={delta.toFixed(2)}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default LissajousCurves;
