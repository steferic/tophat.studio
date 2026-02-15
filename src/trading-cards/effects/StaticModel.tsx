import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';
import type { ModelComponentProps } from '../arena/descriptorTypes';

/**
 * Factory that creates a ModelComponent from a raw GLB path.
 * The returned component loads the GLB, clones it, and renders at baseScale.
 * It applies centerOffset so the model's visual center sits at the origin
 * (matching the pattern used by card ModelComponents like PengoModel).
 * It forwards animatedGroupRef but ignores attack/dance/evolve props (static model).
 */
export function createStaticModel(
  modelPath: string,
  baseScale: number,
): React.FC<ModelComponentProps> {
  const StaticModel: React.FC<ModelComponentProps> = ({ animatedGroupRef }) => {
    const { scene } = useGLTF(modelPath);
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const { centerOffset } = useModelBounds(scene);
    const internalRef = useRef<THREE.Group>(null);

    const groupRef = animatedGroupRef ?? internalRef;

    return (
      <group ref={groupRef} scale={baseScale}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={clonedScene} />
        </group>
      </group>
    );
  };

  StaticModel.displayName = `StaticModel(${modelPath})`;
  return StaticModel;
}
