/**
 * KenBurns - Cinematic pan/zoom animation over static images.
 *
 * Turns a still image into a dynamic video-like clip with smooth
 * camera movement. Supports presets and custom from/to transforms.
 */

import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { KenBurnsPreset } from '../types/project';

interface Transform {
  scale: number;
  x: number; // percent offset (-50 to 50)
  y: number; // percent offset (-50 to 50)
}

const PRESETS: Record<KenBurnsPreset, { from: Transform; to: Transform }> = {
  'zoom-in': {
    from: { scale: 1, x: 0, y: 0 },
    to: { scale: 1.3, x: 0, y: 0 },
  },
  'zoom-out': {
    from: { scale: 1.3, x: 0, y: 0 },
    to: { scale: 1, x: 0, y: 0 },
  },
  'pan-left': {
    from: { scale: 1.2, x: 10, y: 0 },
    to: { scale: 1.2, x: -10, y: 0 },
  },
  'pan-right': {
    from: { scale: 1.2, x: -10, y: 0 },
    to: { scale: 1.2, x: 10, y: 0 },
  },
  'pan-up': {
    from: { scale: 1.2, x: 0, y: 8, },
    to: { scale: 1.2, x: 0, y: -8 },
  },
  'pan-down': {
    from: { scale: 1.2, x: 0, y: -8 },
    to: { scale: 1.2, x: 0, y: 8 },
  },
  'zoom-in-pan-right': {
    from: { scale: 1, x: -8, y: 0 },
    to: { scale: 1.3, x: 8, y: -3 },
  },
  'zoom-out-pan-left': {
    from: { scale: 1.4, x: 8, y: 3 },
    to: { scale: 1, x: -5, y: 0 },
  },
};

export interface KenBurnsProps {
  /** Image source (use staticFile()) */
  src: string;
  /** Preset animation */
  preset?: KenBurnsPreset;
  /** Custom start transform (overrides preset) */
  from?: Transform;
  /** Custom end transform (overrides preset) */
  to?: Transform;
  /** Easing function (default: ease-in-out) */
  easing?: (t: number) => number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  src,
  preset = 'zoom-in',
  from: customFrom,
  to: customTo,
  easing = Easing.inOut(Easing.ease),
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const presetData = PRESETS[preset];
  const from = customFrom ?? presetData.from;
  const to = customTo ?? presetData.to;

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(progress, [0, 1], [from.scale, to.scale]);
  const x = interpolate(progress, [0, 1], [from.x, to.x]);
  const y = interpolate(progress, [0, 1], [from.y, to.y]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x}%, ${y}%)`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

export default KenBurns;
