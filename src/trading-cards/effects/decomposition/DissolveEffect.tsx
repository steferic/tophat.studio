import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Ashima simplex 3D noise (MIT)
const SIMPLEX_GLSL = /* glsl */ `
vec3 mod289_n(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289_n(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute_n(vec4 x) { return mod289_n(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt_n(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289_n(i);
  vec4 p = permute_n(permute_n(permute_n(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt_n(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const PARTICLE_COUNT = 80;
const NOISE_FREQ = 3.0;

// JS simplex3D approximation for particle seeding — use the same freq as the shader
// Simple 3D noise hash (doesn't need to be identical, just correlated)
function hash3(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h & 0x7fffffff) / 0x7fffffff; // 0-1
}

function sampleSurfacePoints(scene: THREE.Object3D, count: number) {
  scene.updateMatrixWorld(true);
  const points: { pos: THREE.Vector3; noiseVal: number }[] = [];
  const tempV = new THREE.Vector3();

  // Collect all mesh triangles with areas for weighted sampling
  const triangles: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; area: number }[] = [];
  let totalArea = 0;

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo || !geo.attributes.position) return;
    const expanded = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = expanded.attributes.position;

    for (let v = 0; v < posAttr.count; v += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(posAttr, v).applyMatrix4(mesh.matrixWorld);
      const b = new THREE.Vector3().fromBufferAttribute(posAttr, v + 1).applyMatrix4(mesh.matrixWorld);
      const c = new THREE.Vector3().fromBufferAttribute(posAttr, v + 2).applyMatrix4(mesh.matrixWorld);
      const ab = new THREE.Vector3().subVectors(b, a);
      const ac = new THREE.Vector3().subVectors(c, a);
      const area = ab.cross(ac).length() * 0.5;
      if (area > 0) {
        triangles.push({ a, b, c, area });
        totalArea += area;
      }
    }
  });

  if (triangles.length === 0) return points;

  // Weighted random sampling
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalArea;
    let tri = triangles[0];
    for (const t of triangles) {
      r -= t.area;
      if (r <= 0) { tri = t; break; }
    }
    // Random point on triangle (barycentric)
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    tempV.copy(tri.a).multiplyScalar(1 - u - v)
      .addScaledVector(tri.b, u)
      .addScaledVector(tri.c, v);

    // Approximate noise value at this position (hash-based, roughly matches simplex distribution)
    const nx = tempV.x * NOISE_FREQ, ny = tempV.y * NOISE_FREQ, nz = tempV.z * NOISE_FREQ;
    const noiseVal = hash3(
      Math.floor(nx * 100),
      Math.floor(ny * 100),
      Math.floor(nz * 100),
    ) * 2 - 1; // map to [-1, 1]

    points.push({ pos: tempV.clone(), noiseVal });
  }

  return points;
}

interface UniformRef {
  uProgress: { value: number };
}

interface DissolveEffectProps {
  scene: THREE.Object3D;
  progress: number;
  modelScale: number;
  centerOffset: THREE.Vector3;
}

export const DissolveEffect: React.FC<DissolveEffectProps> = ({ scene, progress, modelScale, centerOffset }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.InstancedMesh>(null);

  const { clonedScene, uniformRefs } = useMemo(() => {
    const clone = scene.clone(true);
    const refs: UniformRef[] = [];

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const origMat = mesh.material as THREE.MeshStandardMaterial;
      if (!origMat || !origMat.isMeshStandardMaterial) return;

      const mat = origMat.clone();
      mat.transparent = true;
      mat.side = THREE.DoubleSide;

      const uniformData: UniformRef = { uProgress: { value: 0 } };
      refs.push(uniformData);

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uProgress = uniformData.uProgress;
        shader.uniforms.uEdgeColor = { value: new THREE.Vector3(1.0, 0.5, 0.1) };
        shader.uniforms.uEdgeWidth = { value: 0.15 };

        // Inject varying into vertex shader
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vDissolvePos;',
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvDissolvePos = position;',
        );

        // Inject dissolve into fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
uniform float uProgress;
uniform vec3 uEdgeColor;
uniform float uEdgeWidth;
varying vec3 vDissolvePos;
${SIMPLEX_GLSL}`,
        );

        // Inject discard + edge glow after final color output
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
  float dissolveNoise = snoise(vDissolvePos * ${NOISE_FREQ.toFixed(1)});
  float dissolveThreshold = mix(-1.3, 1.3, uProgress);
  if (dissolveNoise < dissolveThreshold) discard;

  float edgeDist = dissolveNoise - dissolveThreshold;
  float edgeFactor = 1.0 - smoothstep(0.0, uEdgeWidth, edgeDist);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uEdgeColor, edgeFactor * 0.85);
  gl_FragColor.rgb += uEdgeColor * edgeFactor * 0.4;
#include <dithering_fragment>`,
        );
      };

      // Force recompile
      mat.needsUpdate = true;
      mesh.material = mat;
    });

    return { clonedScene: clone, uniformRefs: refs };
  }, [scene]);

  // Sample surface points for particles
  const surfacePoints = useMemo(() => sampleSurfacePoints(scene, PARTICLE_COUNT), [scene]);

  const _dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    // Update dissolve progress on all materials
    for (const ref of uniformRefs) {
      ref.uProgress.value = progress;
    }

    // Update particles — they appear at the dissolve boundary
    if (!particleRef.current) return;
    const t = state.clock.getElapsedTime();
    const threshold = -1.3 + progress * 2.6; // matches mix(-1.3, 1.3, progress)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const sp = surfacePoints[i];
      if (!sp) {
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        particleRef.current.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      // Particle is visible when the dissolve boundary is near its noise value
      const distFromBoundary = sp.noiseVal - threshold;
      // Show particle in a window around the boundary (just dissolved)
      const visibility = distFromBoundary < 0 && distFromBoundary > -0.6 ? 1 : 0;
      // Fade based on how far past the boundary
      const fade = visibility * (1.0 - Math.min(1, Math.abs(distFromBoundary) / 0.6));

      // Drift upward after dissolving
      const driftTime = Math.max(0, -distFromBoundary / 0.6);
      const driftY = driftTime * 1.5;
      const wobbleX = Math.sin(t * 3 + i * 1.7) * 0.15;
      const wobbleZ = Math.cos(t * 3 + i * 2.3) * 0.15;

      _dummy.position.set(
        sp.pos.x + wobbleX,
        sp.pos.y + driftY,
        sp.pos.z + wobbleZ,
      );
      const s = fade * (0.03 + Math.sin(t * 5 + i) * 0.01);
      _dummy.scale.setScalar(Math.max(0, s));
      _dummy.updateMatrix();
      particleRef.current.setMatrixAt(i, _dummy.matrix);
    }
    particleRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} scale={modelScale}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={clonedScene} />
      </group>
      <instancedMesh ref={particleRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};
