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
uniform float uWobble;

varying vec3 vNormal;
varying vec3 vViewDir;

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

void main() {
  vNormal = normalize(normalMatrix * normal);

  // Noise-based surface displacement for blobby look
  float displacement = noise3D(position * 3.0 + uTime * qSinFreq(1.5)) * uWobble * 0.3;
  vec3 pos = position + normal * displacement;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}
uniform float uTime;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Fresnel rim glow
  float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);

  // Interior color shift (refraction-like)
  float colorShift = sin(dot(vNormal, vec3(1.0, 0.5, 0.3)) * 3.0 + uTime * qSinFreq(1.0)) * 0.5 + 0.5;
  vec3 shiftedColor = mix(uColor, uColor * vec3(0.7, 1.3, 1.1), colorShift);

  // Core glow
  vec3 col = shiftedColor * (0.4 + fresnel * 1.2);
  col += vec3(1.0) * fresnel * 0.3;

  float alpha = 0.5 + fresnel * 0.5;
  gl_FragColor = vec4(col, alpha);
}
`;

interface LiquidOrbsProps {
  params: Record<string, any>;
}

export const LiquidOrbs: React.FC<LiquidOrbsProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  const color = params.color ?? '#66ffcc';
  const orbCount = Math.round(params.orbCount ?? 5);
  const orbSize = params.orbSize ?? 0.3;
  const orbitRadius = params.orbitRadius ?? 1.5;
  const speed = params.speed ?? 1.0;
  const wobble = params.wobble ?? 0.5;

  // Create stable orbit configs
  const orbConfigs = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angleOffset: (i / 12) * Math.PI * 2,
      yOffset: Math.sin(i * 1.7) * 0.5,
      orbitTilt: (i * 0.4) % 1.0,
      speedMult: 0.8 + (i % 3) * 0.2,
    }));
  }, []);

  // Per-orb uniforms
  const orbUniforms = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uWobble: { value: wobble },
      uLoopDuration: { value: 0 },
    }));
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const qSpeed = qf(speed, loopDuration);

    for (let i = 0; i < orbCount && i < 12; i++) {
      const cfg = orbConfigs[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      // Orbit position
      const angle = cfg.angleOffset + t * qSpeed * cfg.speedMult;
      mesh.position.x = Math.cos(angle) * orbitRadius;
      mesh.position.z = Math.sin(angle) * orbitRadius;
      mesh.position.y = cfg.yOffset + Math.sin(angle * 2) * 0.3;

      // Slight tilt rotation
      mesh.rotation.x = t * qSpeed * cfg.orbitTilt;
      mesh.rotation.y = t * qSpeed * 0.5;

      // Update uniforms
      const u = orbUniforms[i];
      u.uTime.value = t;
      u.uColor.value.set(color);
      u.uWobble.value = wobble;
      u.uLoopDuration.value = loopDuration ?? 0;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: orbCount }).map((_, i) => {
        if (i >= 12) return null;
        return (
          <mesh
            key={i}
            ref={(el) => { meshRefs.current[i] = el; }}
            visible={i < orbCount}
          >
            <sphereGeometry args={[orbSize, 24, 24]} />
            <shaderMaterial
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={orbUniforms[i]}
              transparent
              depthWrite={false}
              side={THREE.FrontSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
};
