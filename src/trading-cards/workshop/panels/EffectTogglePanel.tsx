import React from 'react';
import type { ToggleGroupState, ToggleGroupActions } from '../hooks/useToggleGroup';
import { FILTER_TIERS, FILTER_IDS, getFilterDef } from '../filterRegistry';
import { MORPH_IDS, getMorphDef } from '../morphRegistry';
import { AURA_IDS, getAuraDef } from '../auraRegistry';
import { SHIELD_IDS, getShieldDef } from '../shieldRegistry';
import { SCENE_FX_IDS, getSceneFxDef } from '../sceneFxRegistry';
import { Section } from '../ui/Section';
import { ToggleChipList } from '../ui/ToggleChipList';

export interface EffectTogglePanelProps {
  filters: ToggleGroupState;
  filterActions: ToggleGroupActions;
  morphs: ToggleGroupState;
  morphActions: ToggleGroupActions;
  auras: ToggleGroupState;
  auraActions: ToggleGroupActions;
  shields: ToggleGroupState;
  shieldActions: ToggleGroupActions;
  sceneFx: ToggleGroupState;
  sceneFxActions: ToggleGroupActions;
  filterQuery: string;
}

const tierLabel: React.CSSProperties = {
  width: '100%',
  fontSize: 10,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '6px 0 2px',
};

const tierLabelFirst: React.CSSProperties = {
  ...tierLabel,
  paddingTop: 0,
};

export const EffectTogglePanel: React.FC<EffectTogglePanelProps> = ({
  filters,
  filterActions,
  morphs,
  morphActions,
  auras,
  auraActions,
  shields,
  shieldActions,
  sceneFx,
  sceneFxActions,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  const filteredMorphs = q ? MORPH_IDS.filter((id) => id.toLowerCase().includes(q)) : MORPH_IDS;
  const filteredAuras = q ? AURA_IDS.filter((id) => id.toLowerCase().includes(q)) : AURA_IDS;
  const filteredShields = q ? SHIELD_IDS.filter((id) => id.toLowerCase().includes(q)) : SHIELD_IDS;
  const filteredSceneFx = q ? SCENE_FX_IDS.filter((id) => id.toLowerCase().includes(q) || getSceneFxDef(id)?.displayName.toLowerCase().includes(q)) : SCENE_FX_IDS;
  const filteredFilters = q ? FILTER_IDS.filter((id) => id.toLowerCase().includes(q)) : FILTER_IDS;

  // Build tier groups, skipping empty tiers (from search filtering)
  const visibleTiers = FILTER_TIERS.map((tier) => {
    const visibleIds = q
      ? tier.ids.filter((id) => id.toLowerCase().includes(q))
      : tier.ids;
    return { ...tier, visibleIds };
  }).filter((t) => t.visibleIds.length > 0);

  let isFirstTier = true;

  return (
    <>
      {filteredMorphs.length > 0 && (
        <Section title="Morphs" count={filteredMorphs.length}>
          <ToggleChipList
            allIds={MORPH_IDS}
            getDef={getMorphDef}
            state={morphs}
            actions={morphActions}
            filterQuery={filterQuery}
          />
        </Section>
      )}

      {filteredAuras.length > 0 && (
        <Section title="Auras" count={filteredAuras.length}>
          <ToggleChipList
            allIds={AURA_IDS}
            getDef={getAuraDef}
            state={auras}
            actions={auraActions}
            filterQuery={filterQuery}
          />
        </Section>
      )}

      {filteredShields.length > 0 && (
        <Section title="Shields" count={filteredShields.length}>
          <ToggleChipList
            allIds={SHIELD_IDS}
            getDef={getShieldDef}
            state={shields}
            actions={shieldActions}
            filterQuery={filterQuery}
          />
        </Section>
      )}

      {filteredSceneFx.length > 0 && (
        <Section title="Scene FX" count={filteredSceneFx.length}>
          <ToggleChipList
            allIds={SCENE_FX_IDS}
            getDef={getSceneFxDef}
            state={sceneFx}
            actions={sceneFxActions}
            filterQuery={filterQuery}
          />
        </Section>
      )}

      {filteredFilters.length > 0 && (
        <Section title="Visual Filters" count={filteredFilters.length}>
          {visibleTiers.map((tier) => {
            const first = isFirstTier;
            isFirstTier = false;
            return (
              <React.Fragment key={tier.label}>
                <div style={first ? tierLabelFirst : tierLabel}>{tier.label}</div>
                <ToggleChipList
                  allIds={tier.ids}
                  getDef={getFilterDef}
                  state={filters}
                  actions={filterActions}
                  filterQuery={filterQuery}
                />
              </React.Fragment>
            );
          })}
        </Section>
      )}
    </>
  );
};
