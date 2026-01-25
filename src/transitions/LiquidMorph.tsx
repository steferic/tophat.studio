import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface LiquidMorphProps {
  children: React.ReactNode;
  // Duration of the transition
  durationInFrames?: number;
  // Number of blob points (more = more organic)
  complexity?: number;
  // How much the blob wobbles
  wobbleAmount?: number;
  // Speed of the wobble animation
  wobbleSpeed?: number;
  // Color of the blob (for solid color reveal)
  blobColor?: string;
  // Whether to show the blob color or just use as mask
  showBlob?: boolean;
}

/**
 * Liquid Morph Transition
 * Creates an organic, blob-like reveal effect
 *
 * Usage:
 * ```tsx
 * <LiquidMorph durationInFrames={45} complexity={8}>
 *   <NewScene />
 * </LiquidMorph>
 * ```
 */
export const LiquidMorph: React.FC<LiquidMorphProps> = ({
  children,
  durationInFrames = 45,
  complexity = 6,
  wobbleAmount = 20,
  wobbleSpeed = 2,
  blobColor = '#FF7050',
  showBlob = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames,
  });

  // Calculate the base radius that will cover the screen
  const diagonal = Math.sqrt(width * width + height * height);
  const baseRadius = interpolate(progress, [0, 1], [0, diagonal * 0.7]);

  // Generate blob points with wobble
  const time = frame / fps;
  const points: string[] = [];

  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * Math.PI * 2;

    // Add wobble based on time and point index
    const wobble = Math.sin(time * wobbleSpeed + i * 1.5) * wobbleAmount * (1 - progress * 0.5);

    const radius = baseRadius + wobble;
    const x = 50 + (radius / width) * 100 * Math.cos(angle);
    const y = 50 + (radius / height) * 100 * Math.sin(angle);

    points.push(`${x}% ${y}%`);
  }

  // Create smooth blob using the points
  // We'll use a simplified approach with polygon
  const clipPath = `polygon(${points.join(', ')})`;

  return (
    <AbsoluteFill>
      {/* Blob background (optional) */}
      {showBlob && progress > 0 && progress < 1 && (
        <AbsoluteFill
          style={{
            backgroundColor: blobColor,
            clipPath,
            WebkitClipPath: clipPath,
            zIndex: 5,
          }}
        />
      )}

      {/* Content revealed by blob */}
      <AbsoluteFill
        style={{
          clipPath,
          WebkitClipPath: clipPath,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

interface BlobTransitionProps {
  children: React.ReactNode;
  durationInFrames?: number;
  // Start position (0-1 for x and y)
  origin?: [number, number];
  // Blob color
  color?: string;
}

/**
 * Smooth Blob Transition
 * A simpler, smoother blob that expands from a point
 */
export const BlobTransition: React.FC<BlobTransitionProps> = ({
  children,
  durationInFrames = 40,
  origin = [0.5, 0.5],
  color = '#FF7050',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
    durationInFrames,
  });

  const diagonal = Math.sqrt(width * width + height * height);
  const radius = interpolate(progress, [0, 1], [0, diagonal]);

  const originX = origin[0] * 100;
  const originY = origin[1] * 100;

  // Use a simple circle with some distortion
  const time = frame / fps;

  // Create multiple overlapping circles for organic feel
  const circles = [
    { offset: 0, scale: 1 },
    { offset: Math.PI / 3, scale: 0.95 },
    { offset: (2 * Math.PI) / 3, scale: 0.9 },
  ];

  return (
    <AbsoluteFill>
      {/* Color layer that shows during transition */}
      {progress > 0.1 && progress < 0.9 && (
        <AbsoluteFill
          style={{
            backgroundColor: color,
            clipPath: `circle(${radius * 0.98}px at ${originX}% ${originY}%)`,
            WebkitClipPath: `circle(${radius * 0.98}px at ${originX}% ${originY}%)`,
            opacity: interpolate(progress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0]),
            zIndex: 5,
          }}
        />
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          clipPath: `circle(${radius}px at ${originX}% ${originY}%)`,
          WebkitClipPath: `circle(${radius}px at ${originX}% ${originY}%)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

interface WaveTransitionProps {
  children: React.ReactNode;
  durationInFrames?: number;
  // Number of waves
  waves?: number;
  // Wave amplitude
  amplitude?: number;
  // Direction: 'left', 'right', 'up', 'down'
  direction?: 'left' | 'right' | 'up' | 'down';
  color?: string;
}

/**
 * Wave Transition
 * Content revealed with a wavy edge
 */
export const WaveTransition: React.FC<WaveTransitionProps> = ({
  children,
  durationInFrames = 35,
  waves = 4,
  amplitude = 50,
  direction = 'right',
  color = '#FF7050',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames,
  });

  const time = frame / fps;

  // Generate wave points
  const points: string[] = [];
  const isHorizontal = direction === 'left' || direction === 'right';
  const segments = 50;

  if (isHorizontal) {
    const baseX = direction === 'right'
      ? interpolate(progress, [0, 1], [-10, 110])
      : interpolate(progress, [0, 1], [110, -10]);

    // Top edge (straight)
    points.push(`${direction === 'right' ? -10 : 110}% 0%`);

    // Wavy edge
    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * 100;
      const wave = Math.sin((y / 100) * Math.PI * waves + time * 3) * amplitude * (1 - progress);
      const x = baseX + (wave / width) * 100;
      points.push(`${x}% ${y}%`);
    }

    // Bottom edge (straight)
    points.push(`${direction === 'right' ? -10 : 110}% 100%`);
  } else {
    const baseY = direction === 'down'
      ? interpolate(progress, [0, 1], [-10, 110])
      : interpolate(progress, [0, 1], [110, -10]);

    // Left edge
    points.push(`0% ${direction === 'down' ? -10 : 110}%`);

    // Wavy edge
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 100;
      const wave = Math.sin((x / 100) * Math.PI * waves + time * 3) * amplitude * (1 - progress);
      const y = baseY + (wave / height) * 100;
      points.push(`${x}% ${y}%`);
    }

    // Right edge
    points.push(`100% ${direction === 'down' ? -10 : 110}%`);
  }

  const clipPath = `polygon(${points.join(', ')})`;

  return (
    <AbsoluteFill>
      {/* Wave color overlay */}
      {progress > 0 && progress < 1 && (
        <AbsoluteFill
          style={{
            backgroundColor: color,
            clipPath,
            WebkitClipPath: clipPath,
            opacity: 0.8,
            zIndex: 5,
          }}
        />
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          clipPath,
          WebkitClipPath: clipPath,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
