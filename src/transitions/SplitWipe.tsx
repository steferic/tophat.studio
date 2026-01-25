import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type WipeDirection = 'left' | 'right' | 'up' | 'down' | 'horizontal' | 'vertical' | 'diagonal' | 'corners';

interface SplitWipeProps {
  // The new scene coming in
  children: React.ReactNode;
  // Direction of the wipe
  direction?: WipeDirection;
  // Duration of the transition in frames
  durationInFrames?: number;
  // Color of the wipe bar (set to 'none' for direct cut)
  wipeColor?: string;
  // Width of the wipe bar in pixels
  wipeWidth?: number;
}

/**
 * Split Wipe Transition
 * Various directional wipe transitions between scenes
 *
 * Usage:
 * ```tsx
 * <Sequence from={100} durationInFrames={30}>
 *   <SplitWipe direction="horizontal" durationInFrames={30}>
 *     <NewScene />
 *   </SplitWipe>
 * </Sequence>
 * ```
 */
export const SplitWipe: React.FC<SplitWipeProps> = ({
  children,
  direction = 'horizontal',
  durationInFrames = 20,
  wipeColor = '#FF7050',
  wipeWidth = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames,
  });

  // Calculate clip paths based on direction
  const getClipPath = (): string => {
    switch (direction) {
      case 'left':
        // Wipe from left to right
        const leftX = interpolate(progress, [0, 1], [-100, 0]);
        return `inset(0 ${100 - (leftX + 100)}% 0 0)`;

      case 'right':
        // Wipe from right to left
        const rightX = interpolate(progress, [0, 1], [100, 0]);
        return `inset(0 0 0 ${rightX}%)`;

      case 'up':
        // Wipe from bottom to top
        const upY = interpolate(progress, [0, 1], [100, 0]);
        return `inset(0 0 ${100 - upY}% 0)`;

      case 'down':
        // Wipe from top to bottom
        const downY = interpolate(progress, [0, 1], [-100, 0]);
        return `inset(${downY + 100}% 0 0 0)`;

      case 'horizontal':
        // Split from center horizontally
        const hSplit = interpolate(progress, [0, 1], [50, 0]);
        return `inset(0 ${hSplit}%)`;

      case 'vertical':
        // Split from center vertically
        const vSplit = interpolate(progress, [0, 1], [50, 0]);
        return `inset(${vSplit}% 0)`;

      case 'diagonal':
        // Diagonal wipe
        const diagProgress = interpolate(progress, [0, 1], [0, 150]);
        return `polygon(0 0, ${diagProgress}% 0, ${diagProgress - 50}% 100%, 0 100%)`;

      case 'corners':
        // Reveal from all corners
        const cornerProgress = interpolate(progress, [0, 1], [50, 0]);
        return `inset(${cornerProgress}%)`;

      default:
        return 'none';
    }
  };

  // Wipe bar position for directions that support it
  const getWipeBarStyle = (): React.CSSProperties | null => {
    if (wipeColor === 'none' || wipeWidth === 0) return null;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: wipeColor,
      zIndex: 10,
    };

    switch (direction) {
      case 'left': {
        const x = interpolate(progress, [0, 1], [-wipeWidth, width]);
        return { ...baseStyle, left: x, top: 0, width: wipeWidth, height: '100%' };
      }
      case 'right': {
        const x = interpolate(progress, [0, 1], [width, -wipeWidth]);
        return { ...baseStyle, left: x, top: 0, width: wipeWidth, height: '100%' };
      }
      case 'up': {
        const y = interpolate(progress, [0, 1], [height, -wipeWidth]);
        return { ...baseStyle, left: 0, top: y, width: '100%', height: wipeWidth };
      }
      case 'down': {
        const y = interpolate(progress, [0, 1], [-wipeWidth, height]);
        return { ...baseStyle, left: 0, top: y, width: '100%', height: wipeWidth };
      }
      case 'horizontal': {
        const leftX = interpolate(progress, [0, 1], [width / 2, -wipeWidth]);
        const rightX = interpolate(progress, [0, 1], [width / 2, width]);
        return null; // Return null, we'll render two bars
      }
      default:
        return null;
    }
  };

  const wipeBarStyle = getWipeBarStyle();

  // Special case for horizontal split - two bars
  const renderHorizontalBars = () => {
    if (direction !== 'horizontal' || wipeColor === 'none') return null;

    const leftX = interpolate(progress, [0, 1], [width / 2, -wipeWidth]);
    const rightX = interpolate(progress, [0, 1], [width / 2 - wipeWidth, width]);

    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: leftX,
            top: 0,
            width: wipeWidth,
            height: '100%',
            backgroundColor: wipeColor,
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: rightX,
            top: 0,
            width: wipeWidth,
            height: '100%',
            backgroundColor: wipeColor,
            zIndex: 10,
          }}
        />
      </>
    );
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: getClipPath(),
          WebkitClipPath: getClipPath(),
        }}
      >
        {children}
      </AbsoluteFill>

      {direction === 'horizontal' ? renderHorizontalBars() : wipeBarStyle && <div style={wipeBarStyle} />}
    </AbsoluteFill>
  );
};

interface CrossDissolveProps {
  children: React.ReactNode;
  durationInFrames?: number;
}

/**
 * Simple cross dissolve (fade) transition
 */
export const CrossDissolve: React.FC<CrossDissolveProps> = ({
  children,
  durationInFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames,
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
