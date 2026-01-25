import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface ZoomPunchProps {
  children: React.ReactNode;
  // Frame when the punch happens (relative to sequence start)
  punchFrame?: number;
  // How much to zoom (1.0 = no zoom, 1.2 = 20% zoom)
  zoomAmount?: number;
  // Direction: 'in' zooms in then back, 'out' zooms out then back
  direction?: 'in' | 'out';
  // Spring config for snappiness
  damping?: number;
  stiffness?: number;
}

/**
 * Zoom Punch Effect
 * Creates a quick zoom in/out punch effect, perfect for beat hits
 *
 * Usage:
 * ```tsx
 * <ZoomPunch punchFrame={30} zoomAmount={1.15}>
 *   <YourContent />
 * </ZoomPunch>
 * ```
 */
export const ZoomPunch: React.FC<ZoomPunchProps> = ({
  children,
  punchFrame = 0,
  zoomAmount = 1.15,
  direction = 'in',
  damping = 8,
  stiffness = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation that goes from 0 to 1 and settles
  const punch = spring({
    frame: frame - punchFrame,
    fps,
    config: { damping, stiffness },
  });

  // Create a punch effect: quickly zoom then return
  // We use a curve that peaks and returns
  const punchCurve = Math.sin(punch * Math.PI);

  const baseScale = direction === 'in' ? 1 : zoomAmount;
  const targetScale = direction === 'in' ? zoomAmount : 1;

  const scale = interpolate(punchCurve, [0, 1], [baseScale, targetScale]);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

interface MultiZoomPunchProps {
  children: React.ReactNode;
  // Array of frames when punches happen
  punchFrames: number[];
  zoomAmount?: number;
  damping?: number;
  stiffness?: number;
}

/**
 * Multi Zoom Punch - trigger multiple punches at specific frames
 * Great for syncing to multiple beats
 */
export const MultiZoomPunch: React.FC<MultiZoomPunchProps> = ({
  children,
  punchFrames,
  zoomAmount = 1.1,
  damping = 10,
  stiffness = 300,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate combined punch effect from all punch points
  let totalPunch = 0;

  for (const punchFrame of punchFrames) {
    if (frame >= punchFrame) {
      const timeSincePunch = frame - punchFrame;
      const punch = spring({
        frame: timeSincePunch,
        fps,
        config: { damping, stiffness },
      });
      // Decay the punch effect
      const punchEffect = Math.sin(punch * Math.PI) * Math.exp(-timeSincePunch / 15);
      totalPunch += punchEffect;
    }
  }

  // Clamp the total effect
  totalPunch = Math.min(totalPunch, 1);

  const scale = 1 + (zoomAmount - 1) * totalPunch;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
