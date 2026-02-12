import type { BattleCardEntry } from './types';
import type { CardDefinition } from './descriptorTypes';
import { allCardDefinitions } from '../cards/definitions';

function entryFromDefinition(def: CardDefinition): BattleCardEntry {
  return {
    cardData: def.cardData,
    attackKeys: def.attackKeys,
    attackDurations: def.attackDurations,
    modelId: def.id,
    cameraId: def.cameraId,
    definition: def,
  };
}

// ── Registry ────────────────────────────────────────────────

const CARD_REGISTRY = new Map<string, BattleCardEntry>();

for (const def of allCardDefinitions) {
  CARD_REGISTRY.set(def.id, entryFromDefinition(def));
}

export function getCard(id: string): BattleCardEntry {
  const entry = CARD_REGISTRY.get(id);
  if (!entry) throw new Error(`Card not found: ${id}`);
  return entry;
}

export function getAllCards(): BattleCardEntry[] {
  return Array.from(CARD_REGISTRY.values());
}

// ── Backwards-compatible named exports ──────────────────────

export const PENGO_ENTRY = getCard('pengo');
export const ROSALIND_ENTRY = getCard('rosalind');
