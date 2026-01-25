/**
 * 3D Model Point Cloud Morphing
 * Morphs between any two 3D models using point cloud animation
 */

import React, { useMemo, Suspense } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface FishToAppleProps {
  startFrame?: number;
  /** Path to first model (relative to public folder, e.g., 'models/lion-chinatown.glb') */
  startModel?: string;
  /** Path to second model (relative to public folder, e.g., 'models/tank.glb') */
  endModel?: string;
  /** Label for the first model */
  startLabel?: string;
  /** Label for the second model */
  endLabel?: string;
  /** Color for the first model (hex string) */
  startColor?: string;
  /** Color for the second model (hex string) */
  endColor?: string;
  /** Title displayed at top */
  title?: string;
  /** Number of particles */
  particleCount?: number;
}

// Default configuration
const DEFAULT_CONFIG = {
  startModel: 'models/lion-chinatown.glb',
  endModel: 'models/tank.glb',
  startLabel: 'Lion',
  endLabel: 'Tank',
  startColor: '#fbbf24',
  endColor: '#4d7c0f',
  title: 'Model Metamorphosis',
  particleCount: 8000,
};

// Helper to convert indexed geometry to non-indexed
const toNonIndexed = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => {
  if (geometry.index === null) {
    return geometry;
  }
  return geometry.toNonIndexed();
};

// Helper to extract all vertex positions from a GLTF scene
const extractAllVertices = (scene: THREE.Object3D): Float32Array => {
  const allPositions: number[] = [];

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      let geometry = mesh.geometry.clone();
      geometry = toNonIndexed(geometry);

      mesh.updateWorldMatrix(true, false);
      geometry.applyMatrix4(mesh.matrixWorld);

      const posAttr = geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        allPositions.push(
          posAttr.getX(i),
          posAttr.getY(i),
          posAttr.getZ(i)
        );
      }
    }
  });

  return new Float32Array(allPositions);
};

// Shuffle array deterministically using seed
const shuffleIndices = (count: number, seed: number): number[] => {
  const indices = Array.from({ length: count }, (_, i) => i);

  for (let i = count - 1; i > 0; i--) {
    const seedVal = Math.sin(seed + i * 12.9898) * 43758.5453;
    const j = Math.floor((seedVal - Math.floor(seedVal)) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
};

// Resample vertices to target count with shuffled distribution
const resampleVertices = (vertices: Float32Array, targetCount: number): Float32Array => {
  const vertexCount = vertices.length / 3;
  const result = new Float32Array(targetCount * 3);

  if (vertexCount === 0) {
    return result;
  }

  const shuffled = shuffleIndices(vertexCount, 42);

  for (let i = 0; i < targetCount; i++) {
    const shuffledIndex = shuffled[i % vertexCount];

    result[i * 3] = vertices[shuffledIndex * 3];
    result[i * 3 + 1] = vertices[shuffledIndex * 3 + 1];
    result[i * 3 + 2] = vertices[shuffledIndex * 3 + 2];
  }

  return result;
};

// Normalize points to fit in a bounding box centered at origin
const normalizePoints = (points: Float32Array, targetSize: number): Float32Array => {
  if (points.length === 0) return points;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < points.length; i += 3) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
    minZ = Math.min(minZ, points[i + 2]);
    maxZ = Math.max(maxZ, points[i + 2]);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  if (maxSize === 0) return points;

  const scale = targetSize / maxSize;

  const normalized = new Float32Array(points.length);
  for (let i = 0; i < points.length; i += 3) {
    normalized[i] = (points[i] - centerX) * scale;
    normalized[i + 1] = (points[i + 1] - centerY) * scale;
    normalized[i + 2] = (points[i + 2] - centerZ) * scale;
  }

  return normalized;
};

/**
 * Morphing point cloud component
 */
const MorphingPointCloud: React.FC<{
  progress: number;
  startModelPath: string;
  endModelPath: string;
  startColor: string;
  endColor: string;
  particleCount: number;
}> = ({ progress, startModelPath, endModelPath, startColor, endColor, particleCount }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Load both models
  const startGltf = useGLTF(staticFile(startModelPath));
  const endGltf = useGLTF(staticFile(endModelPath));

  // Extract and process start model points
  const startPoints = useMemo(() => {
    const allVertices = extractAllVertices(startGltf.scene);
    console.log('Start model vertices:', allVertices.length / 3);
    const resampled = resampleVertices(allVertices, particleCount);
    return normalizePoints(resampled, 20);
  }, [startGltf.scene, particleCount]);

  // Extract and process end model points
  const endPoints = useMemo(() => {
    const allVertices = extractAllVertices(endGltf.scene);
    console.log('End model vertices:', allVertices.length / 3);
    const resampled = resampleVertices(allVertices, particleCount);
    return normalizePoints(resampled, 20);
  }, [endGltf.scene, particleCount]);

  // Pre-compute random offsets for chaos effect
  const randomOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < particleCount; i++) {
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
  }, [particleCount]);

  // Calculate current positions based on progress
  const currentPositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const t = Easing.inOut(Easing.cubic)(progress);
    const chaos = Math.sin(progress * Math.PI) * 6;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.lerp(startPoints[i3], endPoints[i3], t) + randomOffsets[i3] * chaos;
      positions[i3 + 1] = THREE.MathUtils.lerp(startPoints[i3 + 1], endPoints[i3 + 1], t) + randomOffsets[i3 + 1] * chaos;
      positions[i3 + 2] = THREE.MathUtils.lerp(startPoints[i3 + 2], endPoints[i3 + 2], t) + randomOffsets[i3 + 2] * chaos;
    }
    return positions;
  }, [progress, startPoints, endPoints, randomOffsets, particleCount]);

  // Calculate current colors based on progress
  const currentColors = useMemo(() => {
    const colors = new Float32Array(particleCount * 3);
    const color1 = new THREE.Color(startColor);
    const color2 = new THREE.Color(endColor);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      colors[i3] = THREE.MathUtils.lerp(color1.r, color2.r, progress);
      colors[i3 + 1] = THREE.MathUtils.lerp(color1.g, color2.g, progress);
      colors[i3 + 2] = THREE.MathUtils.lerp(color1.b, color2.b, progress);
    }
    return colors;
  }, [progress, startColor, endColor, particleCount]);

  const rotY = time * 0.4;

  // Create point cloud geometry
  const pointGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));
    return geo;
  }, [currentPositions, currentColors]);

  // Create instanced mesh for spheres (subset for performance)
  const instanceCount = Math.min(particleCount, 3000);
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 6, 6), []);
  const sphereMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: false,
    transparent: true,
    opacity: 0.7,
  }), []);

  // Create instanced mesh with transforms
  const instancedMesh = useMemo(() => {
    const mesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, instanceCount);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < instanceCount; i++) {
      const i3 = i * 3;
      dummy.position.set(
        currentPositions[i3],
        currentPositions[i3 + 1],
        currentPositions[i3 + 2]
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.setRGB(currentColors[i3], currentColors[i3 + 1], currentColors[i3 + 2]);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    return mesh;
  }, [currentPositions, currentColors, sphereGeometry, sphereMaterial, instanceCount]);

  return (
    <group rotation={[0.3, rotY, 0]}>
      <points geometry={pointGeometry}>
        <pointsMaterial
          size={0.25}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
        />
      </points>
      <primitive object={instancedMesh} />
    </group>
  );
};

// Loading indicator
const LoadingFallback: React.FC = () => {
  return (
    <mesh>
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  );
};

const SceneContent: React.FC<{
  startFrame: number;
  startModelPath: string;
  endModelPath: string;
  startColor: string;
  endColor: string;
  particleCount: number;
}> = ({ startFrame, startModelPath, endModelPath, startColor, endColor, particleCount }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;

  const progress = interpolate(frame, [60, 540], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <Suspense fallback={<LoadingFallback />}>
        <MorphingPointCloud
          progress={progress}
          startModelPath={startModelPath}
          endModelPath={endModelPath}
          startColor={startColor}
          endColor={endColor}
          particleCount={particleCount}
        />
      </Suspense>
    </>
  );
};

export const FishToApple: React.FC<FishToAppleProps> = ({
  startFrame = 0,
  startModel = DEFAULT_CONFIG.startModel,
  endModel = DEFAULT_CONFIG.endModel,
  startLabel = DEFAULT_CONFIG.startLabel,
  endLabel = DEFAULT_CONFIG.endLabel,
  startColor = DEFAULT_CONFIG.startColor,
  endColor = DEFAULT_CONFIG.endColor,
  title = DEFAULT_CONFIG.title,
  particleCount = DEFAULT_CONFIG.particleCount,
}) => {
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
        <SceneContent
          startFrame={startFrame}
          startModelPath={startModel}
          endModelPath={endModel}
          startColor={startColor}
          endColor={endColor}
          particleCount={particleCount}
        />
      </ThreeCanvas>

      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
          {title}
        </h1>
      </div>

      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <p style={{ fontSize: 28, color: progress < 0.5 ? startColor : endColor, margin: 0 }}>
          {progress < 0.3 ? startLabel : progress > 0.7 ? endLabel : 'Morphing...'}
        </p>
        <p style={{ fontSize: 20, color: '#64748b', margin: '10px 0 0 0', fontFamily: 'monospace' }}>
          {(progress * 100).toFixed(0)}%
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default FishToApple;
