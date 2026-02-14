import React, { useState, useMemo } from 'react';
import type { BattleCardEntry } from '../arena/types';
import type { CameraPreset, ShakePattern, ItemDescriptor, ActiveItem, ItemMovementPattern } from '../arena/descriptorTypes';
import { FILTER_IDS, getFilterDef } from './filterRegistry';
import { MORPH_IDS, getMorphDef } from './morphRegistry';
import { AURA_IDS, getAuraDef } from './auraRegistry';
import { FilterParamControls } from './FilterParamControls';

const CAMERA_PRESETS: CameraPreset[] = [
  'close-up',
  'orbit-360',
  'zoom-punch',
  'dramatic-low',
  'pull-back',
  'shake-focus',
  'face-to-face',
  'barrel-roll',
];

const SHAKE_PATTERNS: ShakePattern[] = ['sway', 'slam', 'spin', 'pulse', 'contract'];

const DECOMPOSITION_EFFECTS = ['shatter', 'dissolve', 'slice'] as const;

const SYNTH_PRESET_KEYS = [
  'ice-slide',
  'deep-boom',
  'inferno',
  'bloom',
  'thorn-storm',
  'shadow-slide',
  'soul-drain',
  'void-collapse',
  'multiply',
  'thunder-nap',
  'lightning-dash',
  'volt-surge',
] as const;

// ── Styles ──────────────────────────────────────────────────

const chipBase: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  lineHeight: 1.3,
};

const chipOff: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.7)',
};

const chipOn: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(100,180,255,0.25)',
  color: '#fff',
  borderColor: 'rgba(100,180,255,0.5)',
  boxShadow: '0 0 6px rgba(100,180,255,0.3)',
};

const chipAction: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.7)',
};

// ── Accordion Section ───────────────────────────────────────

const Section: React.FC<{
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        <span>
          {open ? '\u25BE' : '\u25B8'} {title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            paddingBottom: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ── Panel Props ─────────────────────────────────────────────

interface StatusBlueprint {
  id: string;
  displayName: string;
  icon: string;
}

export interface WorkshopPanelProps {
  // Data
  cards: BattleCardEntry[];
  selectedCardIndex: number;
  statusBlueprints: StatusBlueprint[];
  allItems: ItemDescriptor[];
  activeItems: ActiveItem[];

  // Current state
  activeFilters: string[];
  activeStatuses: string[];
  isDancing: boolean;
  isEvolving: boolean;
  isEvolved: boolean;
  glowEnabled: boolean;
  glowColor: string;
  glowRadius: number;

  // Attack state
  activeAttackKey: string | null;
  attackMode: 'give' | 'take' | null;

  // Callbacks
  onSelectCard: (index: number) => void;
  onToggleFilter: (filter: string) => void;
  onTriggerCamera: (preset: CameraPreset) => void;
  onToggleStatus: (id: string) => void;
  onToggleItem: (itemId: string) => void;
  onChangeItemMovement: (itemId: string, movement: ItemMovementPattern) => void;
  onTriggerShake: (pattern: ShakePattern) => void;
  onPlaySynth: (key: string) => void;
  onToggleDance: () => void;
  onToggleEvolving: () => void;
  onToggleEvolved: () => void;
  onToggleGlow: () => void;
  onChangeGlowColor: (hex: string) => void;
  onChangeGlowRadius: (radius: number) => void;
  onGiveAttack: (attackKey: string) => void;
  onTakeAttack: (attackKey: string) => void;

  // Decomposition
  activeDecomposition: string | null;
  onToggleDecomposition: (type: string) => void;

  // Filter params
  filterParams: Record<string, Record<string, any>>;
  onChangeFilterParam: (filterId: string, key: string, value: any) => void;

  // Morphs
  activeMorphs: string[];
  morphParams: Record<string, Record<string, any>>;
  onToggleMorph: (morphId: string) => void;
  onChangeMorphParam: (morphId: string, key: string, value: any) => void;

  // Auras
  activeAuras: string[];
  auraParams: Record<string, Record<string, any>>;
  onToggleAura: (auraId: string) => void;
  onChangeAuraParam: (auraId: string, key: string, value: any) => void;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  cards,
  selectedCardIndex,
  statusBlueprints,
  allItems,
  activeItems,
  activeFilters,
  activeStatuses,
  isDancing,
  isEvolving,
  isEvolved,
  glowEnabled,
  glowColor,
  glowRadius,
  activeAttackKey,
  attackMode,
  onSelectCard,
  onToggleFilter,
  onTriggerCamera,
  onToggleStatus,
  onToggleItem,
  onChangeItemMovement,
  onTriggerShake,
  onPlaySynth,
  onToggleDance,
  onToggleEvolving,
  onToggleEvolved,
  onToggleGlow,
  onChangeGlowColor,
  onChangeGlowRadius,
  onGiveAttack,
  onTakeAttack,
  activeDecomposition,
  onToggleDecomposition,
  filterParams,
  onChangeFilterParam,
  activeMorphs,
  morphParams,
  onToggleMorph,
  onChangeMorphParam,
  activeAuras,
  auraParams,
  onToggleAura,
  onChangeAuraParam,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();

  const filterItems = (items: readonly string[]) =>
    q ? items.filter((item) => item.toLowerCase().includes(q)) : [...items];

  // Attacks for selected card
  const selectedCard = cards[selectedCardIndex];
  const attacks = useMemo(() => {
    if (!selectedCard) return [];
    return selectedCard.cardData.attacks.map((atk, i) => ({
      key: selectedCard.attackKeys[i],
      name: atk.name,
      damage: atk.damage,
    }));
  }, [selectedCard]);
  const filteredAttacks = useMemo(
    () =>
      q
        ? attacks.filter((a) => a.name.toLowerCase().includes(q))
        : attacks,
    [attacks, q],
  );

  const filteredFilters = filterItems(FILTER_IDS);
  const filteredCameras = filterItems(CAMERA_PRESETS);
  const filteredStatuses = useMemo(
    () =>
      q
        ? statusBlueprints.filter(
            (bp) =>
              bp.id.toLowerCase().includes(q) ||
              bp.displayName.toLowerCase().includes(q),
          )
        : statusBlueprints,
    [statusBlueprints, q],
  );
  const filteredItems = useMemo(
    () =>
      q
        ? allItems.filter((item) => item.name.toLowerCase().includes(q))
        : allItems,
    [allItems, q],
  );
  const filteredMorphs = filterItems(MORPH_IDS);
  const filteredAuras = filterItems(AURA_IDS);
  const filteredShakes = filterItems(SHAKE_PATTERNS);
  const filteredSynths = filterItems(SYNTH_PRESET_KEYS);
  const filteredDecompositions = filterItems(DECOMPOSITION_EFFECTS);

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 36,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            padding: '8px 4px',
            fontSize: 14,
            backdropFilter: 'blur(12px)',
          }}
          title="Show panel"
        >
          {'\u25B6'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 320,
        zIndex: 50,
        background: 'rgba(10,10,20,0.85)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto',
        padding: '60px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search effects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '7px 10px',
          fontSize: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          color: '#fff',
          outline: 'none',
          fontFamily: 'inherit',
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      {/* 1. Model Selector */}
      <Section title="Model" count={cards.length} defaultOpen>
        <select
          value={selectedCardIndex}
          onChange={(e) => onSelectCard(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        >
          {cards.map((entry, i) => (
            <option key={entry.definition.id} value={i} style={{ background: '#1a1a2e' }}>
              {entry.cardData.name}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, width: '100%' }}>
          <button
            onClick={onToggleDance}
            style={isDancing ? chipOn : chipOff}
          >
            Dancing
          </button>
          <button
            onClick={onToggleEvolving}
            style={isEvolving ? chipOn : chipOff}
          >
            Evolving
          </button>
          <button
            onClick={onToggleEvolved}
            style={isEvolved ? chipOn : chipOff}
          >
            Evolved
          </button>
        </div>
      </Section>

      {/* 2. Morphs */}
      {filteredMorphs.length > 0 && (
        <Section title="Morphs" count={filteredMorphs.length}>
          {filteredMorphs.map((key) => {
            const def = getMorphDef(key);
            return (
              <button
                key={key}
                onClick={() => onToggleMorph(key)}
                style={activeMorphs.includes(key) ? chipOn : chipOff}
              >
                {def?.displayName ?? key}
              </button>
            );
          })}
          {activeMorphs.map((morphId) => {
            const def = getMorphDef(morphId);
            if (!def || def.params.length === 0) return null;
            return (
              <div key={morphId} style={{ width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(100,180,255,0.8)', padding: '6px 0 2px' }}>
                  {def.displayName}
                </div>
                <FilterParamControls
                  filterDef={def}
                  values={morphParams[morphId] ?? {}}
                  onChange={(key, value) => onChangeMorphParam(morphId, key, value)}
                />
              </div>
            );
          })}
        </Section>
      )}

      {/* Auras */}
      {filteredAuras.length > 0 && (
        <Section title="Auras" count={filteredAuras.length}>
          {filteredAuras.map((key) => {
            const def = getAuraDef(key);
            return (
              <button
                key={key}
                onClick={() => onToggleAura(key)}
                style={activeAuras.includes(key) ? chipOn : chipOff}
              >
                {def?.displayName ?? key}
              </button>
            );
          })}
          {activeAuras.map((auraId) => {
            const def = getAuraDef(auraId);
            if (!def || def.params.length === 0) return null;
            return (
              <div key={auraId} style={{ width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(100,180,255,0.8)', padding: '6px 0 2px' }}>
                  {def.displayName}
                </div>
                <FilterParamControls
                  filterDef={def}
                  values={auraParams[auraId] ?? {}}
                  onChange={(key, value) => onChangeAuraParam(auraId, key, value)}
                />
              </div>
            );
          })}
        </Section>
      )}

      {/* 3. Attacks */}
      {filteredAttacks.length > 0 && (
        <Section title="Attacks" count={filteredAttacks.length}>
          {filteredAttacks.map((atk) => {
            const isActiveGive = activeAttackKey === atk.key && attackMode === 'give';
            const isActiveTake = activeAttackKey === atk.key && attackMode === 'take';
            return (
              <div
                key={atk.key}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 500,
                  }}
                >
                  {atk.name}{' '}
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                    {atk.damage} dmg
                  </span>
                </span>
                <button
                  onClick={() => onGiveAttack(atk.key)}
                  style={isActiveGive ? chipOn : chipAction}
                >
                  Give
                </button>
                <button
                  onClick={() => onTakeAttack(atk.key)}
                  style={isActiveTake ? chipOn : chipAction}
                >
                  Take
                </button>
              </div>
            );
          })}
        </Section>
      )}

      {/* 3. Visual Filters */}
      {filteredFilters.length > 0 && (
        <Section title="Visual Filters" count={filteredFilters.length}>
          {filteredFilters.map((key) => {
            const def = getFilterDef(key);
            return (
              <button
                key={key}
                onClick={() => onToggleFilter(key)}
                style={activeFilters.includes(key) ? chipOn : chipOff}
              >
                {def?.displayName ?? key}
              </button>
            );
          })}
          {activeFilters.map((filterId) => {
            const def = getFilterDef(filterId);
            if (!def || def.params.length === 0) return null;
            return (
              <div key={filterId} style={{ width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(100,180,255,0.8)', padding: '6px 0 2px' }}>
                  {def.displayName}
                </div>
                <FilterParamControls
                  filterDef={def}
                  values={filterParams[filterId] ?? {}}
                  onChange={(key, value) => onChangeFilterParam(filterId, key, value)}
                />
              </div>
            );
          })}
        </Section>
      )}

      {/* 3. Camera Movements */}
      {filteredCameras.length > 0 && (
        <Section title="Camera" count={filteredCameras.length}>
          {filteredCameras.map((preset) => (
            <button
              key={preset}
              onClick={() => onTriggerCamera(preset as CameraPreset)}
              style={chipAction}
            >
              {preset}
            </button>
          ))}
        </Section>
      )}

      {/* 4. Status Effects */}
      {filteredStatuses.length > 0 && (
        <Section title="Status Effects" count={filteredStatuses.length}>
          {filteredStatuses.map((bp) => (
            <button
              key={bp.id}
              onClick={() => onToggleStatus(bp.id)}
              style={activeStatuses.includes(bp.id) ? chipOn : chipOff}
            >
              {bp.icon} {bp.displayName}
            </button>
          ))}
        </Section>
      )}

      {/* 5. Items */}
      {filteredItems.length > 0 && (
        <Section title="Items" count={filteredItems.length}>
          {filteredItems.map((item) => {
            const active = activeItems.find((ai) => ai.itemId === item.id);
            return (
              <div
                key={item.id}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  style={active ? chipOn : chipOff}
                >
                  {item.name}
                </button>
                {active && (
                  <select
                    value={active.movement}
                    onChange={(e) =>
                      onChangeItemMovement(item.id, e.target.value as ItemMovementPattern)
                    }
                    style={{
                      padding: '3px 6px',
                      fontSize: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    <option value="orbit" style={{ background: '#1a1a2e' }}>orbit</option>
                    <option value="hover" style={{ background: '#1a1a2e' }}>hover</option>
                    <option value="follow" style={{ background: '#1a1a2e' }}>follow</option>
                  </select>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* 6. Decomposition */}
      {filteredDecompositions.length > 0 && (
        <Section title="Decomposition" count={filteredDecompositions.length}>
          {filteredDecompositions.map((type) => (
            <button
              key={type}
              onClick={() => onToggleDecomposition(type)}
              style={activeDecomposition === type ? chipOn : chipOff}
            >
              {type}
            </button>
          ))}
        </Section>
      )}

      {/* 7. Card Shake */}
      {filteredShakes.length > 0 && (
        <Section title="Shake" count={filteredShakes.length}>
          {filteredShakes.map((pattern) => (
            <button
              key={pattern}
              onClick={() => onTriggerShake(pattern as ShakePattern)}
              style={chipAction}
            >
              {pattern}
            </button>
          ))}
        </Section>
      )}

      {/* 6. Audio / Synth */}
      {filteredSynths.length > 0 && (
        <Section title="Audio / Synth" count={filteredSynths.length}>
          {filteredSynths.map((key) => (
            <button
              key={key}
              onClick={() => onPlaySynth(key)}
              style={chipAction}
            >
              {key}
            </button>
          ))}
        </Section>
      )}

      {/* 7. Glow */}
      {(!q || 'glow'.includes(q)) && (
        <Section title="Glow" count={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button
              onClick={onToggleGlow}
              style={glowEnabled ? chipOn : chipOff}
            >
              {glowEnabled ? 'Glow ON' : 'Glow OFF'}
            </button>
            {glowEnabled && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>Color</label>
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => onChangeGlowColor(e.target.value)}
                    style={{
                      width: 32,
                      height: 24,
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 4,
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {glowColor}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>Radius</label>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={glowRadius}
                    onChange={(e) => onChangeGlowRadius(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', minWidth: 24 }}>
                    {glowRadius}
                  </span>
                </div>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(true)}
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {'\u25C0'} Hide Panel
      </button>
    </div>
  );
};
