import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeatherSettings } from './environmentTypes';

interface Particle {
  x: number;
  y: number;
  z: number;
  speed: number;
  offset: number;
  drift: number;
}

interface Props {
  settings: WeatherSettings;
  boxSize: number;
  boxHeight: number;
}

export const EnvironmentWeather: React.FC<Props> = ({ settings, boxSize, boxHeight }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const isSnow = settings.type === 'snow';
  const baseCount = isSnow ? 200 : 300;
  const count = Math.round(baseCount * settings.intensity);
  const half = boxSize / 2;

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * boxSize,
        y: Math.random() * boxHeight,
        z: (Math.random() - 0.5) * boxSize,
        speed: isSnow ? 2 + Math.random() * 2 : 30 + Math.random() * 30,
        offset: Math.random() * Math.PI * 2,
        drift: isSnow ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 0.5,
      })),
    [count, boxSize, boxHeight, isSnow],
  );

  useFrame((state, delta) => {
    if (!meshRef.current || settings.type === 'none') return;
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1); // clamp to avoid huge jumps on tab refocus

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      // Fall
      p.y -= p.speed * dt;
      // Drift
      p.x += (p.drift + settings.windX) * dt;
      if (isSnow) {
        p.x += Math.sin(t * 0.8 + p.offset) * 0.3 * dt;
      }

      // Respawn at top
      if (p.y < 0) {
        p.y = boxHeight;
        p.x = (Math.random() - 0.5) * boxSize;
        p.z = (Math.random() - 0.5) * boxSize;
      }
      // Wrap X/Z
      if (p.x > half) p.x -= boxSize;
      if (p.x < -half) p.x += boxSize;

      dummy.position.set(p.x, p.y, p.z);
      if (isSnow) {
        const s = 0.25;
        dummy.scale.set(s, s, s);
      } else {
        dummy.scale.set(0.06, 0.8, 0.06);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (settings.type === 'none') return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {isSnow ? (
        <sphereGeometry args={[1, 5, 4]} />
      ) : (
        <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
      )}
      <meshBasicMaterial color={settings.color} transparent opacity={isSnow ? 0.85 : 0.5} />
    </instancedMesh>
  );
};
