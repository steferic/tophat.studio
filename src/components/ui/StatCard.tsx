import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
  backgroundColor?: string;
  valueColor?: string;
  labelColor?: string;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  delay = 0,
  backgroundColor = 'rgba(255,255,255,0.1)',
  valueColor = '#ffffff',
  labelColor = 'rgba(255,255,255,0.7)',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames: 25,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(progress, [0, 1], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        backgroundColor,
        borderRadius: 16,
        padding: '24px 32px',
        opacity: progress,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: valueColor,
          fontSize: 42,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: labelColor,
          fontSize: 16,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </div>
    </div>
  );
};
