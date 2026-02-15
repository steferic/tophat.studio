import React, { useState } from 'react';
import { ALL_WORKSHOP_MODELS } from '../workshop/modelRegistry';
import type { WorkshopModelEntry } from '../workshop/modelRegistry';
import type { WorkshopPreset } from '../workshop/presetTypes';
import type {
  PlacedModel,
  FloorSettings,
  WallSettings,
  SkySettings,
  SkyPreset,
  TerrainSettings,
  TerrainType,
  WaterSettings,
  WeatherSettings,
  WeatherType,
  CloudSettings,
  GodRaysSettings,
  EnvironmentConfig,
} from './environmentTypes';
import { TERRAIN_DEFAULT_COLORS } from './environmentTypes';

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

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.6)',
  minWidth: 28,
};

const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
};

const monoValue: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'monospace',
  minWidth: 36,
  textAlign: 'right',
};

// ── Accordion Section ───────────────────────────────────────

const Section: React.FC<{
  title: string;
  count?: number;
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
        {count !== undefined && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {count}
          </span>
        )}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ── Panel Props ─────────────────────────────────────────────

export interface EnvironmentPanelProps {
  models: PlacedModel[];
  selectedInstanceId: string | null;
  boxSize: number;
  boxHeight: number;
  floor: FloorSettings;
  walls: WallSettings;
  sky: SkySettings;
  terrain: TerrainSettings;
  water: WaterSettings;
  weather: WeatherSettings;
  clouds: CloudSettings;
  godRays: GodRaysSettings;
  configs: EnvironmentConfig[];
  workshopPresets: WorkshopPreset[];
  onAddModel: (modelId: string) => void;
  onRemoveModel: (instanceId: string) => void;
  onSelectModel: (instanceId: string | null) => void;
  onUpdateTransform: (instanceId: string, field: string, value: any) => void;
  onApplyPreset: (instanceId: string, presetId: string) => void;
  onClearPreset: (instanceId: string) => void;
  onUpdateFloor: (update: Partial<FloorSettings>) => void;
  onUpdateWalls: (update: Partial<WallSettings>) => void;
  onUpdateSky: (update: Partial<SkySettings>) => void;
  onUpdateTerrain: (update: Partial<TerrainSettings>) => void;
  onUpdateWater: (update: Partial<WaterSettings>) => void;
  onUpdateWeather: (update: Partial<WeatherSettings>) => void;
  onUpdateClouds: (update: Partial<CloudSettings>) => void;
  onUpdateGodRays: (update: Partial<GodRaysSettings>) => void;
  onSaveConfig: (name: string) => void;
  onLoadConfig: (id: string) => void;
  onDeleteConfig: (id: string) => void;
  onCopyConfigJSON: (id: string) => void;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({
  models,
  selectedInstanceId,
  boxSize,
  boxHeight,
  floor,
  walls,
  sky,
  terrain,
  water,
  weather,
  clouds,
  godRays,
  configs,
  workshopPresets,
  onAddModel,
  onRemoveModel,
  onSelectModel,
  onUpdateTransform,
  onApplyPreset,
  onClearPreset,
  onUpdateFloor,
  onUpdateWalls,
  onUpdateSky,
  onUpdateTerrain,
  onUpdateWater,
  onUpdateWeather,
  onUpdateClouds,
  onUpdateGodRays,
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig,
  onCopyConfigJSON,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [addModelId, setAddModelId] = useState(ALL_WORKSHOP_MODELS[0]?.id ?? '');
  const [configName, setConfigName] = useState('');

  const cardModels = ALL_WORKSHOP_MODELS.filter((m: WorkshopModelEntry) => m.kind === 'card');
  const itemModels = ALL_WORKSHOP_MODELS.filter((m: WorkshopModelEntry) => m.kind === 'item');

  const selectedModel = models.find((m) => m.instanceId === selectedInstanceId);
  const half = boxSize / 2;

  // Workshop presets for the selected model's modelId
  const availablePresets = selectedModel
    ? workshopPresets.filter((p) => p.modelId === selectedModel.modelId)
    : [];

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
      {/* 1. Add Model */}
      <Section title="Add Model" defaultOpen>
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <select
            value={addModelId}
            onChange={(e) => setAddModelId(e.target.value)}
            style={{
              flex: 1,
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
          <button
            onClick={() => onAddModel(addModelId)}
            style={chipAction}
          >
            Add
          </button>
        </div>
      </Section>

      {/* 2. Placed Models */}
      <Section title="Placed Models" count={models.length} defaultOpen>
        {models.length === 0 && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>No models placed yet</span>
        )}
        {models.map((m) => {
          let displayName = m.modelId;
          try {
            const entry = ALL_WORKSHOP_MODELS.find((e) => e.id === m.modelId);
            if (entry) displayName = entry.displayName;
          } catch { /* noop */ }

          return (
            <div
              key={m.instanceId}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
              }}
            >
              <button
                onClick={() => onSelectModel(m.instanceId)}
                style={{
                  ...(m.instanceId === selectedInstanceId ? chipOn : chipOff),
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </button>
              <button
                onClick={() => onRemoveModel(m.instanceId)}
                style={{ ...chipAction, color: 'rgba(255,100,100,0.8)' }}
              >
                Del
              </button>
            </div>
          );
        })}
      </Section>

      {/* 3. Transform (selected model) */}
      {selectedModel && (
        <Section title="Transform" defaultOpen>
          {/* Position X */}
          <div style={sliderRowStyle}>
            <label style={labelStyle}>X</label>
            <input
              type="range"
              min={-half}
              max={half}
              step={1}
              value={selectedModel.position[0]}
              onChange={(e) => onUpdateTransform(selectedModel.instanceId, 'posX', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={monoValue}>{selectedModel.position[0].toFixed(0)}</span>
          </div>
          {/* Position Y */}
          <div style={sliderRowStyle}>
            <label style={labelStyle}>Y</label>
            <input
              type="range"
              min={0}
              max={boxHeight}
              step={1}
              value={selectedModel.position[1]}
              onChange={(e) => onUpdateTransform(selectedModel.instanceId, 'posY', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={monoValue}>{selectedModel.position[1].toFixed(0)}</span>
          </div>
          {/* Position Z */}
          <div style={sliderRowStyle}>
            <label style={labelStyle}>Z</label>
            <input
              type="range"
              min={-half}
              max={half}
              step={1}
              value={selectedModel.position[2]}
              onChange={(e) => onUpdateTransform(selectedModel.instanceId, 'posZ', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={monoValue}>{selectedModel.position[2].toFixed(0)}</span>
          </div>
          {/* Rotation Y */}
          <div style={sliderRowStyle}>
            <label style={labelStyle}>Rot</label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={selectedModel.rotation[1]}
              onChange={(e) => onUpdateTransform(selectedModel.instanceId, 'rotY', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={monoValue}>{selectedModel.rotation[1].toFixed(0)}&deg;</span>
          </div>
          {/* Scale */}
          <div style={sliderRowStyle}>
            <label style={labelStyle}>Scl</label>
            <input
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={selectedModel.scale}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!isNaN(v) && v >= 0.1 && v <= 100) {
                  onUpdateTransform(selectedModel.instanceId, 'scale', v);
                }
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 11,
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <span style={monoValue}>x</span>
          </div>
        </Section>
      )}

      {/* 4. Preset (selected model) */}
      {selectedModel && (
        <Section title="Preset" count={availablePresets.length}>
          {availablePresets.length === 0 ? (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              No workshop presets for this model
            </span>
          ) : (
            <>
              {availablePresets.map((p) => (
                <div
                  key={p.id}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 0',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: selectedModel.presetId === p.id ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: selectedModel.presetId === p.id ? 600 : 400,
                    }}
                  >
                    {p.name}
                  </span>
                  <button
                    onClick={() => onApplyPreset(selectedModel.instanceId, p.id)}
                    style={selectedModel.presetId === p.id ? chipOn : chipAction}
                  >
                    Apply
                  </button>
                </div>
              ))}
              {selectedModel.presetConfig && (
                <button
                  onClick={() => onClearPreset(selectedModel.instanceId)}
                  style={{ ...chipAction, color: 'rgba(255,180,100,0.8)' }}
                >
                  Clear Preset
                </button>
              )}
            </>
          )}
        </Section>
      )}

      {/* 5. Floor */}
      <Section title="Floor">
        <button
          onClick={() => onUpdateFloor({ visible: !floor.visible })}
          style={floor.visible ? chipOn : chipOff}
        >
          {floor.visible ? 'Visible' : 'Hidden'}
        </button>
        {floor.visible && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Size</label>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={floor.gridSize}
                onChange={(e) => onUpdateFloor({ gridSize: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{floor.gridSize}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={floor.gridColor}
                onChange={(e) => onUpdateFloor({ gridColor: e.target.value })}
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
                {floor.gridColor}
              </span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Opac</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={floor.gridOpacity}
                onChange={(e) => onUpdateFloor({ gridOpacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{floor.gridOpacity.toFixed(2)}</span>
            </div>
          </>
        )}
      </Section>

      {/* 6. Walls */}
      <Section title="Walls">
        <button
          onClick={() => onUpdateWalls({ visible: !walls.visible })}
          style={walls.visible ? chipOn : chipOff}
        >
          {walls.visible ? 'Visible' : 'Hidden'}
        </button>
        {walls.visible && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={walls.wireColor}
                onChange={(e) => onUpdateWalls({ wireColor: e.target.value })}
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
                {walls.wireColor}
              </span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Opac</label>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={walls.wireOpacity}
                onChange={(e) => onUpdateWalls({ wireOpacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{walls.wireOpacity.toFixed(2)}</span>
            </div>
          </>
        )}
      </Section>

      {/* 7. Sky */}
      <Section title="Sky">
        <button
          onClick={() => onUpdateSky({ enabled: !sky.enabled })}
          style={sky.enabled ? chipOn : chipOff}
        >
          {sky.enabled ? 'Enabled' : 'Disabled'}
        </button>
        {sky.enabled && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(['noon', 'sunset', 'dawn', 'night', 'custom'] as SkyPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdateSky({ preset: p })}
                  style={sky.preset === p ? chipOn : chipOff}
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {sky.preset === 'custom' && (
              <>
                <div style={sliderRowStyle}>
                  <label style={labelStyle}>Elev</label>
                  <input
                    type="range" min={0} max={90} step={1}
                    value={sky.sunElevation}
                    onChange={(e) => onUpdateSky({ sunElevation: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={monoValue}>{sky.sunElevation}&deg;</span>
                </div>
                <div style={sliderRowStyle}>
                  <label style={labelStyle}>Azim</label>
                  <input
                    type="range" min={0} max={360} step={1}
                    value={sky.sunAzimuth}
                    onChange={(e) => onUpdateSky({ sunAzimuth: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={monoValue}>{sky.sunAzimuth}&deg;</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onUpdateSky({ stars: !sky.stars })}
                style={sky.stars ? chipOn : chipOff}
              >
                Stars
              </button>
              {sky.stars && (
                <div style={{ ...sliderRowStyle, flex: 1 }}>
                  <input
                    type="range" min={100} max={5000} step={100}
                    value={sky.starCount}
                    onChange={(e) => onUpdateSky({ starCount: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={monoValue}>{sky.starCount}</span>
                </div>
              )}
            </div>
          </>
        )}
      </Section>

      {/* 8. Terrain */}
      <Section title="Terrain">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(['none', 'grass', 'desert', 'snow', 'rocky', 'water'] as TerrainType[]).map((t) => (
            <button
              key={t}
              onClick={() => onUpdateTerrain({ type: t, color: TERRAIN_DEFAULT_COLORS[t] })}
              style={terrain.type === t ? chipOn : chipOff}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {terrain.type !== 'none' && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Elev</label>
              <input
                type="range" min={0} max={1} step={0.05}
                value={terrain.elevation}
                onChange={(e) => onUpdateTerrain({ elevation: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{terrain.elevation.toFixed(2)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={terrain.color}
                onChange={(e) => onUpdateTerrain({ color: e.target.value })}
                style={{ width: 32, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{terrain.color}</span>
            </div>
            <button
              onClick={() => onUpdateTerrain({ hideGrid: !terrain.hideGrid })}
              style={terrain.hideGrid ? chipOn : chipOff}
            >
              {terrain.hideGrid ? 'Grid Hidden' : 'Grid Shown'}
            </button>
          </>
        )}
      </Section>

      {/* 9. Water */}
      <Section title="Water">
        <button
          onClick={() => onUpdateWater({ enabled: !water.enabled })}
          style={water.enabled ? chipOn : chipOff}
        >
          {water.enabled ? 'Enabled' : 'Disabled'}
        </button>
        {water.enabled && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Height</label>
              <input
                type="range" min={0} max={boxHeight} step={0.5}
                value={water.height}
                onChange={(e) => onUpdateWater({ height: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{water.height.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={water.color}
                onChange={(e) => onUpdateWater({ color: e.target.value })}
                style={{ width: 32, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{water.color}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Opac</label>
              <input
                type="range" min={0} max={1} step={0.05}
                value={water.opacity}
                onChange={(e) => onUpdateWater({ opacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{water.opacity.toFixed(2)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Amp</label>
              <input
                type="range" min={0} max={3} step={0.1}
                value={water.waveAmplitude}
                onChange={(e) => onUpdateWater({ waveAmplitude: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{water.waveAmplitude.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Speed</label>
              <input
                type="range" min={0} max={5} step={0.1}
                value={water.waveSpeed}
                onChange={(e) => onUpdateWater({ waveSpeed: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{water.waveSpeed.toFixed(1)}</span>
            </div>
          </>
        )}
      </Section>

      {/* 10. Weather */}
      <Section title="Weather">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(['none', 'snow', 'rain'] as WeatherType[]).map((t) => (
            <button
              key={t}
              onClick={() => onUpdateWeather({ type: t, color: t === 'snow' ? '#ffffff' : t === 'rain' ? '#a0c4ff' : weather.color })}
              style={weather.type === t ? chipOn : chipOff}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {weather.type !== 'none' && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Intns</label>
              <input
                type="range" min={0.5} max={3} step={0.1}
                value={weather.intensity}
                onChange={(e) => onUpdateWeather({ intensity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{weather.intensity.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Wind</label>
              <input
                type="range" min={-10} max={10} step={0.5}
                value={weather.windX}
                onChange={(e) => onUpdateWeather({ windX: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{weather.windX.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={weather.color}
                onChange={(e) => onUpdateWeather({ color: e.target.value })}
                style={{ width: 32, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{weather.color}</span>
            </div>
          </>
        )}
      </Section>

      {/* 11. Clouds */}
      <Section title="Clouds">
        <button
          onClick={() => onUpdateClouds({ enabled: !clouds.enabled })}
          style={clouds.enabled ? chipOn : chipOff}
        >
          {clouds.enabled ? 'Enabled' : 'Disabled'}
        </button>
        {clouds.enabled && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Count</label>
              <input
                type="range" min={1} max={30} step={1}
                value={clouds.count}
                onChange={(e) => onUpdateClouds({ count: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.count}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Alt</label>
              <input
                type="range" min={20} max={boxHeight} step={1}
                value={clouds.altitude}
                onChange={(e) => onUpdateClouds({ altitude: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.altitude}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Spread</label>
              <input
                type="range" min={0.3} max={2.0} step={0.1}
                value={clouds.spread}
                onChange={(e) => onUpdateClouds({ spread: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.spread.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Scale</label>
              <input
                type="range" min={0.3} max={3.0} step={0.1}
                value={clouds.scale}
                onChange={(e) => onUpdateClouds({ scale: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.scale.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Opac</label>
              <input
                type="range" min={0.1} max={1.0} step={0.05}
                value={clouds.opacity}
                onChange={(e) => onUpdateClouds({ opacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.opacity.toFixed(2)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Speed</label>
              <input
                type="range" min={0} max={5} step={0.1}
                value={clouds.speed}
                onChange={(e) => onUpdateClouds({ speed: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{clouds.speed.toFixed(1)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={clouds.color}
                onChange={(e) => onUpdateClouds({ color: e.target.value })}
                style={{ width: 32, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{clouds.color}</span>
            </div>
          </>
        )}
      </Section>

      {/* 12. God Rays */}
      <Section title="God Rays">
        <button
          onClick={() => onUpdateGodRays({ enabled: !godRays.enabled })}
          style={godRays.enabled ? chipOn : chipOff}
        >
          {godRays.enabled ? 'Enabled' : 'Disabled'}
        </button>
        {godRays.enabled && (
          <>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Count</label>
              <input
                type="range" min={1} max={6} step={1}
                value={godRays.count}
                onChange={(e) => onUpdateGodRays({ count: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{godRays.count}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Color</label>
              <input
                type="color"
                value={godRays.color}
                onChange={(e) => onUpdateGodRays({ color: e.target.value })}
                style={{ width: 32, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{godRays.color}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Opac</label>
              <input
                type="range" min={0.02} max={0.5} step={0.01}
                value={godRays.opacity}
                onChange={(e) => onUpdateGodRays({ opacity: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{godRays.opacity.toFixed(2)}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Y</label>
              <input
                type="range" min={20} max={boxHeight} step={1}
                value={godRays.originY}
                onChange={(e) => onUpdateGodRays({ originY: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{godRays.originY}</span>
            </div>
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Speed</label>
              <input
                type="range" min={0} max={5} step={0.1}
                value={godRays.speed}
                onChange={(e) => onUpdateGodRays({ speed: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{godRays.speed.toFixed(1)}</span>
            </div>
          </>
        )}
      </Section>

      {/* 12. Configs */}
      <Section title="Configs" count={configs.length}>
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <input
            type="text"
            placeholder="Config name..."
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
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
              if (configName.trim()) {
                onSaveConfig(configName.trim());
                setConfigName('');
              }
            }}
            style={chipAction}
          >
            Save
          </button>
        </div>
        {configs.map((cfg) => (
          <div
            key={cfg.id}
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
              title={`${cfg.name} — ${new Date(cfg.savedAt).toLocaleString()}`}
            >
              {cfg.name}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 4 }}>
                {cfg.models.length} models
              </span>
            </span>
            <button onClick={() => onLoadConfig(cfg.id)} style={chipAction}>
              Load
            </button>
            <button onClick={() => onCopyConfigJSON(cfg.id)} style={chipAction}>
              Copy
            </button>
            <button
              onClick={() => onDeleteConfig(cfg.id)}
              style={{ ...chipAction, color: 'rgba(255,100,100,0.8)' }}
            >
              Del
            </button>
          </div>
        ))}
      </Section>

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
