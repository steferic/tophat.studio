import React, { useState } from 'react';
import type { WorkshopPreset } from '../presetTypes';
import { Section } from '../ui/Section';
import { chipAction } from '../ui/chipStyles';
import { matchesSectionQuery } from '../ui/matchesQuery';

export interface PresetPanelProps {
  presets: WorkshopPreset[];
  selectedModelId: string;
  onSavePreset: (name: string) => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onCopyPresetJSON: (id: string) => void;
  filterQuery: string;
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  presets,
  selectedModelId,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onCopyPresetJSON,
  filterQuery,
}) => {
  const [presetName, setPresetName] = useState('');
  if (!matchesSectionQuery(filterQuery, 'preset')) return null;

  const modelPresets = presets.filter((p) => p.modelId === selectedModelId);

  return (
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
  );
};
