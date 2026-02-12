import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoseLightProps {
  mode: 'bloom' | 'storm' | null;
}

export const RoseLight: React.FC<RoseLightProps> = ({ mode }) => {
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.getElapsedTime();

    if (!mode) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
      return;
    }

    if (mode === 'bloom') {
      // Warm pink/golden pulsing glow
      lightRef.current.color.setHSL(0.93, 0.8, 0.6);
      lightRef.current.intensity = 3 + Math.sin(t * 3) * 1.5;
      lightRef.current.position.set(0, 3 + Math.sin(t * 1.5) * 1, 2);
    } else {
      // Aggressive red/crimson flicker
      lightRef.current.color.setHSL(0.0, 0.9, 0.5);
      lightRef.current.intensity = 5 + Math.sin(t * 20) * 3;
      lightRef.current.position.set(
        Math.sin(t * 8) * 3,
        2 + Math.sin(t * 6) * 2,
        Math.cos(t * 10) * 2,
      );
    }
  });

  return <pointLight ref={lightRef} intensity={0} distance={20} decay={2} />;
};
