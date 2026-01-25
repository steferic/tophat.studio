import React from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
  frameColor?: string;
  screenBackground?: string;
  width?: number;
  style?: React.CSSProperties;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  frameColor = '#1a1a1a',
  screenBackground = '#000000',
  width = 280,
  style = {},
}) => {
  const height = width * 2.1;
  const borderWidth = width * 0.03;
  const borderRadius = width * 0.12;
  const notchWidth = width * 0.35;
  const notchHeight = width * 0.08;

  return (
    <div
      style={{
        ...style,
        width,
        height,
        backgroundColor: frameColor,
        borderRadius,
        padding: borderWidth,
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: borderWidth,
          left: '50%',
          transform: 'translateX(-50%)',
          width: notchWidth,
          height: notchHeight,
          backgroundColor: frameColor,
          borderBottomLeftRadius: notchHeight / 2,
          borderBottomRightRadius: notchHeight / 2,
          zIndex: 10,
        }}
      />
      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: screenBackground,
          borderRadius: borderRadius - borderWidth,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};
