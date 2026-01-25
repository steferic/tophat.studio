import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface ProgressBarProps {
  progress: number; // 0-100
  delay?: number;
  duration?: number;
  height?: number;
  width?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  showPercentage?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  delay = 0,
  duration = 30,
  height = 12,
  width = 300,
  backgroundColor = 'rgba(255,255,255,0.2)',
  fillColor = '#4ade80',
  borderRadius = 6,
  showPercentage = false,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animationProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 60 },
    durationInFrames: duration,
  });

  const currentProgress = interpolate(
    animationProgress,
    [0, 1],
    [0, progress],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const fillWidth = (currentProgress / 100) * width;

  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width,
          height,
          backgroundColor,
          borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: fillWidth,
            height: '100%',
            backgroundColor: fillColor,
            borderRadius,
            transition: 'none',
          }}
        />
      </div>
      {showPercentage && (
        <span
          style={{
            color: fillColor,
            fontSize: height + 4,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {Math.round(currentProgress)}%
        </span>
      )}
    </div>
  );
};
