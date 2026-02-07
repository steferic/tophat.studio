/**
 * Yoinky Sploinky - Asymptotic Dance
 * Two curves that spiral and dance toward each other,
 * getting infinitely close but never touching.
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Subtitles } from '../components/Subtitles';
import yoinkySploinkySubtitles from '../../public/audio/voiceovers/yoinky-sploinky-voiceover.json';

export interface YoinkySploinkyProps {
  startFrame?: number;
}

// Generate a spiraling curve that approaches but never touches the other
const generateAsymptoticSpiral = (
  t: number,
  phase: number,
  direction: 1 | -1,
  wobble: number
): { x: number; y: number } => {
  const baseRadius = 200 + 150 * Math.exp(-t * 0.5);
  const angle = t * 3 + phase;
  const wobbleAmount = Math.sin(t * 5 + wobble) * 20 * Math.exp(-t * 0.3);

  return {
    x: Math.cos(angle) * (baseRadius + wobbleAmount) * direction,
    y: Math.sin(angle) * (baseRadius + wobbleAmount),
  };
};

export const YoinkySploinky: React.FC<YoinkySploinkyProps> = ({
  startFrame = 0,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();

  const time = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  // Animation progress
  const progress = interpolate(frame, [0, 1600], [0, 8], {
    extrapolateRight: 'clamp',
  });

  // Title fade
  const titleOpacity = interpolate(frame, [0, 30, 60], [0, 0, 1], {
    extrapolateRight: 'clamp',
  });

  // Generate curve points
  const curve1Points = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= progress * 50; i++) {
      const t = i / 50 * progress;
      const { x, y } = generateAsymptoticSpiral(t, 0, 1, time * 2);
      points.push(`${cx + x},${cy + y}`);
    }
    return points.join(' ');
  }, [progress, time, cx, cy]);

  const curve2Points = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= progress * 50; i++) {
      const t = i / 50 * progress;
      const { x, y } = generateAsymptoticSpiral(t, Math.PI, -1, time * 2 + 1);
      points.push(`${cx + x},${cy + y}`);
    }
    return points.join(' ');
  }, [progress, time, cx, cy]);

  // Current positions for the dancing dots
  const dot1 = generateAsymptoticSpiral(progress, 0, 1, time * 2);
  const dot2 = generateAsymptoticSpiral(progress, Math.PI, -1, time * 2 + 1);

  // Colors with hue shift
  const hue1 = (time * 30) % 360;
  const hue2 = (hue1 + 180) % 360;
  const color1 = `hsl(${hue1}, 80%, 60%)`;
  const color2 = `hsl(${hue2}, 80%, 60%)`;

  // Pulsing glow
  const glowIntensity = 0.5 + Math.sin(time * 4) * 0.3;

  // Background particles
  const particles = useMemo(() => {
    const p: { x: number; y: number; size: number; speed: number; hue: number }[] = [];
    for (let i = 0; i < 50; i++) {
      const seed = i * 12.9898;
      p.push({
        x: (Math.sin(seed) * 0.5 + 0.5) * width,
        y: (Math.cos(seed * 2.1) * 0.5 + 0.5) * height,
        size: 2 + Math.sin(seed * 3.2) * 2,
        speed: 0.5 + Math.sin(seed * 4.3) * 0.5,
        hue: (seed * 50) % 360,
      });
    }
    return p;
  }, [width, height]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceovers/yoinky-sploinky-voiceover.mp3')} />

      <svg width={width} height={height}>
        <defs>
          {/* Glow filters */}
          <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * glowIntensity} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * glowIntensity} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for trails */}
          <linearGradient id="trail1" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color1} stopOpacity={0} />
            <stop offset="100%" stopColor={color1} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="trail2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color2} stopOpacity={0} />
            <stop offset="100%" stopColor={color2} stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Background particles */}
        {particles.map((p, i) => {
          const y = (p.y + time * p.speed * 50) % height;
          const opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.size}
              fill={`hsla(${p.hue}, 60%, 70%, ${opacity})`}
            />
          );
        })}

        {/* Curve 1 - Yoinky */}
        {curve1Points.length > 0 && (
          <polyline
            points={curve1Points}
            fill="none"
            stroke={color1}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow1)"
          />
        )}

        {/* Curve 2 - Sploinky */}
        {curve2Points.length > 0 && (
          <polyline
            points={curve2Points}
            fill="none"
            stroke={color2}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow2)"
          />
        )}

        {/* Dancing dots */}
        <circle
          cx={cx + dot1.x}
          cy={cy + dot1.y}
          r={12}
          fill={color1}
          filter="url(#glow1)"
        />
        <circle
          cx={cx + dot2.x}
          cy={cy + dot2.y}
          r={12}
          fill={color2}
          filter="url(#glow2)"
        />

        {/* Connection line showing the gap */}
        <line
          x1={cx + dot1.x}
          y1={cy + dot1.y}
          x2={cx + dot2.x}
          y2={cy + dot2.y}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          strokeDasharray="5,5"
        />
      </svg>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#f8fafc',
            margin: 0,
            fontFamily: 'system-ui',
            textShadow: `0 0 20px ${color1}, 0 0 40px ${color2}`,
          }}
        >
          Yoinky Sploinky
        </h1>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            margin: '10px 0 0 0',
            fontFamily: 'system-ui',
          }}
        >
          The Asymptotic Dance
        </p>
      </div>

      {/* Subtitles */}
      <Subtitles
        segments={yoinkySploinkySubtitles}
        fontSize={36}
        bottomOffset={100}
        maxWords={10}
      />
    </AbsoluteFill>
  );
};

export default YoinkySploinky;
