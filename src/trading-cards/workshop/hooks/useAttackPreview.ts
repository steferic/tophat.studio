import { useState, useCallback, useMemo } from 'react';
import type { CardDefinition, AttackParticleDescriptor, CameraMovementDescriptor } from '../../arena/descriptorTypes';
import type { HitReaction } from '../../arena/types';
import { computeCardShake } from '../../engines/cardShakeEngine';
import { playAttackSound } from '../../engines/synthEngine';
import { useAnimationLoop } from './useAnimationLoop';
import { HIT_DURATION } from '../constants';

export interface AttackState {
  attackMode: 'give' | 'take' | null;
  activeAttackKey: string | null;
  attackElapsed: number;
}

export interface AttackViewportProps {
  activeAttack: string | null;
  hitReaction: HitReaction;
  incomingParticles: AttackParticleDescriptor[];
  attackCameraMovement: CameraMovementDescriptor | undefined;
}

export interface AttackActions {
  giveAttack: (attackKey: string) => void;
  takeAttack: (attackKey: string) => void;
  reset: () => void;
}

export function useAttackPreview(
  definition: CardDefinition,
  setShakeTransform: React.Dispatch<React.SetStateAction<string | undefined>>,
): [AttackState, AttackActions, AttackViewportProps] {
  const [attackMode, setAttackMode] = useState<'give' | 'take' | null>(null);
  const [activeAttackKey, setActiveAttackKey] = useState<string | null>(null);
  const [attackElapsed, setAttackElapsed] = useState(0);
  const anim = useAnimationLoop();

  const reset = useCallback(() => {
    anim.cancel();
    setAttackMode(null);
    setActiveAttackKey(null);
    setAttackElapsed(0);
  }, [anim]);

  const giveAttack = useCallback(
    (attackKey: string) => {
      if (activeAttackKey === attackKey && attackMode === 'give') {
        reset();
        return;
      }
      reset();

      const effects = definition.attackEffects[attackKey];
      const durationSec = (definition.attackDurations[attackKey] ?? 2000) / 1000;

      setActiveAttackKey(attackKey);
      setAttackMode('give');

      if (effects?.audio) {
        playAttackSound(effects.audio);
      }

      anim.start(
        durationSec,
        (elapsed) => {
          setAttackElapsed(elapsed);
          if (effects?.cardShake) {
            const result = computeCardShake(elapsed, effects.cardShake);
            setShakeTransform(result.transform);
          }
        },
        () => reset(),
      );
    },
    [activeAttackKey, attackMode, definition, reset, setShakeTransform, anim],
  );

  const takeAttack = useCallback(
    (attackKey: string) => {
      if (activeAttackKey === attackKey && attackMode === 'take') {
        reset();
        return;
      }
      reset();

      setActiveAttackKey(attackKey);
      setAttackMode('take');

      anim.start(
        HIT_DURATION,
        (elapsed) => setAttackElapsed(elapsed),
        () => reset(),
      );
    },
    [activeAttackKey, attackMode, reset, anim],
  );

  // Derive viewport props (memoized to avoid recreation every render)
  const viewportProps = useMemo<AttackViewportProps>(() => {
    if (!activeAttackKey || !attackMode) {
      return {
        activeAttack: null,
        hitReaction: null as HitReaction,
        incomingParticles: [],
        attackCameraMovement: undefined,
      };
    }
    const effects = definition.attackEffects[activeAttackKey];
    if (attackMode === 'give') {
      return {
        activeAttack: activeAttackKey,
        hitReaction: null as HitReaction,
        incomingParticles: [],
        attackCameraMovement: effects?.camera,
      };
    }
    return {
      activeAttack: null,
      hitReaction: 'hit-heavy' as HitReaction,
      incomingParticles: (effects?.hitParticles ?? []) as AttackParticleDescriptor[],
      attackCameraMovement: undefined,
    };
  }, [activeAttackKey, attackMode, definition]);

  return [
    { attackMode, activeAttackKey, attackElapsed },
    { giveAttack, takeAttack, reset },
    viewportProps,
  ];
}
