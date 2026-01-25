import React from 'react';

interface CardProps {
  children: React.ReactNode;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: string;
  shadow?: boolean;
  border?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  backgroundColor = '#ffffff',
  borderRadius = 16,
  padding = '24px',
  shadow = true,
  border,
  style = {},
}) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor,
        borderRadius,
        padding,
        boxShadow: shadow ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
        border,
      }}
    >
      {children}
    </div>
  );
};
