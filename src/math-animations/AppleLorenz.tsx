/**
 * Apple Lorenz - 3D Apple following the Lorenz Attractor path
 * Combines the 3D model system with mathematical animations
 */

import React, { useMemo, Suspense } from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useGLTF, Clone, Line } from '@react-three/drei';
import * as THREE from 'three';

export interface AppleLorenzProps {
  startFrame?: number;
}

// Lorenz system parameters
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;

// Generate the full Lorenz attractor path once
const generateLorenzPath = (): { points: THREE.Vector3[], center: THREE.Vector3 } => {
  const rawPoints: { x: number; y: number; z: number }[] = [];
  let x = 0.1;
  let y = 0;
  let z = 0;
  const dt = 0.005;
  const numSteps = 8000;
  const scale = 6.0;

  for (let i = 0; i < numSteps; i++) {
    const dx = SIGMA * (y - x);
    const dy = x * (RHO - z) - y;
    const dz = x * y - BETA * z;

    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    rawPoints.push({ x: x * scale, y: z * scale, z: y * scale });
  }

  // Calculate the center of the bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const p of rawPoints) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Offset all points to center at origin
  const points = rawPoints.map(p =>
    new THREE.Vector3(p.x - centerX, p.y - centerY, p.z - centerZ)
  );

  return { points, center: new THREE.Vector3(centerX, centerY, centerZ) };
};

// Pre-generate the path
const { points: LORENZ_PATH } = generateLorenzPath();

/**
 * The Apple model that follows the path
 */
const FollowingApple: React.FC<{
  position: [number, number, number];
  progress: number;
}> = ({ position, progress }) => {
  const { scene } = useGLTF(staticFile('models/apple.glb'));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Tumbling rotation on multiple axes
  const rotX = time * 0.7;
  const rotY = time * 1.2;
  const rotZ = time * 0.4;

  // Scale in animation
  const scale = interpolate(progress, [0, 0.02], [0, 4.5], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

  return (
    <group position={position} rotation={[rotX, rotY, rotZ]} scale={scale}>
      <Clone object={scene} />
    </group>
  );
};

/**
 * Trailing apple follower
 */
const AppleFollower: React.FC<{
  position: [number, number, number];
  progress: number;
  index: number;
}> = ({ position, progress, index }) => {
  const { scene } = useGLTF(staticFile('models/apple.glb'));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Each apple tumbles at slightly different speeds for variety
  const rotX = time * (0.6 + index * 0.15);
  const rotY = time * (1.0 + index * 0.2);
  const rotZ = time * (0.3 + index * 0.1);

  // Scale in with delay based on index
  const delayedProgress = Math.max(0, progress - index * 0.008);
  const scale = interpolate(delayedProgress, [0, 0.015], [0, 3.5], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

  return (
    <group position={position} rotation={[rotX, rotY, rotZ]} scale={scale}>
      <Clone object={scene} />
    </group>
  );
};

/**
 * The glowing trail behind the apple
 */
const LorenzTrail: React.FC<{
  points: THREE.Vector3[];
  progress: number;
}> = ({ points, progress }) => {
  const visibleCount = Math.floor(points.length * progress);
  const trailLength = Math.min(800, visibleCount);
  const startIdx = Math.max(0, visibleCount - trailLength);

  // All hooks must be called before any conditional returns
  const visiblePoints = useMemo(() => {
    if (visibleCount < 2) return [];
    return points.slice(startIdx, visibleCount);
  }, [points, startIdx, visibleCount]);

  // Create color gradient for the trail (purple to blue)
  const colors = useMemo(() => {
    if (visiblePoints.length < 2) return [];
    return visiblePoints.map((_, i) => {
      const t = i / visiblePoints.length;
      // Gradient from purple to vibrant blue
      const r = 0.4 - t * 0.2;
      const g = 0.2 + t * 0.4;
      const b = 0.9;
      return new THREE.Color(r, g, b);
    });
  }, [visiblePoints]);

  // Now we can conditionally render
  if (visiblePoints.length < 2) return null;

  return (
    <Line
      points={visiblePoints}
      vertexColors={colors}
      lineWidth={3}
      transparent
      opacity={0.9}
    />
  );
};

/**
 * Ghost trail showing the full attractor shape (faded)
 */
const GhostAttractor: React.FC<{
  points: THREE.Vector3[];
  opacity: number;
}> = ({ points, opacity }) => {
  // Always render, just with 0 opacity when hidden
  return (
    <Line
      points={points}
      color="#cbd5e1"
      lineWidth={1}
      transparent
      opacity={opacity > 0 ? opacity * 0.5 : 0}
    />
  );
};

// Trailing apple configuration - progress offsets behind the leader
const APPLE_OFFSETS = [0.025, 0.05, 0.075, 0.1];

/**
 * Main scene content
 */
const SceneContent: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;

  // Animation progress (0 to 1 over the full path) - 33% slower
  const progress = interpolate(frame, [0, 2400], [0, 0.5], {
    extrapolateRight: 'clamp',
  });

  // Calculate current position on the path for the apple (leader)
  const currentIndex = Math.floor(progress * (LORENZ_PATH.length - 1));
  const currentPoint = LORENZ_PATH[currentIndex] || LORENZ_PATH[0];

  // Calculate positions for the trailing apples
  const trailingPositions = useMemo(() => {
    return APPLE_OFFSETS.map((offset) => {
      const trailProgress = Math.max(0, progress - offset);
      const trailIndex = Math.floor(trailProgress * (LORENZ_PATH.length - 1));
      return LORENZ_PATH[trailIndex] || LORENZ_PATH[0];
    });
  }, [progress]);

  // Ghost attractor fade in
  const ghostOpacity = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.8} color="#ffffff" />

      {/* Content group */}
      <group position={[0, 0, 0]}>
        {/* Point light follows apple */}
        <pointLight position={[currentPoint.x, currentPoint.y, currentPoint.z]} intensity={3} color="#6366f1" distance={100} />

        {/* Ghost of full attractor */}
        <GhostAttractor points={LORENZ_PATH} opacity={ghostOpacity} />

        {/* Animated trail */}
        <LorenzTrail points={LORENZ_PATH} progress={progress} />

        {/* Trailing apples */}
        <Suspense fallback={null}>
          {trailingPositions.map((point, index) => (
            <AppleFollower
              key={index}
              position={[point.x, point.y, point.z]}
              progress={progress}
              index={index}
            />
          ))}
        </Suspense>

        {/* The Apple (leader) */}
        <Suspense fallback={null}>
          <FollowingApple
            position={[currentPoint.x, currentPoint.y, currentPoint.z]}
            progress={progress}
          />
        </Suspense>
      </group>
    </>
  );
};

/**
 * Main component
 */
export const AppleLorenz: React.FC<AppleLorenzProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 200], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 150, 400]} />
        <SceneContent startFrame={startFrame} />
      </ThreeCanvas>

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0,
          }}
        >
          Apple in Chaos
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: '#64748b',
            margin: 0,
            fontFamily: 'monospace',
          }}
        >
          Following the Lorenz Attractor · σ=10 ρ=28 β=8/3
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default AppleLorenz;
