import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface BadgeProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  pulse?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  backgroundColor = '#ef4444',
  textColor = '#ffffff',
  fontSize = 14,
  pulse = false,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const scale = pulse
    ? interpolate(Math.sin((frame / 15) * Math.PI * 2), [-1, 1], [1, 1.1])
    : 1;

  return (
    <span
      style={{
        ...style,
        backgroundColor,
        color: textColor,
        fontSize,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        padding: '6px 14px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
        display: 'inline-block',
        transform: `scale(${scale})`,
      }}
    >
      {text}
    </span>
  );
};
