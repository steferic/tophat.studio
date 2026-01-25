import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface CountUpProps {
  from?: number;
  to: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  delay = 0,
  duration = 30,
  prefix = '',
  suffix = '',
  decimals = 0,
  style = {},
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 700,
  fontFamily = 'Inter, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 50 },
    durationInFrames: duration,
  });

  const currentValue = interpolate(progress, [0, 1], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const displayValue = currentValue.toFixed(decimals);

  const opacity = interpolate(progress, [0, 0.1, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <span
      style={{
        ...style,
        color,
        fontSize,
        fontWeight,
        fontFamily,
        opacity,
      }}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
