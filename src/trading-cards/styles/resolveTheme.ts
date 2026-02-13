import type { CardTheme } from './cardTheme';
import { DEFAULT_THEME } from './cardTheme';
import { TYPE_PRESETS, deepMerge } from './typePresets';
import type { DeepPartial } from './typePresets';
import type { CardDefinition } from '../arena/descriptorTypes';

export function resolveTheme(definition: CardDefinition): CardTheme {
  const typePreset = TYPE_PRESETS[definition.cardData.type] ?? {};

  // Build a backwards-compat layer from legacy fields
  const compat: DeepPartial<CardTheme> = {};
  if (definition.artBackground) {
    compat.artWindow = { defaultBackground: definition.artBackground };
  }
  if (definition.disableHolo) {
    compat.holoEnabled = false;
  }

  const themeOverride = definition.themeOverride ?? {};

  return deepMerge(DEFAULT_THEME, typePreset, compat, themeOverride);
}
