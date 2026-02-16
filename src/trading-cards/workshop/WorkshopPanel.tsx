import React, { useState, useMemo } from 'react';
import type { CameraPreset, ShakePattern } from '../arena/descriptorTypes';
import type { WorkshopModelEntry } from './modelRegistry';
import type { WorkshopPreset } from './presetTypes';
import type { EnvironmentConfig } from '../environment/environmentTypes';
import { FILTER_IDS, getFilterDef } from './filterRegistry';
import { MORPH_IDS, getMorphDef } from './morphRegistry';
import { AURA_IDS, getAuraDef } from './auraRegistry';
import { FilterParamControls } from './FilterParamControls';
export const RECORD_RESOLUTIONS = [
  { label: '1080\u00d71080 Square', w: 1080, h: 1080 },
  { label: '1080\u00d71920 Portrait', w: 1080, h: 1920 },
  { label: '1920\u00d71080 Landscape', w: 1920, h: 1080 },
  { label: '720\u00d7720 Small', w: 720, h: 720 },
] as const;

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
  models: WorkshopModelEntry[];
  selectedModelId: string;
  statusBlueprints: StatusBlueprint[];

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
  onSelectModel: (modelId: string) => void;
  onToggleFilter: (filter: string) => void;
  onTriggerCamera: (preset: CameraPreset) => void;
  onToggleStatus: (id: string) => void;
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

  // Presets
  presets: WorkshopPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onCopyPresetJSON: (id: string) => void;

  // Environment
  envConfigs: EnvironmentConfig[];
  selectedEnvId: string | null;
  onSelectEnv: (id: string | null) => void;
  modelPosition: [number, number, number];
  modelRotationY: number;
  modelScale: number;
  onChangeModelPosition: (axis: 0 | 1 | 2, value: number) => void;
  onChangeModelRotationY: (value: number) => void;
  onChangeModelScale: (value: number) => void;

  // Recording
  onRecord: (durationSec: number, width: number, height: number, fps: number) => void;
  recording: boolean;
  recordProgress: number;
  recordResIdx: number;
  onChangeRecordResIdx: (idx: number) => void;
  recordFps: number;
  onChangeRecordFps: (fps: number) => void;
  loopMode: 'loop' | 'pingpong';
  onChangeLoopMode: (mode: 'loop' | 'pingpong') => void;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  models,
  selectedModelId,
  statusBlueprints,
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
  onSelectModel,
  onToggleFilter,
  onTriggerCamera,
  onToggleStatus,
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
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onCopyPresetJSON,
  envConfigs,
  selectedEnvId,
  onSelectEnv,
  modelPosition,
  modelRotationY,
  modelScale,
  onChangeModelPosition,
  onChangeModelRotationY,
  onChangeModelScale,
  onRecord,
  recording,
  recordProgress,
  recordResIdx,
  onChangeRecordResIdx,
  recordFps,
  onChangeRecordFps,
  loopMode,
  onChangeLoopMode,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [presetName, setPresetName] = useState('');
  const q = search.toLowerCase();

  const filterItems = (items: readonly string[]) =>
    q ? items.filter((item) => item.toLowerCase().includes(q)) : [...items];

  // Current model entry
  const selectedModel = models.find((m) => m.id === selectedModelId);
  const definition = selectedModel?.definition;

  // Attacks for selected model
  const attacks = useMemo(() => {
    if (!definition) return [];
    return definition.cardData.attacks.map((atk, i) => ({
      key: definition.attackKeys[i],
      name: atk.name,
      damage: atk.damage,
    }));
  }, [definition]);
  const filteredAttacks = useMemo(
    () =>
      q
        ? attacks.filter((a) => a.name.toLowerCase().includes(q))
        : attacks,
    [attacks, q],
  );

  // Group models by kind
  const cardModels = models.filter((m) => m.kind === 'card');
  const itemModels = models.filter((m) => m.kind === 'item');

  // Presets for current model
  const modelPresets = presets.filter((p) => p.modelId === selectedModelId);

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
      <Section title="Model" count={models.length} defaultOpen>
        <select
          value={selectedModelId}
          onChange={(e) => onSelectModel(e.target.value)}
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
          <optgroup label="Characters">
            {cardModels.map((entry) => (
              <option key={entry.id} value={entry.id} style={{ background: '#1a1a2e' }}>
                {entry.displayName}
              </option>
            ))}
          </optgroup>
          <optgroup label="Props">
            {itemModels.map((entry) => (
              <option key={entry.id} value={entry.id} style={{ background: '#1a1a2e' }}>
                {entry.displayName}
              </option>
            ))}
          </optgroup>
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

      {/* Environment Backdrop */}
      <Section title="Environment" count={envConfigs.length} defaultOpen>
        <select
          value={selectedEnvId ?? ''}
          onChange={(e) => onSelectEnv(e.target.value || null)}
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
          <option value="" style={{ background: '#1a1a2e' }}>
            None
          </option>
          {envConfigs.map((cfg) => (
            <option key={cfg.id} value={cfg.id} style={{ background: '#1a1a2e' }}>
              {cfg.name}
            </option>
          ))}
        </select>
        {envConfigs.length === 0 && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '2px 0' }}>
            Save environments in the Environment tab first
          </div>
        )}
        {selectedEnvId && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Model Transform
            </div>
            {(['X', 'Y', 'Z'] as const).map((axis, i) => (
              <label key={axis} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ width: 14 }}>{axis}</span>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  step={0.5}
                  value={modelPosition[i]}
                  onChange={(e) => onChangeModelPosition(i as 0 | 1 | 2, parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#64b4ff' }}
                />
                <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
                  {modelPosition[i].toFixed(1)}
                </span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ width: 14 }}>R</span>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={modelRotationY}
                onChange={(e) => onChangeModelRotationY(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#64b4ff' }}
              />
              <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
                {modelRotationY.toFixed(0)}
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ width: 14 }}>S</span>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={modelScale}
                onChange={(e) => onChangeModelScale(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#64b4ff' }}
              />
              <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
                {modelScale.toFixed(1)}
              </span>
            </label>
          </div>
        )}
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

      {/* Visual Filters */}
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

      {/* Presets */}
      {(!q || 'preset'.includes(q)) && (
        <Section title="Presets" count={modelPresets.length}>
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: 11,
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => {
                if (presetName.trim()) {
                  onSavePreset(presetName.trim());
                  setPresetName('');
                }
              }}
              style={chipAction}
            >
              Save
            </button>
          </div>
          {modelPresets.map((preset) => (
            <div
              key={preset.id}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`${preset.name} — ${new Date(preset.savedAt).toLocaleString()}`}
              >
                {preset.name}
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 4 }}>
                  {new Date(preset.savedAt).toLocaleDateString()}
                </span>
              </span>
              <button onClick={() => onLoadPreset(preset.id)} style={chipAction}>
                Load
              </button>
              <button onClick={() => onCopyPresetJSON(preset.id)} style={chipAction}>
                Copy
              </button>
              <button
                onClick={() => onDeletePreset(preset.id)}
                style={{ ...chipAction, color: 'rgba(255,100,100,0.8)' }}
              >
                Del
              </button>
            </div>
          ))}
        </Section>
      )}

      {/* Camera Movements */}
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

      {/* Status Effects */}
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

      {/* Decomposition */}
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

      {/* Card Shake */}
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

      {/* Audio / Synth */}
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

      {/* Glow */}
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

      {/* Record NFT Loop */}
      {(!q || 'record nft loop'.includes(q)) && (
        <Section title="Record Loop" count={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {recording ? (
              <>
                <div style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${recordProgress * 100}%`,
                    background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
                    borderRadius: 2,
                    transition: 'width 0.1s linear',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'rgba(168,85,247,0.8)', textAlign: 'center' }}>
                  {recordProgress < 0.15 ? 'Warming up' : recordProgress < 0.5 ? 'Capturing' : recordProgress < 0.55 ? 'Building palette' : 'Encoding'}... {Math.round(recordProgress * 100)}%
                </div>
              </>
            ) : (
              <>
                <select
                  value={recordResIdx}
                  onChange={(e) => onChangeRecordResIdx(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: 11,
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                >
                  {RECORD_RESOLUTIONS.map((res, i) => (
                    <option key={i} value={i} style={{ background: '#1a1a2e' }}>
                      {res.label}
                    </option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', width: '100%' }}>
                  <span style={{ minWidth: 24 }}>FPS</span>
                  <input
                    type="range"
                    min={10}
                    max={30}
                    step={5}
                    value={recordFps}
                    onChange={(e) => onChangeRecordFps(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#a855f7' }}
                  />
                  <span style={{ width: 20, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
                    {recordFps}
                  </span>
                </label>
                <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                  {(['loop', 'pingpong'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onChangeLoopMode(mode)}
                      style={{
                        ...chipBase,
                        flex: 1,
                        textAlign: 'center' as const,
                        ...(loopMode === mode
                          ? { background: 'rgba(168,85,247,0.3)', color: '#fff', borderColor: 'rgba(168,85,247,0.5)' }
                          : {}),
                      }}
                    >
                      {mode === 'loop' ? 'Loop' : 'Ping-Pong'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[3, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        const res = RECORD_RESOLUTIONS[recordResIdx];
                        onRecord(sec, res.w, res.h, recordFps);
                      }}
                      style={{
                        ...chipBase,
                        flex: 1,
                        textAlign: 'center' as const,
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(59,130,246,0.35))',
                        color: '#fff',
                        borderColor: 'rgba(168,85,247,0.5)',
                      }}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              Captures a ping-pong loop as .webm at the selected resolution.
            </div>
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
