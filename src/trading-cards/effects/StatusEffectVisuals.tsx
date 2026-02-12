import React from 'react';
import { CubePrison } from './CubePrison';
import type { StatusEffect } from '../arena/types';

interface StatusEffectVisualsProps {
  statusEffects: StatusEffect[];
  targetSize: [number, number, number];
}

/**
 * Renders visual overlays for any active status effects.
 * Maps status effect types to their visual components.
 */
export const StatusEffectVisuals: React.FC<StatusEffectVisualsProps> = ({
  statusEffects,
  targetSize,
}) => {
  const hasCube = statusEffects.some(
    (e) => e.type === 'cube' && e.expiresAt > Date.now(),
  );

  return (
    <>
      <CubePrison active={hasCube} targetSize={targetSize} />
      {/* Future status effects (burn overlay, freeze, etc.) can be added here */}
    </>
  );
};
