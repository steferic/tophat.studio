import React from 'react';
import { useGLTF } from '@react-three/drei';
import { HoloLight } from './HoloLight';
import { CubePrison } from './CubePrison';
import { LightDispatcher } from './lights/LightDispatcher';
import { ParticleDispatcher } from './particles/ParticleDispatcher';
import { useModelBounds } from './useModelBounds';
import type { CardDefinition } from '../arena/descriptorTypes';

type HitReaction = 'hit-light' | 'hit-heavy' | null;

interface ModelSceneProps {
  definition: CardDefinition;
  activeAttack: string | null;
  hitReaction?: HitReaction;
  isCubed?: boolean;
  debug?: boolean;
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
  debug = false,
}) => {
  const { model, attackEffects } = definition;
  const ModelComponent = model.ModelComponent;

  // Load the GLB scene to compute bounds
  const { scene } = useGLTF(model.modelPath);
  const { boxSize } = useModelBounds(scene);
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
        debug={debug}
      />
      <HoloLight />
      <LightDispatcher
        descriptor={effectConfig?.light}
        active={activeAttack !== null}
      />
      <ParticleDispatcher
        descriptors={effectConfig?.particles}
        active={activeAttack !== null}
      />
      <CubePrison active={isCubed} targetSize={worldSize} />
    </>
  );
};
