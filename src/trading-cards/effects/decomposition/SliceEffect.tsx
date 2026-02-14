import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SliceEffectProps {
  scene: THREE.Object3D;
  progress: number;
  modelScale: number;
  centerOffset: THREE.Vector3;
}

export const SliceEffect: React.FC<SliceEffectProps> = ({ scene, progress, modelScale, centerOffset }) => {
  const topRef = useRef<THREE.Group>(null);
  const bottomRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const gl = useThree((s) => s.gl);

  // Enable local clipping
  useEffect(() => {
    gl.localClippingEnabled = true;
    return () => { gl.localClippingEnabled = false; };
  }, [gl]);

  // Compute scene bounding box for cut plane range
  const bounds = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) box.expandByObject(child);
    });
    if (box.isEmpty()) box.setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { minY: box.min.y, maxY: box.max.y, height: size.y, center };
  }, [scene]);

  // Clipping planes
  const { topPlane, bottomPlane } = useMemo(() => ({
    topPlane: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),    // clips below
    bottomPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),  // clips above
  }), []);

  // Clone scenes and apply clipping materials
  const { topScene, bottomScene } = useMemo(() => {
    const makeClipped = (plane: THREE.Plane) => {
      const clone = scene.clone(true);
      clone.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const origMat = mesh.material as THREE.MeshStandardMaterial;
        const newMat = origMat.clone();
        newMat.clippingPlanes = [plane];
        newMat.clipShadows = true;
        newMat.side = THREE.DoubleSide;
        mesh.material = newMat;
      });
      return clone;
    };
    return {
      topScene: makeClipped(topPlane),
      bottomScene: makeClipped(bottomPlane),
    };
  }, [scene, topPlane, bottomPlane]);

  useFrame(() => {
    // Phase 1 (0-0.4): Sweep cut plane from top to bottom
    // Phase 2 (0.4-1.0): Halves drift apart
    const sweepEnd = 0.4;
    const sweepProgress = Math.min(progress / sweepEnd, 1.0);

    // Cut plane Y position: sweeps from top to mid
    const cutY = THREE.MathUtils.lerp(bounds.maxY + 0.1, bounds.center.y, sweepProgress);

    // Update clipping planes
    topPlane.constant = cutY;       // clips below cutY → keeps top
    bottomPlane.constant = -cutY;   // clips above cutY → keeps bottom

    // Phase 2: drift apart
    const driftProgress = progress > sweepEnd
      ? (progress - sweepEnd) / (1.0 - sweepEnd)
      : 0;

    const driftAmount = driftProgress * bounds.height * 0.8;
    const tiltAngle = driftProgress * 0.15;

    if (topRef.current) {
      topRef.current.position.y = driftAmount * 0.5;
      topRef.current.rotation.z = tiltAngle;
      topRef.current.rotation.x = -tiltAngle * 0.3;
    }
    if (bottomRef.current) {
      bottomRef.current.position.y = -driftAmount * 0.5;
      bottomRef.current.rotation.z = -tiltAngle;
      bottomRef.current.rotation.x = tiltAngle * 0.3;
    }

    // Energy glow at cut plane
    if (glowRef.current) {
      glowRef.current.position.y = cutY;
      // Peak glow during sweep, fade during drift
      const glowAlpha = progress < sweepEnd
        ? sweepProgress * 0.8
        : Math.max(0, 0.8 - driftProgress * 1.2);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowAlpha;
      glowRef.current.visible = glowAlpha > 0.01;
    }
  });

  const glowSize = Math.max(bounds.height, 4);

  return (
    <group scale={modelScale}>
      <group ref={topRef}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={topScene} />
        </group>
      </group>
      <group ref={bottomRef}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={bottomScene} />
        </group>
      </group>
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[glowSize * 1.5, glowSize * 1.5]} />
        <meshBasicMaterial
          color="#44ccff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
