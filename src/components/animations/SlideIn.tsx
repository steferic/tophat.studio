import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface SlideInProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: React.CSSProperties;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 20,
  distance = 100,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames: duration,
  });

  const getTransform = () => {
    const translateValue = interpolate(progress, [0, 1], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    switch (direction) {
      case 'left':
        return `translateX(${-translateValue}px)`;
      case 'right':
        return `translateX(${translateValue}px)`;
      case 'top':
        return `translateY(${-translateValue}px)`;
      case 'bottom':
        return `translateY(${translateValue}px)`;
    }
  };

  const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        opacity,
        transform: getTransform(),
      }}
    >
      {children}
    </div>
  );
};
