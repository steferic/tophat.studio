/**
 * Hairy Ball Theorem - Apple Edition
 * A 3D apple covered in animated vector "hair" that sways,
 * demonstrating the hairy ball theorem with a real-world object.
 * Hair is sampled directly from the apple mesh surface.
 */

import React, { useMemo, Suspense } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { Subtitles } from '../components/Subtitles';

export interface HairyBallAppleProps {
  startFrame?: number;
  hairCount?: number;
  hairLength?: number;
  appleScale?: number;
}

const SEGMENTS_PER_HAIR = 5;

interface SurfaceSample {
  position: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * Sample random points on a mesh surface using face area weighting
 */
function sampleMeshSurface(geometry: THREE.BufferGeometry, count: number): SurfaceSample[] {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute | null;
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute | null;
  const indices = geometry.index;

  if (!positions || !normals) {
    console.warn('Geometry missing position or normal attributes');
    console.warn('  positions:', positions);
    console.warn('  normals:', normals);
    return [];
  }

  console.log('Sampling from geometry with', positions.count, 'vertices');

  const samples: SurfaceSample[] = [];
  const triangles: { area: number; i0: number; i1: number; i2: number }[] = [];
  let totalArea = 0;

  // Build list of triangles with their areas
  const numFaces = indices ? indices.count / 3 : positions.count / 3;

  for (let f = 0; f < numFaces; f++) {
    let i0: number, i1: number, i2: number;

    if (indices) {
      i0 = indices.getX(f * 3);
      i1 = indices.getX(f * 3 + 1);
      i2 = indices.getX(f * 3 + 2);
    } else {
      i0 = f * 3;
      i1 = f * 3 + 1;
      i2 = f * 3 + 2;
    }

    const v0 = new THREE.Vector3(
      positions.getX(i0),
      positions.getY(i0),
      positions.getZ(i0)
    );
    const v1 = new THREE.Vector3(
      positions.getX(i1),
      positions.getY(i1),
      positions.getZ(i1)
    );
    const v2 = new THREE.Vector3(
      positions.getX(i2),
      positions.getY(i2),
      positions.getZ(i2)
    );

    // Calculate triangle area
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const area = new THREE.Vector3().crossVectors(edge1, edge2).length() * 0.5;

    if (area > 0) {
      triangles.push({ area, i0, i1, i2 });
      totalArea += area;
    }
  }

  if (triangles.length === 0 || totalArea === 0) {
    console.warn('No valid triangles found');
    return [];
  }

  // Use seeded random for deterministic sampling
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // Sample points weighted by triangle area
  for (let i = 0; i < count; i++) {
    // Pick a random triangle weighted by area
    let r = seededRandom(i * 1.1) * totalArea;
    let selectedTri = triangles[0];

    for (const tri of triangles) {
      r -= tri.area;
      if (r <= 0) {
        selectedTri = tri;
        break;
      }
    }

    const { i0, i1, i2 } = selectedTri;

    // Get vertex positions (unscaled - we'll scale the whole group)
    const v0 = new THREE.Vector3(
      positions.getX(i0),
      positions.getY(i0),
      positions.getZ(i0)
    );
    const v1 = new THREE.Vector3(
      positions.getX(i1),
      positions.getY(i1),
      positions.getZ(i1)
    );
    const v2 = new THREE.Vector3(
      positions.getX(i2),
      positions.getY(i2),
      positions.getZ(i2)
    );

    // Get vertex normals
    const n0 = new THREE.Vector3(
      normals.getX(i0),
      normals.getY(i0),
      normals.getZ(i0)
    );
    const n1 = new THREE.Vector3(
      normals.getX(i1),
      normals.getY(i1),
      normals.getZ(i1)
    );
    const n2 = new THREE.Vector3(
      normals.getX(i2),
      normals.getY(i2),
      normals.getZ(i2)
    );

    // Random barycentric coordinates
    let u = seededRandom(i * 2.3);
    let v = seededRandom(i * 3.7);
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;

    // Interpolate position and normal
    const position = new THREE.Vector3()
      .addScaledVector(v0, u)
      .addScaledVector(v1, v)
      .addScaledVector(v2, w);

    const normal = new THREE.Vector3()
      .addScaledVector(n0, u)
      .addScaledVector(n1, v)
      .addScaledVector(n2, w)
      .normalize();

    samples.push({ position, normal });
  }

  return samples;
}

/**
 * Compute tangent vector - near poles it vanishes (the "cowlick")
 */
const computeTangent = (normal: THREE.Vector3): THREE.Vector3 => {
  const axis = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, axis);
  const len = tangent.length();

  if (len < 0.001) {
    return new THREE.Vector3(0, 0, 0);
  }

  tangent.normalize();
  tangent.multiplyScalar(len);
  return tangent;
};

/**
 * Combined Apple + Hair scene that samples hair from the mesh
 */
const HairyAppleScene: React.FC<{
  hairCount: number;
  hairLength: number;
  appleScale: number;
  startFrame: number;
}> = ({ hairCount, hairLength, appleScale, startFrame }) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = globalFrame - startFrame;
  const time = frame / fps;

  const { scene } = useGLTF(staticFile('models/apple.glb'));

  // Extract geometry and sample surface points synchronously with useMemo
  const surfaceSamples = useMemo(() => {
    const meshes: THREE.Mesh[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        meshes.push(child);
      }
    });

    console.log('Total meshes found:', meshes.length);

    if (meshes.length === 0) {
      return [];
    }

    // Collect all geometries and merge them for sampling
    const allSamples: SurfaceSample[] = [];
    const samplesPerMesh = Math.ceil(hairCount / meshes.length);

    for (const mesh of meshes) {
      // Clone the geometry to get a fresh copy with proper attributes
      const geo = mesh.geometry.clone();

      // Apply the mesh's world matrix to get correct positions
      mesh.updateMatrixWorld(true);
      geo.applyMatrix4(mesh.matrixWorld);

      // Ensure we have normals
      if (!geo.getAttribute('normal')) {
        console.log('Computing normals for mesh:', mesh.name);
        geo.computeVertexNormals();
      }

      const posAttr = geo.getAttribute('position');
      const normAttr = geo.getAttribute('normal');

      console.log('Mesh', mesh.name, '- pos:', posAttr?.count, 'verts, normal:', normAttr?.count);

      if (posAttr && normAttr) {
        const samples = sampleMeshSurface(geo, samplesPerMesh);
        console.log('  Generated', samples.length, 'samples from this mesh');
        allSamples.push(...samples);
      }
    }

    console.log('Total surface samples:', allSamples.length);
    if (allSamples.length > 0) {
      console.log('Sample 0 position:', allSamples[0].position.toArray());
      console.log('Sample 0 normal:', allSamples[0].normal.toArray());
    }
    return allSamples;
  }, [scene, hairCount]);

  // Slow rotation
  const rotY = time * 0.3;
  const rotX = Math.sin(time * 0.15) * 0.2;

  // Scale animation
  const scaleAnim = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentScale = appleScale * scaleAnim;

  // Pre-compute tangents and phases
  const { tangents, phases } = useMemo(() => {
    const tangents = surfaceSamples.map((s) => computeTangent(s.normal));
    const phases = surfaceSamples.map((_, i) => {
      const s = Math.sin(i * 12.9898 + 1) * 43758.5453;
      return (s - Math.floor(s)) * Math.PI * 2;
    });
    return { tangents, phases };
  }, [surfaceSamples]);

  // Hair colors
  const rootColor = useMemo(() => new THREE.Color('#1a5c1a'), []);
  const tipColor = useMemo(() => new THREE.Color('#7cfc00'), []);

  // Hair geometry - recreate when sample count changes
  const hairGeometry = useMemo(() => {
    const actualCount = surfaceSamples.length;
    const vertexCount = actualCount * SEGMENTS_PER_HAIR * 2;
    const posArray = new Float32Array(vertexCount * 3);
    const colArray = new Float32Array(vertexCount * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    return geo;
  }, [surfaceSamples.length]);

  // Update hair positions every frame
  useMemo(() => {
    if (surfaceSamples.length === 0) return;

    const posAttr = hairGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = hairGeometry.getAttribute('color') as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    const growFactor = interpolate(frame, [0, 120], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const segLen = (hairLength / SEGMENTS_PER_HAIR) * growFactor;

    for (let h = 0; h < surfaceSamples.length; h++) {
      const sample = surfaceSamples[h];
      const root = sample.position;
      const normal = sample.normal;
      const tangent = tangents[h] || new THREE.Vector3(1, 0, 0);
      const phase = phases[h] || 0;

      const biTangent = new THREE.Vector3().crossVectors(normal, tangent);
      if (biTangent.length() > 0.001) biTangent.normalize();

      const swayAmount = 0.15 * tangent.length();
      const swayX = Math.sin(time * 2.0 + phase) * swayAmount;
      const swayY = Math.cos(time * 1.5 + phase * 1.3) * swayAmount * 0.6;

      let prevPoint = root.clone();

      for (let s = 0; s < SEGMENTS_PER_HAIR; s++) {
        const t = (s + 1) / SEGMENTS_PER_HAIR;

        const offset = new THREE.Vector3()
          .addScaledVector(normal, segLen)
          .addScaledVector(tangent, segLen * 0.2 * t)
          .addScaledVector(tangent, swayX * t * t)
          .addScaledVector(biTangent, swayY * t * t);

        const nextPoint = prevPoint.clone().add(offset);

        const idx = (h * SEGMENTS_PER_HAIR + s) * 6;
        pos[idx] = prevPoint.x;
        pos[idx + 1] = prevPoint.y;
        pos[idx + 2] = prevPoint.z;
        pos[idx + 3] = nextPoint.x;
        pos[idx + 4] = nextPoint.y;
        pos[idx + 5] = nextPoint.z;

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
  }, [frame, time, hairLength, hairGeometry, surfaceSamples, tangents, phases, rootColor, tipColor]);

  return (
    <group rotation={[rotX, rotY, 0]} scale={currentScale}>
      {/* Apple model */}
      <Clone object={scene} />

      {/* Hair strands - in same coordinate space as apple */}
      {surfaceSamples.length > 0 && (
        <lineSegments geometry={hairGeometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.95} linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};

import hairyAppleSubtitles from '../../public/audio/voiceovers/hairy-apple-voiceover.json';

export const HairyBallApple: React.FC<HairyBallAppleProps> = ({
  startFrame = 0,
  hairCount = 3000,
  hairLength = 0.3,
  appleScale = 1.5,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceovers/hairy-apple-voiceover.mp3')} />

      {/* Background music - classical */}
      <Audio
        src={staticFile('audio/music/ravel-string-quartet.mp3')}
        volume={0.48}
        startFrom={240}
      />

      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 8], fov: 50 }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, -5, 5]} intensity={0.4} color="#90ee90" />
        <Suspense fallback={null}>
          <HairyAppleScene
            hairCount={hairCount}
            hairLength={hairLength}
            appleScale={appleScale}
            startFrame={startFrame}
          />
        </Suspense>
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
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            margin: '10px 0 0 0',
            fontFamily: 'system-ui',
          }}
        >
          You can't comb a hairy apple flat
        </p>
      </div>

      {/* Subtitles */}
      <Subtitles
        segments={hairyAppleSubtitles}
        fontSize={36}
        bottomOffset={100}
      />
    </AbsoluteFill>
  );
};

export default HairyBallApple;
