import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TeleportClone } from './TeleportClone';
import { HoloLight } from './HoloLight';
import { StatusEffectScene } from './StatusEffectScene';
import { MorphEffect, createMorphUniforms, injectMorphVertexShader, updateMorphUniforms } from './MorphEffect';
import type { MorphUniforms } from './MorphEffect';
import { AuraEffect } from './AuraEffect';
import { ShieldEffect } from './ShieldEffect';
import { LightDispatcher } from './lights/LightDispatcher';
import { ParticleDispatcher } from './particles/ParticleDispatcher';
import { useModelBounds } from './useModelBounds';
import type { CardDefinition, AttackParticleDescriptor, EvolvedEffectDescriptor } from '../arena/descriptorTypes';
import type { TeleportAttacker, StatusEffect } from '../arena/types';
import { useLoopDuration, qf } from '../workshop/loopContext';

// ── Evolved Aura: Ghost Clone + Halo Ring ────────────────

/** Transparent clone that tracks the model's animated group each frame */
const GhostClone: React.FC<{
  scene: THREE.Object3D;
  sourceRef: React.MutableRefObject<THREE.Group | null>;
  effects: EvolvedEffectDescriptor;
  activeMorphs: string[];
  morphParams: Record<string, Record<string, any>>;
}> = ({ scene, sourceRef, effects, activeMorphs, morphParams }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const auraOpacity = effects.auraOpacity ?? 0.15;
  const auraScale = effects.auraScale ?? 1.25;

  // Clone the scene, replace materials with additive ghost material,
  // and inject morph vertex shader so the aura matches base model deformation.
  const { ghostScene, morphUniformRefs } = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    // Compute bounds for morph uniforms
    const box = new THREE.Box3();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) box.expandByObject(child);
    });
    if (box.isEmpty()) box.setFromObject(clone);
    const boundsMin = box.min;
    const boundsSize = box.getSize(new THREE.Vector3());
    const boundsCenter = box.getCenter(new THREE.Vector3());

    const refs: MorphUniforms[] = [];

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;

      const uniformData = createMorphUniforms(boundsMin, boundsSize, boundsCenter);
      refs.push(uniformData);

      const mat = new THREE.MeshBasicMaterial({
        color: effects.color,
        transparent: true,
        opacity: auraOpacity,
        depthWrite: false,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
      });

      const idx = refs.length - 1;
      mat.customProgramCacheKey = () => `ghost-morph-v1-${idx}`;
      mat.onBeforeCompile = (shader) => {
        // MeshBasicMaterial doesn't define objectNormal — declare it as zero
        // and let safeNormalize fall back to push-from-center direction
        injectMorphVertexShader(shader, uniformData, { needsObjectNormalDecl: true });
      };
      mat.needsUpdate = true;

      mesh.material = mat;
    });

    return { ghostScene: clone, morphUniformRefs: refs };
  }, [scene, effects.color, auraOpacity]);

  // Compute bounds from the unparented clone (no polluted parent transforms)
  const { centerOffset } = useModelBounds(ghostScene);

  const loopDuration = useLoopDuration();

  useFrame((state) => {
    const src = sourceRef.current;
    if (!groupRef.current || !src) return;
    const t = state.clock.getElapsedTime();

    // Copy position and rotation from the animated model
    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);

    // Scale = source scale * multiplier, with breathing pulse
    const breathe = 1 + Math.sin(t * qf(2.5, loopDuration)) * 0.04;
    const s = auraScale * breathe;
    groupRef.current.scale.set(
      src.scale.x * s,
      src.scale.y * s,
      src.scale.z * s,
    );

    // Shimmer opacity (scales around the configured auraOpacity)
    const pulse = (auraOpacity - 0.01) + Math.sin(t * qf(3, loopDuration)) * 0.06 + Math.sin(t * qf(7.3, loopDuration)) * 0.03;
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = pulse;
      }
    });

    // Update morph uniforms so ghost matches base model deformation
    updateMorphUniforms(morphUniformRefs, activeMorphs, morphParams, t, loopDuration);
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
  /** Aura effects */
  activeAuras?: string[];
  auraParams?: Record<string, Record<string, any>>;
  /** Shield effects */
  activeShields?: string[];
  shieldParams?: Record<string, Record<string, any>>;
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
  activeAuras = [],
  auraParams = {},
  activeShields = [],
  shieldParams = {},
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
        {/* Custom auras */}
        {activeAuras.map((auraId) => (
          <AuraEffect
            key={auraId}
            scene={scene}
            sourceRef={modelGroupRef}
            auraId={auraId}
            auraParams={auraParams[auraId] ?? {}}
            activeMorphs={activeMorphs}
            morphParams={morphParams}
            centerOffset={centerOffset}
          />
        ))}
        {/* Custom shields */}
        {activeShields.map((id) => (
          <ShieldEffect key={id} shieldId={id} shieldParams={shieldParams[id] ?? {}} modelScale={model.baseScale} />
        ))}
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
              activeMorphs={activeMorphs}
              morphParams={morphParams}
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
