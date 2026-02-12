import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';

import type { ModelComponentProps } from '../arena/descriptorTypes';

export const PengoModel: React.FC<ModelComponentProps> = ({ activeAttack, hitReaction, isCubed, debug }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('models/pengoo.glb');
  const attackStart = useRef(0);
  const hitStart = useRef(0);

  const { centerOffset, boxSize } = useModelBounds(scene);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Hit reaction takes priority when no active attack
    if (hitReaction && !activeAttack) {
      if (hitStart.current === 0) hitStart.current = t;
      const elapsed = t - hitStart.current;

      if (hitReaction === 'hit-light') {
        // Quick flinch/shake back (~400ms)
        const intensity = Math.max(0, 1 - elapsed * 2.5);
        const flinch = Math.sin(elapsed * 30) * intensity;
        groupRef.current.position.x = flinch * 1.5;
        groupRef.current.position.y = -Math.abs(flinch) * 0.5;
        groupRef.current.rotation.z = flinch * 0.15;
        groupRef.current.rotation.x = -0.2 * intensity;
        const s = 14 - intensity * 0.8;
        groupRef.current.scale.setScalar(s);
      } else if (hitReaction === 'hit-heavy') {
        // Big knockback, tumble, slow recovery (~660ms)
        const phase = Math.min(elapsed / 0.66, 1);
        if (phase < 0.3) {
          // Knockback
          const knock = phase / 0.3;
          groupRef.current.position.x = -knock * 4;
          groupRef.current.position.y = -knock * 2;
          groupRef.current.rotation.z = knock * 0.5;
          groupRef.current.rotation.x = -knock * 0.4;
          groupRef.current.scale.setScalar(14 - knock * 2);
        } else if (phase < 0.6) {
          // Tumble
          const tumble = (phase - 0.3) / 0.3;
          groupRef.current.position.x = -4 + tumble * 2;
          groupRef.current.position.y = -2 + Math.sin(tumble * Math.PI) * 1.5;
          groupRef.current.rotation.z = 0.5 - tumble * 0.3;
          groupRef.current.rotation.x = -0.4 + tumble * 0.2;
          groupRef.current.scale.setScalar(12 + tumble * 1);
        } else {
          // Slow recovery
          const recover = (phase - 0.6) / 0.4;
          groupRef.current.position.x = -2 * (1 - recover);
          groupRef.current.position.y = (-2 + 1.5) * (1 - recover);
          groupRef.current.rotation.z = 0.2 * (1 - recover);
          groupRef.current.rotation.x = -0.2 * (1 - recover);
          groupRef.current.scale.setScalar(13 + recover);
        }
      }
      return;
    }

    // Reset hit tracking when not hit
    if (!hitReaction) hitStart.current = 0;

    if (!activeAttack) {
      attackStart.current = 0;

      // Trapped in cube: tumble and spin helplessly
      if (isCubed) {
        groupRef.current.rotation.x += 0.06;
        groupRef.current.rotation.y += 0.09;
        groupRef.current.rotation.z += 0.04;
        groupRef.current.position.x = Math.sin(t * 3) * 1.2;
        groupRef.current.position.y = Math.sin(t * 2.3) * 0.8;
        groupRef.current.scale.lerp(new THREE.Vector3(14, 14, 14), 0.1);
        return;
      }

      groupRef.current.rotation.x *= 0.9;
      groupRef.current.rotation.y *= 0.9;
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.position.x *= 0.9;
      groupRef.current.position.y *= 0.9;
      groupRef.current.scale.lerp(new THREE.Vector3(14, 14, 14), 0.1);
      return;
    }

    if (attackStart.current === 0) attackStart.current = t;
    const elapsed = t - attackStart.current;

    if (activeAttack === 'ice-slide') {
      const slide = Math.sin(elapsed * 12) * Math.max(0, 1 - elapsed * 2);
      groupRef.current.position.x = slide * 3;
      groupRef.current.rotation.y = slide * 0.8;
      groupRef.current.rotation.z = slide * -0.3;
      const s = 14 + Math.sin(elapsed * 16) * 0.5 * Math.max(0, 1 - elapsed * 2.5);
      groupRef.current.scale.set(s, s, s);
    } else if (activeAttack === 'glacier-crush') {
      if (elapsed < 0.2) {
        const rise = elapsed / 0.2;
        groupRef.current.position.y = rise * 3;
        groupRef.current.scale.setScalar(14 + rise * 1.5);
      } else if (elapsed < 0.35) {
        const slam = (elapsed - 0.2) / 0.15;
        groupRef.current.position.y = 3 * (1 - slam) - slam * 1.5;
        groupRef.current.scale.setScalar(15.5 - slam * 2);
      } else {
        const shake = Math.sin(elapsed * 40) * Math.max(0, 1 - (elapsed - 0.35) * 3);
        groupRef.current.position.y = -1.5 * Math.max(0, 1 - (elapsed - 0.35) * 4);
        groupRef.current.position.x = shake * 2;
        groupRef.current.rotation.z = shake * 0.2;
        groupRef.current.scale.setScalar(13.5 + Math.max(0, 1 - (elapsed - 0.35) * 3) * 0.8);
      }
    } else if (activeAttack === 'inferno') {
      const intensity = Math.max(0, 1 - elapsed * 0.55);
      groupRef.current.rotation.y = elapsed * 12 * intensity;
      groupRef.current.rotation.x = Math.sin(elapsed * 25) * 0.4 * intensity;
      groupRef.current.rotation.z = Math.cos(elapsed * 18) * 0.15 * intensity;
      const s = 14 + Math.sin(elapsed * 14) * 2.5 * intensity;
      groupRef.current.scale.setScalar(s);
      groupRef.current.position.y = Math.sin(elapsed * 8) * 2.5 * intensity + intensity * 1.5;
      groupRef.current.position.x = Math.sin(elapsed * 11) * 1.0 * intensity;
    }
  });

  return (
    <group ref={groupRef} scale={14}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={scene} />
      </group>
      {debug && (
        <>
          {/* Bounding box wireframe (at centroid origin, in local model units) */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z)]} />
            <lineBasicMaterial color="#ff3333" transparent opacity={0.35} />
          </lineSegments>
          {/* Centroid crosshair — small axes at origin */}
          <axesHelper args={[boxSize.x * 0.3]} />
        </>
      )}
    </group>
  );
};
