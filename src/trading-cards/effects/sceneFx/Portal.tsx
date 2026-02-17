import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration, qf } from '../../workshop/loopContext';
import {
  LOOP_QUANTIZE_UNIFORMS_GLSL,
  LOOP_QUANTIZE_HELPERS_GLSL,
} from '../../workshop/loopContext';

// ── Ring shader (pulsing emissive torus) ───────────────────

const ringVertex = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ringFragment = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vNormal;

void main() {
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  float pulse = 0.7 + 0.3 * sin(uTime * qSinFreq(3.0));
  float alpha = fresnel * pulse * uOpacity;
  gl_FragColor = vec4(uColor * 1.5, alpha);
}
`;

// ── Inner disc shader (FBM noise swirl) ────────────────────

const discVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const discFragment = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor;
uniform float uDistortion;
uniform float uOpacity;
uniform float uSwirlSpeed;
varying vec2 vUv;

// Simple hash-based noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);
  float angle = atan(centered.y, centered.x);

  // Spiral distortion
  float swirlT = uTime * qSinFreq(uSwirlSpeed);
  float spiral = angle + dist * 3.0 * uDistortion + swirlT;
  vec2 swirlUv = vec2(cos(spiral), sin(spiral)) * dist * 3.0;

  // FBM noise
  float n = fbm(swirlUv + uTime * qSinFreq(0.3));

  // Radial fade
  float fade = 1.0 - smoothstep(0.6, 1.0, dist);

  // Bright center
  float center = smoothstep(0.3, 0.0, dist) * 0.5;

  float alpha = (n * 0.8 + center) * fade * uOpacity;
  if (alpha < 0.01) discard;

  // Color with bright core
  vec3 col = mix(uColor, vec3(1.0), center * 0.5);
  gl_FragColor = vec4(col, alpha);
}
`;

interface PortalProps {
  params: Record<string, any>;
}

export const Portal: React.FC<PortalProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  const color = params.color ?? '#00ccff';
  const size = params.size ?? 2.0;
  const swirlSpeed = params.swirlSpeed ?? 1.0;
  const distortion = params.distortion ?? 0.5;
  const opacity = params.opacity ?? 0.8;

  const ringUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uLoopDuration: { value: 0 },
    }),
    [],
  );

  const discUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uDistortion: { value: distortion },
      uOpacity: { value: opacity },
      uSwirlSpeed: { value: swirlSpeed },
      uLoopDuration: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    ringUniforms.uTime.value = t;
    ringUniforms.uColor.value.set(color);
    ringUniforms.uOpacity.value = opacity;
    ringUniforms.uLoopDuration.value = loopDuration ?? 0;

    discUniforms.uTime.value = t;
    discUniforms.uColor.value.set(color);
    discUniforms.uDistortion.value = distortion;
    discUniforms.uOpacity.value = opacity;
    discUniforms.uSwirlSpeed.value = swirlSpeed;
    discUniforms.uLoopDuration.value = loopDuration ?? 0;

    if (groupRef.current) {
      groupRef.current.rotation.z = t * qf(0.2, loopDuration);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1.5]}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[size * 0.5, size * 0.06, 16, 48]} />
        <shaderMaterial
          vertexShader={ringVertex}
          fragmentShader={ringFragment}
          uniforms={ringUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner swirl disc */}
      <mesh>
        <circleGeometry args={[size * 0.5, 48]} />
        <shaderMaterial
          vertexShader={discVertex}
          fragmentShader={discFragment}
          uniforms={discUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
