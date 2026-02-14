import type { ItemDescriptor } from '../arena/descriptorTypes';

// scale is a relative size multiplier applied AFTER bounding-box normalization.
// 1.0 = same visual size as pengo.  All items start at 1.0 so they render
// at a uniform size; tweak individual values if a specific item should be
// larger or smaller relative to others.

export const ITEM_REGISTRY: Record<string, ItemDescriptor> = {
  apple: {
    id: 'apple',
    name: 'Apple',
    modelPath: '/models/apple.glb',
    scale: 0.5,
    defaultMovement: 'orbit',
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    modelPath: '/models/bread.glb',
    scale: 0.5,
    defaultMovement: 'orbit',
  },
  'burger-king-computer': {
    id: 'burger-king-computer',
    name: 'BK Computer',
    modelPath: '/models/burger-king-computer.glb',
    scale: 0.5,
    defaultMovement: 'hover',
  },
  'filet-o-fish': {
    id: 'filet-o-fish',
    name: 'Filet-O-Fish',
    modelPath: '/models/filet-o-fish.glb',
    scale: 0.5,
    defaultMovement: 'orbit',
  },
  iss: {
    id: 'iss',
    name: 'ISS',
    modelPath: '/models/iss.glb',
    scale: 0.5,
    defaultMovement: 'orbit',
  },
  'lion-chinatown': {
    id: 'lion-chinatown',
    name: 'Lion Chinatown',
    modelPath: '/models/lion-chinatown.glb',
    scale: 0.5,
    defaultMovement: 'follow',
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    modelPath: '/models/rock.glb',
    scale: 0.5,
    defaultMovement: 'hover',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    modelPath: '/models/rose.glb',
    scale: 0.5,
    defaultMovement: 'orbit',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    modelPath: '/models/tank.glb',
    scale: 0.5,
    defaultMovement: 'follow',
  },
  'wild-things': {
    id: 'wild-things',
    name: 'Wild Things',
    modelPath: '/models/wild-things.glb',
    scale: 0.5,
    defaultMovement: 'hover',
  },
  zoltar: {
    id: 'zoltar',
    name: 'Zoltar',
    modelPath: '/models/zoltar.glb',
    scale: 0.5,
    defaultMovement: 'hover',
  },
};

export function getItemDescriptor(id: string): ItemDescriptor {
  const desc = ITEM_REGISTRY[id];
  if (!desc) throw new Error(`Unknown item: ${id}`);
  return desc;
}

export function getAllItems(): ItemDescriptor[] {
  return Object.values(ITEM_REGISTRY);
}
