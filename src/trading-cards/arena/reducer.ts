import type {
  ArenaState,
  ArenaAction,
  BattleCardEntry,
  PlayerState,
  DamageEvent,
  HitReaction,
  StatusEffect,
} from './types';
import type { InflictStatusDescriptor } from './descriptorTypes';
import { getBlueprint } from './statusRegistry';

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
    teleportAttacker: null,
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

// ── Status Effect Helpers ───────────────────────────────────

/** Check if an effect prevents attacking (reads from blueprint) */
export function effectPreventsAttack(e: StatusEffect): boolean {
  return getBlueprint(e.blueprintId).preventsAttack === true && e.expiresAt > Date.now();
}

/** Check if an effect is a specific type and still active */
export function hasActiveEffect(effects: StatusEffect[], blueprintId: string): boolean {
  return effects.some((e) => e.blueprintId === blueprintId && e.expiresAt > Date.now());
}

/** Get the combined outgoing damage multiplier from all active effects */
function getOutgoingDamageMultiplier(effects: StatusEffect[]): number {
  const now = Date.now();
  let multiplier = 1;
  for (const e of effects) {
    if (e.expiresAt <= now) continue;
    const bp = getBlueprint(e.blueprintId);
    if (bp.damageMultiplier) {
      multiplier *= bp.damageMultiplier;
    }
  }
  return multiplier;
}

/** Get the combined incoming damage multiplier from all active effects */
function getIncomingDamageMultiplier(effects: StatusEffect[]): number {
  const now = Date.now();
  let multiplier = 1;
  for (const e of effects) {
    if (e.expiresAt <= now) continue;
    const bp = getBlueprint(e.blueprintId);
    if (bp.incomingDamageMultiplier) {
      multiplier *= bp.incomingDamageMultiplier;
    }
  }
  return multiplier;
}

/** Apply a status effect to an effect list (handles stacking, refresh, curing) */
function applyStatus(
  effects: StatusEffect[],
  desc: InflictStatusDescriptor,
  attackKey?: string,
): StatusEffect[] {
  // Check chance
  if (desc.chance !== undefined && desc.chance < 1) {
    if (Math.random() > desc.chance) return effects;
  }

  const bp = getBlueprint(desc.blueprintId);
  const now = Date.now();
  const duration = desc.durationMs ?? bp.defaultDurationMs;

  // Check immunity
  if (bp.immuneWhile) {
    const hasImmunity = effects.some(
      (e) => bp.immuneWhile!.includes(e.blueprintId) && e.expiresAt > now,
    );
    if (hasImmunity) return effects;
  }

  // Remove effects that the new effect cures
  let result = effects;
  if (bp.curedBy) {
    // This blueprint lists what cures IT, not what it cures — skip here
  }

  // Check if already exists
  const existing = result.find((e) => e.blueprintId === desc.blueprintId && e.expiresAt > now);

  if (existing) {
    if (bp.stackable) {
      const maxStacks = bp.maxStacks ?? 99;
      if (existing.stacks >= maxStacks) {
        // At max stacks — just refresh duration
        return result.map((e) =>
          e === existing ? { ...e, expiresAt: now + duration } : e,
        );
      }
      // Add a stack and refresh duration
      return result.map((e) =>
        e === existing ? { ...e, stacks: e.stacks + 1, expiresAt: now + duration } : e,
      );
    }
    // Not stackable — refresh duration
    return result.map((e) =>
      e === existing ? { ...e, expiresAt: now + duration } : e,
    );
  }

  // New effect
  const newEffect: StatusEffect = {
    blueprintId: desc.blueprintId,
    expiresAt: now + duration,
    appliedAt: now,
    stacks: 1,
    lastTickAt: now,
    sourceAttackKey: attackKey,
    tickDamageOverride: desc.tickDamage,
  };

  return [...result, newEffect];
}

/** Remove all effects whose blueprintId is in the given list */
function cureEffects(effects: StatusEffect[], blueprintIds: string[]): StatusEffect[] {
  return effects.filter((e) => !blueprintIds.includes(e.blueprintId));
}

/** When a new effect is applied, check if it cures any existing effects (via curedBy) */
function applyCureRules(effects: StatusEffect[], newBlueprintId: string): StatusEffect[] {
  return effects.filter((e) => {
    const bp = getBlueprint(e.blueprintId);
    return !bp.curedBy?.includes(newBlueprintId);
  });
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

      // Apply outgoing damage multiplier from attacker's active effects
      const outMult = getOutgoingDamageMultiplier(attacker.statusEffects);
      // Apply incoming damage multiplier from defender's active effects
      const inMult = getIncomingDamageMultiplier(state[defenderSide].statusEffects);
      const combinedMult = outMult * inMult;

      const lastDamage = combinedMult !== 1
        ? { ...baseDamage, finalDamage: Math.round(baseDamage.finalDamage * combinedMult) }
        : baseDamage;

      const isTeleport = attackKey === 'instant-transmission';
      const teleportAttacker = isTeleport
        ? {
            modelPath: attacker.entry.definition.model.modelPath,
            side: state.turn,
            baseScale: attacker.entry.definition.model.baseScale,
            relativeSize: attacker.entry.definition.model.relativeSize ?? 1.0,
            isEvolved: action.isEvolved ?? false,
            evolvedEffects: attacker.entry.definition.evolvedEffects,
          }
        : null;

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
        teleportAttacker,
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

      const attackKey = attacker.activeAttack;
      const effectConfig = attackKey
        ? attacker.entry.definition.attackEffects[attackKey]
        : undefined;

      if (effectConfig?.skipHitAnimation) {
        // Apply status effects using the new system (inflictStatus) or legacy (statusEffect)
        let defenderEffects = defender.statusEffects;
        let attackerEffects = attacker.statusEffects;

        if (effectConfig.inflictStatus) {
          defenderEffects = applyStatus(defenderEffects, effectConfig.inflictStatus, attackKey ?? undefined);
          defenderEffects = applyCureRules(defenderEffects, effectConfig.inflictStatus.blueprintId);
        } else if (effectConfig.statusEffect) {
          // Legacy fallback
          defenderEffects = applyStatus(defenderEffects, {
            blueprintId: effectConfig.statusEffect.type,
            durationMs: effectConfig.statusEffect.durationMs,
          }, attackKey ?? undefined);
        }

        if (effectConfig.selfStatus) {
          attackerEffects = applyStatus(attackerEffects, effectConfig.selfStatus, attackKey ?? undefined);
          attackerEffects = applyCureRules(attackerEffects, effectConfig.selfStatus.blueprintId);
        } else if (effectConfig.selfStatusEffect) {
          // Legacy fallback
          attackerEffects = applyStatus(attackerEffects, {
            blueprintId: effectConfig.selfStatusEffect.type,
            durationMs: effectConfig.selfStatusEffect.durationMs,
          }, attackKey ?? undefined);
        }

        // Apply cure rules
        if (effectConfig.curesStatus) {
          defenderEffects = cureEffects(defenderEffects, effectConfig.curesStatus);
        }
        if (effectConfig.curesSelfStatus) {
          attackerEffects = cureEffects(attackerEffects, effectConfig.curesSelfStatus);
        }

        return {
          ...state,
          phase: 'resolving',
          [state.turn]: {
            ...attacker,
            activeAttack: null,
            animationElapsed: 0,
            statusEffects: attackerEffects,
          },
          [defenderSide]: {
            ...defender,
            statusEffects: defenderEffects,
          },
          lastDamage: null,
          lastDamageTarget: null,
          teleportAttacker: null,
        };
      }

      // Normal attack: apply damage + any status effects
      const damage = state.lastDamage!;
      const newHp = Math.max(0, defender.currentHp - damage.finalDamage);

      let defenderEffects = defender.statusEffects;
      let attackerEffects = attacker.statusEffects;

      // Apply status effects even on normal attacks
      if (effectConfig?.inflictStatus) {
        defenderEffects = applyStatus(defenderEffects, effectConfig.inflictStatus, attackKey ?? undefined);
        defenderEffects = applyCureRules(defenderEffects, effectConfig.inflictStatus.blueprintId);
      }
      if (effectConfig?.selfStatus) {
        attackerEffects = applyStatus(attackerEffects, effectConfig.selfStatus, attackKey ?? undefined);
        attackerEffects = applyCureRules(attackerEffects, effectConfig.selfStatus.blueprintId);
      }
      if (effectConfig?.curesStatus) {
        defenderEffects = cureEffects(defenderEffects, effectConfig.curesStatus);
      }
      if (effectConfig?.curesSelfStatus) {
        attackerEffects = cureEffects(attackerEffects, effectConfig.curesSelfStatus);
      }

      // Check if the attacker's energy type cures any defender effects
      const attackerType = attacker.entry.cardData.type;
      defenderEffects = defenderEffects.filter((e) => {
        const bp = getBlueprint(e.blueprintId);
        return !bp.curedByTypes?.includes(attackerType);
      });

      return {
        ...state,
        phase: 'resolving',
        [state.turn]: {
          ...attacker,
          activeAttack: null,
          animationElapsed: 0,
          statusEffects: attackerEffects,
        },
        [defenderSide]: {
          ...defender,
          hitReaction: null,
          animationElapsed: 0,
          currentHp: newHp,
          incomingParticles: [],
          statusEffects: defenderEffects,
        },
        teleportAttacker: null,
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
      const { side, blueprintId } = action;
      return {
        ...state,
        [side]: {
          ...state[side],
          statusEffects: state[side].statusEffects.filter(
            (e) => e.blueprintId !== blueprintId,
          ),
        },
      };
    }

    case 'STATUS_TICK_DAMAGE': {
      const { side, blueprintId, damage: tickDmg } = action;
      const player = state[side];
      const newHp = Math.max(0, player.currentHp - tickDmg);

      // Update lastTickAt
      const updatedEffects = player.statusEffects.map((e) =>
        e.blueprintId === blueprintId ? { ...e, lastTickAt: Date.now() } : e,
      );

      const next: ArenaState = {
        ...state,
        [side]: {
          ...player,
          currentHp: newHp,
          statusEffects: updatedEffects,
        },
      };

      if (newHp <= 0) {
        return { ...next, phase: 'game-over', winner: side === 'left' ? 'right' : 'left' };
      }
      return next;
    }

    case 'STATUS_TICK_HEAL': {
      const { side, amount } = action;
      const player = state[side];
      const newHp = Math.min(player.maxHp, player.currentHp + amount);
      return {
        ...state,
        [side]: { ...player, currentHp: newHp },
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
