import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PetalEffectProps {
  active: boolean;
  /** 'bloom' = gentle floating petals, 'storm' = violent swirling */
  mode?: 'bloom' | 'storm';
}

const PETAL_COUNT = 40;

export const PetalEffect: React.FC<PetalEffectProps> = ({ active, mode = 'bloom' }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const startTime = useRef(0);

  // Per-petal random seeds
  const seeds = useMemo(() => {
    const arr: { rx: number; ry: number; rz: number; speed: number; offset: number; radius: number }[] = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      arr.push({
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2,
        radius: 1 + Math.random() * 4,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    if (!active) {
      startTime.current = 0;
      // Hide all petals
      for (let i = 0; i < PETAL_COUNT; i++) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    if (startTime.current === 0) startTime.current = t;
    const elapsed = t - startTime.current;

    const isStorm = mode === 'storm';
    const fadeIn = Math.min(elapsed / 0.5, 1);
    const intensity = isStorm ? Math.max(0, 1 - elapsed * 0.4) : fadeIn;

    for (let i = 0; i < PETAL_COUNT; i++) {
      const s = seeds[i];
      const et = elapsed * s.speed;

      if (isStorm) {
        // Violent spiral outward
        const angle = et * 8 + s.offset;
        const r = s.radius * (0.5 + elapsed * 1.5) * intensity;
        dummy.position.set(
          Math.cos(angle) * r,
          Math.sin(et * 6 + s.offset) * r * 0.6,
          Math.sin(angle) * r,
        );
        dummy.rotation.set(et * 12 + s.rx, et * 8 + s.ry, et * 10 + s.rz);
      } else {
        // Gentle float upward in a spiral
        const angle = et * 1.5 + s.offset;
        const r = s.radius * 0.8;
        const rise = (elapsed * 0.8 + s.offset * 0.3) % 6;
        dummy.position.set(
          Math.cos(angle) * r,
          rise - 2 + Math.sin(et * 2) * 0.5,
          Math.sin(angle) * r,
        );
        dummy.rotation.set(
          Math.sin(et * 2 + s.rx) * 0.5,
          et * 1.5 + s.ry,
          Math.cos(et * 1.5 + s.rz) * 0.3,
        );
      }

      const petalScale = 0.15 * intensity;
      dummy.scale.set(petalScale, petalScale * 0.3, petalScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PETAL_COUNT]}>
      <sphereGeometry args={[1, 4, 2]} />
      <meshStandardMaterial
        color={mode === 'storm' ? '#cc2244' : '#ffaacc'}
        emissive={mode === 'storm' ? '#880022' : '#ff6699'}
        emissiveIntensity={0.4}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
