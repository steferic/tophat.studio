import type React from 'react';
import type { CardData } from '../types';

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

// ── Per-Attack Effect Config ────────────────────────────────

export interface AttackEffectConfig {
  cardShake: CardShakeDescriptor;
  cardGlow: GlowDescriptor;
  artGlow: ArtGlowDescriptor;
  audio: AttackAudioDescriptor;
  voiceLine?: VoiceLineDescriptor;
  light?: AttackLightDescriptor;
  particles?: AttackParticleDescriptor[];
  statusEffect?: StatusEffectDescriptor;
  skipHitAnimation?: boolean;
}

// ── Model Config ────────────────────────────────────────────

export interface ModelComponentProps {
  activeAttack: string | null;
  hitReaction: 'hit-light' | 'hit-heavy' | null;
  isCubed: boolean;
  debug: boolean;
}

export interface ModelConfig {
  modelPath: string;
  baseScale: number;
  ModelComponent: React.ComponentType<ModelComponentProps>;
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
}
