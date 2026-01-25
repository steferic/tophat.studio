/**
 * Fourier Series Circle Drawing
 * Animated epicycles that draw patterns using Fourier approximation
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import {
  BLUE,
  YELLOW,
  WHITE,
  TAU,
  useCoordinates,
} from '../manim';

export interface FourierSeriesProps {
  startFrame?: number;
  numTerms?: number;
}

export const FourierSeries: React.FC<FourierSeriesProps> = ({
  startFrame = 0,
  numTerms = 5,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Animation progress
  const progress = interpolate(frame, [0, 300], [0, TAU * 2], {
    extrapolateRight: 'clamp',
  });

  // Calculate Fourier series for a square wave
  const fourierTerms = useMemo(() => {
    const terms: { frequency: number; amplitude: number; phase: number }[] = [];
    for (let n = 0; n < numTerms; n++) {
      const k = 2 * n + 1; // Odd harmonics only for square wave
      terms.push({
        frequency: k,
        amplitude: 1 / k,
        phase: 0,
      });
    }
    return terms;
  }, [numTerms]);

  // Calculate circle positions and total path
  const calculatePositions = (t: number) => {
    let x = 0;
    let y = 0;
    const circles: { cx: number; cy: number; r: number }[] = [];

    for (const term of fourierTerms) {
      const prevX = x;
      const prevY = y;
      const angle = term.frequency * t + term.phase;
      const r = term.amplitude * 1.5;
      x += r * Math.cos(angle);
      y += r * Math.sin(angle);
      circles.push({ cx: prevX, cy: prevY, r });
    }

    return { x, y, circles };
  };

  // Generate the drawn path
  const pathPoints: { x: number; y: number }[] = [];
  const numPathPoints = Math.floor(progress * 50);
  for (let i = 0; i <= numPathPoints; i++) {
    const t = (i / 50) * TAU;
    if (t <= progress) {
      const pos = calculatePositions(t);
      pathPoints.push({ x: pos.x, y: pos.y });
    }
  }

  // Current position for circles
  const currentPos = calculatePositions(progress);

  // Convert to screen coordinates
  const screenPath = pathPoints.map((p) => coords.toPixel({ x: p.x + 3, y: p.y }));
  const screenCircles = currentPos.circles.map((c) => ({
    ...coords.toPixel({ x: c.cx + 3, y: c.cy }),
    r: coords.toPixelDistance(c.r),
  }));
  const screenEndPoint = coords.toPixel({ x: currentPos.x + 3, y: currentPos.y });

  // Generate path string
  let pathD = '';
  if (screenPath.length > 1) {
    pathD = `M ${screenPath[0].x} ${screenPath[0].y}`;
    for (let i = 1; i < screenPath.length; i++) {
      pathD += ` L ${screenPath[i].x} ${screenPath[i].y}`;
    }
  }

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow-fourier">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Epicycles (circles) */}
        {screenCircles.map((circle, i) => (
          <circle
            key={i}
            cx={circle.x}
            cy={circle.y}
            r={circle.r}
            fill="none"
            stroke={WHITE}
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* Connecting lines between circle centers */}
        {screenCircles.slice(1).map((circle, i) => (
          <line
            key={`line-${i}`}
            x1={screenCircles[i].x}
            y1={screenCircles[i].y}
            x2={circle.x}
            y2={circle.y}
            stroke={WHITE}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Line to drawing point */}
        {screenCircles.length > 0 && (
          <line
            x1={screenCircles[screenCircles.length - 1].x}
            y1={screenCircles[screenCircles.length - 1].y}
            x2={screenEndPoint.x}
            y2={screenEndPoint.y}
            stroke={YELLOW}
            strokeWidth={2}
          />
        )}

        {/* The drawn path */}
        <path
          d={pathD}
          fill="none"
          stroke={BLUE}
          strokeWidth={3}
          filter="url(#glow-fourier)"
        />

        {/* Drawing point */}
        <circle cx={screenEndPoint.x} cy={screenEndPoint.y} r={6} fill={YELLOW} />

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
          Fourier Series
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default FourierSeries;
