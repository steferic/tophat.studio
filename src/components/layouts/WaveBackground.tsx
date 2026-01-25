import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface WaveBackgroundProps {
  backgroundColor?: string;
  waveColor?: string;
  waveCount?: number;
  amplitude?: number;
  speed?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({
  backgroundColor = '#1a1a2e',
  waveColor = 'rgba(99, 102, 241, 0.3)',
  waveCount = 3,
  amplitude = 50,
  speed = 0.02,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const waves = useMemo(() => {
    return Array.from({ length: waveCount }, (_, i) => ({
      id: i,
      offset: (i / waveCount) * Math.PI * 2,
      amplitudeMultiplier: 1 - i * 0.2,
      yOffset: height * 0.5 + i * 40,
    }));
  }, [waveCount, height]);

  const generateWavePath = (
    waveOffset: number,
    yOffset: number,
    amplitudeMultiplier: number
  ) => {
    const points: string[] = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const y =
        yOffset +
        Math.sin((i / segments) * Math.PI * 4 + frame * speed + waveOffset) *
          amplitude *
          amplitudeMultiplier;

      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    points.push(`L ${width} ${height}`);
    points.push(`L 0 ${height}`);
    points.push('Z');

    return points.join(' ');
  };

  return (
    <AbsoluteFill
      style={{
        ...style,
        backgroundColor,
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {waves.map((wave) => (
          <path
            key={wave.id}
            d={generateWavePath(wave.offset, wave.yOffset, wave.amplitudeMultiplier)}
            fill={waveColor}
          />
        ))}
      </svg>
      {children}
    </AbsoluteFill>
  );
};
