import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CloudSettings } from './environmentTypes';
import { useLoopDuration, qf } from '../workshop/loopContext';

// ── Raymarched volumetric cloud shaders ──────────────────────

const VERTEX = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uSpeed;
uniform vec3 uBoxMin;
uniform vec3 uBoxMax;
uniform mat4 modelMatrix;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

// ── 3D hash / noise / fbm ──────────────────────────────────

float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash3(i);
  float n100 = hash3(i + vec3(1,0,0));
  float n010 = hash3(i + vec3(0,1,0));
  float n110 = hash3(i + vec3(1,1,0));
  float n001 = hash3(i + vec3(0,0,1));
  float n101 = hash3(i + vec3(1,0,1));
  float n011 = hash3(i + vec3(0,1,1));
  float n111 = hash3(i + vec3(1,1,1));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);

  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

float fbm3(vec3 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise3(p);
    p = p * 2.1 + vec3(1.7, 2.3, 1.1);
    amp *= 0.45;
  }
  return v;
}

// ── Density function ────────────────────────────────────────

float cloudDensity(vec3 p, float t) {
  // Normalize p into 0..1 within the box
  vec3 uvw = (p - uBoxMin) / (uBoxMax - uBoxMin);

  // Ellipsoidal falloff — heavier in center, fades at edges
  vec3 d = uvw - 0.5;
  // Squash y axis so clouds are wider than tall
  d.y *= 2.0;
  float ellipse = 1.0 - smoothstep(0.0, 0.5, length(d));

  // Animated 3D FBM noise
  vec3 noisePos = p * 0.08 + vec3(t * 0.4, 0.0, t * 0.15);
  float n = fbm3(noisePos);

  // Combine: base shape * noise, threshold to create wispy edges
  float density = ellipse * n * 2.2;
  density = smoothstep(0.15, 0.55, density);

  return density;
}

// ── Ray-box intersection (slab method) ──────────────────────

vec2 boxIntersect(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
  vec3 invRd = 1.0 / rd;
  vec3 t0 = (bmin - ro) * invRd;
  vec3 t1 = (bmax - ro) * invRd;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float tNear = max(max(tmin.x, tmin.y), tmin.z);
  float tFar  = min(min(tmax.x, tmax.y), tmax.z);
  return vec2(tNear, tFar);
}

void main() {
  float t = uTime * uSpeed * 0.3;

  // Ray from camera through this fragment in world space
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorldPos - cameraPosition);

  // Transform box bounds to world space
  vec3 bmin = (modelMatrix * vec4(uBoxMin, 1.0)).xyz;
  vec3 bmax = (modelMatrix * vec4(uBoxMax, 1.0)).xyz;
  // Ensure min < max after transform
  vec3 wMin = min(bmin, bmax);
  vec3 wMax = max(bmin, bmax);

  vec2 hit = boxIntersect(ro, rd, wMin, wMax);
  if (hit.x > hit.y || hit.y < 0.0) discard;

  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  float march = tFar - tNear;

  // Raymarch through the volume
  const int STEPS = 40;
  float stepSize = march / float(STEPS);
  float transmittance = 1.0;
  vec3 light = vec3(0.0);
  vec3 lightDir = normalize(vec3(0.3, 1.0, 0.2));

  for (int i = 0; i < STEPS; i++) {
    float tt = tNear + (float(i) + 0.5) * stepSize;
    vec3 pos = ro + rd * tt;

    float density = cloudDensity(pos, t);
    if (density < 0.001) continue;

    // Simple lighting: brighter at top of cloud, darker underneath
    // Normalize pos within world bounds for vertical gradient
    float yFrac = clamp((pos.y - wMin.y) / (wMax.y - wMin.y), 0.0, 1.0);
    float lightAmount = 0.6 + 0.4 * yFrac;

    // Fake scattering — sample density a bit toward light for self-shadowing
    vec3 lightSample = pos + lightDir * stepSize * 2.0;
    float shadowDensity = cloudDensity(lightSample, t);
    lightAmount *= exp(-shadowDensity * 1.5);

    vec3 stepColor = uColor * lightAmount;

    float absorption = density * stepSize * 0.8;
    light += stepColor * transmittance * absorption;
    transmittance *= exp(-absorption);

    if (transmittance < 0.01) break;
  }

  float alpha = (1.0 - transmittance) * uOpacity;
  if (alpha < 0.005) discard;

  gl_FragColor = vec4(light / max(1.0 - transmittance, 0.001), alpha);
}
`;

// ── Component ───────────────────────────────────────────────

interface CloudData {
  x: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  phaseOffset: number;
}

interface Props {
  settings: CloudSettings;
  boxSize: number;
}

export const EnvironmentClouds: React.FC<Props> = ({ settings, boxSize }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  // Shared uniforms (uBoxMin/uBoxMax are per-cloud but identical in local space)
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(settings.color) },
      uOpacity: { value: settings.opacity },
      uTime: { value: 0 },
      uSpeed: { value: settings.speed },
      uBoxMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
      uBoxMax: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    }),
    [],
  );

  const clouds = useMemo<CloudData[]>(
    () =>
      Array.from({ length: settings.count }, (_, i) => {
        const half = (boxSize / 2) * settings.spread;
        return {
          x: (Math.random() - 0.5) * half * 1.8,
          z: (Math.random() - 0.5) * half * 1.8,
          scaleX: 18 + Math.random() * 25,
          scaleY: 5 + Math.random() * 6,
          scaleZ: 14 + Math.random() * 20,
          phaseOffset: (i / settings.count) * Math.PI * 2 + Math.random() * 2,
        };
      }),
    [settings.count, settings.spread, boxSize],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    uniforms.uColor.value.set(settings.color);
    uniforms.uOpacity.value = settings.opacity;
    uniforms.uSpeed.value = settings.speed;
    uniforms.uTime.value = t;

    groupRef.current.children.forEach((child, i) => {
      const cloud = clouds[i];
      if (!cloud) return;
      child.position.x = cloud.x + Math.sin(t * qf(settings.speed * 0.5 * 0.3, loopDuration) + cloud.phaseOffset) * 8;
      child.position.z = cloud.z + Math.cos(t * qf(settings.speed * 0.5 * 0.2, loopDuration) + cloud.phaseOffset) * 6;
    });
  });

  if (!settings.enabled) return null;

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          position={[cloud.x, settings.altitude, cloud.z]}
          scale={[
            cloud.scaleX * settings.scale,
            cloud.scaleY * settings.scale,
            cloud.scaleZ * settings.scale,
          ]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <shaderMaterial
            vertexShader={VERTEX}
            fragmentShader={FRAGMENT}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </group>
  );
};
