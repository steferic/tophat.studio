import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration } from '../../workshop/loopContext';
import {
  LOOP_QUANTIZE_UNIFORMS_GLSL,
  LOOP_QUANTIZE_HELPERS_GLSL,
} from '../../workshop/loopContext';

const RIBBON_COUNT = 4;

const vertexShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Sine-based wave displacement
  float wave1 = sin(pos.x * 0.5 + uTime * qSinFreq(uSpeed)) * 1.5;
  float wave2 = sin(pos.x * 0.3 - uTime * qSinFreq(uSpeed * 0.7)) * 0.8;
  pos.y += wave1 + wave2;

  // Slow drift along X
  pos.x += sin(uTime * qSinFreq(uSpeed * 0.2)) * 2.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uOpacity;
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

void main() {
  // Gradient between colors
  vec3 col = mix(uColor1, uColor2, vUv.x + sin(vUv.y * 3.14159) * 0.3);

  // Shimmer noise
  float shimmer = noise(vUv * 8.0 + uTime * qSinFreq(0.5));
  col += shimmer * 0.15;

  // Vertical fade (stronger at edges)
  float vFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

  // Horizontal fade at ribbon edges
  float hFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);

  float alpha = vFade * hFade * uOpacity * (0.8 + shimmer * 0.2);
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, alpha);
}
`;

interface AuroraBorealisProps {
  params: Record<string, any>;
}

export const AuroraBorealis: React.FC<AuroraBorealisProps> = ({ params }) => {
  const loopDuration = useLoopDuration();

  const color1 = params.color1 ?? '#00ff88';
  const color2 = params.color2 ?? '#8844ff';
  const speed = params.speed ?? 0.5;
  const height = params.height ?? 15;
  const spread = params.spread ?? 20;
  const opacity = params.opacity ?? 0.6;

  // Create uniforms for each ribbon
  const ribbons = useMemo(() => {
    return Array.from({ length: RIBBON_COUNT }, (_, i) => ({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(color1) },
        uColor2: { value: new THREE.Color(color2) },
        uOpacity: { value: opacity },
        uSpeed: { value: speed },
        uLoopDuration: { value: 0 },
      },
      yOffset: (i / RIBBON_COUNT - 0.5) * 4,
      zOffset: (i - RIBBON_COUNT / 2) * 2,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    for (const ribbon of ribbons) {
      ribbon.uniforms.uTime.value = t;
      ribbon.uniforms.uColor1.value.set(color1);
      ribbon.uniforms.uColor2.value.set(color2);
      ribbon.uniforms.uOpacity.value = opacity;
      ribbon.uniforms.uSpeed.value = speed;
      ribbon.uniforms.uLoopDuration.value = loopDuration ?? 0;
    }
  });

  return (
    <group position={[0, height, 0]}>
      {ribbons.map((ribbon, i) => (
        <mesh
          key={i}
          position={[0, ribbon.yOffset, ribbon.zOffset]}
          rotation={[0.1 * (i - 1), 0, 0]}
        >
          <planeGeometry args={[spread, 3, 64, 4]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={ribbon.uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
