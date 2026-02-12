import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AttackLightDescriptor } from '../../arena/descriptorTypes';

interface LightDispatcherProps {
  descriptor: AttackLightDescriptor | undefined;
  active: boolean;
}

const AnimatedLight: React.FC<{
  color: [number, number, number];
  intensity: number;
  position: [number, number, number];
  animation: string;
}> = ({ color, intensity, position, animation }) => {
  const ref = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();

    if (animation === 'flicker') {
      const flicker = 0.6 + Math.sin(t * 25) * 0.2 + Math.sin(t * 37) * 0.15 + Math.sin(t * 53) * 0.05;
      ref.current.intensity = Math.PI * intensity * flicker;
      ref.current.color.setRGB(
        color[0] / 255 + Math.sin(t * 18) * 0.15,
        color[1] / 255 + Math.sin(t * 12) * 0.1,
        color[2] / 255,
      );
      ref.current.position.x = position[0] + Math.sin(t * 10) * 2;
      ref.current.position.y = position[1] + Math.sin(t * 7) * 2;
    } else if (animation === 'pulse') {
      ref.current.intensity = intensity + Math.sin(t * 3) * (intensity * 0.5);
      ref.current.position.set(
        position[0],
        position[1] + Math.sin(t * 1.5) * 1,
        position[2],
      );
    }
    // 'static' — no animation needed
  });

  return (
    <pointLight
      ref={ref}
      intensity={Math.PI * intensity}
      decay={0}
      position={position}
    />
  );
};

export const LightDispatcher: React.FC<LightDispatcherProps> = ({ descriptor, active }) => {
  if (!active || !descriptor) return null;

  return (
    <>
      <AnimatedLight
        color={descriptor.color}
        intensity={descriptor.intensity}
        position={descriptor.position}
        animation={descriptor.animation}
      />
      {descriptor.secondary && (
        <AnimatedLight
          color={descriptor.secondary.color}
          intensity={descriptor.secondary.intensity}
          position={descriptor.secondary.position}
          animation={descriptor.secondary.animation}
        />
      )}
    </>
  );
};
