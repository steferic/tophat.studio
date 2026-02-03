/**
 * Hairy Ball Theorem Visualization
 * A sphere covered in animated vector "hair follicles" that sway,
 * demonstrating that any continuous tangent vector field on a sphere
 * must have at least one point where the vector is zero.
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

export interface HairyBallProps {
  startFrame?: number;
  hairCount?: number;
  sphereRadius?: number;
  hairLength?: number;
}

const SEGMENTS_PER_HAIR = 5;

/**
 * Generate follicle positions on a sphere using fibonacci spiral sampling
 * for near-uniform distribution.
 */
const generateFollicles = (count: number, radius: number) => {
  const positions: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / count);
    const phi = (2 * Math.PI * i) / goldenRatio;

    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    const normal = new THREE.Vector3(x, y, z);
    positions.push(normal.clone().multiplyScalar(radius));
    normals.push(normal);
  }

  return { positions, normals };
};

/**
 * Compute a tangent vector at a point on the sphere.
 * Uses cross product of surface normal with a fixed axis.
 * Near the poles (where the cross product degenerates), the
 * tangent shrinks — demonstrating the hairy ball theorem singularity.
 */
const computeTangent = (normal: THREE.Vector3): THREE.Vector3 => {
  const axis = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, axis);
  const len = tangent.length();

  if (len < 0.001) {
    // Near the poles — the "cowlick" where hair must vanish
    return new THREE.Vector3(0, 0, 0);
  }

  tangent.normalize();
  // Scale by how far from the pole we are (sin of angle from axis)
  tangent.multiplyScalar(len);
  return tangent;
};

/**
 * Inner Three.js scene component for the hairy ball
 */
const HairyBallScene: React.FC<{
  hairCount: number;
  sphereRadius: number;
  hairLength: number;
  startFrame: number;
}> = ({ hairCount, sphereRadius, hairLength, startFrame }) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = globalFrame - startFrame;
  const time = frame / fps;

  // Generate follicle data once
  const { positions: folliclePositions, normals: follicleNormals } = useMemo(
    () => generateFollicles(hairCount, sphereRadius),
    [hairCount, sphereRadius]
  );

  // Pre-compute tangent vectors and per-strand phase offsets
  const { tangents, phases } = useMemo(() => {
    const tangents = follicleNormals.map(computeTangent);
    const phases = follicleNormals.map((_, i) => {
      const s = Math.sin(i * 12.9898 + 1) * 43758.5453;
      return (s - Math.floor(s)) * Math.PI * 2;
    });
    return { tangents, phases };
  }, [follicleNormals]);

  // Warm hair color gradient (root darker, tip lighter)
  const rootColor = useMemo(() => new THREE.Color('#8B4513'), []); // saddle brown
  const tipColor = useMemo(() => new THREE.Color('#FFD700'), []);  // gold

  // Build line segment geometry — updated each frame
  const geometry = useMemo(() => {
    // Each hair has SEGMENTS_PER_HAIR segments, each segment = 2 vertices
    const vertexCount = hairCount * SEGMENTS_PER_HAIR * 2;
    const posArray = new Float32Array(vertexCount * 3);
    const colArray = new Float32Array(vertexCount * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    return geo;
  }, [hairCount]);

  // Update hair positions every frame
  useMemo(() => {
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    // Grow-in animation over first 2 seconds
    const growFactor = interpolate(frame, [0, 120], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const segLen = (hairLength / SEGMENTS_PER_HAIR) * growFactor;

    for (let h = 0; h < hairCount; h++) {
      const root = folliclePositions[h];
      const normal = follicleNormals[h];
      const tangent = tangents[h];
      const phase = phases[h];

      // Perpendicular to both normal and tangent for sway variation
      const biTangent = new THREE.Vector3().crossVectors(normal, tangent);
      if (biTangent.length() > 0.001) biTangent.normalize();

      // Sway parameters
      const swayAmount = 0.3 * tangent.length(); // less sway near poles
      const swayX = Math.sin(time * 2.0 + phase) * swayAmount;
      const swayY = Math.cos(time * 1.5 + phase * 1.3) * swayAmount * 0.6;

      // Build chain of segments
      let prevPoint = root.clone();

      for (let s = 0; s < SEGMENTS_PER_HAIR; s++) {
        const t = (s + 1) / SEGMENTS_PER_HAIR;

        // Hair grows outward along normal, bent by tangent field + sway
        const offset = new THREE.Vector3()
          .addScaledVector(normal, segLen)
          .addScaledVector(tangent, segLen * 0.3 * t)
          .addScaledVector(tangent, swayX * t * t)
          .addScaledVector(biTangent, swayY * t * t);

        const nextPoint = prevPoint.clone().add(offset);

        // Write vertices for this segment
        const idx = (h * SEGMENTS_PER_HAIR + s) * 6; // 2 verts * 3 components
        pos[idx] = prevPoint.x;
        pos[idx + 1] = prevPoint.y;
        pos[idx + 2] = prevPoint.z;
        pos[idx + 3] = nextPoint.x;
        pos[idx + 4] = nextPoint.y;
        pos[idx + 5] = nextPoint.z;

        // Color: interpolate root to tip
        const c = new THREE.Color().lerpColors(rootColor, tipColor, t);
        col[idx] = c.r;
        col[idx + 1] = c.g;
        col[idx + 2] = c.b;
        col[idx + 3] = c.r;
        col[idx + 4] = c.g;
        col[idx + 5] = c.b;

        prevPoint = nextPoint;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }, [frame, time, hairCount, hairLength, geometry, folliclePositions, follicleNormals, tangents, phases, rootColor, tipColor]);

  // Slow rotation
  const rotY = time * 0.3;
  const rotX = Math.sin(time * 0.15) * 0.2;

  return (
    <group rotation={[rotX, rotY, 0]}>
      {/* Semi-transparent sphere underneath */}
      <mesh>
        <sphereGeometry args={[sphereRadius, 64, 64]} />
        <meshStandardMaterial
          color="#2a1a0a"
          transparent
          opacity={0.6}
          roughness={0.8}
        />
      </mesh>

      {/* Hair strands as line segments */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
};

export const HairyBall: React.FC<HairyBallProps> = ({
  startFrame = 0,
  hairCount = 2000,
  sphereRadius = 5,
  hairLength = 1.5,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [60, 120], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 18], fov: 50 }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <directionalLight position={[-5, -5, 5]} intensity={0.3} color="#ffd080" />
        <HairyBallScene
          hairCount={hairCount}
          sphereRadius={sphereRadius}
          hairLength={hairLength}
          startFrame={startFrame}
        />
      </ThreeCanvas>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 52,
            fontWeight: 'bold',
            color: '#f8fafc',
            margin: 0,
            fontFamily: 'system-ui',
          }}
        >
          Hairy Ball Theorem
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 22,
            color: '#94a3b8',
            margin: 0,
            fontFamily: 'monospace',
          }}
        >
          Every continuous tangent vector field on a sphere has at least one
          zero
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default HairyBall;
