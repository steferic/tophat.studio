import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireLightProps {
  active: boolean;
}

export const FireLight: React.FC<FireLightProps> = ({ active }) => {
  const mainRef = useRef<THREE.PointLight>(null!);
  const lowRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();
    if (mainRef.current) {
      const flicker = 0.6 + Math.sin(t * 25) * 0.2 + Math.sin(t * 37) * 0.15 + Math.sin(t * 53) * 0.05;
      mainRef.current.intensity = Math.PI * 5 * flicker;
      mainRef.current.color.setRGB(1, 0.25 + Math.sin(t * 18) * 0.15, 0);
      mainRef.current.position.x = Math.sin(t * 10) * 2;
      mainRef.current.position.y = 8 + Math.sin(t * 7) * 2;
    }
    if (lowRef.current) {
      const flicker2 = 0.5 + Math.sin(t * 30 + 1) * 0.25 + Math.sin(t * 45) * 0.15;
      lowRef.current.intensity = Math.PI * 3 * flicker2;
      lowRef.current.color.setRGB(1, 0.5 + Math.sin(t * 12) * 0.2, 0.05);
    }
  });

  if (!active) return null;
  return (
    <>
      <pointLight ref={mainRef} intensity={Math.PI * 5} decay={0} position={[0, 8, 6]} />
      <pointLight ref={lowRef} intensity={Math.PI * 3} decay={0} position={[0, 0, 8]} />
    </>
  );
};
