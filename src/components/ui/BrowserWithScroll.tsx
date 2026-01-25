import React, { useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
} from 'remotion';

interface BrowserWithScrollProps {
  /** Path to the screenshot image */
  src: string;
  /** URL to display in the address bar */
  url?: string;
  /** Width of the browser window */
  width?: number;
  /** Height of the browser window */
  height?: number;
  /** Delay before scrolling starts (in frames) */
  scrollDelay?: number;
  /** Duration of the scroll animation (in frames) */
  scrollDuration?: number;
  /** How much of the image to scroll through (0-1) */
  scrollAmount?: number;
  /** Browser frame color */
  frameColor?: string;
  /** Toolbar color */
  toolbarColor?: string;
  /** Whether to animate the browser entrance */
  animateEntrance?: boolean;
  /** Entrance animation delay */
  entranceDelay?: number;
  style?: React.CSSProperties;
}

export const BrowserWithScroll: React.FC<BrowserWithScrollProps> = ({
  src,
  url = 'https://example.com',
  width = 900,
  height = 560,
  scrollDelay = 30,
  scrollDuration = 150,
  scrollAmount = 0.6,
  frameColor = '#1a1a1a',
  toolbarColor = '#2a2a2a',
  animateEntrance = true,
  entranceDelay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [imageHeight, setImageHeight] = useState<number>(0);

  const toolbarHeight = 44;
  const dotSize = 12;
  const contentHeight = height - toolbarHeight;

  // Entrance animation
  const entranceProgress = animateEntrance
    ? spring({
        frame: frame - entranceDelay,
        fps,
        config: { damping: 15, stiffness: 80 },
        durationInFrames: 60,
      })
    : 1;

  const browserScale = interpolate(entranceProgress, [0, 1], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const browserOpacity = entranceProgress;

  // Scroll animation - use pixel values for smoother rendering
  const scrollFrame = Math.max(0, frame - entranceDelay - scrollDelay);

  // Smooth ease-in-out
  const t = interpolate(
    scrollFrame,
    [0, scrollDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const scrollProgress = t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Calculate scroll in pixels for smoother animation (avoid subpixel issues)
  // Use a reasonable estimate if image hasn't loaded yet (typical long screenshot is ~3x viewport height)
  const estimatedImageHeight = imageHeight > 0 ? imageHeight : contentHeight * 4;
  const maxScroll = Math.max(0, (estimatedImageHeight - contentHeight) * scrollAmount);
  const scrollPixels = Math.round(scrollProgress * maxScroll);

  return (
    <div
      style={{
        ...style,
        width,
        height,
        backgroundColor: frameColor,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        transform: `scale(${browserScale})`,
        opacity: browserOpacity,
        // GPU acceleration hints
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
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
            padding: '8px 14px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#28c840' }}>🔒</span>
          {url}
        </div>
      </div>

      {/* Content area with scrolling screenshot */}
      <div
        style={{
          height: contentHeight,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#ffffff',
          // Prevent edge artifacts
          isolation: 'isolate',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            // Use pixel-based transform with rounding to avoid subpixel flickering
            transform: `translate3d(0, ${-scrollPixels}px, 0)`,
            // GPU acceleration
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Img
            src={src}
            onLoad={(e) => {
              const img = e.currentTarget;
              // Calculate the rendered height based on width scaling
              const renderedHeight = (img.naturalHeight / img.naturalWidth) * width;
              setImageHeight(renderedHeight);
            }}
            style={{
              width: '100%',
              display: 'block',
              // Prevent any image rendering artifacts
              imageRendering: 'auto',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          />
        </div>
      </div>
    </div>
  );
};
