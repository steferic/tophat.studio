/**
 * ManimDemo - Impressive mathematical animations showcasing the Manim port
 */

import React, { useMemo } from 'react';
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
} from './manim';

// ============================================================================
// SCENE 1: Double Helix DNA Animation
// ============================================================================
const DoubleHelixScene: React.FC<{ startFrame: number }> = ({ startFrame }) => {
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
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow)">
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

// ============================================================================
// SCENE 2: Fourier Series Circle Drawing
// ============================================================================
const FourierScene: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();
  const coords = useCoordinates();

  // Number of terms in Fourier series
  const numTerms = 5;

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
          <filter id="glow2">
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
          filter="url(#glow2)"
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

// ============================================================================
// SCENE 3: Morphing Shapes
// ============================================================================
const MorphingShapesScene: React.FC<{ startFrame: number }> = ({ startFrame }) => {
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
          <filter id="glow3">
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
            filter="url(#glow3)"
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

// ============================================================================
// SCENE 4: Lissajous Curves with Trails
// ============================================================================
const LissajousScene: React.FC<{ startFrame: number }> = ({ startFrame }) => {
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
          <filter id="glow4">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow4)">{pathSegments}</g>

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

// ============================================================================
// MAIN DEMO COMPONENT
// ============================================================================
export const ManimDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene durations
  const scene1End = 300;
  const scene2End = 600;
  const scene3End = 900;

  if (frame < scene1End) {
    return <DoubleHelixScene startFrame={0} />;
  } else if (frame < scene2End) {
    return <FourierScene startFrame={scene1End} />;
  } else if (frame < scene3End) {
    return <MorphingShapesScene startFrame={scene2End} />;
  } else {
    return <LissajousScene startFrame={scene3End} />;
  }
};

export default ManimDemo;
