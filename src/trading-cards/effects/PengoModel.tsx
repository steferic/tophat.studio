import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';

import type { ModelComponentProps } from '../arena/descriptorTypes';

export const PengoModel: React.FC<ModelComponentProps> = ({ activeAttack, hitReaction, isCubed, isDancing, isEvolving, isEvolved, debug, animatedGroupRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  if (animatedGroupRef) animatedGroupRef.current = groupRef.current;
  const { scene } = useGLTF('models/pengoo.glb');
  const attackStart = useRef(0);
  const hitStart = useRef(0);
  const evolveStart = useRef(0);

  const targetScale = isEvolved ? 14 * 1.5 : 14;

  const { centerOffset, boxSize } = useModelBounds(scene);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Hit reaction takes priority when no active attack
    if (hitReaction && !activeAttack) {
      if (hitStart.current === 0) hitStart.current = t;
      const elapsed = t - hitStart.current;

      if (hitReaction === 'hit-light') {
        const intensity = Math.max(0, 1 - elapsed * 2.5);
        const flinch = Math.sin(elapsed * 30) * intensity;
        groupRef.current.position.x = flinch * 1.5;
        groupRef.current.position.y = -Math.abs(flinch) * 0.5;
        groupRef.current.rotation.z = flinch * 0.15;
        groupRef.current.rotation.x = -0.2 * intensity;
        const s = targetScale - intensity * 0.8;
        groupRef.current.scale.setScalar(s);
      } else if (hitReaction === 'hit-heavy') {
        const phase = Math.min(elapsed / 0.66, 1);
        if (phase < 0.3) {
          const knock = phase / 0.3;
          groupRef.current.position.x = -knock * 4;
          groupRef.current.position.y = -knock * 2;
          groupRef.current.rotation.z = knock * 0.5;
          groupRef.current.rotation.x = -knock * 0.4;
          groupRef.current.scale.setScalar(targetScale - knock * 2);
        } else if (phase < 0.6) {
          const tumble = (phase - 0.3) / 0.3;
          groupRef.current.position.x = -4 + tumble * 2;
          groupRef.current.position.y = -2 + Math.sin(tumble * Math.PI) * 1.5;
          groupRef.current.rotation.z = 0.5 - tumble * 0.3;
          groupRef.current.rotation.x = -0.4 + tumble * 0.2;
          groupRef.current.scale.setScalar(targetScale - 2 + tumble * 1);
        } else {
          const recover = (phase - 0.6) / 0.4;
          groupRef.current.position.x = -2 * (1 - recover);
          groupRef.current.position.y = (-2 + 1.5) * (1 - recover);
          groupRef.current.rotation.z = 0.2 * (1 - recover);
          groupRef.current.rotation.x = -0.2 * (1 - recover);
          groupRef.current.scale.setScalar(targetScale - 1 + recover);
        }
      }
      return;
    }

    if (!hitReaction) hitStart.current = 0;

    if (!activeAttack) {
      attackStart.current = 0;

      // Evolving animation (2.5s epic transformation)
      if (isEvolving) {
        if (evolveStart.current === 0) evolveStart.current = t;
        const elapsed = t - evolveStart.current;

        if (elapsed < 0.8) {
          // Phase 1: Intense vibration, rising, slight scale pulse
          const p = elapsed / 0.8;
          const vibrate = Math.sin(elapsed * 60) * (0.5 + p * 1.5);
          groupRef.current.position.x = vibrate;
          groupRef.current.position.y = p * 2;
          groupRef.current.rotation.z = Math.sin(elapsed * 40) * 0.15 * p;
          const s = 14 + Math.sin(elapsed * 20) * 1.5 * p;
          groupRef.current.scale.setScalar(s);
        } else if (elapsed < 1.8) {
          // Phase 2: Rapid spin, scale ramps from 14 → 21
          const p = (elapsed - 0.8) / 1.0;
          const ease = p * p * (3 - 2 * p); // smoothstep
          groupRef.current.rotation.y = (elapsed - 0.8) * 12;
          groupRef.current.position.y = 2 + Math.sin(elapsed * 6) * 0.5;
          groupRef.current.position.x = Math.sin(elapsed * 30) * (1 - ease) * 0.8;
          const s = 14 + ease * (21 - 14);
          groupRef.current.scale.setScalar(s);
        } else {
          // Phase 3: Settle into evolved size, slight bounce
          const p = (elapsed - 1.8) / 0.7;
          const bounce = Math.sin(p * Math.PI * 2) * Math.max(0, 1 - p) * 1.5;
          groupRef.current.rotation.y *= 0.92;
          groupRef.current.position.y = (2 * (1 - p)) + bounce * 0.3;
          groupRef.current.position.x *= 0.9;
          groupRef.current.rotation.z *= 0.9;
          const s = 21 + bounce;
          groupRef.current.scale.setScalar(s);
        }
        return;
      }
      evolveStart.current = 0;

      if (isCubed) {
        groupRef.current.rotation.x += 0.06;
        groupRef.current.rotation.y += 0.09;
        groupRef.current.rotation.z += 0.04;
        groupRef.current.position.x = Math.sin(t * 3) * 1.2;
        groupRef.current.position.y = Math.sin(t * 2.3) * 0.8;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        return;
      }

      if (isDancing) {
        const bounce = Math.abs(Math.sin(t * 5)) * 2;
        groupRef.current.position.y = bounce;
        groupRef.current.position.x = Math.sin(t * 2.5) * 1.5;
        groupRef.current.rotation.z = Math.sin(t * 2.5) * 0.3;
        groupRef.current.rotation.y = Math.sin(t * 5) * 0.4;
        groupRef.current.rotation.x = 0;
        const s = targetScale + Math.sin(t * 10) * 0.5;
        groupRef.current.scale.setScalar(s);
        return;
      }

      groupRef.current.rotation.x *= 0.9;
      groupRef.current.rotation.y *= 0.9;
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.position.x *= 0.9;
      groupRef.current.position.y *= 0.9;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      return;
    }

    if (attackStart.current === 0) attackStart.current = t;
    const elapsed = t - attackStart.current;

    if (activeAttack === 'ice-slide') {
      const slide = Math.sin(elapsed * 12) * Math.max(0, 1 - elapsed * 2);
      groupRef.current.position.x = slide * 3;
      groupRef.current.rotation.y = slide * 0.8;
      groupRef.current.rotation.z = slide * -0.3;
      const s = targetScale + Math.sin(elapsed * 16) * 0.5 * Math.max(0, 1 - elapsed * 2.5);
      groupRef.current.scale.set(s, s, s);
    } else if (activeAttack === 'glacier-crush') {
      if (elapsed < 0.2) {
        const rise = elapsed / 0.2;
        groupRef.current.position.y = rise * 3;
        groupRef.current.scale.setScalar(targetScale + rise * 1.5);
      } else if (elapsed < 0.35) {
        const slam = (elapsed - 0.2) / 0.15;
        groupRef.current.position.y = 3 * (1 - slam) - slam * 1.5;
        groupRef.current.scale.setScalar(targetScale + 1.5 - slam * 2);
      } else {
        const shake = Math.sin(elapsed * 40) * Math.max(0, 1 - (elapsed - 0.35) * 3);
        groupRef.current.position.y = -1.5 * Math.max(0, 1 - (elapsed - 0.35) * 4);
        groupRef.current.position.x = shake * 2;
        groupRef.current.rotation.z = shake * 0.2;
        groupRef.current.scale.setScalar(targetScale - 0.5 + Math.max(0, 1 - (elapsed - 0.35) * 3) * 0.8);
      }
    } else if (activeAttack === 'inferno') {
      const intensity = Math.max(0, 1 - elapsed * 0.55);
      groupRef.current.rotation.y = elapsed * 12 * intensity;
      groupRef.current.rotation.x = Math.sin(elapsed * 25) * 0.4 * intensity;
      groupRef.current.rotation.z = Math.cos(elapsed * 18) * 0.15 * intensity;
      const s = targetScale + Math.sin(elapsed * 14) * 2.5 * intensity;
      groupRef.current.scale.setScalar(s);
      groupRef.current.position.y = Math.sin(elapsed * 8) * 2.5 * intensity + intensity * 1.5;
      groupRef.current.position.x = Math.sin(elapsed * 11) * 1.0 * intensity;
    }
  });

  return (
    <group ref={groupRef} scale={targetScale}>
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
