import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration, qf } from '../../workshop/loopContext';
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
uniform float uRingCount;
uniform float uPulseIntensity;
uniform float uGlyphDensity;

varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);
  float angle = atan(centered.y, centered.x);

  // Concentric rings
  float ringFreq = uRingCount * 3.14159;
  float rings = sin(dist * ringFreq - uTime * qSinFreq(2.0)) * 0.5 + 0.5;
  rings = smoothstep(0.3, 0.7, rings);

  // Procedural rune glyphs using polar coords
  float glyphAngle = angle + uTime * qSinFreq(0.5);
  float glyphs = step(0.5, fract(glyphAngle * uGlyphDensity / 6.283185));
  float glyphRing = smoothstep(0.35, 0.4, dist) * smoothstep(0.65, 0.6, dist);
  glyphs *= glyphRing;

  // Outer ring border
  float outerRing = smoothstep(0.95, 0.9, dist) * smoothstep(0.85, 0.9, dist);

  // Inner ring border
  float innerRing = smoothstep(0.3, 0.35, dist) * smoothstep(0.4, 0.35, dist);

  // Combine
  float pattern = max(rings * 0.4, max(glyphs * 0.8, max(outerRing, innerRing * 0.6)));

  // Pulsing opacity
  float pulse = 1.0 - uPulseIntensity * 0.3 + sin(uTime * qSinFreq(3.0)) * uPulseIntensity * 0.3;

  // Fade at edges
  float edgeFade = 1.0 - smoothstep(0.85, 1.0, dist);

  float alpha = pattern * pulse * edgeFade;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(uColor, alpha * 0.9);
}
`;

interface MagicCircleProps {
  params: Record<string, any>;
}

export const MagicCircle: React.FC<MagicCircleProps> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loopDuration = useLoopDuration();

  const color = params.color ?? '#9966ff';
  const radius = params.radius ?? 1.5;
  const rotationSpeed = params.rotationSpeed ?? 1.0;
  const ringCount = params.ringCount ?? 3;
  const pulseIntensity = params.pulseIntensity ?? 0.5;
  const glyphDensity = params.glyphDensity ?? 8;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uRingCount: { value: ringCount },
      uPulseIntensity: { value: pulseIntensity },
      uGlyphDensity: { value: glyphDensity },
      uLoopDuration: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uColor.value.set(color);
    uniforms.uRingCount.value = ringCount;
    uniforms.uPulseIntensity.value = pulseIntensity;
    uniforms.uGlyphDensity.value = glyphDensity;
    uniforms.uLoopDuration.value = loopDuration ?? 0;

    if (meshRef.current) {
      meshRef.current.rotation.z = t * qf(rotationSpeed, loopDuration);
    }
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
