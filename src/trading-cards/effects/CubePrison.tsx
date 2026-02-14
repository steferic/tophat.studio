import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CubePrisonProps {
  active: boolean;
  /** World-space bounding box size of the target model [w, h, d] */
  targetSize: [number, number, number];
  color?: string;
  edgeColor?: string;
  opacity?: number;
}

export const CubePrison: React.FC<CubePrisonProps> = ({
  active,
  targetSize,
  color = '#020008',
  edgeColor = '#8844ff',
  opacity = 0.35,
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const edgesRef = useRef<THREE.LineBasicMaterial>(null!);
  const spawnTime = useRef(0);

  // Use the largest dimension so the prison is always a perfect cube
  const pad = 2.3;
  const side = Math.max(targetSize[0], targetSize[1], targetSize[2]) * pad;

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
    const basePulse = opacity + Math.sin(elapsed * 2.5) * 0.1;

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
        <boxGeometry args={[side, side, side]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Glowing purple edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(side, side, side)]} />
        <lineBasicMaterial
          ref={edgesRef}
          color={edgeColor}
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
};
