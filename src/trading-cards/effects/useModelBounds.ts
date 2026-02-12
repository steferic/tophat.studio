import { useMemo } from 'react';
import * as THREE from 'three';

export interface ModelBounds {
  /** Offset to apply to the model so its visual centroid sits at origin */
  centerOffset: THREE.Vector3;
  /** Bounding box dimensions (in model-local units, before outer scale) */
  boxSize: THREE.Vector3;
}

/**
 * Compute the mesh-only bounding box for a loaded GLB scene.
 * Ignores bones, armatures, helpers — only visible Mesh geometry.
 */
export function useModelBounds(scene: THREE.Object3D): ModelBounds {
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
      }
    });
    if (box.isEmpty()) box.setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    return { centerOffset: center.negate(), boxSize: size };
  }, [scene]);
}
