import { useEffect, useRef } from 'react';
import { playHitLightSound, playHitHeavySound, playCubeBreakSound } from '../audio';
import { playAttackSound, playVoiceLineFromDescriptor } from '../engines/synthEngine';
import type { ArenaState } from './types';

/**
 * Plays attack sounds when animating-attack begins,
 * and hit impact sounds when animating-hit begins.
 */
export function useArenaAudio(state: ArenaState) {
  const prevPhaseRef = useRef(state.phase);
  const prevLeftEffectsRef = useRef(state.left.statusEffects);
  const prevRightEffectsRef = useRef(state.right.statusEffects);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = state.phase;
    prevPhaseRef.current = curr;

    if (prev === curr) return;

    // Attack started → play attack sound + voice line from descriptor
    if (curr === 'animating-attack') {
      const attacker = state[state.turn];
      const attackKey = attacker.activeAttack;
      if (attackKey) {
        const effectConfig = attacker.entry.definition.attackEffects[attackKey];
        if (effectConfig) {
          playAttackSound(effectConfig.audio);
          playVoiceLineFromDescriptor(effectConfig.voiceLine);
        }
      }
    }

    // Hit started → play impact sound
    if (curr === 'animating-hit') {
      const defenderSide = state.turn === 'left' ? 'right' : 'left';
      const defender = state[defenderSide];
      if (defender.hitReaction === 'hit-heavy') {
        playHitHeavySound();
      } else {
        playHitLightSound();
      }
    }
  }, [state.phase, state.turn, state]);

  // Play cube break sound when a status effect is removed
  useEffect(() => {
    const prevLeft = prevLeftEffectsRef.current;
    const prevRight = prevRightEffectsRef.current;

    // Check if a 'cube' status effect was removed from either side
    if (prevLeft.some((e) => e.type === 'cube') && !state.left.statusEffects.some((e) => e.type === 'cube')) {
      playCubeBreakSound();
    }
    if (prevRight.some((e) => e.type === 'cube') && !state.right.statusEffects.some((e) => e.type === 'cube')) {
      playCubeBreakSound();
    }

    prevLeftEffectsRef.current = state.left.statusEffects;
    prevRightEffectsRef.current = state.right.statusEffects;
  }, [state.left.statusEffects, state.right.statusEffects]);
}
