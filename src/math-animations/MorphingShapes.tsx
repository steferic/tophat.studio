/**
 * Morphing Shapes Animation
 * Smooth transitions between geometric shapes with gradient colors
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import {
  BLUE,
  RED,
  GREEN,
  WHITE,
  PURPLE,
  TAU,
  PI,
  useCoordinates,
} from '../manim';

export interface MorphingShapesProps {
  startFrame?: number;
}

export const MorphingShapes: React.FC<MorphingShapesProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Shape morphing cycle
  const cycleLength = 90; // frames per morph
  const morphProgress = (frame % cycleLength) / cycleLength;
  const shapeIndex = Math.floor(frame / cycleLength) % 4;

  // Define shapes as arrays of points
  const generateShapePoints = (sides: number, radius: number): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * TAU - PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    return points;
  };

  // Generate circle points (approximation)
  const generateCirclePoints = (radius: number, numPoints: number): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * TAU;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    return points;
  };

  // Shapes with same number of points for smooth morphing
  const numPoints = 60;
  const radius = 2;

  const shapes = [
    generateCirclePoints(radius, numPoints), // Circle
    generateShapePoints(3, radius * 1.2), // Triangle (will be interpolated)
    generateShapePoints(4, radius * 1.1), // Square
    generateShapePoints(5, radius * 1.05), // Pentagon
  ];

  const colors = [BLUE, RED, GREEN, PURPLE];

  // Interpolate points to match count
  const normalizeShape = (
    shape: { x: number; y: number }[],
    targetCount: number
  ): { x: number; y: number }[] => {
    if (shape.length === targetCount) return shape;

    const result: { x: number; y: number }[] = [];
    for (let i = 0; i < targetCount; i++) {
      const t = i / targetCount;
      const idx = t * shape.length;
      const idx1 = Math.floor(idx) % shape.length;
      const idx2 = (idx1 + 1) % shape.length;
      const frac = idx - Math.floor(idx);

      result.push({
        x: shape[idx1].x + (shape[idx2].x - shape[idx1].x) * frac,
        y: shape[idx1].y + (shape[idx2].y - shape[idx1].y) * frac,
      });
    }
    return result;
  };

  // Get current and next shape
  const currentShape = normalizeShape(shapes[shapeIndex], numPoints);
  const nextShape = normalizeShape(shapes[(shapeIndex + 1) % shapes.length], numPoints);

  // Smooth easing
  const easedProgress = Easing.inOut(Easing.cubic)(morphProgress);

  // Interpolate between shapes
  const morphedShape = currentShape.map((p, i) => ({
    x: p.x + (nextShape[i].x - p.x) * easedProgress,
    y: p.y + (nextShape[i].y - p.y) * easedProgress,
  }));

  // Interpolate colors
  const currentColor = colors[shapeIndex];
  const nextColor = colors[(shapeIndex + 1) % colors.length];

  // Convert to screen coordinates
  const screenPoints = morphedShape.map((p) => coords.toPixel(p));

  // Generate SVG path
  let pathD = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
  for (let i = 1; i < screenPoints.length; i++) {
    pathD += ` L ${screenPoints[i].x} ${screenPoints[i].y}`;
  }
  pathD += ' Z';

  // Rotation animation
  const rotation = frame * 0.5;
  const centerX = width / 2;
  const centerY = height / 2;

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-morph">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentColor} />
            <stop offset="100%" stopColor={nextColor} />
          </linearGradient>
        </defs>

        <g transform={`rotate(${rotation}, ${centerX}, ${centerY})`}>
          <path
            d={pathD}
            fill="url(#morphGradient)"
            fillOpacity={0.3}
            stroke="url(#morphGradient)"
            strokeWidth={4}
            filter="url(#glow-morph)"
          />
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
          Shape Morphing
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default MorphingShapes;
