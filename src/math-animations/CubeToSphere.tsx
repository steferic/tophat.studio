/**
 * Simple Cube to Sphere Point Cloud Morphing
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

export interface CubeToSphereProps {
  startFrame?: number;
}

const PARTICLE_COUNT = 4000;
const CUBE_SIZE = 15;
const SPHERE_RADIUS = 12;

/**
 * Generate matched cube and sphere points where each cube point
 * maps to its radially projected position on the sphere.
 * This creates optimal straight-line paths for the morph.
 */
const generateMatchedPoints = (count: number, cubeSize: number, sphereRadius: number) => {
  const cubePoints: number[] = [];
  const spherePoints: number[] = [];

  const halfSize = cubeSize / 2;
  const pointsPerFace = Math.floor(count / 6);

  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < pointsPerFace; i++) {
      // Use golden ratio for better distribution on cube faces
      const u = (i * 0.618033988749895) % 1;
      const v = i / pointsPerFace;

      let x: number, y: number, z: number;

      switch (face) {
        case 0: x = (u - 0.5) * cubeSize; y = (v - 0.5) * cubeSize; z = halfSize; break;
        case 1: x = (u - 0.5) * cubeSize; y = (v - 0.5) * cubeSize; z = -halfSize; break;
        case 2: x = (u - 0.5) * cubeSize; y = halfSize; z = (v - 0.5) * cubeSize; break;
        case 3: x = (u - 0.5) * cubeSize; y = -halfSize; z = (v - 0.5) * cubeSize; break;
        case 4: x = halfSize; y = (u - 0.5) * cubeSize; z = (v - 0.5) * cubeSize; break;
        default: x = -halfSize; y = (u - 0.5) * cubeSize; z = (v - 0.5) * cubeSize; break;
      }

      // Add cube point
      cubePoints.push(x, y, z);

      // Calculate corresponding sphere point by radial projection
      // Each cube point projects outward to the sphere along the same direction
      const length = Math.sqrt(x * x + y * y + z * z);
      if (length > 0) {
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        spherePoints.push(nx * sphereRadius, ny * sphereRadius, nz * sphereRadius);
      } else {
        // Handle center point (shouldn't happen with surface points)
        spherePoints.push(0, sphereRadius, 0);
      }
    }
  }

  // Fill remaining points if needed
  while (cubePoints.length < count * 3) {
    cubePoints.push(0, 0, 0);
    spherePoints.push(0, 0, 0);
  }

  return {
    cube: new Float32Array(cubePoints),
    sphere: new Float32Array(spherePoints),
  };
};

/**
 * Morphing point cloud component
 */
const MorphingPointCloud: React.FC<{
  progress: number;
}> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Generate matched cube and sphere points
  const { cube: cubePoints, sphere: spherePoints } = useMemo(
    () => generateMatchedPoints(PARTICLE_COUNT, CUBE_SIZE, SPHERE_RADIUS),
    []
  );

  // Pre-compute random offsets for chaos effect
  const randomOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const seed1 = Math.sin(i * 12.9898 + 1) * 43758.5453;
      const seed2 = Math.sin(i * 78.233 + 2) * 43758.5453;
      const seed3 = Math.sin(i * 45.164 + 3) * 43758.5453;
      offsets.push(
        (seed1 - Math.floor(seed1)) - 0.5,
        (seed2 - Math.floor(seed2)) - 0.5,
        (seed3 - Math.floor(seed3)) - 0.5
      );
    }
    return offsets;
  }, []);


  // Calculate current positions based on progress
  const currentPositions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const t = Easing.inOut(Easing.cubic)(progress);
    // Reduced chaos since paths are now optimal - just a subtle wobble
    const chaos = Math.sin(progress * Math.PI) * 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.lerp(cubePoints[i3], spherePoints[i3], t) + randomOffsets[i3] * chaos;
      positions[i3 + 1] = THREE.MathUtils.lerp(cubePoints[i3 + 1], spherePoints[i3 + 1], t) + randomOffsets[i3 + 1] * chaos;
      positions[i3 + 2] = THREE.MathUtils.lerp(cubePoints[i3 + 2], spherePoints[i3 + 2], t) + randomOffsets[i3 + 2] * chaos;
    }
    return positions;
  }, [progress, cubePoints, spherePoints, randomOffsets]);

  // Calculate current colors based on progress
  const currentColors = useMemo(() => {
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const cubeColor = new THREE.Color('#3b82f6');
    const sphereColor = new THREE.Color('#ef4444');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      colors[i3] = THREE.MathUtils.lerp(cubeColor.r, sphereColor.r, progress);
      colors[i3 + 1] = THREE.MathUtils.lerp(cubeColor.g, sphereColor.g, progress);
      colors[i3 + 2] = THREE.MathUtils.lerp(cubeColor.b, sphereColor.b, progress);
    }
    return colors;
  }, [progress]);

  const rotY = time * 0.4;

  // Create geometry with key to force recreation when positions change
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));
    return geo;
  }, [currentPositions, currentColors]);

  return (
    <group rotation={[0.3, rotY, 0]}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.4}
          vertexColors
          sizeAttenuation
        />
      </points>
    </group>
  );
};

const SceneContent: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;

  const progress = interpolate(frame, [60, 540], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <MorphingPointCloud progress={progress} />
    </>
  );
};

export const CubeToSphere: React.FC<CubeToSphereProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  const progress = interpolate(frame, [60, 540], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 45], fov: 50 }}
      >
        <color attach="background" args={['#0a0a1a']} />
        <SceneContent startFrame={startFrame} />
      </ThreeCanvas>

      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
          Cube → Sphere Morphing
        </h1>
      </div>

      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <p style={{ fontSize: 28, color: progress < 0.5 ? '#3b82f6' : '#ef4444', margin: 0 }}>
          {progress < 0.3 ? 'Cube' : progress > 0.7 ? 'Sphere' : 'Morphing...'}
        </p>
        <p style={{ fontSize: 20, color: '#64748b', margin: '10px 0 0 0', fontFamily: 'monospace' }}>
          {(progress * 100).toFixed(0)}%
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default CubeToSphere;
