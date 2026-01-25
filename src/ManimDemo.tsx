/**
 * ManimDemo - Showcase of mathematical animations using the Manim port
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  DoubleHelix,
  FourierSeries,
  MorphingShapes,
  LissajousCurves,
} from './math-animations';

export const ManimDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene durations
  const scene1End = 300;
  const scene2End = 600;
  const scene3End = 900;

  if (frame < scene1End) {
    return <DoubleHelix startFrame={0} />;
  } else if (frame < scene2End) {
    return <FourierSeries startFrame={scene1End} />;
  } else if (frame < scene3End) {
    return <MorphingShapes startFrame={scene2End} />;
  } else {
    return <LissajousCurves startFrame={scene3End} />;
  }
};

export default ManimDemo;
