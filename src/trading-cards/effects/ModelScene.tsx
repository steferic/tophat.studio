import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { HoloLight } from './HoloLight';
import { CubePrison } from './CubePrison';
import { LightDispatcher } from './lights/LightDispatcher';
import { ParticleDispatcher } from './particles/ParticleDispatcher';
import { useModelBounds } from './useModelBounds';
import type { CardDefinition, AttackParticleDescriptor } from '../arena/descriptorTypes';

// ── Evolved Aura: Ghost Clone + Halo Ring ────────────────

/** Transparent blue clone that tracks the model's animated group each frame */
const GhostClone: React.FC<{
  scene: THREE.Object3D;
  centerOffset: THREE.Vector3;
  sourceRef: React.MutableRefObject<THREE.Group | null>;
  scaleMultiplier: number;
}> = ({ scene, centerOffset, sourceRef, scaleMultiplier }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const ghostScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: '#3b82f6',
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
        });
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    const src = sourceRef.current;
    if (!groupRef.current || !src) return;
    const t = state.clock.getElapsedTime();

    // Copy position and rotation from the animated model
    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);

    // Scale = source scale * multiplier, with breathing pulse
    const breathe = 1 + Math.sin(t * 2.5) * 0.04;
    const s = scaleMultiplier * breathe;
    groupRef.current.scale.set(
      src.scale.x * s,
      src.scale.y * s,
      src.scale.z * s,
    );

    // Shimmer opacity
    const pulse = 0.14 + Math.sin(t * 3) * 0.06 + Math.sin(t * 7.3) * 0.03;
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = pulse;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={ghostScene} />
      </group>
    </group>
  );
};

type HitReaction = 'hit-light' | 'hit-heavy' | null;

interface ModelSceneProps {
  definition: CardDefinition;
  activeAttack: string | null;
  hitReaction?: HitReaction;
  isCubed?: boolean;
  isDancing?: boolean;
  isEvolving?: boolean;
  isEvolved?: boolean;
  debug?: boolean;
  /** Particle effects from an incoming attack */
  incomingParticles?: AttackParticleDescriptor[];
}

/**
 * Generic scene renderer: model + lights + effects.
 * Reads everything from the card definition — no per-card if/else.
 */
export const ModelScene: React.FC<ModelSceneProps> = ({
  definition,
  activeAttack,
  hitReaction = null,
  isCubed = false,
  isDancing = false,
  isEvolving = false,
  isEvolved = false,
  debug = false,
  incomingParticles = [],
}) => {
  const { model, attackEffects } = definition;
  const ModelComponent = model.ModelComponent;
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Load the GLB scene to compute bounds
  const { scene } = useGLTF(model.modelPath);
  const { boxSize, centerOffset } = useModelBounds(scene);
  const scale = model.baseScale;

  // World-space bounding box size
  const worldSize: [number, number, number] = [
    boxSize.x * scale,
    boxSize.y * scale,
    boxSize.z * scale,
  ];

  // Get the current attack's effect config
  const effectConfig = activeAttack ? attackEffects[activeAttack] : undefined;

  return (
    <>
      <ModelComponent
        activeAttack={activeAttack}
        hitReaction={hitReaction}
        isCubed={isCubed}
        isDancing={isDancing}
        isEvolving={isEvolving}
        isEvolved={isEvolved}
        debug={debug}
        animatedGroupRef={modelGroupRef}
      />
      {isEvolved && (
        <>
          <pointLight color="#3b82f6" intensity={Math.PI * 3} decay={0} position={[0, 0, 0]} />
          <GhostClone
            scene={scene}
            centerOffset={centerOffset}
            sourceRef={modelGroupRef}
            scaleMultiplier={1.25}
          />
        </>
      )}
      <HoloLight />
      <LightDispatcher
        descriptor={effectConfig?.light}
        active={activeAttack !== null}
      />
      <ParticleDispatcher
        descriptors={effectConfig?.particles}
        active={activeAttack !== null}
      />
      <ParticleDispatcher
        descriptors={incomingParticles}
        active={incomingParticles.length > 0}
      />
      <CubePrison active={isCubed} targetSize={worldSize} />
    </>
  );
};
