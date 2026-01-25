import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
} from 'remotion';

interface ScrollingScreenshotProps {
  /** Path to the screenshot image (use staticFile('path')) or URL */
  src: string;
  /** Width of the visible viewport */
  viewportWidth?: number;
  /** Height of the visible viewport */
  viewportHeight?: number;
  /** Delay before scrolling starts (in frames) */
  delay?: number;
  /** Duration of the scroll animation (in frames) */
  scrollDuration?: number;
  /** How much of the image to scroll through (0-1, where 1 = scroll to bottom) */
  scrollAmount?: number;
  /** Border radius of the viewport */
  borderRadius?: number;
  /** Whether to add a subtle shadow */
  shadow?: boolean;
  /** Easing style: 'smooth' | 'linear' | 'spring' */
  easing?: 'smooth' | 'linear' | 'spring';
  style?: React.CSSProperties;
}

export const ScrollingScreenshot: React.FC<ScrollingScreenshotProps> = ({
  src,
  viewportWidth = 800,
  viewportHeight = 500,
  delay = 0,
  scrollDuration = 120,
  scrollAmount = 0.7,
  borderRadius = 12,
  shadow = true,
  easing = 'smooth',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = Math.max(0, frame - delay);

  // Calculate scroll progress based on easing type
  let scrollProgress: number;

  switch (easing) {
    case 'spring':
      scrollProgress = spring({
        frame: relativeFrame,
        fps,
        config: { damping: 50, stiffness: 20 },
        durationInFrames: scrollDuration,
      });
      break;
    case 'linear':
      scrollProgress = interpolate(
        relativeFrame,
        [0, scrollDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
      break;
    case 'smooth':
    default:
      // Ease in-out cubic
      const t = interpolate(
        relativeFrame,
        [0, scrollDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
      scrollProgress = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      break;
  }

  // We'll use a large assumed height for the screenshot
  // The actual scroll will be percentage-based
  const scrollPercentage = scrollProgress * scrollAmount * 100;

  return (
    <div
      style={{
        ...style,
        width: viewportWidth,
        height: viewportHeight,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: shadow ? '0 25px 50px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(-${scrollPercentage}%)`,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};
