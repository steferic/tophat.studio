import { useEffect, useRef } from 'react';
import { playCubeBreakSound } from '../audio';
import { playAttackSound, playVoiceLineOrCustom, playHitSoundOrCustom, playStatusReactSound } from '../engines/synthEngine';
import type { ArenaState } from './types';

/**
 * Plays attack sounds when animating-attack begins,
 * and hit impact sounds when hit reaction starts mid-attack.
 */
export function useArenaAudio(state: ArenaState) {
  const prevPhaseRef = useRef(state.phase);
  const prevLeftHitRef = useRef(state.left.hitReaction);
  const prevRightHitRef = useRef(state.right.hitReaction);
  const prevLeftEffectsRef = useRef(state.left.statusEffects);
  const prevRightEffectsRef = useRef(state.right.statusEffects);

  // Attack started → play attack sound + voice line from descriptor
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = state.phase;
    prevPhaseRef.current = curr;

    if (prev === curr) return;

    if (curr === 'animating-attack') {
      const attacker = state[state.turn];
      const attackKey = attacker.activeAttack;
      if (attackKey) {
        const effectConfig = attacker.entry.definition.attackEffects[attackKey];
        if (effectConfig) {
          playAttackSound(effectConfig.audio);
          const attackerCardId = attacker.entry.definition.id;
          playVoiceLineOrCustom(attackerCardId, effectConfig.voiceLine);

          // Instant Transmission: replay teleport SFX on return + play Ultra Instinct theme
          if (attackKey === 'instant-transmission') {
            setTimeout(() => playAttackSound(effectConfig.audio), 1400);
            playAttackSound({ type: 'file', filePath: 'audio/sfx/ultra-instinct.mp3', volume: 0.5 });
          }
        }
      }
    }
  }, [state.phase, state.turn, state]);

  // Hit reaction started → play impact sound
  useEffect(() => {
    const defenderSide = state.turn === 'left' ? 'right' : 'left';
    const prevHit = defenderSide === 'left' ? prevLeftHitRef.current : prevRightHitRef.current;
    const currHit = state[defenderSide].hitReaction;

    prevLeftHitRef.current = state.left.hitReaction;
    prevRightHitRef.current = state.right.hitReaction;

    // Play sound when hit reaction transitions from null to a value
    if (!prevHit && currHit) {
      const defenderCardId = state[defenderSide].entry.definition.id;
      playHitSoundOrCustom(defenderCardId, currHit);
    }
  }, [state.left.hitReaction, state.right.hitReaction, state.turn]);

  // Play cube break sound when a status effect is removed,
  // and status-react sound when a new status effect is added
  useEffect(() => {
    const prevLeft = prevLeftEffectsRef.current;
    const prevRight = prevRightEffectsRef.current;

    // Check if a 'cube' status effect was removed from either side
    if (prevLeft.some((e) => e.blueprintId === 'cube') && !state.left.statusEffects.some((e) => e.blueprintId === 'cube')) {
      playCubeBreakSound();
    }
    if (prevRight.some((e) => e.blueprintId === 'cube') && !state.right.statusEffects.some((e) => e.blueprintId === 'cube')) {
      playCubeBreakSound();
    }

    // Play status-react when a new status effect is added
    if (state.left.statusEffects.length > prevLeft.length) {
      playStatusReactSound(state.left.entry.definition.id);
    }
    if (state.right.statusEffects.length > prevRight.length) {
      playStatusReactSound(state.right.entry.definition.id);
    }

    prevLeftEffectsRef.current = state.left.statusEffects;
    prevRightEffectsRef.current = state.right.statusEffects;
  }, [state.left.statusEffects, state.right.statusEffects]);
}
