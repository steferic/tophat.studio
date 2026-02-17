import React from 'react';
import type { MaskConfig } from '../maskRegistry';
import { MASK_PATTERNS, MASK_GLOBAL_PARAMS, ZONE_EFFECT_PARAMS } from '../maskRegistry';
import { FilterParamControls } from '../FilterParamControls';
import { Section } from '../ui/Section';
import { chipOn, chipOff } from '../ui/chipStyles';
import { sliderRowStyle, labelStyle, monoValue } from '../ui/chipStyles';

export interface MaskPanelProps {
  maskConfig: MaskConfig;
  onToggleMask: () => void;
  onChangeMaskParam: (key: string, value: any) => void;
  onChangeMaskPattern: (pattern: string) => void;
  onChangeZoneParam: (zone: 'zoneA' | 'zoneB', key: string, value: any) => void;
}

// Params that aren't cell size (rendered via generic FilterParamControls)
const NON_CELL_PARAMS = MASK_GLOBAL_PARAMS.filter(
  (p) => p.key !== 'cellSizeX' && p.key !== 'cellSizeY',
);

export const MaskPanel: React.FC<MaskPanelProps> = ({
  maskConfig,
  onToggleMask,
  onChangeMaskParam,
  onChangeMaskPattern,
  onChangeZoneParam,
}) => {
  const cellX = maskConfig.cellSizeX ?? 0.1;
  const cellY = maskConfig.cellSizeY ?? 0.1;
  const linked = maskConfig.cellLinked ?? true;

  const handleCellX = (v: number) => {
    onChangeMaskParam('cellSizeX', v);
    if (linked) onChangeMaskParam('cellSizeY', v);
  };
  const handleCellY = (v: number) => {
    onChangeMaskParam('cellSizeY', v);
    if (linked) onChangeMaskParam('cellSizeX', v);
  };
  const handleSnap = () => {
    // Snap Y to X value
    onChangeMaskParam('cellSizeY', cellX);
    onChangeMaskParam('cellLinked', true);
  };

  return (
    <Section title="Masked Effects" count={MASK_PATTERNS.length}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button
          onClick={onToggleMask}
          style={maskConfig.enabled ? chipOn : chipOff}
        >
          {maskConfig.enabled ? 'Mask ON' : 'Mask OFF'}
        </button>
        {maskConfig.enabled && (
          <>
            <select
              value={maskConfig.pattern}
              onChange={(e) => onChangeMaskPattern(e.target.value)}
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
              {MASK_PATTERNS.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#1a1a2e' }}>
                  {p.displayName}
                </option>
              ))}
            </select>

            {/* Cell Size X */}
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Cell X</label>
              <input
                type="range"
                min={0.01} max={0.5} step={0.01}
                value={cellX}
                onChange={(e) => handleCellX(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{cellX.toFixed(2)}</span>
            </div>

            {/* Cell Size Y */}
            <div style={sliderRowStyle}>
              <label style={labelStyle}>Cell Y</label>
              <input
                type="range"
                min={0.01} max={0.5} step={0.01}
                value={cellY}
                onChange={(e) => handleCellY(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={monoValue}>{cellY.toFixed(2)}</span>
            </div>

            {/* Link / Snap-to-square */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => {
                  const next = !linked;
                  onChangeMaskParam('cellLinked', next);
                  if (next) onChangeMaskParam('cellSizeY', cellX);
                }}
                style={linked ? chipOn : chipOff}
                title="Link X & Y so they stay equal"
              >
                {linked ? 'Linked' : 'Unlinked'}
              </button>
              {!linked && (
                <button
                  onClick={handleSnap}
                  style={chipOff}
                  title="Snap Y to match X (make square)"
                >
                  Snap Square
                </button>
              )}
            </div>

            <FilterParamControls
              filterDef={{ params: NON_CELL_PARAMS }}
              values={maskConfig}
              onChange={(key, value) => onChangeMaskParam(key, value)}
            />
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(100,180,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 4 }}>
              Zone A
            </div>
            <FilterParamControls
              filterDef={{ params: ZONE_EFFECT_PARAMS }}
              values={maskConfig.zoneA}
              onChange={(key, value) => onChangeZoneParam('zoneA', key, value)}
            />
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(168,85,247,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 4 }}>
              Zone B
            </div>
            <FilterParamControls
              filterDef={{ params: ZONE_EFFECT_PARAMS }}
              values={maskConfig.zoneB}
              onChange={(key, value) => onChangeZoneParam('zoneB', key, value)}
            />
          </>
        )}
      </div>
    </Section>
  );
};
