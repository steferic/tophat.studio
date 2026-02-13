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

export interface StatusEffectDescriptor {
  type: string;
  durationMs: number;
  preventsAttack: boolean;
  tickDamage: number;
  /** Multiplier applied to this player's attack damage while active */
  damageMultiplier?: number;
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
  | 'shake-focus';

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
  statusEffect?: StatusEffectDescriptor;
  /** Status effect applied to the attacker (self-buff) */
  selfStatusEffect?: StatusEffectDescriptor;
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
  baseScale: number;
  ModelComponent: React.ComponentType<ModelComponentProps>;
}

export const DEFAULT_ART_BACKGROUND =
  'linear-gradient(180deg, #b5ddf0 0%, #7ec4e2 50%, #5aafcf 100%)';

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
}
