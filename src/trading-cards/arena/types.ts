import type { CardData, EnergyType } from '../types';
import type { CardDefinition, AttackParticleDescriptor } from './descriptorTypes';

// ── Phase flow ──────────────────────────────────────────────
// selecting → animating-attack → resolving → turn-end → selecting
//             (hit reaction starts mid-attack)       ↘ game-over

export type BattlePhase =
  | 'selecting'
  | 'animating-attack'
  | 'resolving'
  | 'turn-end'
  | 'game-over';

export type Side = 'left' | 'right';

export type HitReaction = 'hit-light' | 'hit-heavy' | null;

// ── Card registry entry ─────────────────────────────────────

export interface BattleCardEntry {
  cardData: CardData;
  /** Keys mapping each attack index to the model's attack animation string */
  attackKeys: string[];
  /** Duration in ms for each attack animation */
  attackDurations: Record<string, number>;
  /** Identifier for which 3D model to render */
  modelId: string;
  /** Camera ID for ArtWindow persistence (shared across all views) */
  cameraId: string;
  /** Full card definition with effect descriptors */
  definition: CardDefinition;
}

// ── Status effects ──────────────────────────────────────────

export interface StatusEffect {
  type: string;
  expiresAt: number;
  preventsAttack: boolean;
  tickDamage: number;
  /** Multiplier applied to this player's attack damage while active */
  damageMultiplier?: number;
}

// ── Player state ────────────────────────────────────────────

export interface PlayerState {
  entry: BattleCardEntry;
  currentHp: number;
  maxHp: number;
  /** Currently playing attack animation key, or null */
  activeAttack: string | null;
  /** Currently playing hit reaction, or null */
  hitReaction: HitReaction;
  /** Elapsed seconds since current attack/hit started */
  animationElapsed: number;
  /** Active status effects on this player */
  statusEffects: StatusEffect[];
  /** Particle effects from an incoming attack (rendered on this player's model) */
  incomingParticles: AttackParticleDescriptor[];
}

// ── Damage event ────────────────────────────────────────────

export interface DamageEvent {
  baseDamage: number;
  finalDamage: number;
  attackerType: EnergyType;
  defenderWeakness: EnergyType;
  defenderResistance: EnergyType;
  /** Whether weakness applied */
  superEffective: boolean;
  /** Whether resistance applied */
  resisted: boolean;
}

// ── Arena state ─────────────────────────────────────────────

export interface ArenaState {
  phase: BattlePhase;
  turn: Side;
  left: PlayerState;
  right: PlayerState;
  lastDamage: DamageEvent | null;
  lastDamageTarget: Side | null;
  turnNumber: number;
  winner: Side | null;
}

// ── Arena actions ───────────────────────────────────────────

export type ArenaAction =
  | { type: 'SELECT_ATTACK'; attackIndex: number }
  | { type: 'HIT_REACTION_START' }
  | { type: 'ATTACK_ANIMATION_COMPLETE' }
  | { type: 'DAMAGE_RESOLVED' }
  | { type: 'END_TURN' }
  | { type: 'SKIP_TURN' }
  | { type: 'STATUS_EXPIRED'; side: Side; effectType: string }
  | { type: 'REMATCH' }
  | { type: 'TICK_ELAPSED'; delta: number };
