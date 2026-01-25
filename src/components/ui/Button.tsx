import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface ButtonProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  padding?: string;
  borderRadius?: number;
  pulse?: boolean;
  pulseSpeed?: number;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  backgroundColor = '#6366f1',
  textColor = '#ffffff',
  fontSize = 18,
  padding = '16px 32px',
  borderRadius = 8,
  pulse = false,
  pulseSpeed = 30,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const scale = pulse
    ? interpolate(
        Math.sin((frame / pulseSpeed) * Math.PI * 2),
        [-1, 1],
        [1, 1.05]
      )
    : 1;

  const shadow = pulse
    ? interpolate(
        Math.sin((frame / pulseSpeed) * Math.PI * 2),
        [-1, 1],
        [10, 25]
      )
    : 10;

  return (
    <div
      style={{
        ...style,
        backgroundColor,
        color: textColor,
        fontSize,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        padding,
        borderRadius,
        display: 'inline-block',
        transform: `scale(${scale})`,
        boxShadow: `0 ${shadow / 2}px ${shadow}px rgba(0,0,0,0.3)`,
      }}
    >
      {text}
    </div>
  );
};
