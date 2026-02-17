import React from 'react';
import type { WorkshopModelEntry } from '../modelRegistry';
import { Section } from '../ui/Section';
import { chipOn, chipOff } from '../ui/chipStyles';

export interface ModelPanelProps {
  models: WorkshopModelEntry[];
  selectedModelId: string;
  isDancing: boolean;
  isEvolving: boolean;
  isEvolved: boolean;
  onSelectModel: (modelId: string) => void;
  onToggleDance: () => void;
  onToggleEvolving: () => void;
  onToggleEvolved: () => void;
}

export const ModelPanel: React.FC<ModelPanelProps> = ({
  models,
  selectedModelId,
  isDancing,
  isEvolving,
  isEvolved,
  onSelectModel,
  onToggleDance,
  onToggleEvolving,
  onToggleEvolved,
}) => {
  const cardModels = models.filter((m) => m.kind === 'card');
  const itemModels = models.filter((m) => m.kind === 'item');

  return (
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
        <button onClick={onToggleDance} style={isDancing ? chipOn : chipOff}>
          Dancing
        </button>
        <button onClick={onToggleEvolving} style={isEvolving ? chipOn : chipOff}>
          Evolving
        </button>
        <button onClick={onToggleEvolved} style={isEvolved ? chipOn : chipOff}>
          Evolved
        </button>
      </div>
    </Section>
  );
};
