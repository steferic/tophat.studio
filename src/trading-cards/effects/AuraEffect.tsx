import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SIMPLEX_GLSL,
  MORPH_FUNCTIONS_GLSL,
  UNIFORM_DECLARATIONS_GLSL,
  DISPLACEMENT_GLSL,
  createMorphUniforms,
  updateMorphUniforms,
} from './MorphEffect';
import type { MorphUniforms } from './MorphEffect';

// ── Aura type → shader int mapping ──────────────────────────

const AURA_TYPE_MAP: Record<string, number> = {
  ghost: 0,
  flame: 1,
  electric: 2,
  shadow: 3,
  prismatic: 4,
  frost: 5,
  void: 6,
  solar: 7,
};

// ── Per-aura render config ──────────────────────────────────

interface RenderConfig {
  blending: THREE.Blending;
  side: THREE.Side;
  depthWrite: boolean;
}

const AURA_RENDER_CONFIG: Record<string, RenderConfig> = {
  ghost:     { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
  flame:     { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
  electric:  { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
  shadow:    { blending: THREE.NormalBlending,    side: THREE.FrontSide, depthWrite: false },
  prismatic: { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
  frost:     { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
  void:      { blending: THREE.NormalBlending,    side: THREE.BackSide,  depthWrite: false },
  solar:     { blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false },
};

const DEFAULT_CONFIG: RenderConfig = {
  blending: THREE.AdditiveBlending,
  side: THREE.FrontSide,
  depthWrite: false,
};

// ── Aura-specific uniform type ──────────────────────────────

interface AuraUniforms {
  uTime: { value: number };
  uAuraColor: { value: THREE.Color };
  uAuraOpacity: { value: number };
  uAuraScale: { value: number };
  uAuraSpeed: { value: number };
  uAuraIntensity: { value: number };
  uAuraType: { value: number };
}

function createAuraUniforms(auraType: number): AuraUniforms {
  return {
    uTime: { value: 0 },
    uAuraColor: { value: new THREE.Color('#ffffff') },
    uAuraOpacity: { value: 0.15 },
    uAuraScale: { value: 0.25 },
    uAuraSpeed: { value: 1.0 },
    uAuraIntensity: { value: 1.0 },
    uAuraType: { value: auraType },
  };
}

// ── Vertex shader ───────────────────────────────────────────

const AURA_VERTEX_SHADER = /* glsl */ `
// ── Morph uniforms ──
${UNIFORM_DECLARATIONS_GLSL}

// ── Aura uniforms ──
uniform float uTime;
uniform vec3 uAuraColor;
uniform float uAuraOpacity;
uniform float uAuraScale;
uniform float uAuraSpeed;
uniform float uAuraIntensity;
uniform int uAuraType;

// ── Noise + morph functions ──
${SIMPLEX_GLSL}
${MORPH_FUNCTIONS_GLSL}

// ── Varyings ──
varying float vHeightNorm;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying float vNoise;

void main() {
  vec3 transformed = position;
  vec3 objectNormal = normal;

  // ── Morph displacement (mirrors base model) ──
  ${DISPLACEMENT_GLSL}

  // ── Bounds-relative values ──
  float bsy = max(uBoundsSize.y, 0.001);
  float heightNorm = clamp((transformed.y - uBoundsMin.y) / bsy, 0.0, 1.0);
  vHeightNorm = heightNorm;
  vLocalPos = transformed;

  // Direction: normal if available, else push from center
  float nLen = length(objectNormal);
  vec3 dir = nLen > 0.001 ? objectNormal / nLen : vec3(0.0);
  if (length(dir) < 0.5) {
    vec3 toCenter = transformed - uBoundsCenter;
    float cLen = length(toCenter);
    dir = cLen > 0.001 ? toCenter / cLen : vec3(0.0, 1.0, 0.0);
  }
  vNormal = dir;

  // ── Base outward expansion ──
  transformed += dir * uAuraScale * uBoundsScale * 0.05;

  float t = uTime * uAuraSpeed;

  // ── Aura-specific vertex displacement ──
  if (uAuraType == 1) {
    // Flame: upward flow + sway
    float flameNoise = snoise_m(vec3(transformed.xz / uBoundsScale * 3.0, t * 2.0));
    transformed.y += flameNoise * heightNorm * uAuraIntensity * uBoundsScale * 0.15;
    float sway = snoise_m(vec3(transformed.yz / uBoundsScale * 4.0, t * 3.0));
    transformed.x += sway * uAuraIntensity * uBoundsScale * 0.03;
  } else if (uAuraType == 2) {
    // Electric: sharp spikes
    float spark = snoise_m(vec3(transformed / uBoundsScale * 8.0 + t * 10.0));
    spark = pow(abs(spark), 3.0) * sign(spark);
    transformed += dir * spark * uAuraIntensity * uBoundsScale * 0.12;
  } else if (uAuraType == 3) {
    // Shadow: subtle waver + droop
    float waver = snoise_m(vec3(transformed / uBoundsScale * 2.0 + t * 0.5));
    transformed += dir * waver * uBoundsScale * 0.02;
    transformed.y -= 0.01 * uBoundsScale;
  } else if (uAuraType == 4) {
    // Prismatic: gentle wave
    float wave = sin(heightNorm * 6.28 + t * 2.0) * uBoundsScale * 0.03;
    transformed += dir * wave;
  } else if (uAuraType == 5) {
    // Frost: crystalline spikes
    float crystal = snoise_m(transformed / uBoundsScale * 12.0);
    crystal = abs(crystal);
    transformed += dir * crystal * uAuraIntensity * uBoundsScale * 0.05;
  } else if (uAuraType == 6) {
    // Void: pulsing expansion (BackSide → outline)
    float pulse = 1.0 + sin(t * 1.5) * 0.1;
    transformed += dir * uAuraScale * uBoundsScale * 0.02 * pulse;
  } else if (uAuraType == 7) {
    // Solar: corona + flicker
    float corona = sin(heightNorm * 3.14 + t * 2.0) * uAuraIntensity * uBoundsScale * 0.08;
    float flicker = snoise_m(vec3(transformed.xz / uBoundsScale * 5.0, t * 3.0)) * uBoundsScale * 0.04;
    transformed += dir * (corona + flicker);
  }

  // Store noise for fragment shader
  vNoise = snoise_m(transformed / uBoundsScale * 6.0 + t);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

// ── Fragment shader ─────────────────────────────────────────

const AURA_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec3 uAuraColor;
uniform float uAuraOpacity;
uniform float uAuraSpeed;
uniform float uAuraIntensity;
uniform int uAuraType;

varying float vHeightNorm;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying float vNoise;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float t = uTime * uAuraSpeed;
  vec3 color = uAuraColor;
  float alpha = uAuraOpacity;

  if (uAuraType == 0) {
    // Ghost: breathing pulse + dual-frequency shimmer
    alpha *= 0.7 + sin(t * 2.5) * 0.3;
    alpha += sin(t * 3.0) * 0.04 + sin(t * 7.3) * 0.02;
  } else if (uAuraType == 1) {
    // Flame: gradient orange→yellow, fade at top, flicker
    color = mix(uAuraColor, vec3(1.0, 1.0, 0.3), vHeightNorm * 0.7);
    float flameMask = 1.0 - smoothstep(0.6, 1.0, vHeightNorm);
    alpha *= flameMask * (0.6 + vNoise * 0.4);
    alpha *= 0.7 + sin(t * 8.0 + vHeightNorm * 4.0) * 0.3;
  } else if (uAuraType == 2) {
    // Electric: white-blue flashes, rapid flicker
    float flash = step(0.7, abs(vNoise));
    color = mix(uAuraColor, vec3(1.0), flash * 0.8);
    alpha *= 0.4 + flash * 0.6;
    alpha *= 0.5 + step(0.3, fract(t * 15.0 + vNoise * 5.0)) * 0.5;
  } else if (uAuraType == 3) {
    // Shadow: subtle opacity variation, slow pulse
    alpha *= 0.8 + vNoise * 0.2;
    alpha *= 0.85 + sin(t * 1.5) * 0.15;
  } else if (uAuraType == 4) {
    // Prismatic: rainbow hue cycling
    float hue = fract(vHeightNorm * 0.5 + t * 0.3 + vNoise * 0.2);
    color = hsv2rgb(vec3(hue, 0.9, 1.0));
    alpha *= 0.7 + sin(t * 2.0 + vHeightNorm * 3.0) * 0.3;
  } else if (uAuraType == 5) {
    // Frost: sparkle, pale blue shimmer
    float sparkle = smoothstep(0.5, 0.8, abs(vNoise));
    color = mix(uAuraColor, vec3(1.0), sparkle * 0.6);
    alpha *= 0.6 + sparkle * 0.4;
    alpha *= 0.8 + sin(t * 1.8 + vHeightNorm * 5.0) * 0.2;
  } else if (uAuraType == 6) {
    // Void: edge brightening, ominous pulse
    float edgeFade = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    color = mix(uAuraColor, vec3(0.5, 0.0, 1.0), edgeFade * 0.5);
    alpha *= 0.6 + edgeFade * 0.4;
    alpha *= 0.8 + sin(t * 1.2) * 0.2;
  } else if (uAuraType == 7) {
    // Solar: golden glow, corona pulse
    float glow = 1.0 - vHeightNorm * 0.3;
    color = mix(uAuraColor, vec3(1.0, 1.0, 0.8), glow * 0.4);
    alpha *= 0.5 + sin(t * 3.0) * 0.3 + sin(t * 7.0) * 0.2;
    color += vec3(0.1) * max(vNoise, 0.0);
  }

  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

// ── Component ───────────────────────────────────────────────

export interface AuraEffectProps {
  scene: THREE.Object3D;
  sourceRef: React.MutableRefObject<THREE.Group | null>;
  auraId: string;
  auraParams: Record<string, any>;
  activeMorphs: string[];
  morphParams: Record<string, Record<string, any>>;
  centerOffset: THREE.Vector3;
}

export const AuraEffect: React.FC<AuraEffectProps> = ({
  scene,
  sourceRef,
  auraId,
  auraParams,
  activeMorphs,
  morphParams,
  centerOffset,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const auraType = AURA_TYPE_MAP[auraId] ?? 0;
  const renderConfig = AURA_RENDER_CONFIG[auraId] ?? DEFAULT_CONFIG;

  const { clonedScene, morphUniformRefs, auraUniformRefs } = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    // Compute bounding box
    const box = new THREE.Box3();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) box.expandByObject(child);
    });
    if (box.isEmpty()) box.setFromObject(clone);

    const boundsMin = box.min;
    const boundsSize = box.getSize(new THREE.Vector3());
    const boundsCenter = box.getCenter(new THREE.Vector3());

    const mRefs: MorphUniforms[] = [];
    const aRefs: AuraUniforms[] = [];

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;

      const morphUni = createMorphUniforms(boundsMin, boundsSize, boundsCenter);
      mRefs.push(morphUni);

      const auraUni = createAuraUniforms(auraType);
      aRefs.push(auraUni);

      const mat = new THREE.ShaderMaterial({
        vertexShader: AURA_VERTEX_SHADER,
        fragmentShader: AURA_FRAGMENT_SHADER,
        uniforms: { ...morphUni, ...auraUni },
        transparent: true,
        blending: renderConfig.blending,
        side: renderConfig.side,
        depthWrite: renderConfig.depthWrite,
      });

      mesh.material = mat;
    });

    return { clonedScene: clone, morphUniformRefs: mRefs, auraUniformRefs: aRefs };
  }, [scene, auraType, renderConfig]);

  useFrame((state) => {
    const src = sourceRef.current;
    if (!groupRef.current || !src) return;

    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);
    groupRef.current.scale.copy(src.scale);

    const time = state.clock.getElapsedTime();

    // Update morph uniforms (mirrors base model deformation)
    updateMorphUniforms(morphUniformRefs, activeMorphs, morphParams, time);

    // Update aura uniforms
    const color = auraParams.color ?? '#ffffff';
    const opacity = auraParams.opacity ?? 0.15;
    const scale = auraParams.scale ?? 0.25;
    const speed = auraParams.speed ?? 1.0;
    const intensity = auraParams.intensity ?? 1.0;

    for (const u of auraUniformRefs) {
      u.uTime.value = time;
      u.uAuraColor.value.set(color);
      u.uAuraOpacity.value = opacity;
      u.uAuraScale.value = scale;
      u.uAuraSpeed.value = speed;
      u.uAuraIntensity.value = intensity;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
};
