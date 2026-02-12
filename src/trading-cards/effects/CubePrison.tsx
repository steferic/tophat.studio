import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CubePrisonProps {
  active: boolean;
  /** World-space bounding box size of the target model [w, h, d] */
  targetSize: [number, number, number];
}

export const CubePrison: React.FC<CubePrisonProps> = ({ active, targetSize }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const edgesRef = useRef<THREE.LineBasicMaterial>(null!);
  const spawnTime = useRef(0);

  // Add some padding so the cube doesn't clip the model
  const pad = 2.3;
  const w = targetSize[0] * pad;
  const h = targetSize[1] * pad;
  const d = targetSize[2] * pad;

  useFrame((state) => {
    if (!active) {
      spawnTime.current = 0;
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    if (spawnTime.current === 0) spawnTime.current = state.clock.getElapsedTime();
    const elapsed = state.clock.getElapsedTime() - spawnTime.current;

    groupRef.current.visible = true;

    // Tumble rotation on all three axes
    groupRef.current.rotation.x = elapsed * 0.3;
    groupRef.current.rotation.y = elapsed * 0.7;
    groupRef.current.rotation.z = elapsed * 0.15;

    // Pulsing opacity — darker base
    const basePulse = 0.35 + Math.sin(elapsed * 2.5) * 0.1;

    // Late-stage shake
    const shake = Math.sin(elapsed * 18) * 0.03 * Math.max(0, elapsed - 4);
    groupRef.current.position.x = shake;
    groupRef.current.position.z = shake * 0.7;

    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity = basePulse;
    }
    if (edgesRef.current) {
      edgesRef.current.opacity = 0.7 + Math.sin(elapsed * 3) * 0.25;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Dark cube face */}
      <mesh ref={meshRef}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#020008"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Glowing purple edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial
          ref={edgesRef}
          color="#8844ff"
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
};
