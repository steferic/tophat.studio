import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface GridBackgroundProps {
  backgroundColor?: string;
  lineColor?: string;
  gridSize?: number;
  lineWidth?: number;
  animated?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  backgroundColor = '#0a0a0a',
  lineColor = 'rgba(255,255,255,0.1)',
  gridSize = 40,
  lineWidth = 1,
  animated = false,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const offset = animated
    ? interpolate(frame % 60, [0, 60], [0, gridSize])
    : 0;

  const gridPattern = `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent ${gridSize - lineWidth}px,
      ${lineColor} ${gridSize - lineWidth}px,
      ${lineColor} ${gridSize}px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent ${gridSize - lineWidth}px,
      ${lineColor} ${gridSize - lineWidth}px,
      ${lineColor} ${gridSize}px
    )
  `;

  return (
    <AbsoluteFill
      style={{
        ...style,
        backgroundColor,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: gridPattern,
          backgroundPosition: `${offset}px ${offset}px`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
