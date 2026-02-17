import React from 'react';
import { Section } from '../ui/Section';
import { chipOn, chipOff } from '../ui/chipStyles';

const DECOMPOSITION_EFFECTS = ['shatter', 'dissolve', 'slice'] as const;

export interface DecompositionPanelProps {
  activeDecomposition: string | null;
  onToggleDecomposition: (type: string) => void;
  filterQuery: string;
}

export const DecompositionPanel: React.FC<DecompositionPanelProps> = ({
  activeDecomposition,
  onToggleDecomposition,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  const filtered = q
    ? DECOMPOSITION_EFFECTS.filter((e) => e.toLowerCase().includes(q))
    : [...DECOMPOSITION_EFFECTS];

  if (filtered.length === 0) return null;

  return (
    <Section title="Decomposition" count={filtered.length}>
      {filtered.map((type) => (
        <button
          key={type}
          onClick={() => onToggleDecomposition(type)}
          style={activeDecomposition === type ? chipOn : chipOff}
        >
          {type}
        </button>
      ))}
    </Section>
  );
};
