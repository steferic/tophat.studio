import React from 'react';

interface BrowserMockupProps {
  children: React.ReactNode;
  url?: string;
  frameColor?: string;
  toolbarColor?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  children,
  url = 'https://example.com',
  frameColor = '#1a1a1a',
  toolbarColor = '#2a2a2a',
  width = 800,
  height = 500,
  style = {},
}) => {
  const toolbarHeight = 40;
  const dotSize = 12;

  return (
    <div
      style={{
        ...style,
        width,
        height,
        backgroundColor: frameColor,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: toolbarHeight,
          backgroundColor: toolbarColor,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: '#ff5f57',
            }}
          />
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: '#febc2e',
            }}
          />
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: '#28c840',
            }}
          />
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            marginLeft: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {url}
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          height: height - toolbarHeight,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};
