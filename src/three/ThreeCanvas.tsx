import React from 'react';
import { ThreeCanvas as RemotionThreeCanvas } from '@remotion/three';
import { useVideoConfig } from 'remotion';

interface ThreeCanvasProps {
  children: React.ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  };
  background?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper around Remotion's ThreeCanvas with sensible defaults
 *
 * Usage:
 * ```tsx
 * <ThreeCanvas camera={{ position: [0, 0, 5], fov: 75 }}>
 *   <RotatingCube />
 *   <ambientLight intensity={0.5} />
 * </ThreeCanvas>
 * ```
 */
export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  children,
  camera = { position: [0, 0, 5], fov: 75 },
  background = 'transparent',
  style,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <RemotionThreeCanvas
      width={width}
      height={height}
      style={{
        background,
        ...style,
      }}
      camera={{
        position: camera.position,
        fov: camera.fov,
        near: camera.near ?? 0.1,
        far: camera.far ?? 10000,
      }}
      gl={{
        alpha: true,
        antialias: true,
      }}
    >
      {children}
    </RemotionThreeCanvas>
  );
};
