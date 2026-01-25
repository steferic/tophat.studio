import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface GradientBackgroundProps {
  colors: string[];
  angle?: number;
  animated?: boolean;
  animationSpeed?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  colors,
  angle = 135,
  animated = false,
  animationSpeed = 60,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const animatedAngle = animated
    ? angle + interpolate(
        frame % animationSpeed,
        [0, animationSpeed],
        [0, 360]
      )
    : angle;

  const gradient = `linear-gradient(${animatedAngle}deg, ${colors.join(', ')})`;

  return (
    <AbsoluteFill
      style={{
        ...style,
        background: gradient,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
