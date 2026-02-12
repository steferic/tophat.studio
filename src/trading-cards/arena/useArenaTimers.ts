import { useEffect, useRef } from 'react';
import type { ArenaState, ArenaAction } from './types';

const HIT_DURATIONS = { 'hit-light': 400, 'hit-heavy': 660 } as const;
const RESOLVE_DELAY = 1200;
const TURN_END_DELAY = 800;
const CUBE_SKIP_DELAY = 1500;

/**
 * Handles all animation sequencing via rAF so the reducer stays pure.
 * Auto-dispatches phase transitions when animation durations elapse.
 */
export function useArenaTimers(
  state: ArenaState,
  dispatch: React.Dispatch<ArenaAction>,
) {
  const phaseStartRef = useRef(0);
  const lastTickRef = useRef(0);
  const dispatchedRef = useRef(false);

  // Reset tracking whenever phase changes
  useEffect(() => {
    phaseStartRef.current = performance.now();
    lastTickRef.current = performance.now();
    dispatchedRef.current = false;
  }, [state.phase]);

  useEffect(() => {
    if (
      state.phase !== 'animating-attack' &&
      state.phase !== 'animating-hit' &&
      state.phase !== 'resolving' &&
      state.phase !== 'turn-end'
    ) {
      return;
    }

    let rafId: number;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - phaseStartRef.current;
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // Tick elapsed for animation progress
      if (
        (state.phase === 'animating-attack' || state.phase === 'animating-hit') &&
        delta > 0
      ) {
        dispatch({ type: 'TICK_ELAPSED', delta });
      }

      if (dispatchedRef.current) return;

      if (state.phase === 'animating-attack') {
        const attacker = state[state.turn];
        const attackKey = attacker.activeAttack;
        if (attackKey) {
          const duration = attacker.entry.attackDurations[attackKey] ?? 1000;
          if (elapsed >= duration) {
            dispatchedRef.current = true;
            dispatch({ type: 'ATTACK_ANIMATION_COMPLETE' });
            return;
          }
        }
      }

      if (state.phase === 'animating-hit') {
        const defenderSide = state.turn === 'left' ? 'right' : 'left';
        const defender = state[defenderSide];
        const reaction = defender.hitReaction;
        if (reaction) {
          const duration = HIT_DURATIONS[reaction];
          if (elapsed >= duration) {
            dispatchedRef.current = true;
            dispatch({ type: 'HIT_ANIMATION_COMPLETE' });
            return;
          }
        }
      }

      if (state.phase === 'resolving' && elapsed >= RESOLVE_DELAY) {
        dispatchedRef.current = true;
        dispatch({ type: 'DAMAGE_RESOLVED' });
        return;
      }

      if (state.phase === 'turn-end' && elapsed >= TURN_END_DELAY) {
        dispatchedRef.current = true;
        dispatch({ type: 'END_TURN' });
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state.phase, state.turn, state, dispatch]);

  // Auto-skip if active player has a preventsAttack status, or clear expired status effects
  useEffect(() => {
    if (state.phase !== 'selecting') return;

    const activePlayer = state[state.turn];
    const blockingEffect = activePlayer.statusEffects.find(
      (e) => e.preventsAttack && e.expiresAt > Date.now(),
    );

    // Check for any expired status effects on either side and clear them
    const now = Date.now();
    for (const side of ['left', 'right'] as const) {
      for (const effect of state[side].statusEffects) {
        if (effect.expiresAt <= now) {
          dispatch({ type: 'STATUS_EXPIRED', side, effectType: effect.type });
          return;
        }
      }
    }

    if (!blockingEffect) return;

    // Player is still blocked — auto-skip after delay
    const timer = setTimeout(() => {
      dispatch({ type: 'SKIP_TURN' });
    }, CUBE_SKIP_DELAY);

    return () => clearTimeout(timer);
  }, [state.phase, state.turn, state.left.statusEffects, state.right.statusEffects, dispatch]);
}
