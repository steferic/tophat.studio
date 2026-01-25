/**
 * Scene component - Declarative scene builder similar to Manim's Scene class
 */

import React from 'react';
import { ManimCanvas, ManimCanvasProps } from './ManimCanvas';

export interface SceneProps extends ManimCanvasProps {
  children?: React.ReactNode;
}

/**
 * Scene wraps content in a ManimCanvas with proper coordinate system
 *
 * Usage:
 * ```tsx
 * <Scene background="#1a1a2e">
 *   <Sequence from={0} durationInFrames={60}>
 *     <Play animation={new Create(circle)} />
 *   </Sequence>
 * </Scene>
 * ```
 */
export const Scene: React.FC<SceneProps> = ({
  children,
  background,
  showGrid,
  gridSpacing,
  gridColor,
}) => {
  return (
    <ManimCanvas
      background={background}
      showGrid={showGrid}
      gridSpacing={gridSpacing}
      gridColor={gridColor}
    >
      {children}
    </ManimCanvas>
  );
};

export default Scene;
