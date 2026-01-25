import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  delay?: number;
  backgroundColor?: string;
  quoteColor?: string;
  authorColor?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  role,
  delay = 0,
  backgroundColor = '#ffffff',
  quoteColor = '#1a1a1a',
  authorColor = '#666666',
  accentColor = '#6366f1',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 30,
  });

  const translateX = interpolate(progress, [0, 1], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...style,
        backgroundColor,
        borderRadius: 20,
        padding: 32,
        opacity: progress,
        transform: `translateX(${translateX}px)`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 48,
          lineHeight: 1,
          marginBottom: 16,
          fontFamily: 'Georgia, serif',
        }}
      >
        "
      </div>
      <div
        style={{
          color: quoteColor,
          fontSize: 18,
          lineHeight: 1.6,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 20,
        }}
      >
        {quote}
      </div>
      <div>
        <div
          style={{
            color: quoteColor,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {author}
        </div>
        {role && (
          <div
            style={{
              color: authorColor,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              marginTop: 4,
            }}
          >
            {role}
          </div>
        )}
      </div>
    </div>
  );
};
