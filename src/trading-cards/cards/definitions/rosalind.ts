import type { CardDefinition } from '../../arena/descriptorTypes';
import { RoseModel } from '../../effects/RoseModel';

export const rosalindDefinition: CardDefinition = {
  id: 'rosalind',
  cardData: {
    name: 'Rosalind',
    stage: 'Stage 1',
    hp: 180,
    type: 'grass',
    attacks: [
      {
        name: 'Eternal Bloom',
        energyCost: ['grass', 'colorless'],
        damage: 70,
        description:
          'The rose unfurls in radiant light. Heal 30 HP and remove all Special Conditions from this Pok\u00e9mon.',
      },
      {
        name: 'Thorn Storm',
        energyCost: ['grass', 'grass', 'colorless'],
        damage: 140,
        description:
          'A whirlwind of razor petals. Does 20 damage to each of your opponent\u2019s Benched Pok\u00e9mon.',
      },
      {
        name: 'Cube',
        energyCost: ['grass', 'grass', 'grass', 'colorless'],
        damage: 0,
        description:
          'Trap the Defending Pok\u00e9mon inside a void cube for 5 seconds. They cannot attack while imprisoned.',
      },
    ],
    weakness: { type: 'fire', modifier: '+20' },
    resistance: { type: 'water', modifier: '-20' },
    retreatCost: 1,
    flavorText:
      'Its petals never wilt. Legend says it bloomed from the first ray of sunlight to touch the earth, and has been growing ever since.',
    illustrator: 'TopHat Software',
    cardNumber: '004/001 \u2605\u2605',
  },
  attackKeys: ['bloom', 'thorn-storm', 'cube'],
  attackDurations: {
    bloom: 3500,
    'thorn-storm': 2200,
    cube: 1500,
  },
  attackEffects: {
    bloom: {
      cardShake: { pattern: 'pulse', duration: 3, intensity: 1 },
      cardGlow: {
        color: [255, 150, 200],
        radius: 40,
        maxOpacity: 0.7,
        fadeProfile: 'hold-then-fade',
        layers: [
          { color: [255, 100, 180], radius: 80, maxOpacity: 0.4 },
          { color: [255, 200, 150], radius: 120, maxOpacity: 0.25 },
        ],
      },
      artGlow: {
        color: [255, 150, 200],
        radius: 50,
        maxOpacity: 0.7,
        fadeIn: 0.2,
        fadeOut: 2.8,
        layers: [
          { color: [255, 220, 180], radius: 25, maxOpacity: 0.5 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'bloom' },
      light: {
        type: 'point',
        color: [255, 180, 220],
        intensity: 3,
        position: [0, 3, 2],
        animation: 'pulse',
      },
      particles: [{ particleSystem: 'petals', mode: 'bloom' }],
    },
    'thorn-storm': {
      cardShake: { pattern: 'spin', duration: 2.2, intensity: 1 },
      cardGlow: {
        color: [200, 0, 50],
        radius: 50,
        maxOpacity: 0.8,
        fadeProfile: 'linear',
        layers: [
          { color: [150, 0, 30], radius: 100, maxOpacity: 0.5 },
          { color: [255, 50, 80], radius: 140, maxOpacity: 0.2 },
        ],
      },
      artGlow: {
        color: [200, 0, 50],
        radius: 60,
        maxOpacity: 0.8,
        fadeIn: 0.1,
        fadeOut: 1.9,
        layers: [
          { color: [255, 80, 100], radius: 30, maxOpacity: 0.5 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'thorn-storm' },
      light: {
        type: 'point',
        color: [255, 0, 50],
        intensity: 5,
        position: [0, 2, 2],
        animation: 'flicker',
      },
      particles: [{ particleSystem: 'petals', mode: 'storm' }],
    },
    cube: {
      cardShake: { pattern: 'contract', duration: 1.5, intensity: 1 },
      cardGlow: {
        color: [80, 0, 120],
        radius: 40,
        maxOpacity: 0.8,
        fadeProfile: 'hold-then-fade',
        layers: [
          { color: [30, 0, 60], radius: 80, maxOpacity: 0.5 },
          { color: [0, 0, 0], radius: 120, maxOpacity: 0.3 },
        ],
      },
      artGlow: {
        color: [80, 0, 120],
        radius: 45,
        maxOpacity: 0.8,
        fadeIn: 0.15,
        fadeOut: 1.35,
        layers: [
          { color: [0, 0, 0], radius: 25, maxOpacity: 0.6 },
        ],
      },
      audio: { type: 'file', filePath: 'audio/sfx/annihilation.mp3', volume: 0.85 },
      inflictStatus: {
        blueprintId: 'cube',
        durationMs: 5000,
      },
      skipHitAnimation: true,
    },
  },
  model: {
    modelPath: 'models/rose.glb',
    baseScale: 100,
    relativeSize: 0.5,
    ModelComponent: RoseModel,
  },
  cameraId: 'rosalind',
  evolvedEffects: {
    color: '#f472b6',
  },
};
