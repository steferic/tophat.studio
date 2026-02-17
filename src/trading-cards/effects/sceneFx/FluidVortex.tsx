import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration } from '../../workshop/loopContext';
import {
  LOOP_QUANTIZE_UNIFORMS_GLSL,
  LOOP_QUANTIZE_HELPERS_GLSL,
} from '../../workshop/loopContext';

const vertexShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform float uTwist;
uniform float uSpeed;

varying vec2 vUv;
varying float vHeight;

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

void main() {
  vUv = uv;
  vec3 pos = position;

  // Normalized height (0 = bottom, 1 = top)
  vHeight = (pos.y + 0.5);

  // Spiral twist: rotate XZ by height + time
  float twistAngle = vHeight * uTwist + uTime * qSinFreq(uSpeed);
  float cosA = cos(twistAngle);
  float sinA = sin(twistAngle);
  vec2 rotated = vec2(
    pos.x * cosA - pos.z * sinA,
    pos.x * sinA + pos.z * cosA
  );
  pos.x = rotated.x;
  pos.z = rotated.y;

  // Noise-based radial displacement
  float n = noise(vec2(vHeight * 4.0, uTime * qSinFreq(uSpeed * 0.5))) * 0.3;
  float radialDir = length(pos.xz);
  if (radialDir > 0.001) {
    pos.x += (pos.x / radialDir) * n;
    pos.z += (pos.z / radialDir) * n;
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSpeed;

varying vec2 vUv;
varying float vHeight;

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

void main() {
  // Flowing streak pattern via polar-UV noise
  float angle = vUv.x * 6.283185;
  float streak = noise(vec2(angle * 2.0, vHeight * 6.0 - uTime * qSinFreq(uSpeed * 2.0)));
  streak = smoothstep(0.3, 0.7, streak);

  // Secondary fine detail
  float detail = noise(vec2(angle * 5.0, vHeight * 12.0 + uTime * qSinFreq(uSpeed)));
  streak = streak * 0.7 + detail * 0.3;

  // Vertical opacity gradient: opaque at base, fading at top
  float vertFade = 1.0 - smoothstep(0.3, 1.0, vHeight);

  // Bottom edge fade
  float bottomFade = smoothstep(0.0, 0.1, vHeight);

  // Bright core streaks
  vec3 col = mix(uColor * 0.5, uColor * 1.5, streak);
  col += vec3(1.0) * pow(streak, 4.0) * 0.3;

  float alpha = streak * vertFade * bottomFade * uOpacity;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, alpha);
}
`;

interface FluidVortexProps {
  params: Record<string, any>;
}

export const FluidVortex: React.FC<FluidVortexProps> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loopDuration = useLoopDuration();

  const color = params.color ?? '#00aaff';
  const height = params.height ?? 3.0;
  const radius = params.radius ?? 1.0;
  const speed = params.speed ?? 1.0;
  const twist = params.twist ?? 2.0;
  const opacity = params.opacity ?? 0.6;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uTwist: { value: twist },
      uLoopDuration: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uColor.value.set(color);
    uniforms.uOpacity.value = opacity;
    uniforms.uSpeed.value = speed;
    uniforms.uTwist.value = twist;
    uniforms.uLoopDuration.value = loopDuration ?? 0;
  });

  return (
    <mesh ref={meshRef} position={[0, height * 0.5, 0]}>
      <cylinderGeometry args={[radius, radius, height, 32, 32, true]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
