import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';
import type { EvolvedEffectDescriptor } from '../arena/descriptorTypes';

const NORM_UNIT = 6.25;

interface TeleportCloneProps {
  modelPath: string;
  /** Seconds elapsed since the attack started */
  attackElapsed: number;
  /** Attacker's internal base scale (for normalization) */
  baseScale: number;
  /** Attacker's relative size (for normalization) */
  relativeSize: number;
  /** Whether the attacker is in evolved state (1.5x scale) */
  isEvolved: boolean;
  /** Evolved visual effects descriptor — drives aura + light */
  evolvedEffects?: EvolvedEffectDescriptor;
}

/**
 * Renders a clone of the attacker's model inside the defender's scene.
 * Appears simultaneously as the attacker vanishes from own card.
 *
 * Timeline (synced with PengoModel):
 *   0.0-0.08s   near-instant materialize right behind defender
 *   0.08-1.3s   chop strike (lunge forward + slam down)
 *   1.3-1.4s    near-instant vanish (attacker reappears in own card at 1.4s)
 */
export const TeleportClone: React.FC<TeleportCloneProps> = ({ modelPath, attackElapsed, baseScale, relativeSize, isEvolved, evolvedEffects }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(modelPath);

  const hasAura = isEvolved && !!evolvedEffects;
  const auraOpacity = evolvedEffects?.auraOpacity ?? 0.15;
  const auraScale = evolvedEffects?.auraScale ?? 1.25;
  const auraColor = evolvedEffects?.color ?? '#3b82f6';
  const lightIntensity = evolvedEffects?.lightIntensity ?? Math.PI * 3;

  // Clone the scene for rendering — must happen BEFORE useModelBounds
  // so we compute bounds on the clone (which has no parent transforms).
  // The shared `scene` from useGLTF is parented to the attacker's scaled group,
  // polluting its matrixWorld with the attacker's baseScale.
  const cloneScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const origMat = mesh.material as THREE.MeshStandardMaterial;
        if (origMat.isMeshStandardMaterial) {
          const mat = origMat.clone();
          mat.transparent = true;
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene]);

  // Ghost aura clone (additive blending) — only created when evolved with effects
  const ghostScene = useMemo(() => {
    if (!hasAura) return null;
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: auraColor,
          transparent: true,
          opacity: auraOpacity,
          depthWrite: false,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
        });
      }
    });
    return clone;
  }, [scene, hasAura, auraColor, auraOpacity]);

  // Compute bounds on the clone (no parent transforms from the attacker's scene)
  const { centerOffset, boxSize } = useModelBounds(cloneScene);

  // Compute the same normalized scale as ModelScene uses
  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
  const normScale = (NORM_UNIT / maxDim * relativeSize) / baseScale;
  const internalScale = isEvolved ? baseScale * 1.5 : baseScale;

  const setOpacity = (opacity: number) => {
    cloneScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.transparent) mat.opacity = opacity;
      }
    });
  };

  const setGhostOpacity = (opacity: number) => {
    if (!ghostScene) return;
    ghostScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  };

  // Position behind the defender
  const BEHIND_Z = -2.5;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = attackElapsed;

    // Ghost aura shimmer (scales around configured auraOpacity)
    if (hasAura && ghostScene) {
      const clock = state.clock.getElapsedTime();
      const pulse = (auraOpacity - 0.01) + Math.sin(clock * 3) * 0.06 + Math.sin(clock * 7.3) * 0.03;
      setGhostOpacity(pulse);
    }

    // Near-instant materialize (0.0-0.08s) — simultaneous with attacker vanishing
    if (t < 0.08) {
      const p = t / 0.08;
      groupRef.current.scale.setScalar(internalScale * p);
      groupRef.current.position.set(0, 0, BEHIND_Z);
      groupRef.current.rotation.y = Math.PI;
      setOpacity(p);
      if (hasAura) setGhostOpacity(p * auraOpacity);
      return;
    }

    // Chop strike (0.08-1.3s)
    if (t < 1.3) {
      const p = (t - 0.08) / 1.22;
      groupRef.current.scale.setScalar(internalScale);
      const lunge = Math.sin(p * Math.PI) * 1.5;
      groupRef.current.position.set(0, -p * 1.5, BEHIND_Z + lunge);
      groupRef.current.rotation.y = Math.PI;
      groupRef.current.rotation.x = -p * 0.6;
      setOpacity(1);
      return;
    }

    // Near-instant vanish (1.3-1.4s) — attacker reappears in own card at 1.4s
    if (t < 1.4) {
      const p = (t - 1.3) / 0.1;
      const fade = 1 - p;
      groupRef.current.scale.setScalar(internalScale * fade);
      groupRef.current.position.set(0, -1.5 * fade, BEHIND_Z);
      setOpacity(fade);
      if (hasAura) setGhostOpacity(fade * auraOpacity);
      return;
    }

    // After vanish - invisible
    groupRef.current.scale.setScalar(0);
  });

  return (
    <group scale={normScale}>
      <group ref={groupRef} scale={0}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={cloneScene} />
          {hasAura && ghostScene && (
            <group scale={auraScale}>
              <primitive object={ghostScene} />
            </group>
          )}
        </group>
        {hasAura && (
          <pointLight color={auraColor} intensity={lightIntensity} decay={0} position={[0, 0, 0]} />
        )}
      </group>
    </group>
  );
};
