/**
 * ManimCanvas - Main SVG-based rendering component for Manim objects
 */

import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { useCoordinates } from '../hooks/useCoordinates';
import { BACKGROUND_COLOR } from '../constants';

export interface ManimCanvasProps {
  children?: React.ReactNode;
  background?: string;
  showGrid?: boolean;
  gridSpacing?: number;
  gridColor?: string;
}

export const ManimCanvas: React.FC<ManimCanvasProps> = ({
  children,
  background = BACKGROUND_COLOR,
  showGrid = false,
  gridSpacing = 1,
  gridColor = '#333344',
}) => {
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Generate grid lines
  const gridLines: React.ReactNode[] = [];

  if (showGrid) {
    // Vertical lines
    for (let x = -7; x <= 7; x += gridSpacing) {
      const { x: px } = coords.toPixel({ x, y: 0 });
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={px}
          y1={0}
          x2={px}
          y2={height}
          stroke={gridColor}
          strokeWidth={x === 0 ? 2 : 1}
          opacity={x === 0 ? 0.5 : 0.2}
        />
      );
    }

    // Horizontal lines
    for (let y = -4; y <= 4; y += gridSpacing) {
      const { y: py } = coords.toPixel({ x: 0, y });
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={py}
          x2={width}
          y2={py}
          stroke={gridColor}
          strokeWidth={y === 0 ? 2 : 1}
          opacity={y === 0 ? 0.5 : 0.2}
        />
      );
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Grid */}
        {gridLines}

        {/* Manim objects */}
        {children}
      </svg>
    </AbsoluteFill>
  );
};

export default ManimCanvas;
