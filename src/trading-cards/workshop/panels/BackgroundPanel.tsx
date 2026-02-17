import React from 'react';
import { Section } from '../ui/Section';
import { matchesSectionQuery } from '../ui/matchesQuery';
import { FilterParamControls } from '../FilterParamControls';
import { BG_PATTERN_REGISTRY, getBgPatternDef } from '../backgroundPatternRegistry';
import type { BgPatternConfig } from '../backgroundPatternRegistry';

export interface BackgroundPanelProps {
  bgPattern: BgPatternConfig;
  onSetPattern: (id: string) => void;
  onSetParam: (key: string, value: any) => void;
  filterQuery: string;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  bgPattern,
  onSetPattern,
  onSetParam,
  filterQuery,
}) => {
  if (!matchesSectionQuery(filterQuery, 'background pattern bg')) return null;

  const currentDef = getBgPatternDef(bgPattern.pattern);

  return (
    <Section title="Background" count={1}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {/* Pattern selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 50 }}>Pattern</label>
          <select
            value={bgPattern.pattern}
            onChange={(e) => onSetPattern(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 11,
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            {BG_PATTERN_REGISTRY.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#1a1a2e' }}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Param controls */}
        {currentDef && currentDef.params.length > 0 && (
          <FilterParamControls
            filterDef={currentDef}
            values={bgPattern.params}
            onChange={onSetParam}
          />
        )}
      </div>
    </Section>
  );
};
