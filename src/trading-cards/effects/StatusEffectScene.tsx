import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getBlueprint } from '../arena/statusRegistry';
import type { StatusEffect } from '../arena/types';
import { CubePrison } from './CubePrison';

// ── Model Tint Sphere ────────────────────────────────────

/** Semi-transparent sphere overlay that tints the model with a pulsing color */
const TintSphere: React.FC<{
  color: string;
  opacity: number;
  radius: number;
  stacks: number;
}> = ({ color, opacity, radius, stacks }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const pulse = opacity + Math.sin(t * 2.0) * 0.03 * stacks;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.min(pulse, 0.6);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
};

// ── Status Effect Scene ──────────────────────────────────

interface StatusEffectSceneProps {
  effects: StatusEffect[];
  /** World-space bounding box size [w, h, d] for prison geometry + tint sizing */
  targetSize: [number, number, number];
  /** Ref to the model's animated group — effects track its position/rotation each frame */
  modelRef: React.MutableRefObject<THREE.Group | null>;
}

/**
 * Renders 3D visuals for all active status effects.
 * Tracks the model's animated group so effects follow during attacks/dance/evolve.
 */
export const StatusEffectScene: React.FC<StatusEffectSceneProps> = ({
  effects,
  targetSize,
  modelRef,
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  // Follow the model's animated group every frame
  useFrame(() => {
    const src = modelRef.current;
    if (!groupRef.current || !src) return;
    groupRef.current.position.copy(src.position);
    groupRef.current.rotation.copy(src.rotation);
  });

  const now = Date.now();
  const active = effects.filter((e) => e.expiresAt > now);
  const tintRadius = Math.max(targetSize[0], targetSize[1], targetSize[2]) * 0.9;

  if (active.length === 0) return null;

  return (
    <group ref={groupRef}>
      {active.map((effect) => {
        const bp = getBlueprint(effect.blueprintId);
        const v = bp.visual;

        return (
          <React.Fragment key={effect.blueprintId}>
            {v.prison && (
              <CubePrison
                active
                targetSize={targetSize}
                color={v.prison.color}
                edgeColor={v.prison.edgeColor}
                opacity={v.prison.opacity}
              />
            )}
            {v.auraColor && (
              <pointLight
                color={v.auraColor}
                intensity={Math.PI * (v.auraIntensity ?? 0.3)}
                decay={0}
                position={[0, 0, 0]}
              />
            )}
            {v.modelTint && (
              <TintSphere
                color={v.modelTint}
                opacity={v.modelTintOpacity ?? 0.12}
                radius={tintRadius}
                stacks={effect.stacks}
              />
            )}
          </React.Fragment>
        );
      })}
    </group>
  );
};
