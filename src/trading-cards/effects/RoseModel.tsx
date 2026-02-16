import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';
import { useLoopDuration, qf } from '../workshop/loopContext';

import type { ModelComponentProps } from '../arena/descriptorTypes';

export type RoseAttack = 'bloom' | 'thorn-storm' | 'cube' | null;

export const RoseModel: React.FC<ModelComponentProps> = ({ activeAttack, hitReaction, isCubed, isDancing, isEvolving, isEvolved, debug, animatedGroupRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  if (animatedGroupRef) animatedGroupRef.current = groupRef.current;
  const { scene } = useGLTF('models/rose.glb');
  const attackStart = useRef(0);
  const hitStart = useRef(0);
  const evolveStart = useRef(0);

  const targetScale = isEvolved ? 100 * 1.5 : 100;

  const { centerOffset, boxSize } = useModelBounds(scene);
  const loopDuration = useLoopDuration();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Hit reaction takes priority when no active attack
    if (hitReaction && !activeAttack) {
      if (hitStart.current === 0) hitStart.current = t;
      const elapsed = t - hitStart.current;

      if (hitReaction === 'hit-light') {
        const intensity = Math.max(0, 1 - elapsed * 2.5);
        const flinch = Math.sin(elapsed * 28) * intensity;
        groupRef.current.position.x = flinch * 1.2;
        groupRef.current.position.y = -Math.abs(flinch) * 0.4;
        groupRef.current.rotation.z = flinch * 0.12;
        groupRef.current.rotation.x = -0.15 * intensity;
        const s = targetScale - intensity * 8;
        groupRef.current.scale.setScalar(s);
      } else if (hitReaction === 'hit-heavy') {
        const phase = Math.min(elapsed / 0.66, 1);
        if (phase < 0.3) {
          const knock = phase / 0.3;
          groupRef.current.position.x = -knock * 3;
          groupRef.current.position.y = -knock * 1.5;
          groupRef.current.rotation.z = knock * 0.4;
          groupRef.current.rotation.x = -knock * 0.35;
          groupRef.current.scale.setScalar(targetScale - knock * 20);
        } else if (phase < 0.6) {
          const wobble = (phase - 0.3) / 0.3;
          groupRef.current.position.x = -3 + wobble * 1.5;
          groupRef.current.position.y = -1.5 + Math.sin(wobble * Math.PI) * 1;
          groupRef.current.rotation.z = 0.4 - wobble * 0.25;
          groupRef.current.rotation.x = -0.35 + wobble * 0.15;
          groupRef.current.scale.setScalar(targetScale - 20 + wobble * 8);
        } else {
          const recover = (phase - 0.6) / 0.4;
          groupRef.current.position.x = -1.5 * (1 - recover);
          groupRef.current.position.y = -0.5 * (1 - recover);
          groupRef.current.rotation.z = 0.15 * (1 - recover);
          groupRef.current.rotation.x = -0.2 * (1 - recover);
          groupRef.current.scale.setScalar(targetScale - 12 + recover * 12);
        }
      }
      return;
    }

    // Reset hit tracking when not hit
    if (!hitReaction) hitStart.current = 0;

    if (!activeAttack) {
      attackStart.current = 0;

      // Evolving animation (2.5s elegant bloom transformation)
      if (isEvolving) {
        if (evolveStart.current === 0) evolveStart.current = t;
        const elapsed = t - evolveStart.current;

        if (elapsed < 0.8) {
          // Phase 1: Graceful rise, petals tightening
          const p = elapsed / 0.8;
          groupRef.current.rotation.y = elapsed * 3;
          groupRef.current.position.y = p * 2.5;
          groupRef.current.rotation.z = Math.sin(elapsed * 8) * 0.1 * p;
          const s = 100 + Math.sin(elapsed * 6) * 5 * p;
          groupRef.current.scale.setScalar(s);
        } else if (elapsed < 1.8) {
          // Phase 2: Blooming spin, scale ramps to evolved
          const p = (elapsed - 0.8) / 1.0;
          const ease = p * p * (3 - 2 * p);
          groupRef.current.rotation.y = (elapsed - 0.8) * 8;
          groupRef.current.position.y = 2.5 + Math.sin(elapsed * 4) * 0.3;
          groupRef.current.position.x = Math.sin(elapsed * 6) * (1 - ease) * 0.5;
          const s = 100 + ease * (150 - 100);
          groupRef.current.scale.setScalar(s);
        } else {
          // Phase 3: Settle with gentle sway
          const p = (elapsed - 1.8) / 0.7;
          const sway = Math.sin(p * Math.PI * 2) * Math.max(0, 1 - p) * 8;
          groupRef.current.rotation.y *= 0.95;
          groupRef.current.position.y = (2.5 * (1 - p));
          groupRef.current.position.x *= 0.9;
          groupRef.current.rotation.z *= 0.9;
          const s = 150 + sway;
          groupRef.current.scale.setScalar(s);
        }
        return;
      }
      evolveStart.current = 0;

      if (isCubed) {
        groupRef.current.rotation.x += 0.06;
        groupRef.current.rotation.y += 0.09;
        groupRef.current.rotation.z += 0.04;
        groupRef.current.position.x = Math.sin(t * qf(3, loopDuration)) * 0.8;
        groupRef.current.position.y = Math.sin(t * qf(2.3, loopDuration)) * 0.5;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        return;
      }

      if (isDancing) {
        groupRef.current.rotation.y = t * qf(3, loopDuration);
        groupRef.current.position.y = Math.sin(t * qf(2, loopDuration)) * 1.5 + 0.5;
        groupRef.current.position.x = Math.sin(t * qf(1.5, loopDuration)) * 1;
        groupRef.current.rotation.z = Math.sin(t * qf(3, loopDuration)) * 0.2;
        groupRef.current.rotation.x = Math.cos(t * qf(2, loopDuration)) * 0.15;
        const s = targetScale + Math.sin(t * qf(4, loopDuration)) * 8;
        groupRef.current.scale.setScalar(s);
        return;
      }

      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x *= 0.95;
      groupRef.current.rotation.z = Math.sin(t * qf(0.8, loopDuration)) * 0.05;
      groupRef.current.position.x *= 0.9;
      groupRef.current.position.y = Math.sin(t * qf(1.2, loopDuration)) * 0.3;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      return;
    }

    if (attackStart.current === 0) attackStart.current = t;
    const elapsed = t - attackStart.current;

    if (activeAttack === 'bloom') {
      // Graceful bloom: rise up, scale pulse outward, slow elegant spin
      const phase = Math.min(elapsed / 3, 1);
      const ease = 1 - Math.pow(1 - phase, 3); // ease-out cubic

      // Rise upward gently
      groupRef.current.position.y = ease * 2.5 + Math.sin(elapsed * 2) * 0.4 * ease;

      // Slow majestic spin
      groupRef.current.rotation.y += 0.02 + ease * 0.03;

      // Gentle tilt that sways
      groupRef.current.rotation.x = Math.sin(elapsed * 1.5) * 0.15 * ease;
      groupRef.current.rotation.z = Math.cos(elapsed * 1.2) * 0.1 * ease;

      // Scale blooms outward then settles
      const breathe = Math.sin(elapsed * 3) * 0.8;
      const s = 100 + ease * 30 + breathe * ease * 10;
      groupRef.current.scale.setScalar(s);
    } else if (activeAttack === 'thorn-storm') {
      // Violent fast spin with position whip, thorns everywhere
      const intensity = Math.max(0, 1 - elapsed * 0.45);

      // Rapid aggressive spin
      groupRef.current.rotation.y = elapsed * 18 * intensity;
      groupRef.current.rotation.x = Math.sin(elapsed * 30) * 0.6 * intensity;
      groupRef.current.rotation.z = Math.cos(elapsed * 22) * 0.4 * intensity;

      // Whip around the scene
      groupRef.current.position.x = Math.sin(elapsed * 14) * 3 * intensity;
      groupRef.current.position.y = Math.sin(elapsed * 9) * 2.5 * intensity + intensity * 1.5;

      // Scale pulses aggressively
      const s = 100 + Math.sin(elapsed * 20) * 30 * intensity;
      groupRef.current.scale.setScalar(s);
    } else if (activeAttack === 'cube') {
      // Dark energy gathering: spin inward, contract, then sudden expansion burst (~1.5s)
      const phase = Math.min(elapsed / 1.5, 1);

      if (phase < 0.6) {
        // Gathering phase: spin inward, scale contracts
        const gather = phase / 0.6;
        const ease = gather * gather; // ease-in
        groupRef.current.rotation.y -= 0.08 * (1 + ease * 3);
        groupRef.current.position.y = -ease * 1.5;
        const s = 100 - ease * 35;
        groupRef.current.scale.setScalar(s);
        groupRef.current.rotation.x = Math.sin(elapsed * 8) * 0.2 * ease;
        groupRef.current.rotation.z = Math.cos(elapsed * 6) * 0.15 * ease;
      } else {
        // Burst phase: sudden expansion
        const burst = (phase - 0.6) / 0.4;
        const easeOut = 1 - Math.pow(1 - burst, 3);
        groupRef.current.rotation.y -= 0.02;
        groupRef.current.position.y = -1.5 + easeOut * 1.5;
        const s = 65 + easeOut * 55;
        groupRef.current.scale.setScalar(s);
        groupRef.current.rotation.x = (1 - easeOut) * 0.2;
        groupRef.current.rotation.z = (1 - easeOut) * 0.15;
      }
    }
  });

  return (
    <group ref={groupRef} scale={100}>
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
