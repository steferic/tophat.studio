import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HoloLight: React.FC = () => {
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const r = Math.sin(t * 0.7) * 0.5 + 0.5;
    const g = Math.sin(t * 0.7 + 2.1) * 0.5 + 0.5;
    const b = Math.sin(t * 0.7 + 4.2) * 0.5 + 0.5;
    lightRef.current.color.setRGB(r, g, b);
    lightRef.current.position.x = Math.sin(t * 0.5) * 8;
    lightRef.current.position.y = Math.cos(t * 0.3) * 4 + 10;
  });

  return <pointLight ref={lightRef} intensity={Math.PI * 1.5} decay={0} position={[0, 10, 8]} />;
};
