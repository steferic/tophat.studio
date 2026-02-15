import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaterSettings } from './environmentTypes';

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

// Gerstner wave: displaces xz (circular orbit) + y, returns displacement vec3
// dir = normalized wave direction, freq = spatial freq, amp = amplitude,
// steepness Q controls crest sharpness, phase = time-based phase offset
vec3 gerstner(vec2 pos, vec2 dir, float freq, float amp, float Q, float phase) {
  float d = dot(dir, pos) * freq + phase;
  float s = sin(d);
  float c = cos(d);
  return vec3(
    Q * amp * dir.x * c,
    amp * s,
    Q * amp * dir.y * c
  );
}

// Gerstner contribution to the analytical normal (partial derivatives)
// Returns dN/dx and dN/dz packed as: vec3(ddx_x, ddy, ddx_z) — accumulated
vec3 gerstnerNormalX(vec2 pos, vec2 dir, float freq, float amp, float Q, float phase) {
  float d = dot(dir, pos) * freq + phase;
  float s = sin(d);
  float c = cos(d);
  float WA = freq * amp;
  return vec3(
    -dir.x * dir.x * WA * s * Q,
    dir.x * WA * c,
    -dir.x * dir.y * WA * s * Q
  );
}

vec3 gerstnerNormalZ(vec2 pos, vec2 dir, float freq, float amp, float Q, float phase) {
  float d = dot(dir, pos) * freq + phase;
  float s = sin(d);
  float c = cos(d);
  float WA = freq * amp;
  return vec3(
    -dir.y * dir.x * WA * s * Q,
    dir.y * WA * c,
    -dir.y * dir.y * WA * s * Q
  );
}

void main() {
  vUv = uv;
  vec3 pos = position;
  float t = uTime * uSpeed;
  vec2 xz = pos.xz;

  // 6 Gerstner waves at varied directions to break up regularity
  //              direction          freq   amp    Q     phase
  vec3 w  = vec3(0.0);
  vec3 nx = vec3(0.0);
  vec3 nz = vec3(0.0);

  // Large swell
  vec2 d1 = normalize(vec2(0.7, 0.3));
  w  += gerstner(xz, d1, 0.12, 1.0,  0.6, t * 0.7);
  nx += gerstnerNormalX(xz, d1, 0.12, 1.0, 0.6, t * 0.7);
  nz += gerstnerNormalZ(xz, d1, 0.12, 1.0, 0.6, t * 0.7);

  vec2 d2 = normalize(vec2(-0.4, 0.8));
  w  += gerstner(xz, d2, 0.08, 0.8,  0.5, t * 0.5);
  nx += gerstnerNormalX(xz, d2, 0.08, 0.8, 0.5, t * 0.5);
  nz += gerstnerNormalZ(xz, d2, 0.08, 0.8, 0.5, t * 0.5);

  // Medium chop
  vec2 d3 = normalize(vec2(0.2, -0.9));
  w  += gerstner(xz, d3, 0.3, 0.35, 0.7, t * 1.3);
  nx += gerstnerNormalX(xz, d3, 0.3, 0.35, 0.7, t * 1.3);
  nz += gerstnerNormalZ(xz, d3, 0.3, 0.35, 0.7, t * 1.3);

  vec2 d4 = normalize(vec2(-0.6, -0.5));
  w  += gerstner(xz, d4, 0.25, 0.25, 0.65, t * 1.1);
  nx += gerstnerNormalX(xz, d4, 0.25, 0.25, 0.65, t * 1.1);
  nz += gerstnerNormalZ(xz, d4, 0.25, 0.25, 0.65, t * 1.1);

  // Fine ripple
  vec2 d5 = normalize(vec2(0.9, 0.5));
  w  += gerstner(xz, d5, 0.7, 0.1, 0.5, t * 2.2);
  nx += gerstnerNormalX(xz, d5, 0.7, 0.1, 0.5, t * 2.2);
  nz += gerstnerNormalZ(xz, d5, 0.7, 0.1, 0.5, t * 2.2);

  vec2 d6 = normalize(vec2(-0.3, 0.6));
  w  += gerstner(xz, d6, 0.9, 0.07, 0.4, t * 2.8);
  nx += gerstnerNormalX(xz, d6, 0.9, 0.07, 0.4, t * 2.8);
  nz += gerstnerNormalZ(xz, d6, 0.9, 0.07, 0.4, t * 2.8);

  pos.x += w.x * uAmplitude;
  pos.y += w.y * uAmplitude;
  pos.z += w.z * uAmplitude;

  // Reconstruct normal from accumulated Gerstner partials
  vec3 waveNormal = normalize(vec3(-nx.y, 1.0 - nx.x - nz.z, -nz.y));

  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  vNormal = normalize(normalMatrix * waveNormal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uSpeed;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

// Hash-based pseudo-random for noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Value noise with smooth interpolation
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM (fractal brownian motion) for organic patterns
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.1;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float t = uTime * uSpeed;

  // Fresnel
  float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
  fresnel = pow(fresnel, 2.5);

  // Specular highlight
  vec3 lightDir = normalize(vec3(0.3, 1.0, 0.2));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);

  // Noise-based caustic shimmer — two fbm layers sliding past each other
  vec2 wp = vWorldPos.xz * 0.08;
  float n1 = fbm(wp + vec2(t * 0.15, t * 0.1));
  float n2 = fbm(wp * 1.3 + vec2(-t * 0.12, t * 0.08));
  float caustic = smoothstep(0.35, 0.65, n1 * n2 * 4.0) * 0.12;

  vec3 color = uColor;
  color = mix(color, vec3(1.0), fresnel * 0.3);
  color += vec3(caustic);
  color += vec3(spec * 0.5);

  float alpha = uOpacity + fresnel * 0.2;
  gl_FragColor = vec4(color, alpha);
}
`;

interface Props {
  settings: WaterSettings;
  boxSize: number;
}

export const EnvironmentWater: React.FC<Props> = ({ settings, boxSize }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(settings.color) },
      uOpacity: { value: settings.opacity },
      uAmplitude: { value: settings.waveAmplitude },
      uSpeed: { value: settings.waveSpeed },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    matRef.current.uniforms.uColor.value.set(settings.color);
    matRef.current.uniforms.uOpacity.value = settings.opacity;
    matRef.current.uniforms.uAmplitude.value = settings.waveAmplitude;
    matRef.current.uniforms.uSpeed.value = settings.waveSpeed;
  });

  if (!settings.enabled) return null;

  return (
    <mesh position={[0, settings.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[boxSize, boxSize, 128, 128]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
