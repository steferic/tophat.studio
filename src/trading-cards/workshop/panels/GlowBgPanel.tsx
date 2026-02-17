import React from 'react';
import { Section } from '../ui/Section';
import { chipOn, chipOff } from '../ui/chipStyles';
import { matchesSectionQuery } from '../ui/matchesQuery';

export interface GlowBgPanelProps {
  glowEnabled: boolean;
  glowColor: string;
  glowRadius: number;
  onToggleGlow: () => void;
  onChangeGlowColor: (hex: string) => void;
  onChangeGlowRadius: (radius: number) => void;
  filterQuery: string;
}

export const GlowBgPanel: React.FC<GlowBgPanelProps> = ({
  glowEnabled,
  glowColor,
  glowRadius,
  onToggleGlow,
  onChangeGlowColor,
  onChangeGlowRadius,
  filterQuery,
}) => {
  return (
    <>
      {matchesSectionQuery(filterQuery, 'glow') && (
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
    </>
  );
};
