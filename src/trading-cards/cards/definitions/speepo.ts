import type { CardDefinition } from '../../arena/descriptorTypes';
import { SpeepoModel } from '../../effects/SpeepoModel';

export const speepoDefinition: CardDefinition = {
  id: 'speepo',
  cardData: {
    name: 'Speepo',
    stage: 'Basic',
    hp: 200,
    type: 'electric',
    attacks: [
      {
        name: 'Thunder Nap',
        energyCost: ['electric'],
        damage: 50,
        description:
          'Dozes off mid-battle, then jolts awake with a static discharge. Heal 30 HP.',
      },
      {
        name: 'Lightning Dash',
        energyCost: ['electric', 'colorless'],
        damage: 90,
        description:
          'Zigzags across the field in a blur of sparks. Flip a coin — if heads, prevent all damage to Speepo next turn.',
      },
      {
        name: 'Volt Surge',
        energyCost: ['electric', 'electric', 'colorless'],
        damage: 180,
        description:
          'Overloads with electricity and unleashes a devastating discharge. Speepo does 30 damage to itself.',
      },
    ],
    weakness: { type: 'fighting', modifier: '+20' },
    resistance: { type: 'electric', modifier: '-20' },
    retreatCost: 1,
    flavorText:
      'Always half-asleep, yet impossibly fast when startled. Scientists theorize its drowsiness actually channels ambient static into devastating bolts.',
    illustrator: 'TopHat Software',
    cardNumber: '042/001 ★★',
  },
  attackKeys: ['thunder-nap', 'lightning-dash', 'volt-surge'],
  attackDurations: {
    'thunder-nap': 1500,
    'lightning-dash': 800,
    'volt-surge': 2000,
  },
  attackEffects: {
    'thunder-nap': {
      cardShake: { pattern: 'sway', duration: 1.2, intensity: 0.6 },
      cardGlow: {
        color: [255, 220, 50],
        radius: 30,
        maxOpacity: 0.6,
        fadeProfile: 'ease-out',
        layers: [
          { color: [255, 180, 0], radius: 60, maxOpacity: 0.3 },
        ],
      },
      artGlow: {
        color: [255, 200, 30],
        radius: 35,
        maxOpacity: 0.7,
        fadeIn: 0.3,
        fadeOut: 0.6,
      },
      audio: { type: 'synth', synthPreset: 'thunder-nap' },
      camera: { preset: 'close-up', duration: 1.2 },
    },
    'lightning-dash': {
      cardShake: { pattern: 'sway', duration: 0.6, intensity: 1.5 },
      cardGlow: {
        color: [255, 240, 80],
        radius: 40,
        maxOpacity: 0.8,
        fadeProfile: 'linear',
        layers: [
          { color: [255, 255, 150], radius: 80, maxOpacity: 0.4 },
        ],
      },
      artGlow: {
        color: [255, 230, 50],
        radius: 50,
        maxOpacity: 0.9,
        fadeIn: 0.05,
        fadeOut: 0.4,
      },
      audio: { type: 'synth', synthPreset: 'lightning-dash' },
      camera: { preset: 'zoom-punch', duration: 0.8, intensity: 1.5 },
    },
    'volt-surge': {
      cardShake: { pattern: 'spin', duration: 2.0, intensity: 1.3 },
      cardGlow: {
        color: [255, 200, 0],
        radius: 55,
        maxOpacity: 0.9,
        fadeProfile: 'hold-then-fade',
        layers: [
          { color: [255, 255, 100], radius: 110, maxOpacity: 0.5 },
          { color: [255, 160, 0], radius: 170, maxOpacity: 0.25 },
        ],
      },
      artGlow: {
        color: [255, 220, 20],
        radius: 80,
        maxOpacity: 1.0,
        fadeIn: 0.1,
        holdDuration: 0.4,
        fadeOut: 1.0,
        layers: [
          { color: [255, 255, 180], radius: 40, maxOpacity: 0.7 },
        ],
      },
      audio: { type: 'synth', synthPreset: 'volt-surge' },
      light: {
        type: 'point',
        color: [255, 220, 50],
        intensity: 5,
        position: [0, 6, 4],
        animation: 'flicker',
      },
      camera: { preset: 'orbit-360', duration: 2.0 },
    },
  },
  model: {
    modelPath: 'models/pengoo.glb',
    baseScale: 14,
    ModelComponent: SpeepoModel,
  },
  cameraId: 'speepo',
  artBackground: 'linear-gradient(180deg, #c7dff0 0%, #5b9bd5 50%, #2a5f9e 100%)',
  disableHolo: true,
};
