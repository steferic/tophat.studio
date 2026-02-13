import type { CardDefinition } from '../../arena/descriptorTypes';
import { PengoModel } from '../../effects/PengoModel';

export const pengoDefinition: CardDefinition = {
  id: 'pengo',
  cardData: {
    name: 'Dr. Pengo',
    stage: 'Stage 2 EX',
    hp: 300,
    type: 'water',
    attacks: [
      {
        name: 'Aura Farm',
        energyCost: ['water'],
        damage: 60,
        description: 'Harvest ambient energy. Heal 20 HP from all benched Pok\u00e9mon.',
      },
      {
        name: 'Diagnose Mental Illness',
        energyCost: ['water', 'water', 'colorless'],
        damage: 150,
        description:
          "Peer into your opponent's psyche. They reveal their hand and discard 2 cards of your choice.",
      },
      {
        name: 'Hellfire Protocol',
        energyCost: ['fire', 'fire', 'colorless', 'colorless'],
        damage: 200,
        description:
          'Discard all Energy. The Defending Pok\u00e9mon and all benched Pok\u00e9mon are now Burned.',
      },
    ],
    weakness: { type: 'fire', modifier: '+20' },
    resistance: { type: 'fighting', modifier: '-20' },
    retreatCost: 1,
    flavorText:
      'Said to appear once every thousand years. Its ancient wisdom can cure any ailment of the mind. Those who encounter it are forever changed.',
    illustrator: 'TopHat Software',
    cardNumber: '001/001 \u2605\u2605\u2605',
  },
  attackKeys: ['ice-slide', 'glacier-crush', 'inferno'],
  attackDurations: {
    'ice-slide': 800,
    'glacier-crush': 1000,
    inferno: 1800,
  },
  attackEffects: {
    'ice-slide': {
      cardShake: { pattern: 'sway', duration: 0.6, intensity: 1 },
      cardGlow: {
        color: [100, 200, 255],
        radius: 30,
        maxOpacity: 0.6,
        fadeProfile: 'linear',
        layers: [
          { color: [100, 200, 255], radius: 60, maxOpacity: 0.3 },
        ],
      },
      artGlow: {
        color: [150, 220, 255],
        radius: 40,
        maxOpacity: 0.7,
        fadeIn: 0.1,
        fadeOut: 0.4,
      },
      audio: { type: 'synth', synthPreset: 'ice-slide' },
      voiceLine: { filePath: '/audio/voiceovers/pengo-aura-farm.mp3' },
    },
    'glacier-crush': {
      cardShake: { pattern: 'slam', duration: 1, intensity: 1 },
      cardGlow: {
        color: [255, 255, 255],
        radius: 40,
        maxOpacity: 0.5,
        fadeProfile: 'linear',
        layers: [
          { color: [100, 180, 255], radius: 80, maxOpacity: 0.3 },
        ],
      },
      artGlow: {
        color: [100, 180, 255],
        radius: 50,
        maxOpacity: 0.6,
        fadeIn: 0.09,
        holdDuration: 0.09,
        fadeOut: 0.42,
        layers: [
          { color: [255, 255, 255], radius: 20, maxOpacity: 0.8 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'deep-boom' },
      voiceLine: { filePath: '/audio/voiceovers/pengo-diagnose.mp3' },
    },
    inferno: {
      cardShake: { pattern: 'spin', duration: 1.8, intensity: 1 },
      cardGlow: {
        color: [255, 80, 0],
        radius: 50,
        maxOpacity: 0.8,
        fadeProfile: 'linear',
        layers: [
          { color: [255, 30, 0], radius: 100, maxOpacity: 0.5 },
          { color: [255, 200, 0], radius: 150, maxOpacity: 0.3 },
          { color: [255, 50, 0], radius: 200, maxOpacity: 0.15 },
        ],
      },
      artGlow: {
        color: [255, 80, 0],
        radius: 80,
        maxOpacity: 0.9,
        fadeIn: 0.08,
        holdDuration: 0.16,
        fadeOut: 1.36,
        layers: [
          { color: [255, 0, 0], radius: 60, maxOpacity: 0.7 },
          { color: [255, 255, 200], radius: 20, maxOpacity: 0.4 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'inferno' },
      voiceLine: { filePath: '/audio/voiceovers/pengo-hellfire.mp3' },
      light: {
        type: 'point',
        color: [255, 80, 0],
        intensity: 5,
        position: [0, 8, 6],
        animation: 'flicker',
        secondary: {
          color: [255, 128, 13],
          intensity: 3,
          position: [0, 0, 8],
          animation: 'flicker',
        },
      },
      particles: [{ particleSystem: 'fire', mode: 'default' }],
      hitParticles: [{ particleSystem: 'fire', mode: 'default' }],
    },
  },
  model: {
    modelPath: 'models/pengoo.glb',
    baseScale: 14,
    ModelComponent: PengoModel,
  },
  cameraId: 'dr-pengo',
};
