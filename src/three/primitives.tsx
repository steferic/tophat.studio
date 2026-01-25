import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface RotatingCubeProps {
  size?: number;
  color?: string;
  wireframe?: boolean;
  // Rotation speed (rotations per second for each axis)
  rotationSpeed?: [number, number, number];
  // Initial rotation offset
  rotationOffset?: [number, number, number];
  // Position in 3D space
  position?: [number, number, number];
  // Optional entrance animation (frames to animate in)
  entranceFrames?: number;
  // Metalness and roughness for PBR material
  metalness?: number;
  roughness?: number;
  // Emissive glow
  emissive?: string;
  emissiveIntensity?: number;
}

/**
 * A rotating cube that syncs with Remotion's frame
 *
 * Usage:
 * ```tsx
 * <RotatingCube
 *   size={2}
 *   color="#FF7050"
 *   rotationSpeed={[0.5, 1, 0.3]}
 *   entranceFrames={30}
 * />
 * ```
 */
export const RotatingCube: React.FC<RotatingCubeProps> = ({
  size = 1,
  color = '#6366f1',
  wireframe = false,
  rotationSpeed = [0.3, 0.5, 0.2],
  rotationOffset = [0, 0, 0],
  position = [0, 0, 0],
  entranceFrames = 0,
  metalness = 0.3,
  roughness = 0.4,
  emissive,
  emissiveIntensity = 0.2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate rotation based on frame
  const time = frame / fps;
  const rotationX = rotationOffset[0] + time * rotationSpeed[0] * Math.PI * 2;
  const rotationY = rotationOffset[1] + time * rotationSpeed[1] * Math.PI * 2;
  const rotationZ = rotationOffset[2] + time * rotationSpeed[2] * Math.PI * 2;

  // Entrance animation
  let scale = 1;
  let opacity = 1;
  if (entranceFrames > 0) {
    const entranceProgress = spring({
      frame,
      fps,
      config: { damping: 12, stiffness: 100 },
    });
    scale = interpolate(entranceProgress, [0, 1], [0, 1]);
    opacity = entranceProgress;
  }

  return (
    <mesh
      position={position}
      scale={[scale, scale, scale]}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        wireframe={wireframe}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive || color}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
        transparent={entranceFrames > 0}
        opacity={opacity}
      />
    </mesh>
  );
};

interface RotatingSphereProps {
  radius?: number;
  color?: string;
  wireframe?: boolean;
  rotationSpeed?: [number, number, number];
  position?: [number, number, number];
  entranceFrames?: number;
  segments?: number;
  metalness?: number;
  roughness?: number;
}

/**
 * A rotating sphere that syncs with Remotion's frame
 */
export const RotatingSphere: React.FC<RotatingSphereProps> = ({
  radius = 1,
  color = '#6366f1',
  wireframe = false,
  rotationSpeed = [0.2, 0.3, 0.1],
  position = [0, 0, 0],
  entranceFrames = 0,
  segments = 32,
  metalness = 0.5,
  roughness = 0.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;
  const rotationX = time * rotationSpeed[0] * Math.PI * 2;
  const rotationY = time * rotationSpeed[1] * Math.PI * 2;
  const rotationZ = time * rotationSpeed[2] * Math.PI * 2;

  let scale = 1;
  if (entranceFrames > 0) {
    const entranceProgress = spring({
      frame,
      fps,
      config: { damping: 12, stiffness: 100 },
    });
    scale = interpolate(entranceProgress, [0, 1], [0, 1]);
  }

  return (
    <mesh
      position={position}
      scale={[scale, scale, scale]}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        color={color}
        wireframe={wireframe}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
};

interface FloatingObjectProps {
  children: React.ReactNode;
  floatSpeed?: number;
  floatAmount?: number;
  rotationSpeed?: [number, number, number];
  position?: [number, number, number];
}

/**
 * Wrapper that adds floating animation to any 3D object
 */
export const FloatingObject: React.FC<FloatingObjectProps> = ({
  children,
  floatSpeed = 1,
  floatAmount = 0.3,
  rotationSpeed = [0, 0.2, 0],
  position = [0, 0, 0],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;
  const floatY = Math.sin(time * floatSpeed * Math.PI * 2) * floatAmount;
  const rotationX = time * rotationSpeed[0] * Math.PI * 2;
  const rotationY = time * rotationSpeed[1] * Math.PI * 2;
  const rotationZ = time * rotationSpeed[2] * Math.PI * 2;

  return (
    <group
      position={[position[0], position[1] + floatY, position[2]]}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      {children}
    </group>
  );
};

interface WireframeTorusProps {
  radius?: number;
  tube?: number;
  color?: string;
  rotationSpeed?: [number, number, number];
  position?: [number, number, number];
  entranceFrames?: number;
}

/**
 * A wireframe torus for decorative backgrounds
 */
export const WireframeTorus: React.FC<WireframeTorusProps> = ({
  radius = 2,
  tube = 0.5,
  color = '#ffffff',
  rotationSpeed = [0.1, 0.2, 0.05],
  position = [0, 0, 0],
  entranceFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;
  const rotationX = time * rotationSpeed[0] * Math.PI * 2;
  const rotationY = time * rotationSpeed[1] * Math.PI * 2;
  const rotationZ = time * rotationSpeed[2] * Math.PI * 2;

  let scale = 1;
  let opacity = 0.3;
  if (entranceFrames > 0) {
    const entranceProgress = spring({
      frame,
      fps,
      config: { damping: 15, stiffness: 80 },
    });
    scale = interpolate(entranceProgress, [0, 1], [0.5, 1]);
    opacity = interpolate(entranceProgress, [0, 1], [0, 0.3]);
  }

  return (
    <mesh
      position={position}
      scale={[scale, scale, scale]}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      <torusGeometry args={[radius, tube, 16, 48]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
};
