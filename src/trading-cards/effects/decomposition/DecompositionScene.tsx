import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ShatterEffect } from './ShatterEffect';
import { DissolveEffect } from './DissolveEffect';
import { SliceEffect } from './SliceEffect';

const NORM_UNIT = 6.25;

export type DecompositionType = 'shatter' | 'dissolve' | 'slice';

interface RawBounds {
  boxSize: THREE.Vector3;
  centerOffset: THREE.Vector3;
}

/**
 * Compute bounding box using only transforms internal to the scene,
 * ignoring any external parent chain (e.g. ModelScene's normalization wrapper).
 * Returns both box size and center offset (same as useModelBounds but parent-safe).
 */
function getRawBounds(scene: THREE.Object3D): RawBounds {
  const totalBox = new THREE.Box3();
  const localMatrix = new THREE.Matrix4();

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo) return;

    geo.computeBoundingBox();
    if (!geo.boundingBox) return;

    // Build transform chain from mesh up to scene root (excluding external parents)
    localMatrix.identity();
    let node: THREE.Object3D = mesh;
    while (node !== scene) {
      node.updateMatrix();
      localMatrix.premultiply(node.matrix);
      if (!node.parent) break;
      node = node.parent;
    }

    const meshBox = geo.boundingBox.clone().applyMatrix4(localMatrix);
    totalBox.union(meshBox);
  });

  if (totalBox.isEmpty()) {
    return { boxSize: new THREE.Vector3(1, 1, 1), centerOffset: new THREE.Vector3() };
  }
  const center = totalBox.getCenter(new THREE.Vector3());
  return {
    boxSize: totalBox.getSize(new THREE.Vector3()),
    centerOffset: center.negate(),
  };
}

interface DecompositionSceneProps {
  modelPath: string;
  baseScale: number;
  relativeSize: number;
  effectType: DecompositionType;
  progress: number;
}

export const DecompositionScene: React.FC<DecompositionSceneProps> = ({
  modelPath,
  baseScale,
  relativeSize,
  effectType,
  progress,
}) => {
  const { scene } = useGLTF(modelPath);

  // Compute raw model bounds ignoring any external parent transforms
  // (the shared useGLTF scene is parented inside ModelScene's normalization
  // wrapper, so useModelBounds would give polluted results).
  const { boxSize, centerOffset } = useMemo(() => getRawBounds(scene), [scene]);

  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
  const normWrapperScale = (NORM_UNIT / maxDim * relativeSize) / baseScale;
  const modelScale = baseScale * normWrapperScale;

  return (
    <group>
      {effectType === 'shatter' && (
        <ShatterEffect scene={scene} progress={progress} modelScale={modelScale} centerOffset={centerOffset} />
      )}
      {effectType === 'dissolve' && (
        <DissolveEffect scene={scene} progress={progress} modelScale={modelScale} centerOffset={centerOffset} />
      )}
      {effectType === 'slice' && (
        <SliceEffect scene={scene} progress={progress} modelScale={modelScale} centerOffset={centerOffset} />
      )}
    </group>
  );
};
