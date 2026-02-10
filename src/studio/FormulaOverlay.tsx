import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { SegmentStyleHints, SegmentPurpose, ColorMood } from '../types/project';

const COLOR_MOOD_MAP: Record<ColorMood, { filter: string; overlay: string }> = {
  vibrant: {
    filter: 'saturate(1.3) contrast(1.05)',
    overlay: 'transparent',
  },
  warm: {
    filter: 'saturate(1.1)',
    overlay: 'rgba(255, 160, 60, 0.08)',
  },
  cool: {
    filter: 'saturate(1.05)',
    overlay: 'rgba(60, 120, 255, 0.08)',
  },
  'danger-red': {
    filter: 'saturate(1.2) contrast(1.05)',
    overlay: 'rgba(255, 50, 50, 0.1)',
  },
  dark: {
    filter: 'brightness(0.85) contrast(1.1)',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },
  neon: {
    filter: 'saturate(1.5) contrast(1.15)',
    overlay: 'transparent',
  },
  neutral: {
    filter: 'none',
    overlay: 'transparent',
  },
};

interface FormulaOverlayProps {
  style: SegmentStyleHints;
  purpose: SegmentPurpose;
  children: React.ReactNode;
}

export const FormulaOverlay: React.FC<FormulaOverlayProps> = ({
  style,
  purpose: _purpose,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const mood = COLOR_MOOD_MAP[style.colorMood] ?? COLOR_MOOD_MAP.neutral;

  // Vignette intensity scales with energy (0-10)
  const vignetteStrength = interpolate(style.energy, [0, 10], [0, 0.6]);

  // Text overlay animation
  const textOverlay = style.textOverlayHint;
  const textSpring = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const textOpacity = interpolate(
    frame,
    [0, fps * 0.3, durationInFrames - fps * 0.5, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const textScale = interpolate(textSpring, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill>
      {/* Scene content with color grading filter */}
      <AbsoluteFill style={{ filter: mood.filter }}>
        {children}
      </AbsoluteFill>

      {/* Color mood overlay */}
      {mood.overlay !== 'transparent' && (
        <AbsoluteFill
          style={{
            backgroundColor: mood.overlay,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Energy-driven vignette */}
      {vignetteStrength > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteStrength}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Text overlay */}
      {textOverlay && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 80,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              fontSize: 48,
              fontWeight: 900,
              color: 'white',
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0px 4px rgba(0,0,0,0.5)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {textOverlay}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
