import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type MaskShape = 'circle' | 'rectangle' | 'diamond' | 'star' | 'hexagon' | 'heart';

interface MaskRevealProps {
  children: React.ReactNode;
  // Shape of the reveal mask
  shape?: MaskShape;
  // Duration of the reveal in frames
  durationInFrames?: number;
  // Center point of the reveal (0-1 for x and y)
  center?: [number, number];
  // Starting size (0 = point, 1 = full screen)
  startScale?: number;
  // Ending size
  endScale?: number;
  // Rotation during reveal (in degrees)
  rotation?: number;
}

/**
 * Mask Reveal Transition
 * Reveals content through an expanding shape mask
 *
 * Usage:
 * ```tsx
 * <MaskReveal shape="circle" durationInFrames={30} center={[0.5, 0.5]}>
 *   <YourContent />
 * </MaskReveal>
 * ```
 */
export const MaskReveal: React.FC<MaskRevealProps> = ({
  children,
  shape = 'circle',
  durationInFrames = 30,
  center = [0.5, 0.5],
  startScale = 0,
  endScale = 2,
  rotation = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames,
  });

  const scale = interpolate(progress, [0, 1], [startScale, endScale]);
  const rot = interpolate(progress, [0, 1], [0, rotation]);

  // Calculate mask size based on screen diagonal
  const diagonal = Math.sqrt(width * width + height * height);
  const maskSize = diagonal * scale;

  const centerX = center[0] * 100;
  const centerY = center[1] * 100;

  // Generate clip path based on shape
  const getClipPath = (): string => {
    switch (shape) {
      case 'circle':
        return `circle(${maskSize / 2}px at ${centerX}% ${centerY}%)`;

      case 'rectangle':
        const rectHalf = maskSize / 2;
        return `inset(${50 - (scale * 50)}% ${50 - (scale * 50)}%)`;

      case 'diamond':
        const d = scale * 100;
        return `polygon(
          ${centerX}% ${centerY - d / 2}%,
          ${centerX + d / 2}% ${centerY}%,
          ${centerX}% ${centerY + d / 2}%,
          ${centerX - d / 2}% ${centerY}%
        )`;

      case 'star':
        // 5-pointed star
        const outerR = scale * 80;
        const innerR = outerR * 0.4;
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * 36 - 90 + rot) * (Math.PI / 180);
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          points.push(`${x}% ${y}%`);
        }
        return `polygon(${points.join(', ')})`;

      case 'hexagon':
        const hexR = scale * 70;
        const hexPoints: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 - 30 + rot) * (Math.PI / 180);
          const x = centerX + hexR * Math.cos(angle);
          const y = centerY + hexR * Math.sin(angle);
          hexPoints.push(`${x}% ${y}%`);
        }
        return `polygon(${hexPoints.join(', ')})`;

      case 'heart':
        // Simplified heart shape using circle approximation
        return `circle(${maskSize / 2}px at ${centerX}% ${centerY}%)`;

      default:
        return `circle(${maskSize / 2}px at ${centerX}% ${centerY}%)`;
    }
  };

  return (
    <AbsoluteFill
      style={{
        clipPath: getClipPath(),
        WebkitClipPath: getClipPath(),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

interface IrisWipeProps {
  children: React.ReactNode;
  durationInFrames?: number;
  // 'in' opens from center, 'out' closes to center
  direction?: 'in' | 'out';
  center?: [number, number];
}

/**
 * Classic iris wipe (circular reveal/close)
 */
export const IrisWipe: React.FC<IrisWipeProps> = ({
  children,
  durationInFrames = 30,
  direction = 'in',
  center = [0.5, 0.5],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
    durationInFrames,
  });

  const diagonal = Math.sqrt(width * width + height * height);

  const radius = direction === 'in'
    ? interpolate(progress, [0, 1], [0, diagonal / 2])
    : interpolate(progress, [0, 1], [diagonal / 2, 0]);

  const centerX = center[0] * 100;
  const centerY = center[1] * 100;

  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${radius}px at ${centerX}% ${centerY}%)`,
        WebkitClipPath: `circle(${radius}px at ${centerX}% ${centerY}%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

interface ShutterRevealProps {
  children: React.ReactNode;
  durationInFrames?: number;
  // Number of shutter blades
  blades?: number;
  // Direction of shutter movement
  direction?: 'horizontal' | 'vertical';
}

/**
 * Shutter/blinds reveal effect
 */
export const ShutterReveal: React.FC<ShutterRevealProps> = ({
  children,
  durationInFrames = 30,
  blades = 10,
  direction = 'horizontal',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames,
  });

  // Create blade mask
  const bladeSize = 100 / blades;
  const bladeOpen = interpolate(progress, [0, 1], [0, bladeSize]);

  // Build polygon points for all blades
  let clipPath = '';

  if (direction === 'horizontal') {
    const points: string[] = [];
    for (let i = 0; i < blades; i++) {
      const y1 = i * bladeSize;
      const y2 = y1 + bladeOpen;
      points.push(`0% ${y1}%`);
      points.push(`100% ${y1}%`);
      points.push(`100% ${y2}%`);
      points.push(`0% ${y2}%`);
    }
    // This creates a series of horizontal stripes
    // We need a different approach - use multiple rects
  }

  // Simpler approach: use a repeating gradient as mask
  const gradientStops = [];
  for (let i = 0; i < blades; i++) {
    const start = i * bladeSize;
    const visible = start + bladeOpen;
    gradientStops.push(`transparent ${start}%`);
    gradientStops.push(`transparent ${Math.min(visible, start + bladeSize)}%`);
    gradientStops.push(`black ${Math.min(visible, start + bladeSize)}%`);
    gradientStops.push(`black ${start + bladeSize}%`);
  }

  const gradientDirection = direction === 'horizontal' ? 'to bottom' : 'to right';
  const maskImage = `linear-gradient(${gradientDirection}, ${gradientStops.join(', ')})`;

  return (
    <AbsoluteFill
      style={{
        WebkitMaskImage: maskImage,
        maskImage: maskImage,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
