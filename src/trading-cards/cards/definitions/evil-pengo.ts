import type { CardDefinition } from '../../arena/descriptorTypes';
import { EvilPengoModel } from '../../effects/EvilPengoModel';

export const evilPengoDefinition: CardDefinition = {
  id: 'evil-pengo',
  cardData: {
    name: 'Evil Pengo',
    stage: 'Stage 2 EX',
    hp: 280,
    type: 'psychic',
    attacks: [
      {
        name: 'Shadow Slide',
        energyCost: ['psychic'],
        damage: 70,
        description:
          'Phase through the shadow realm and strike. The defending Pokémon cannot retreat next turn.',
      },
      {
        name: 'Soul Drain',
        energyCost: ['psychic', 'psychic', 'colorless'],
        damage: 120,
        description:
          "Siphon the opponent's life force. Heal 60 HP from Evil Pengo.",
      },
      {
        name: 'Multiply',
        energyCost: ['psychic', 'colorless'],
        damage: 0,
        description:
          'Summon shadow clones that amplify your dark power. All attacks deal double damage for the rest of the battle.',
      },
      {
        name: 'Void Collapse',
        energyCost: ['psychic', 'psychic', 'colorless', 'colorless'],
        damage: 220,
        description:
          'Collapse the fabric of reality around the target. Discard your hand, then draw 4 cards.',
      },
    ],
    weakness: { type: 'fighting', modifier: '+20' },
    resistance: { type: 'psychic', modifier: '-20' },
    retreatCost: 2,
    flavorText:
      "Born from Dr. Pengo's darkest experiments. Its hollow gaze freezes the soul, and its touch drains all warmth from the living.",
    illustrator: 'TopHat Software',
    cardNumber: '666/001 ★★★',
  },
  attackKeys: ['shadow-slide', 'soul-drain', 'multiply', 'void-collapse'],
  attackDurations: {
    'shadow-slide': 1000,
    'soul-drain': 2500,
    multiply: 2000,
    'void-collapse': 2000,
  },
  attackEffects: {
    'shadow-slide': {
      cardShake: { pattern: 'sway', duration: 0.8, intensity: 1.2 },
      cardGlow: {
        color: [100, 0, 180],
        radius: 35,
        maxOpacity: 0.7,
        fadeProfile: 'linear',
        layers: [
          { color: [60, 0, 120], radius: 70, maxOpacity: 0.4 },
        ],
      },
      artGlow: {
        color: [80, 0, 160],
        radius: 45,
        maxOpacity: 0.8,
        fadeIn: 0.08,
        fadeOut: 0.5,
      },
      audio: { type: 'synth', synthPreset: 'shadow-slide' },
      voiceLine: { filePath: '/audio/voiceovers/evil-pengo-shadow.mp3' },
    },
    'soul-drain': {
      cardShake: { pattern: 'pulse', duration: 2.5, intensity: 0.8 },
      cardGlow: {
        color: [120, 0, 200],
        radius: 50,
        maxOpacity: 0.7,
        fadeProfile: 'ease-out',
        layers: [
          { color: [180, 0, 255], radius: 90, maxOpacity: 0.35 },
          { color: [60, 0, 100], radius: 130, maxOpacity: 0.2 },
        ],
      },
      artGlow: {
        color: [140, 0, 220],
        radius: 60,
        maxOpacity: 0.8,
        fadeIn: 0.15,
        holdDuration: 1.0,
        fadeOut: 1.0,
        layers: [
          { color: [200, 0, 255], radius: 30, maxOpacity: 0.5 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'soul-drain' },
      voiceLine: { filePath: '/audio/voiceovers/evil-pengo-soul.mp3' },
      light: {
        type: 'point',
        color: [120, 0, 200],
        intensity: 4,
        position: [0, 6, 4],
        animation: 'pulse',
      },
    },
    multiply: {
      cardShake: { pattern: 'pulse', duration: 2.0, intensity: 1.0 },
      cardGlow: {
        color: [140, 0, 220],
        radius: 60,
        maxOpacity: 0.8,
        fadeProfile: 'ease-out',
        layers: [
          { color: [180, 0, 255], radius: 100, maxOpacity: 0.4 },
          { color: [80, 0, 140], radius: 150, maxOpacity: 0.2 },
        ],
      },
      artGlow: {
        color: [160, 0, 240],
        radius: 70,
        maxOpacity: 0.9,
        fadeIn: 0.2,
        holdDuration: 1.0,
        fadeOut: 0.8,
        layers: [
          { color: [200, 0, 255], radius: 40, maxOpacity: 0.6 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'multiply' },
      skipHitAnimation: true,
      selfStatusEffect: {
        type: 'multiply',
        durationMs: 60000,
        preventsAttack: false,
        tickDamage: 0,
        damageMultiplier: 2,
      },
    },
    'void-collapse': {
      cardShake: { pattern: 'spin', duration: 2.0, intensity: 1.5 },
      cardGlow: {
        color: [40, 0, 60],
        radius: 60,
        maxOpacity: 0.9,
        fadeProfile: 'hold-then-fade',
        layers: [
          { color: [100, 0, 180], radius: 120, maxOpacity: 0.5 },
          { color: [200, 0, 255], radius: 180, maxOpacity: 0.25 },
          { color: [0, 0, 0], radius: 250, maxOpacity: 0.15 },
        ],
      },
      artGlow: {
        color: [60, 0, 100],
        radius: 100,
        maxOpacity: 1.0,
        fadeIn: 0.1,
        holdDuration: 0.3,
        fadeOut: 1.2,
        layers: [
          { color: [150, 0, 255], radius: 50, maxOpacity: 0.8 },
          { color: [0, 0, 0], radius: 30, maxOpacity: 0.6 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'void-collapse' },
      voiceLine: { filePath: '/audio/voiceovers/evil-pengo-void.mp3' },
      light: {
        type: 'point',
        color: [80, 0, 150],
        intensity: 6,
        position: [0, 8, 6],
        animation: 'flicker',
        secondary: {
          color: [150, 0, 255],
          intensity: 3,
          position: [0, 0, 8],
          animation: 'pulse',
        },
      },
    },
  },
  model: {
    modelPath: 'models/pengoo.glb',
    baseScale: 14,
    ModelComponent: EvilPengoModel,
  },
  cameraId: 'evil-pengo',
  artBackground: 'linear-gradient(180deg, #0a0010 0%, #1a0030 40%, #0d0018 100%)',
  disableHolo: true,
};
