import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TeleportClone } from './TeleportClone';
import { HoloLight } from './HoloLight';
import { StatusEffectScene } from './StatusEffectScene';
import { MorphEffect } from './MorphEffect';
import { LightDispatcher } from './lights/LightDispatcher';
import { ParticleDispatcher } from './particles/ParticleDispatcher';
import { useModelBounds } from './useModelBounds';
import type { CardDefinition, AttackParticleDescriptor, EvolvedEffectDescriptor } from '../arena/descriptorTypes';
import type { TeleportAttacker, StatusEffect } from '../arena/types';

// ── Evolved Aura: Ghost Clone + Halo Ring ────────────────

/** Transparent clone that tracks the model's animated group each frame */
const GhostClone: React.FC<{
  scene: THREE.Object3D;
  sourceRef: React.MutableRefObject<THREE.Group | null>;
  effects: EvolvedEffectDescriptor;
}> = ({ scene, sourceRef, effects }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const auraOpacity = effects.auraOpacity ?? 0.15;
  const auraScale = effects.auraScale ?? 1.25;

  // Clone the scene so we compute bounds on an unparented copy.
  // The shared `scene` from useGLTF is parented to the model's scaled group,
  // which pollutes matrixWorld and skews the bounding box center.
  const ghostScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: effects.color,
          transparent: true,
          opacity: auraOpacity,
          depthWrite: false,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
        });
      }
    });
    return clone;
  }, [scene, effects.color, auraOpacity]);

  // Compute bounds from the unparented clone (no polluted parent transforms)
  const { centerOffset } = useModelBounds(ghostScene);

  useFrame((state) => {
    const src = sourceRef.current;
    if (!groupRef.current || !src) return;
    const t = state.clock.getElapsedTime();

    // Copy position and rotation from the animated model
    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);

    // Scale = source scale * multiplier, with breathing pulse
    const breathe = 1 + Math.sin(t * 2.5) * 0.04;
    const s = auraScale * breathe;
    groupRef.current.scale.set(
      src.scale.x * s,
      src.scale.y * s,
      src.scale.z * s,
    );

    // Shimmer opacity (scales around the configured auraOpacity)
    const pulse = (auraOpacity - 0.01) + Math.sin(t * 3) * 0.06 + Math.sin(t * 7.3) * 0.03;
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
  /** Active status effects on this player (drives visual overlays + isCubed) */
  statusEffects?: StatusEffect[];
  isCubed?: boolean;
  isDancing?: boolean;
  isEvolving?: boolean;
  isEvolved?: boolean;
  debug?: boolean;
  /** Particle effects from an incoming attack */
  incomingParticles?: AttackParticleDescriptor[];
  teleportAttacker?: TeleportAttacker | null;
  teleportElapsed?: number;
  side?: 'left' | 'right';
  /** Morph effects */
  activeMorphs?: string[];
  morphParams?: Record<string, Record<string, any>>;
}

/**
 * Generic scene renderer: model + lights + effects.
 * Reads everything from the card definition — no per-card if/else.
 */
export const ModelScene: React.FC<ModelSceneProps> = ({
  definition,
  activeAttack,
  hitReaction = null,
  statusEffects = [],
  isCubed = false,
  isDancing = false,
  isEvolving = false,
  isEvolved = false,
  debug = false,
  incomingParticles = [],
  teleportAttacker = null,
  teleportElapsed = 0,
  side,
  activeMorphs = [],
  morphParams = {},
}) => {
  const { model, attackEffects } = definition;
  const ModelComponent = model.ModelComponent;
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Load the GLB scene to compute bounds
  const { scene } = useGLTF(model.modelPath);
  const { boxSize, centerOffset } = useModelBounds(scene);
  const hasMorphs = activeMorphs.length > 0;

  // ── Model normalization ───────────────────────────────────
  // All models are normalized to the same visual size (NORM_UNIT),
  // then relativeSize adjusts proportions between them.
  // NORM_UNIT = 6.25 (calibrated from pengoo.glb at baseScale 14).
  const NORM_UNIT = 6.25;
  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
  const relativeSize = model.relativeSize ?? 1.0;
  const normWrapperScale = (NORM_UNIT / maxDim * relativeSize) / model.baseScale;

  // World-space bounding box size (uses effective visual scale)
  const effectiveScale = model.baseScale * normWrapperScale;
  const worldSize: [number, number, number] = [
    boxSize.x * effectiveScale,
    boxSize.y * effectiveScale,
    boxSize.z * effectiveScale,
  ];

  // Get the current attack's effect config
  const effectConfig = activeAttack ? attackEffects[activeAttack] : undefined;

  return (
    <>
      {/* Normalization wrapper — model component animates at its internal baseScale,
          this group corrects the final visual size so all models are normalized. */}
      <group scale={normWrapperScale}>
        {/* Original model — hidden when morphs active, but useFrame still runs */}
        <group visible={!hasMorphs}>
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
        </group>
        {/* Morphed clone — tracks source transforms */}
        {hasMorphs && (
          <MorphEffect
            scene={scene}
            sourceRef={modelGroupRef}
            activeMorphs={activeMorphs}
            morphParams={morphParams}
            centerOffset={centerOffset}
          />
        )}
        {isEvolved && definition.evolvedEffects && (
          <>
            <pointLight
              color={definition.evolvedEffects.color}
              intensity={definition.evolvedEffects.lightIntensity ?? Math.PI * 3}
              decay={0}
              position={[0, 0, 0]}
            />
            <GhostClone
              scene={scene}
              sourceRef={modelGroupRef}
              effects={definition.evolvedEffects}
            />
          </>
        )}
      </group>
      {teleportAttacker && side && teleportAttacker.side !== side && (
        <TeleportClone
          modelPath={teleportAttacker.modelPath}
          attackElapsed={teleportElapsed}
          baseScale={teleportAttacker.baseScale}
          relativeSize={teleportAttacker.relativeSize}
          isEvolved={teleportAttacker.isEvolved}
          evolvedEffects={teleportAttacker.evolvedEffects}
        />
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
      <StatusEffectScene effects={statusEffects} targetSize={worldSize} modelRef={modelGroupRef} />
    </>
  );
};
