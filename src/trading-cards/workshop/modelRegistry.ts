import { getAllCards } from '../arena/cardRegistry';
import { getAllItems } from '../items';
import { createStaticModel } from '../effects/StaticModel';
import type { CardDefinition } from '../arena/descriptorTypes';
import type { CardData } from '../types';

export interface WorkshopModelEntry {
  id: string;
  displayName: string;
  kind: 'card' | 'item';
  definition: CardDefinition;
}

// ── Build card entries ──────────────────────────────────────

const cardEntries: WorkshopModelEntry[] = getAllCards().map((entry) => ({
  id: entry.definition.id,
  displayName: entry.cardData.name,
  kind: 'card',
  definition: entry.definition,
}));

// ── Build item entries (synthetic CardDefinition) ───────────

const placeholderCardData: CardData = {
  name: '',
  stage: 'Prop',
  hp: 0,
  type: 'colorless',
  attacks: [],
  weakness: { type: 'colorless', modifier: '+0' },
  resistance: { type: 'colorless', modifier: '-0' },
  retreatCost: 0,
  flavorText: '',
  illustrator: '',
  cardNumber: '',
};

const itemEntries: WorkshopModelEntry[] = getAllItems().map((desc) => {
  const ModelComponent = createStaticModel(desc.modelPath, 1);
  const definition: CardDefinition = {
    id: `item-${desc.id}`,
    cardData: { ...placeholderCardData, name: desc.name },
    attackKeys: [],
    attackDurations: {},
    attackEffects: {},
    model: {
      modelPath: desc.modelPath,
      baseScale: 1,
      relativeSize: desc.scale,
      ModelComponent,
    },
    cameraId: `workshop-item-${desc.id}`,
  };
  return {
    id: definition.id,
    displayName: desc.name,
    kind: 'item',
    definition,
  };
});

// ── Unified registry ────────────────────────────────────────

export const ALL_WORKSHOP_MODELS: WorkshopModelEntry[] = [
  ...cardEntries,
  ...itemEntries,
];

const modelMap = new Map(ALL_WORKSHOP_MODELS.map((m) => [m.id, m]));

export function getWorkshopModel(id: string): WorkshopModelEntry {
  const entry = modelMap.get(id);
  if (!entry) throw new Error(`Workshop model not found: ${id}`);
  return entry;
}
