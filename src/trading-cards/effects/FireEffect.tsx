import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FLAME_COUNT = 60;
const EMBER_COUNT = 30;

interface FireEffectProps {
  active: boolean;
}

export const FireEffect: React.FC<FireEffectProps> = ({ active }) => {
  const flameRef = useRef<THREE.InstancedMesh>(null!);
  const emberRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const flames = useMemo(
    () =>
      Array.from({ length: FLAME_COUNT }, () => ({
        x: (Math.random() - 0.5) * 8,
        y: Math.random() * -4,
        z: (Math.random() - 0.5) * 6,
        speed: 4 + Math.random() * 6,
        size: 0.4 + Math.random() * 0.9,
        offset: Math.random() * Math.PI * 2,
        wobble: 0.5 + Math.random() * 1.5,
      })),
    [],
  );

  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, () => ({
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * -2,
        z: (Math.random() - 0.5) * 6,
        speed: 2 + Math.random() * 3,
        size: 0.1 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 3,
      })),
    [],
  );

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();

    if (flameRef.current) {
      for (let i = 0; i < FLAME_COUNT; i++) {
        const p = flames[i];
        const life = ((t * p.speed + p.offset) % 6) / 6;
        dummy.position.set(
          p.x + Math.sin(t * p.wobble + p.offset) * 1.2,
          p.y + life * 16,
          p.z + Math.cos(t * p.wobble * 0.7 + p.offset) * 0.8,
        );
        const fade = life < 0.15 ? life / 0.15 : life > 0.6 ? (1 - life) / 0.4 : 1;
        const s = p.size * fade * (1 + Math.sin(t * 8 + p.offset) * 0.3);
        dummy.scale.set(s, s * 1.3, s);
        dummy.updateMatrix();
        flameRef.current.setMatrixAt(i, dummy.matrix);
      }
      flameRef.current.instanceMatrix.needsUpdate = true;
    }

    if (emberRef.current) {
      for (let i = 0; i < EMBER_COUNT; i++) {
        const p = embers[i];
        const life = ((t * p.speed + p.offset) % 10) / 10;
        dummy.position.set(
          p.x + p.drift * life + Math.sin(t * 3 + p.offset) * 0.5,
          p.y + life * 20,
          p.z + Math.cos(t * 2 + p.offset) * 0.3,
        );
        const fade = life < 0.1 ? life / 0.1 : Math.pow(1 - life, 2);
        const s = p.size * fade;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        emberRef.current.setMatrixAt(i, dummy.matrix);
      }
      emberRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <>
      <instancedMesh ref={flameRef} args={[undefined, undefined, FLAME_COUNT]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.8} />
      </instancedMesh>
      <instancedMesh ref={emberRef} args={[undefined, undefined, EMBER_COUNT]}>
        <sphereGeometry args={[1, 4, 3]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.9} />
      </instancedMesh>
    </>
  );
};
