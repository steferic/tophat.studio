import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GodRaysSettings } from './environmentTypes';
import { useLoopDuration, qf } from '../workshop/loopContext';

const VERTEX = /* glsl */ `
varying float vY;
void main() {
  vY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vY;
void main() {
  // Gradient: bright at apex (y=1) → transparent at base (y=0)
  float grad = smoothstep(0.0, 0.8, vY);
  gl_FragColor = vec4(uColor, uOpacity * grad);
}
`;

interface RayData {
  x: number;
  z: number;
  phaseOffset: number;
}

interface Props {
  settings: GodRaysSettings;
  boxSize: number;
}

export const EnvironmentGodRays: React.FC<Props> = ({ settings, boxSize }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(settings.color) },
      uOpacity: { value: settings.opacity },
    }),
    [],
  );

  const rays = useMemo<RayData[]>(
    () =>
      Array.from({ length: settings.count }, (_, i) => {
        const half = boxSize / 2;
        return {
          x: (Math.random() - 0.5) * half * 1.5,
          z: (Math.random() - 0.5) * half * 1.5,
          phaseOffset: (i / settings.count) * Math.PI * 2,
        };
      }),
    [settings.count, boxSize],
  );

  const loopDuration = useLoopDuration();

  const coneGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(12, settings.originY, 8, 1, true);
    // Shift so apex is at top (y = originY) and base at y = 0
    geo.translate(0, settings.originY / 2, 0);
    return geo;
  }, [settings.originY]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const rawT = state.clock.getElapsedTime();

    uniforms.uColor.value.set(settings.color);
    uniforms.uOpacity.value = settings.opacity;

    groupRef.current.children.forEach((child, i) => {
      const ray = rays[i];
      if (!ray) return;
      const sway = Math.sin(rawT * qf(settings.speed * 0.3, loopDuration) + ray.phaseOffset) * 4;
      child.position.x = ray.x + sway;
      child.position.z = ray.z + Math.cos(rawT * qf(settings.speed * 0.2, loopDuration) + ray.phaseOffset) * 3;
    });
  });

  if (!settings.enabled) return null;

  return (
    <group ref={groupRef}>
      {rays.map((ray, i) => (
        <mesh key={i} geometry={coneGeo} position={[ray.x, 0, ray.z]}>
          <shaderMaterial
            vertexShader={VERTEX}
            fragmentShader={FRAGMENT}
            uniforms={uniforms}
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
