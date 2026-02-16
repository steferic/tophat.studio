import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';
import type { ItemMovementPattern } from '../arena/descriptorTypes';
import { useLoopDuration, qf } from '../workshop/loopContext';

const ORBIT_RADIUS = 3.5;
const HOVER_RADIUS = 2.5;
const FOLLOW_Z_OFFSET = -3;

/** Same NORM_UNIT as ModelScene — calibrated from pengoo.glb at baseScale 14.
 *  Items normalized to this appear the same visual size as the character. */
const NORM_UNIT = 6.25;

interface FloatingItemProps {
  modelPath: string;
  /** Relative size after normalization. 1.0 = same size as pengo. */
  scale: number;
  movement: ItemMovementPattern;
  index: number;
  totalCount: number;
}

export const FloatingItem: React.FC<FloatingItemProps> = ({
  modelPath,
  scale,
  movement,
  index,
  totalCount,
}) => {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const { boxSize } = useModelBounds(clonedScene);
  const groupRef = useRef<THREE.Group>(null);

  // Normalize so largest dimension = NORM_UNIT, then apply relative scale
  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
  const normScale = maxDim > 0 ? (NORM_UNIT / maxDim) * scale : scale;

  const loopDuration = useLoopDuration();

  const angleOffset = (index / Math.max(totalCount, 1)) * Math.PI * 2;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    switch (movement) {
      case 'orbit': {
        const a = t * qf(0.6, loopDuration) + angleOffset;
        groupRef.current.position.set(
          Math.cos(a) * ORBIT_RADIUS,
          0.4 + Math.sin(t * qf(1.8, loopDuration) + angleOffset) * 0.2,
          Math.sin(a) * ORBIT_RADIUS,
        );
        groupRef.current.rotation.y = t * qf(1.2, loopDuration);
        groupRef.current.rotation.x = Math.sin(t * qf(0.9, loopDuration) + angleOffset) * 0.15;
        break;
      }
      case 'hover': {
        const x = Math.cos(angleOffset) * HOVER_RADIUS;
        const z = Math.sin(angleOffset) * HOVER_RADIUS;
        groupRef.current.position.set(
          x,
          1.0 + Math.sin(t * qf(1.2, loopDuration) + angleOffset) * 0.3,
          z,
        );
        groupRef.current.rotation.y = t * qf(0.3, loopDuration);
        break;
      }
      case 'follow': {
        const sway = Math.sin(t * qf(0.8, loopDuration) + angleOffset) * 1.5;
        groupRef.current.position.set(
          sway,
          0.5 + Math.sin(t * qf(1.5, loopDuration) + angleOffset) * 0.15,
          FOLLOW_Z_OFFSET - index * 1.5,
        );
        groupRef.current.rotation.y = t * qf(0.5, loopDuration);
        break;
      }
    }
  });

  return (
    <group ref={groupRef} scale={normScale}>
      <primitive object={clonedScene} />
    </group>
  );
};
