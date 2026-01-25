import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface GlowPulseProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  speed?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export const GlowPulse: React.FC<GlowPulseProps> = ({
  children,
  color = '#ffffff',
  intensity = 20,
  speed = 30,
  delay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - delay;

  if (relativeFrame < 0) {
    return <div style={style}>{children}</div>;
  }

  const pulseProgress = Math.sin((relativeFrame / speed) * Math.PI * 2);
  const glowIntensity = interpolate(pulseProgress, [-1, 1], [intensity * 0.5, intensity], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        filter: `drop-shadow(0 0 ${glowIntensity}px ${color})`,
      }}
    >
      {children}
    </div>
  );
};
