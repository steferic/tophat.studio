import React, { useMemo } from 'react';
import { Section } from '../ui/Section';
import { chipOn, chipOff } from '../ui/chipStyles';

interface StatusBlueprint {
  id: string;
  displayName: string;
  icon: string;
}

export interface StatusPanelProps {
  statusBlueprints: StatusBlueprint[];
  activeStatuses: string[];
  onToggleStatus: (id: string) => void;
  filterQuery: string;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  statusBlueprints,
  activeStatuses,
  onToggleStatus,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  const filtered = useMemo(
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

  if (filtered.length === 0) return null;

  return (
    <Section title="Status Effects" count={filtered.length}>
      {filtered.map((bp) => (
        <button
          key={bp.id}
          onClick={() => onToggleStatus(bp.id)}
          style={activeStatuses.includes(bp.id) ? chipOn : chipOff}
        >
          {bp.icon} {bp.displayName}
        </button>
      ))}
    </Section>
  );
};
