import type {
  ArenaState,
  ArenaAction,
  BattleCardEntry,
  PlayerState,
  DamageEvent,
  HitReaction,
} from './types';

// ── Helpers ─────────────────────────────────────────────────

function createPlayer(entry: BattleCardEntry): PlayerState {
  return {
    entry,
    currentHp: entry.cardData.hp,
    maxHp: entry.cardData.hp,
    activeAttack: null,
    hitReaction: null,
    animationElapsed: 0,
    statusEffects: [],
    incomingParticles: [],
  };
}

export function createInitialState(
  leftEntry: BattleCardEntry,
  rightEntry: BattleCardEntry,
): ArenaState {
  return {
    phase: 'selecting',
    turn: 'left',
    left: createPlayer(leftEntry),
    right: createPlayer(rightEntry),
    lastDamage: null,
    lastDamageTarget: null,
    turnNumber: 1,
    winner: null,
  };
}

const WEAKNESS_MODIFIER = 20;
const RESISTANCE_MODIFIER = 20;

export function calculateDamage(
  attackerEntry: BattleCardEntry,
  attackIndex: number,
  defenderEntry: BattleCardEntry,
): DamageEvent {
  const attack = attackerEntry.cardData.attacks[attackIndex];
  const baseDamage = attack.damage;
  const attackerType = attackerEntry.cardData.type;
  const defenderWeakness = defenderEntry.cardData.weakness.type;
  const defenderResistance = defenderEntry.cardData.resistance.type;

  const superEffective = attackerType === defenderWeakness;
  const resisted = attackerType === defenderResistance;

  let finalDamage = baseDamage;
  if (superEffective) finalDamage += WEAKNESS_MODIFIER;
  if (resisted) finalDamage -= RESISTANCE_MODIFIER;
  finalDamage = Math.max(0, finalDamage);

  return {
    baseDamage,
    finalDamage,
    attackerType,
    defenderWeakness,
    defenderResistance,
    superEffective,
    resisted,
  };
}

function hitReactionForDamage(damage: DamageEvent): HitReaction {
  return damage.finalDamage >= 120 ? 'hit-heavy' : 'hit-light';
}

// ── Reducer ─────────────────────────────────────────────────

export function arenaReducer(state: ArenaState, action: ArenaAction): ArenaState {
  switch (action.type) {
    case 'SELECT_ATTACK': {
      if (state.phase !== 'selecting') return state;

      const attacker = state[state.turn];
      const defenderSide = state.turn === 'left' ? 'right' : 'left';
      const attackKey = attacker.entry.attackKeys[action.attackIndex];
      if (!attackKey) return state;

      // Pre-compute damage so timer hook knows hit reaction
      const baseDamage = calculateDamage(
        attacker.entry,
        action.attackIndex,
        state[defenderSide].entry,
      );

      // Apply damage multiplier from attacker's active self-buffs
      const multiplyEffect = attacker.statusEffects.find(
        (e) => e.damageMultiplier && e.damageMultiplier > 1 && e.expiresAt > Date.now(),
      );
      const lastDamage = multiplyEffect?.damageMultiplier
        ? { ...baseDamage, finalDamage: Math.round(baseDamage.finalDamage * multiplyEffect.damageMultiplier) }
        : baseDamage;

      return {
        ...state,
        phase: 'animating-attack',
        [state.turn]: {
          ...attacker,
          activeAttack: attackKey,
          animationElapsed: 0,
        },
        lastDamage,
        lastDamageTarget: defenderSide,
      };
    }

    case 'HIT_REACTION_START': {
      if (state.phase !== 'animating-attack') return state;

      const defenderSide = state.turn === 'left' ? 'right' : 'left';
      const defender = state[defenderSide];
      const attacker = state[state.turn];
      const reaction = hitReactionForDamage(state.lastDamage!);

      // Read hitParticles from the attacker's attack descriptor
      const attackKey = attacker.activeAttack;
      const effectConfig = attackKey
        ? attacker.entry.definition.attackEffects[attackKey]
        : undefined;

      return {
        ...state,
        [defenderSide]: {
          ...defender,
          hitReaction: reaction,
          animationElapsed: 0,
          incomingParticles: effectConfig?.hitParticles ?? [],
        },
      };
    }

    case 'ATTACK_ANIMATION_COMPLETE': {
      if (state.phase !== 'animating-attack') return state;

      const defenderSide = state.turn === 'left' ? 'right' : 'left';
      const defender = state[defenderSide];
      const attacker = state[state.turn];

      // Check if the attack has skipHitAnimation or a status effect via descriptor
      const attackKey = attacker.activeAttack;
      const effectConfig = attackKey
        ? attacker.entry.definition.attackEffects[attackKey]
        : undefined;

      if (effectConfig?.skipHitAnimation) {
        // Build status effects if the attack applies one to defender
        const newDefenderEffects = effectConfig.statusEffect
          ? [
              ...defender.statusEffects,
              {
                type: effectConfig.statusEffect.type,
                expiresAt: Date.now() + effectConfig.statusEffect.durationMs,
                preventsAttack: effectConfig.statusEffect.preventsAttack,
                tickDamage: effectConfig.statusEffect.tickDamage,
                damageMultiplier: effectConfig.statusEffect.damageMultiplier,
              },
            ]
          : defender.statusEffects;

        // Build self status effects if the attack applies one to attacker
        const newAttackerEffects = effectConfig.selfStatusEffect
          ? [
              ...attacker.statusEffects,
              {
                type: effectConfig.selfStatusEffect.type,
                expiresAt: Date.now() + effectConfig.selfStatusEffect.durationMs,
                preventsAttack: effectConfig.selfStatusEffect.preventsAttack,
                tickDamage: effectConfig.selfStatusEffect.tickDamage,
                damageMultiplier: effectConfig.selfStatusEffect.damageMultiplier,
              },
            ]
          : attacker.statusEffects;

        return {
          ...state,
          phase: 'resolving',
          [state.turn]: {
            ...attacker,
            activeAttack: null,
            animationElapsed: 0,
            statusEffects: newAttackerEffects,
          },
          [defenderSide]: {
            ...defender,
            statusEffects: newDefenderEffects,
          },
          lastDamage: null,
          lastDamageTarget: null,
        };
      }

      // Normal attack: apply damage directly (hit reaction already started mid-attack)
      const damage = state.lastDamage!;
      const newHp = Math.max(0, defender.currentHp - damage.finalDamage);

      return {
        ...state,
        phase: 'resolving',
        [state.turn]: {
          ...attacker,
          activeAttack: null,
          animationElapsed: 0,
        },
        [defenderSide]: {
          ...defender,
          hitReaction: null,
          animationElapsed: 0,
          currentHp: newHp,
          incomingParticles: [],
        },
      };
    }

    case 'DAMAGE_RESOLVED': {
      if (state.phase !== 'resolving') return state;

      const defenderSide = state.turn === 'left' ? 'right' : 'left';
      const defender = state[defenderSide];

      if (defender.currentHp <= 0) {
        return {
          ...state,
          phase: 'game-over',
          winner: state.turn,
        };
      }

      return {
        ...state,
        phase: 'turn-end',
      };
    }

    case 'END_TURN': {
      if (state.phase !== 'turn-end') return state;

      return {
        ...state,
        phase: 'selecting',
        turn: state.turn === 'left' ? 'right' : 'left',
        turnNumber: state.turnNumber + 1,
        lastDamage: null,
        lastDamageTarget: null,
      };
    }

    case 'SKIP_TURN': {
      // Status-prevented player's turn is auto-skipped
      if (state.phase !== 'selecting') return state;
      return {
        ...state,
        phase: 'turn-end',
      };
    }

    case 'STATUS_EXPIRED': {
      const { side, effectType } = action;
      return {
        ...state,
        [side]: {
          ...state[side],
          statusEffects: state[side].statusEffects.filter(
            (e) => e.type !== effectType,
          ),
        },
      };
    }

    case 'REMATCH': {
      return createInitialState(state.left.entry, state.right.entry);
    }

    case 'TICK_ELAPSED': {
      // Update animation elapsed on animating players
      if (state.phase === 'animating-attack') {
        const attacker = state[state.turn];
        const defenderSide = state.turn === 'left' ? 'right' : 'left';
        const defender = state[defenderSide];

        const next: ArenaState = {
          ...state,
          [state.turn]: {
            ...attacker,
            animationElapsed: attacker.animationElapsed + action.delta,
          },
        };

        // Also tick defender if hit reaction is active (overlapping animations)
        if (defender.hitReaction) {
          (next as any)[defenderSide] = {
            ...defender,
            animationElapsed: defender.animationElapsed + action.delta,
          };
        }

        return next;
      }
      return state;
    }

    default:
      return state;
  }
}
