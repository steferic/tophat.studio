import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration } from '../workshop/loopContext';

// ── Ashima simplex 3D noise (MIT) — suffixed to avoid collisions ──
export const SIMPLEX_GLSL = /* glsl */ `
vec3 mod289_m(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289_m(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute_m(vec4 x) { return mod289_m(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt_m(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise_m(vec3 v) {
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
  i = mod289_m(i);
  vec4 p = permute_m(permute_m(permute_m(
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
  vec4 norm = taylorInvSqrt_m(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// ── GLSL morph functions ──────────────────────────────────
// All displacements are scaled by uBoundsScale (max bounding box dimension)
// so effects are proportional to model size regardless of raw geometry units.
export const MORPH_FUNCTIONS_GLSL = /* glsl */ `
float qSinFreq(float freq) {
  if (uLoopDuration <= 0.0) return freq;
  float TAU = 6.283185307179586;
  float cycles = max(1.0, floor(freq * uLoopDuration / TAU + 0.5));
  return cycles * TAU / uLoopDuration;
}
float qLinFreq(float freq) {
  if (uLoopDuration <= 0.0) return freq;
  float cycles = max(1.0, floor(freq * uLoopDuration + 0.5));
  return cycles / uLoopDuration;
}

vec3 safeNormalize(vec3 v) {
  float len = length(v);
  return len > 0.0001 ? v / len : vec3(0.0);
}

vec3 morphBloat(vec3 pos, vec3 normal, float amount, float noise, float boundsScale, vec3 boundsCenter) {
  // Use normal if available; otherwise push outward from bounding box center
  vec3 dir = safeNormalize(normal);
  if (length(dir) < 0.5) {
    dir = safeNormalize(pos - boundsCenter);
  }
  if (length(dir) < 0.5) {
    dir = vec3(0.0, 1.0, 0.0); // last resort: push up
  }
  float n = noise > 0.001 ? snoise_m(pos / boundsScale * 6.0) * noise : 0.0;
  return dir * (amount + n) * boundsScale * 0.15;
}

vec3 morphStarve(vec3 pos, float amount, vec3 center) {
  vec3 toCenter = vec3(center.x - pos.x, 0.0, center.z - pos.z);
  return toCenter * amount;
}

vec3 morphMelt(vec3 pos, float amount, float droop, vec3 boundsMin, vec3 boundsSize) {
  float bsy = max(boundsSize.y, 0.001);
  float heightNorm = clamp((pos.y - boundsMin.y) / bsy, 0.0, 1.0);
  float droopFactor = heightNorm * heightNorm * amount;
  float noiseOffset = snoise_m(pos / bsy * 4.0) * amount * bsy * 0.05;
  return vec3(noiseOffset, -droopFactor * droop * bsy * 0.3, noiseOffset);
}

vec3 morphTwist(vec3 pos, float angle, vec3 boundsMin, vec3 boundsSize, float axisSelect) {
  float heightNorm = clamp((pos.y - boundsMin.y) / max(boundsSize.y, 0.001), 0.0, 1.0);
  float theta = angle * heightNorm;
  float cosT = cos(theta);
  float sinT = sin(theta);
  vec3 result = vec3(0.0);
  if (axisSelect < 0.5) {
    result = vec3(0.0, pos.y * (cosT - 1.0) - pos.z * sinT, pos.y * sinT + pos.z * (cosT - 1.0));
  } else if (axisSelect < 1.5) {
    result = vec3(pos.x * (cosT - 1.0) - pos.z * sinT, 0.0, pos.x * sinT + pos.z * (cosT - 1.0));
  } else {
    result = vec3(pos.x * (cosT - 1.0) - pos.y * sinT, pos.x * sinT + pos.y * (cosT - 1.0), 0.0);
  }
  return result;
}

vec3 morphStretch(vec3 pos, float factor, vec3 center) {
  return vec3(0.0, (pos.y - center.y) * (factor - 1.0), 0.0);
}

vec3 morphWobble(vec3 pos, float amplitude, float frequency, float time, float boundsScale) {
  float wave = sin(pos.y / boundsScale * frequency + time * qSinFreq(3.0)) * amplitude * boundsScale * 0.12;
  float wave2 = cos(pos.y / boundsScale * frequency * 0.7 + time * qSinFreq(2.3)) * amplitude * boundsScale * 0.08;
  return vec3(wave, 0.0, wave2);
}

vec3 morphSquash(vec3 pos, float amount, vec3 boundsMin, vec3 boundsSize) {
  float heightNorm = clamp((pos.y - boundsMin.y) / max(boundsSize.y, 0.001), 0.0, 1.0);
  float squashY = -(pos.y - boundsMin.y) * amount * 0.5;
  float expandXZ = (1.0 - heightNorm) * amount * 0.4;
  return vec3(pos.x * expandXZ, squashY, pos.z * expandXZ);
}
`;

// ── Uniform declarations ──────────────────────────────────
export const UNIFORM_DECLARATIONS_GLSL = /* glsl */ `
uniform float uMorphBloatAmount;
uniform float uMorphBloatNoise;
uniform float uMorphStarveAmount;
uniform float uMorphMeltAmount;
uniform float uMorphMeltDroop;
uniform float uMorphTwistAngle;
uniform float uMorphTwistAxis;
uniform float uMorphStretchFactor;
uniform float uMorphWobbleAmplitude;
uniform float uMorphWobbleFrequency;
uniform float uMorphSquashAmount;
uniform float uMorphTime;
uniform float uBoundsScale;
uniform vec3 uBoundsMin;
uniform vec3 uBoundsSize;
uniform vec3 uBoundsCenter;
uniform float uLoopDuration;
`;

// ── Displacement code (injected after begin_vertex) ───────
export const DISPLACEMENT_GLSL = /* glsl */ `
{
  vec3 morphDisp = vec3(0.0);

  if (uMorphBloatAmount > 0.001) {
    morphDisp += morphBloat(transformed, objectNormal, uMorphBloatAmount, uMorphBloatNoise, uBoundsScale, uBoundsCenter);
  }
  if (uMorphStarveAmount > 0.001) {
    morphDisp += morphStarve(transformed, uMorphStarveAmount, uBoundsCenter);
  }
  if (uMorphMeltAmount > 0.001) {
    morphDisp += morphMelt(transformed, uMorphMeltAmount, uMorphMeltDroop, uBoundsMin, uBoundsSize);
  }
  if (abs(uMorphTwistAngle) > 0.001) {
    morphDisp += morphTwist(transformed, uMorphTwistAngle, uBoundsMin, uBoundsSize, uMorphTwistAxis);
  }
  if (abs(uMorphStretchFactor - 1.0) > 0.001) {
    morphDisp += morphStretch(transformed, uMorphStretchFactor, uBoundsCenter);
  }
  if (uMorphWobbleAmplitude > 0.001) {
    morphDisp += morphWobble(transformed, uMorphWobbleAmplitude, uMorphWobbleFrequency, uMorphTime, uBoundsScale);
  }
  if (uMorphSquashAmount > 0.001) {
    morphDisp += morphSquash(transformed, uMorphSquashAmount, uBoundsMin, uBoundsSize);
  }

  transformed += morphDisp;
}
`;

// ── Uniform data structure ────────────────────────────────

export interface MorphUniforms {
  uMorphBloatAmount: { value: number };
  uMorphBloatNoise: { value: number };
  uMorphStarveAmount: { value: number };
  uMorphMeltAmount: { value: number };
  uMorphMeltDroop: { value: number };
  uMorphTwistAngle: { value: number };
  uMorphTwistAxis: { value: number };
  uMorphStretchFactor: { value: number };
  uMorphWobbleAmplitude: { value: number };
  uMorphWobbleFrequency: { value: number };
  uMorphSquashAmount: { value: number };
  uMorphTime: { value: number };
  uBoundsScale: { value: number };
  uBoundsMin: { value: THREE.Vector3 };
  uBoundsSize: { value: THREE.Vector3 };
  uBoundsCenter: { value: THREE.Vector3 };
  uLoopDuration: { value: number };
}

export function createMorphUniforms(boundsMin: THREE.Vector3, boundsSize: THREE.Vector3, boundsCenter: THREE.Vector3): MorphUniforms {
  const boundsScale = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);
  return {
    uMorphBloatAmount: { value: 0 },
    uMorphBloatNoise: { value: 0 },
    uMorphStarveAmount: { value: 0 },
    uMorphMeltAmount: { value: 0 },
    uMorphMeltDroop: { value: 1 },
    uMorphTwistAngle: { value: 0 },
    uMorphTwistAxis: { value: 1 },
    uMorphStretchFactor: { value: 1 },
    uMorphWobbleAmplitude: { value: 0 },
    uMorphWobbleFrequency: { value: 3 },
    uMorphSquashAmount: { value: 0 },
    uMorphTime: { value: 0 },
    uBoundsScale: { value: boundsScale },
    uBoundsMin: { value: boundsMin.clone() },
    uBoundsSize: { value: boundsSize.clone() },
    uBoundsCenter: { value: boundsCenter.clone() },
    uLoopDuration: { value: 0 },
  };
}

/** Copy key visual properties from a source material onto a fresh MeshStandardMaterial */
function copyMaterialProps(dst: THREE.MeshStandardMaterial, src: THREE.Material): void {
  const s = src as THREE.MeshStandardMaterial;
  if (s.isMeshStandardMaterial) {
    dst.map = s.map;
    dst.color.copy(s.color);
    dst.roughness = s.roughness;
    dst.metalness = s.metalness;
    dst.roughnessMap = s.roughnessMap;
    dst.metalnessMap = s.metalnessMap;
    dst.normalMap = s.normalMap;
    if (s.normalScale) dst.normalScale.copy(s.normalScale);
    dst.emissive.copy(s.emissive);
    dst.emissiveMap = s.emissiveMap;
    dst.emissiveIntensity = s.emissiveIntensity;
    dst.aoMap = s.aoMap;
    dst.aoMapIntensity = s.aoMapIntensity;
    dst.envMap = s.envMap;
    dst.envMapIntensity = s.envMapIntensity;
    dst.alphaMap = s.alphaMap;
    dst.alphaTest = s.alphaTest;
    dst.transparent = s.transparent;
    dst.opacity = s.opacity;
    dst.side = s.side;
    dst.depthWrite = s.depthWrite;
    dst.depthTest = s.depthTest;
  } else {
    // Fallback for MeshBasicMaterial etc — copy what we can
    const b = src as any;
    if (b.map) dst.map = b.map;
    if (b.color) dst.color.copy(b.color);
    if (b.transparent !== undefined) dst.transparent = b.transparent;
    if (b.opacity !== undefined) dst.opacity = b.opacity;
    if (b.side !== undefined) dst.side = b.side;
    if (b.alphaTest !== undefined) dst.alphaTest = b.alphaTest;
    if (b.alphaMap) dst.alphaMap = b.alphaMap;
  }
}

// ── Component ─────────────────────────────────────────────

export interface MorphEffectProps {
  scene: THREE.Object3D;
  sourceRef: React.MutableRefObject<THREE.Group | null>;
  activeMorphs: string[];
  morphParams: Record<string, Record<string, any>>;
  centerOffset: THREE.Vector3;
}

export const AXIS_MAP: Record<string, number> = { x: 0, y: 1, z: 2 };

/** Inject morph vertex shader into a material's onBeforeCompile callback */
export function injectMorphVertexShader(
  shader: { uniforms: Record<string, any>; vertexShader: string },
  uniformData: MorphUniforms,
  options?: { needsObjectNormalDecl?: boolean },
): void {
  Object.assign(shader.uniforms, uniformData);

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
${UNIFORM_DECLARATIONS_GLSL}
${SIMPLEX_GLSL}
${MORPH_FUNCTIONS_GLSL}`,
  );

  const normalDecl = options?.needsObjectNormalDecl
    ? 'vec3 objectNormal = vec3(0.0);\n'
    : '';

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
${normalDecl}${DISPLACEMENT_GLSL}`,
  );
}

/** Update morph uniform values from current activeMorphs and params */
export function updateMorphUniforms(
  uniformRefs: MorphUniforms[],
  activeMorphs: string[],
  morphParams: Record<string, Record<string, any>>,
  time: number,
  loopDuration?: number | null,
): void {
  const activeSet = new Set(activeMorphs);
  for (const u of uniformRefs) {
    u.uMorphTime.value = time;
    u.uLoopDuration.value = loopDuration ?? 0;

    if (activeSet.has('bloat')) {
      const p = morphParams['bloat'] ?? {};
      u.uMorphBloatAmount.value = p.amount ?? 0.5;
      u.uMorphBloatNoise.value = p.noise ?? 0;
    } else {
      u.uMorphBloatAmount.value = 0;
      u.uMorphBloatNoise.value = 0;
    }

    if (activeSet.has('starve')) {
      const p = morphParams['starve'] ?? {};
      u.uMorphStarveAmount.value = p.amount ?? 0.3;
    } else {
      u.uMorphStarveAmount.value = 0;
    }

    if (activeSet.has('melt')) {
      const p = morphParams['melt'] ?? {};
      u.uMorphMeltAmount.value = p.amount ?? 0.5;
      u.uMorphMeltDroop.value = p.droop ?? 1.0;
    } else {
      u.uMorphMeltAmount.value = 0;
      u.uMorphMeltDroop.value = 1;
    }

    if (activeSet.has('twist')) {
      const p = morphParams['twist'] ?? {};
      u.uMorphTwistAngle.value = p.angle ?? 1.57;
      u.uMorphTwistAxis.value = AXIS_MAP[p.axis as string] ?? 1;
    } else {
      u.uMorphTwistAngle.value = 0;
      u.uMorphTwistAxis.value = 1;
    }

    if (activeSet.has('stretch')) {
      const p = morphParams['stretch'] ?? {};
      u.uMorphStretchFactor.value = p.factor ?? 1.5;
    } else {
      u.uMorphStretchFactor.value = 1;
    }

    if (activeSet.has('wobble')) {
      const p = morphParams['wobble'] ?? {};
      u.uMorphWobbleAmplitude.value = p.amplitude ?? 0.3;
      u.uMorphWobbleFrequency.value = p.frequency ?? 3.0;
    } else {
      u.uMorphWobbleAmplitude.value = 0;
      u.uMorphWobbleFrequency.value = 3;
    }

    if (activeSet.has('squash')) {
      const p = morphParams['squash'] ?? {};
      u.uMorphSquashAmount.value = p.amount ?? 0.5;
    } else {
      u.uMorphSquashAmount.value = 0;
    }
  }
}

export const MorphEffect: React.FC<MorphEffectProps> = ({
  scene,
  sourceRef,
  activeMorphs,
  morphParams,
  centerOffset,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const loopDuration = useLoopDuration();

  const { clonedScene, uniformRefs } = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    // Compute object-space bounding box
    const box = new THREE.Box3();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
      }
    });
    if (box.isEmpty()) box.setFromObject(clone);

    const boundsMin = box.min;
    const boundsSize = box.getSize(new THREE.Vector3());
    const boundsCenter = box.getCenter(new THREE.Vector3());

    const refs: MorphUniforms[] = [];
    let meshCount = 0;

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;

      // Handle material arrays (multi-material meshes)
      const origMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const newMats: THREE.MeshStandardMaterial[] = [];

      for (const origMat of origMats) {
        if (!origMat) continue;

        // Create a FRESH MeshStandardMaterial — not a clone.
        // This guarantees onBeforeCompile fires because the renderer
        // has never seen this material instance and must compile a new program.
        const mat = new THREE.MeshStandardMaterial();
        copyMaterialProps(mat, origMat);

        const uniformData = createMorphUniforms(boundsMin, boundsSize, boundsCenter);
        const idx = refs.length;
        refs.push(uniformData);

        // Unique cache key per material so programs aren't shared with originals
        mat.customProgramCacheKey = () => `morph-v1-${idx}`;

        mat.onBeforeCompile = (shader) => {
          injectMorphVertexShader(shader, uniformData);
        };

        mat.needsUpdate = true;
        newMats.push(mat);
      }

      mesh.material = newMats.length === 1 ? newMats[0] : newMats;
      meshCount++;
    });

    console.log(`[MorphEffect] Prepared ${meshCount} meshes with ${refs.length} morph materials`);
    return { clonedScene: clone, uniformRefs: refs };
  }, [scene]);

  // Per-frame: copy transforms from source, update uniform values
  useFrame((state) => {
    const src = sourceRef.current;
    if (!groupRef.current || !src) return;

    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);
    groupRef.current.scale.copy(src.scale);

    updateMorphUniforms(uniformRefs, activeMorphs, morphParams, state.clock.getElapsedTime(), loopDuration);
  });

  return (
    <group ref={groupRef}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
};
