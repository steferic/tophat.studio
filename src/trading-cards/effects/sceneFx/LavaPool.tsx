import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration } from '../../workshop/loopContext';
import {
  LOOP_QUANTIZE_UNIFORMS_GLSL,
  LOOP_QUANTIZE_HELPERS_GLSL,
} from '../../workshop/loopContext';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor;
uniform float uCrackIntensity;
uniform float uHeatGlow;
uniform float uTurbulence;
uniform float uFlowSpeed;

varying vec2 vUv;

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
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0 + uTurbulence * 0.5;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);

  // Circular fade
  float circleFade = 1.0 - smoothstep(0.7, 1.0, dist);
  if (circleFade < 0.01) discard;

  // Flowing magma using time-offset FBM layers
  float t = uTime * qSinFreq(uFlowSpeed);
  vec2 flowUv = centered * 3.0;
  float n1 = fbm(flowUv + vec2(t * 0.3, t * 0.2));
  float n2 = fbm(flowUv * 1.5 - vec2(t * 0.2, t * 0.4));
  float magma = n1 * 0.6 + n2 * 0.4;

  // Cracks: sharp bright lines from noise derivatives
  float crackNoise = fbm(flowUv * 2.0 + vec2(t * 0.1));
  float crack = smoothstep(0.45, 0.5, crackNoise) * uCrackIntensity;

  // Color gradient: dark crust -> bright lava -> white-hot cracks
  vec3 darkCrust = uColor * 0.15;
  vec3 brightLava = uColor;
  vec3 whiteHot = mix(uColor, vec3(1.0, 0.95, 0.8), 0.7);

  vec3 col = mix(darkCrust, brightLava, magma);
  col = mix(col, whiteHot, crack);

  // Pulsing emissive hotspots
  float hotspot = pow(magma, 3.0) * uHeatGlow;
  col += whiteHot * hotspot * 0.5;

  // Emissive glow boost
  col *= 1.0 + uHeatGlow * 0.5;

  float alpha = circleFade * (0.7 + magma * 0.3);
  gl_FragColor = vec4(col, alpha);
}
`;

interface LavaPoolProps {
  params: Record<string, any>;
}

export const LavaPool: React.FC<LavaPoolProps> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loopDuration = useLoopDuration();

  const color = params.color ?? '#ff4400';
  const radius = params.radius ?? 1.5;
  const flowSpeed = params.flowSpeed ?? 1.0;
  const crackIntensity = params.crackIntensity ?? 0.7;
  const heatGlow = params.heatGlow ?? 0.8;
  const turbulence = params.turbulence ?? 0.5;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uCrackIntensity: { value: crackIntensity },
      uHeatGlow: { value: heatGlow },
      uTurbulence: { value: turbulence },
      uFlowSpeed: { value: flowSpeed },
      uLoopDuration: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uColor.value.set(color);
    uniforms.uCrackIntensity.value = crackIntensity;
    uniforms.uHeatGlow.value = heatGlow;
    uniforms.uTurbulence.value = turbulence;
    uniforms.uFlowSpeed.value = flowSpeed;
    uniforms.uLoopDuration.value = loopDuration ?? 0;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
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
