import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface SpotlightProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  intensity?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  children,
  color = 'rgba(255,255,255,0.3)',
  size = 300,
  intensity = 0.8,
  startX = 0,
  startY = 0,
  endX = 100,
  endY = 100,
  duration = 60,
  delay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - delay;

  const progress = interpolate(
    relativeFrame,
    [0, duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const currentX = interpolate(progress, [0, 1], [startX, endX]);
  const currentY = interpolate(progress, [0, 1], [startY, endY]);

  const gradient = `radial-gradient(circle ${size}px at ${currentX}% ${currentY}%, ${color} 0%, transparent 70%)`;

  return (
    <div style={{ ...style, position: 'relative' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: gradient,
          opacity: intensity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
