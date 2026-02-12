import React from 'react';
import { FireEffect } from '../FireEffect';
import { PetalEffect } from '../PetalEffect';
import type { AttackParticleDescriptor } from '../../arena/descriptorTypes';

interface ParticleDispatcherProps {
  descriptors: AttackParticleDescriptor[] | undefined;
  active: boolean;
}

export const ParticleDispatcher: React.FC<ParticleDispatcherProps> = ({ descriptors, active }) => {
  if (!active || !descriptors) return null;

  return (
    <>
      {descriptors.map((desc, i) => {
        if (desc.particleSystem === 'fire') {
          return <FireEffect key={`fire-${i}`} active />;
        }
        if (desc.particleSystem === 'petals') {
          return (
            <PetalEffect
              key={`petals-${desc.mode}-${i}`}
              active
              mode={desc.mode as 'bloom' | 'storm'}
            />
          );
        }
        return null;
      })}
    </>
  );
};
