import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface LogoProps {
  text: string;
  icon?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  animated?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  text,
  icon,
  color = '#ffffff',
  fontSize = 32,
  fontWeight = 800,
  animated = true,
  delay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animated
    ? spring({
        frame: frame - delay,
        fps,
        config: { damping: 12, stiffness: 100 },
        durationInFrames: 20,
      })
    : 1;

  const scale = interpolate(progress, [0, 1], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: fontSize * 0.3,
        opacity: progress,
        transform: `scale(${scale})`,
      }}
    >
      {icon && (
        <span style={{ fontSize: fontSize * 1.2 }}>{icon}</span>
      )}
      <span
        style={{
          color,
          fontSize,
          fontWeight,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: -1,
        }}
      >
        {text}
      </span>
    </div>
  );
};
