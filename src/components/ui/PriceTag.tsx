import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface PriceTagProps {
  originalPrice?: number;
  salePrice: number;
  currency?: string;
  delay?: number;
  showStrikethrough?: boolean;
  originalColor?: string;
  saleColor?: string;
  style?: React.CSSProperties;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  originalPrice,
  salePrice,
  currency = '$',
  delay = 0,
  showStrikethrough = true,
  originalColor = '#999999',
  saleColor = '#ef4444',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 20,
  });

  const strikeProgress = spring({
    frame: frame - delay - 10,
    fps,
    config: { damping: 20, stiffness: 150 },
    durationInFrames: 15,
  });

  const saleScale = interpolate(progress, [0, 0.5, 1], [0, 1.2, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const strikeWidth = interpolate(strikeProgress, [0, 1], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {originalPrice && showStrikethrough && (
        <div style={{ position: 'relative', opacity: progress }}>
          <span
            style={{
              color: originalColor,
              fontSize: 28,
              fontWeight: 500,
            }}
          >
            {currency}{originalPrice}
          </span>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 3,
              width: `${strikeWidth}%`,
              backgroundColor: saleColor,
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      )}
      <span
        style={{
          color: saleColor,
          fontSize: 48,
          fontWeight: 800,
          transform: `scale(${saleScale})`,
          display: 'inline-block',
        }}
      >
        {currency}{salePrice}
      </span>
    </div>
  );
};
