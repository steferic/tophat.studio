import React, { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { useGLTF, Clone } from '@react-three/drei';

interface ModelProps {
  // Path to the model file (relative to public folder)
  src: string;
  // Position in 3D space
  position?: [number, number, number];
  // Scale (uniform or per-axis)
  scale?: number | [number, number, number];
  // Rotation in radians
  rotation?: [number, number, number];
  // Auto-rotate speeds (rotations per second for each axis)
  autoRotate?: [number, number, number];
  // Entrance animation duration in frames
  entranceFrames?: number;
  // Float animation
  float?: {
    speed?: number;
    amount?: number;
  };
}

/**
 * 3D Model Component
 * Loads and displays GLTF/GLB models from Polycam or other sources
 *
 * Usage:
 * ```tsx
 * <ThreeCanvas>
 *   <Model
 *     src="models/my-scan.glb"
 *     position={[0, 0, 0]}
 *     scale={2}
 *     autoRotate={[0, 0.3, 0]}
 *   />
 * </ThreeCanvas>
 * ```
 */
export const Model: React.FC<ModelProps> = ({
  src,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  autoRotate,
  entranceFrames = 0,
  float,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Load the model
  const { scene } = useGLTF(src);

  // Calculate rotation
  let rotX = rotation[0];
  let rotY = rotation[1];
  let rotZ = rotation[2];

  if (autoRotate) {
    rotX += time * autoRotate[0] * Math.PI * 2;
    rotY += time * autoRotate[1] * Math.PI * 2;
    rotZ += time * autoRotate[2] * Math.PI * 2;
  }

  // Calculate position with float
  let posY = position[1];
  if (float) {
    const floatSpeed = float.speed ?? 1;
    const floatAmount = float.amount ?? 0.3;
    posY += Math.sin(time * floatSpeed * Math.PI * 2) * floatAmount;
  }

  // Entrance animation
  let scaleMultiplier = 1;
  let opacity = 1;
  if (entranceFrames > 0) {
    const entranceProgress = spring({
      frame,
      fps,
      config: { damping: 12, stiffness: 100 },
    });
    scaleMultiplier = interpolate(entranceProgress, [0, 1], [0, 1]);
    opacity = entranceProgress;
  }

  // Calculate final scale
  const finalScale = Array.isArray(scale)
    ? scale.map((s) => s * scaleMultiplier) as [number, number, number]
    : [scale * scaleMultiplier, scale * scaleMultiplier, scale * scaleMultiplier] as [number, number, number];

  return (
    <group
      position={[position[0], posY, position[2]]}
      rotation={[rotX, rotY, rotZ]}
      scale={finalScale}
    >
      <Clone object={scene} />
    </group>
  );
};

/**
 * Wrapper for Model with Suspense fallback
 */
export const ModelWithFallback: React.FC<ModelProps & { fallback?: React.ReactNode }> = ({
  fallback = null,
  ...props
}) => {
  return (
    <Suspense fallback={fallback}>
      <Model {...props} />
    </Suspense>
  );
};

interface OrbitingModelProps extends ModelProps {
  // Orbit radius
  orbitRadius?: number;
  // Orbit speed (rotations per second)
  orbitSpeed?: number;
  // Orbit axis: 'y' for horizontal orbit, 'x' for vertical
  orbitAxis?: 'x' | 'y' | 'z';
  // Starting angle in radians
  orbitOffset?: number;
}

/**
 * A model that orbits around a center point
 */
export const OrbitingModel: React.FC<OrbitingModelProps> = ({
  orbitRadius = 3,
  orbitSpeed = 0.2,
  orbitAxis = 'y',
  orbitOffset = 0,
  position = [0, 0, 0],
  ...props
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const angle = orbitOffset + time * orbitSpeed * Math.PI * 2;

  let orbitX = position[0];
  let orbitY = position[1];
  let orbitZ = position[2];

  switch (orbitAxis) {
    case 'y':
      orbitX = position[0] + Math.cos(angle) * orbitRadius;
      orbitZ = position[2] + Math.sin(angle) * orbitRadius;
      break;
    case 'x':
      orbitY = position[1] + Math.cos(angle) * orbitRadius;
      orbitZ = position[2] + Math.sin(angle) * orbitRadius;
      break;
    case 'z':
      orbitX = position[0] + Math.cos(angle) * orbitRadius;
      orbitY = position[1] + Math.sin(angle) * orbitRadius;
      break;
  }

  return <Model {...props} position={[orbitX, orbitY, orbitZ]} />;
};

// Preload helper for better performance
export const preloadModel = (src: string) => {
  useGLTF.preload(src);
};
