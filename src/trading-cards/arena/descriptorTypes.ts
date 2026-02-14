import type React from 'react';
import type * as THREE from 'three';
import type { CardData } from '../types';
import type { CardTheme } from '../styles/cardTheme';
import type { DeepPartial } from '../styles/typePresets';

// ── Card Shake ─────────────────────────────────────────────

export type ShakePattern = 'sway' | 'slam' | 'spin' | 'pulse' | 'contract';

export interface CardShakeDescriptor {
  pattern: ShakePattern;
  /** Total animation duration in seconds */
  duration: number;
  /** Base intensity multiplier (default 1) */
  intensity?: number;
}

// ── Glow ────────────────────────────────────────────────────

export type FadeProfile = 'linear' | 'ease-out' | 'hold-then-fade';

export interface GlowDescriptor {
  color: [number, number, number];
  /** Base glow radius in px */
  radius: number;
  maxOpacity: number;
  fadeProfile: FadeProfile;
  /** Optional secondary color layers */
  layers?: Array<{
    color: [number, number, number];
    radius: number;
    maxOpacity: number;
  }>;
}

// ── Audio ───────────────────────────────────────────────────

export type AttackAudioDescriptor =
  | { type: 'file'; filePath: string; volume?: number }
  | { type: 'synth'; synthPreset: string };

export interface VoiceLineDescriptor {
  filePath: string;
  volume?: number;
}

// ── Status Effects ──────────────────────────────────────────

/** @deprecated Use InflictStatusDescriptor + statusRegistry instead */
export interface StatusEffectDescriptor {
  type: string;
  durationMs: number;
  preventsAttack: boolean;
  tickDamage: number;
  damageMultiplier?: number;
}

/** Describes a status effect to inflict via an attack */
export interface InflictStatusDescriptor {
  /** Blueprint ID from statusRegistry (e.g. 'burned', 'poisoned') */
  blueprintId: string;
  /** Override blueprint's default duration */
  durationMs?: number;
  /** Override blueprint's default tick damage */
  tickDamage?: number;
  /** Probability [0-1] the effect is applied (default 1.0 = always) */
  chance?: number;
}

// ── Lights ──────────────────────────────────────────────────

export type LightAnimationType = 'flicker' | 'pulse' | 'static';

export interface AttackLightDescriptor {
  type: 'point' | 'spot';
  color: [number, number, number];
  intensity: number;
  position: [number, number, number];
  animation: LightAnimationType;
  /** Optional second light */
  secondary?: {
    color: [number, number, number];
    intensity: number;
    position: [number, number, number];
    animation: LightAnimationType;
  };
}

// ── Particles ───────────────────────────────────────────────

export type ParticleSystemType = 'fire' | 'petals' | 'none';

export interface AttackParticleDescriptor {
  particleSystem: ParticleSystemType;
  mode: string;
}

// ── Art Window Glow ─────────────────────────────────────────

export interface ArtGlowDescriptor {
  color: [number, number, number];
  radius: number;
  maxOpacity: number;
  /** Fade-in time in seconds */
  fadeIn: number;
  /** Optional hold duration before fade-out */
  holdDuration?: number;
  /** Fade-out time in seconds */
  fadeOut: number;
  layers?: Array<{
    color: [number, number, number];
    radius: number;
    maxOpacity: number;
  }>;
}

// ── Camera Movement ────────────────────────────────────────

export type CameraPreset =
  | 'close-up'
  | 'orbit-360'
  | 'zoom-punch'
  | 'dramatic-low'
  | 'pull-back'
  | 'shake-focus'
  | 'face-to-face'
  | 'barrel-roll';

export interface CameraMovementDescriptor {
  preset: CameraPreset;
  /** Override default duration in seconds (defaults per preset) */
  duration?: number;
  /** Scale movement intensity, default 1 */
  intensity?: number;
}

// ── Per-Attack Effect Config ────────────────────────────────

export interface AttackEffectConfig {
  cardShake: CardShakeDescriptor;
  cardGlow: GlowDescriptor;
  artGlow: ArtGlowDescriptor;
  audio: AttackAudioDescriptor;
  voiceLine?: VoiceLineDescriptor;
  light?: AttackLightDescriptor;
  particles?: AttackParticleDescriptor[];
  /** Particles that appear on the defender's model when hit */
  hitParticles?: AttackParticleDescriptor[];
  /** @deprecated Use inflictStatus instead */
  statusEffect?: StatusEffectDescriptor;
  /** @deprecated Use selfStatus instead */
  selfStatusEffect?: StatusEffectDescriptor;
  /** Status effect to inflict on the defender */
  inflictStatus?: InflictStatusDescriptor;
  /** Status effect to apply to the attacker (self-buff) */
  selfStatus?: InflictStatusDescriptor;
  /** Blueprint IDs to cure/remove from the defender */
  curesStatus?: string[];
  /** Blueprint IDs to cure/remove from self */
  curesSelfStatus?: string[];
  skipHitAnimation?: boolean;
  camera?: CameraMovementDescriptor;
}

// ── Model Config ────────────────────────────────────────────

export interface DanceSongDescriptor {
  filePath: string;
  volume?: number;
}

export interface ModelComponentProps {
  activeAttack: string | null;
  hitReaction: 'hit-light' | 'hit-heavy' | null;
  isCubed: boolean;
  isDancing: boolean;
  isEvolving: boolean;
  isEvolved: boolean;
  debug: boolean;
  /** Ref exposed so external effects (ghost clone) can track the animated group */
  animatedGroupRef?: React.MutableRefObject<THREE.Group | null>;
}

export interface ModelConfig {
  modelPath: string;
  /** Internal base scale used by the model component's animation math.
   *  This is NOT the visual size — normalization handles that. */
  baseScale: number;
  /** Relative size after normalization. 1.0 = standard, 0.5 = half size.
   *  All models at relativeSize 1.0 appear the same visual size. */
  relativeSize?: number;
  ModelComponent: React.ComponentType<ModelComponentProps>;
}

export const DEFAULT_ART_BACKGROUND =
  'linear-gradient(180deg, #b5ddf0 0%, #7ec4e2 50%, #5aafcf 100%)';

// ── Evolved Effects ─────────────────────────────────────────

export interface EvolvedEffectDescriptor {
  /** Color for ghost aura and point light (hex string, e.g. '#3b82f6') */
  color: string;
  /** Ghost aura base opacity (default 0.15) */
  auraOpacity?: number;
  /** Ghost aura scale relative to model (default 1.25) */
  auraScale?: number;
  /** Point light intensity (default Math.PI * 3) */
  lightIntensity?: number;
}

// ── Items ───────────────────────────────────────────────────

export type ItemMovementPattern = 'orbit' | 'hover' | 'follow';

export interface ItemDescriptor {
  id: string;
  name: string;
  modelPath: string;
  scale: number;
  defaultMovement: ItemMovementPattern;
}

export interface ActiveItem {
  itemId: string;
  movement: ItemMovementPattern;
}

// ── Card Definition ─────────────────────────────────────────

export interface CardDefinition {
  id: string;
  cardData: CardData;
  attackKeys: string[];
  attackDurations: Record<string, number>;
  attackEffects: Record<string, AttackEffectConfig>;
  model: ModelConfig;
  cameraId: string;
  /** CSS background for the art window (defaults to blue sky) */
  artBackground?: string;
  /** Disable holographic shimmer overlays on this card */
  disableHolo?: boolean;
  /** Theme overrides (highest-priority merge layer) */
  themeOverride?: DeepPartial<CardTheme>;
  /** Song that plays when the card dances */
  danceSong?: DanceSongDescriptor;
  /** Visual effects when evolved (ghost aura + light). If absent, no aura on evolve. */
  evolvedEffects?: EvolvedEffectDescriptor;
}
