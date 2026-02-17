import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FogSettings } from './environmentTypes';

interface Props {
  settings: FogSettings;
  boxSize?: number;
}

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vCameraPos;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vCameraPos = cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uDensity;
uniform float uHeight;
uniform float uHeightFalloff;
uniform float uWindSpeed;
uniform float uTurbulence;
uniform float uOpacity;
uniform float uScale;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vCameraPos;

// ── Hash-based 3D noise ──────────────────────────────────
vec3 hash3(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
          dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
      mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
          dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
    mix(
      mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
          dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
      mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
          dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * noise3D(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ── Fog density at a point ───────────────────────────────
float fogDensity(vec3 pos) {
  // Height-based exponential falloff
  float heightFactor = exp(-max(pos.y, 0.0) * uHeightFalloff);
  // Below ground floor, keep full density
  if (pos.y < 0.0) heightFactor = 1.0;

  // Only render fog within the height band
  if (pos.y > uHeight) return 0.0;

  // Wind-driven offset
  vec3 windOffset = vec3(uTime * uWindSpeed * 0.8, uTime * 0.1, uTime * uWindSpeed * 0.4);

  // Noise-based turbulence (scale controls frequency)
  float noiseFreq = 0.02 / max(uScale, 0.1);
  float n = fbm((pos + windOffset) * noiseFreq, 4);
  // Remap noise from [-1,1] to [0,1] range with turbulence control
  float noiseDensity = smoothstep(-0.2, 1.0, n * uTurbulence + 0.5);

  return uDensity * heightFactor * noiseDensity;
}

void main() {
  vec3 rayOrigin = vCameraPos;
  vec3 rayDir = normalize(vWorldPos - vCameraPos);

  // March from entry point toward the surface point
  float totalDist = length(vWorldPos - vCameraPos);
  int steps = 40;
  float stepSize = min(totalDist, 300.0) / float(steps);

  // Front-to-back compositing
  float transmittance = 1.0;
  vec3 accumulated = vec3(0.0);

  for (int i = 0; i < 40; i++) {
    float t = float(i) * stepSize;
    if (t > totalDist) break;

    vec3 samplePos = rayOrigin + rayDir * t;
    float d = fogDensity(samplePos);

    if (d > 0.001) {
      // Beer-Lambert absorption
      float absorption = exp(-d * stepSize * 0.15);
      // Scattered light contribution (constant ambient)
      vec3 scatterLight = uColor * d * (1.0 - absorption);
      accumulated += transmittance * scatterLight;
      transmittance *= absorption;
    }

    // Early exit if opaque enough
    if (transmittance < 0.01) break;
  }

  float alpha = (1.0 - transmittance) * uOpacity;
  gl_FragColor = vec4(accumulated / max(1.0 - transmittance, 0.001), alpha);
}
`;

export const EnvironmentFog: React.FC<Props> = ({ settings, boxSize = 156.25 }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(settings.color) },
      uDensity: { value: settings.density },
      uHeight: { value: settings.height },
      uHeightFalloff: { value: settings.heightFalloff },
      uWindSpeed: { value: settings.windSpeed },
      uTurbulence: { value: settings.turbulence },
      uOpacity: { value: settings.opacity },
      uScale: { value: settings.scale },
      uTime: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uColor.value.set(settings.color);
    mat.uniforms.uDensity.value = settings.density;
    mat.uniforms.uHeight.value = settings.height;
    mat.uniforms.uHeightFalloff.value = settings.heightFalloff;
    mat.uniforms.uWindSpeed.value = settings.windSpeed;
    mat.uniforms.uTurbulence.value = settings.turbulence;
    mat.uniforms.uOpacity.value = settings.opacity;
    mat.uniforms.uScale.value = settings.scale;
  });

  if (!settings.enabled) return null;

  const extent = boxSize * 1.5;

  return (
    <mesh>
      <boxGeometry args={[extent, extent, extent]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
};
