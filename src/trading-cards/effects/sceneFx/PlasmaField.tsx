import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration, qf } from '../../workshop/loopContext';
import {
  LOOP_QUANTIZE_UNIFORMS_GLSL,
  LOOP_QUANTIZE_HELPERS_GLSL,
} from '../../workshop/loopContext';

const vertexShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Gentle wave displacement for organic feel
  pos.x += sin(pos.y * 2.0 + uTime * qSinFreq(uSpeed)) * 0.1;
  pos.y += cos(pos.x * 2.0 + uTime * qSinFreq(uSpeed * 0.7)) * 0.08;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uIntensity;
uniform float uOpacity;
uniform float uSpeed;
uniform float uScale;

varying vec2 vUv;
varying vec3 vWorldPos;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
  return n;
}

float fbm3D(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise3D(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 centered = vUv * 2.0 - 1.0;

  // 3D FBM noise sampled at world position + time
  float t = uTime * qSinFreq(uSpeed);
  vec3 samplePos = vec3(centered * uScale, t * 0.3) + vWorldPos * 0.2;
  float n = fbm3D(samplePos);

  // Second layer for tendrils
  float n2 = fbm3D(samplePos * 1.5 + vec3(t * 0.2, 0.0, t * 0.1));

  // Tendril pattern
  float tendrils = pow(n * 0.6 + n2 * 0.4, 1.5) * uIntensity;

  // Dual-color gradient driven by noise
  vec3 col = mix(uColor1, uColor2, n);
  col *= 1.0 + tendrils * 0.5;

  // Bright noise peaks
  col += vec3(1.0) * pow(tendrils, 3.0) * 0.4;

  // Edge fade
  float edgeFade = 1.0 - smoothstep(0.6, 1.0, length(centered));

  float alpha = tendrils * edgeFade * uOpacity;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, alpha);
}
`;

const PLANE_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

interface PlasmaFieldProps {
  params: Record<string, any>;
}

export const PlasmaField: React.FC<PlasmaFieldProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  const color1 = params.color1 ?? '#ff00ff';
  const color2 = params.color2 ?? '#00ffff';
  const intensity = params.intensity ?? 0.7;
  const speed = params.speed ?? 0.8;
  const scale = params.scale ?? 1.5;
  const opacity = params.opacity ?? 0.5;

  // Per-plane uniforms
  const planeUniforms = useMemo(() => {
    return PLANE_ANGLES.map(() => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uIntensity: { value: intensity },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uLoopDuration: { value: 0 },
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    for (const u of planeUniforms) {
      u.uTime.value = t;
      u.uColor1.value.set(color1);
      u.uColor2.value.set(color2);
      u.uIntensity.value = intensity;
      u.uOpacity.value = opacity;
      u.uSpeed.value = speed;
      u.uScale.value = scale;
      u.uLoopDuration.value = loopDuration ?? 0;
    }

    // Slow rotation of the whole group
    if (groupRef.current) {
      groupRef.current.rotation.y = t * qf(0.15, loopDuration);
    }
  });

  return (
    <group ref={groupRef}>
      {PLANE_ANGLES.map((angle, i) => {
        const dist = 1.2;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        return (
          <mesh
            key={i}
            position={[x, 1.0, z]}
            rotation={[0, -angle + Math.PI * 0.5, 0]}
          >
            <planeGeometry args={[2.5, 3.0, 8, 8]} />
            <shaderMaterial
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={planeUniforms[i]}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
};
