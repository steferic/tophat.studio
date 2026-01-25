import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type AnimationType = 'wave' | 'stagger' | 'blur' | 'split';

interface AnimatedTextProps {
  text: string;
  type?: AnimationType;
  delay?: number;
  staggerDelay?: number;
  style?: React.CSSProperties;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  type = 'stagger',
  delay = 0,
  staggerDelay = 2,
  style = {},
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 700,
  fontFamily = 'Inter, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const characters = text.split('');

  const renderCharacter = (char: string, index: number) => {
    const charDelay = delay + index * staggerDelay;
    const relativeFrame = frame - charDelay;

    const progress = spring({
      frame: relativeFrame,
      fps,
      config: { damping: 15, stiffness: 120 },
      durationInFrames: 15,
    });

    let charStyle: React.CSSProperties = {
      display: 'inline-block',
      whiteSpace: 'pre',
    };

    switch (type) {
      case 'wave':
        const yOffset = interpolate(progress, [0, 1], [30, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        charStyle = {
          ...charStyle,
          transform: `translateY(${yOffset}px)`,
          opacity: progress,
        };
        break;

      case 'stagger':
        charStyle = {
          ...charStyle,
          opacity: progress,
          transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])})`,
        };
        break;

      case 'blur':
        const blur = interpolate(progress, [0, 1], [10, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        charStyle = {
          ...charStyle,
          opacity: progress,
          filter: `blur(${blur}px)`,
        };
        break;

      case 'split':
        const splitY = interpolate(
          progress,
          [0, 1],
          [index % 2 === 0 ? -50 : 50, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        charStyle = {
          ...charStyle,
          transform: `translateY(${splitY}px)`,
          opacity: progress,
        };
        break;
    }

    return (
      <span key={index} style={charStyle}>
        {char}
      </span>
    );
  };

  return (
    <div
      style={{
        ...style,
        color,
        fontSize,
        fontWeight,
        fontFamily,
        display: 'flex',
      }}
    >
      {characters.map(renderCharacter)}
    </div>
  );
};
