import React from 'react';
import type { ShakePattern } from '../../arena/descriptorTypes';
import { Section } from '../ui/Section';
import { chipAction } from '../ui/chipStyles';

const SHAKE_PATTERNS: ShakePattern[] = ['sway', 'slam', 'spin', 'pulse', 'contract'];

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

export interface ShakeAudioPanelProps {
  onTriggerShake: (pattern: ShakePattern) => void;
  onPlaySynth: (key: string) => void;
  filterQuery: string;
}

export const ShakeAudioPanel: React.FC<ShakeAudioPanelProps> = ({
  onTriggerShake,
  onPlaySynth,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  const filteredShakes = q
    ? SHAKE_PATTERNS.filter((p) => p.toLowerCase().includes(q))
    : [...SHAKE_PATTERNS];
  const filteredSynths = q
    ? SYNTH_PRESET_KEYS.filter((k) => k.toLowerCase().includes(q))
    : [...SYNTH_PRESET_KEYS];

  return (
    <>
      {filteredShakes.length > 0 && (
        <Section title="Shake" count={filteredShakes.length}>
          {filteredShakes.map((pattern) => (
            <button
              key={pattern}
              onClick={() => onTriggerShake(pattern)}
              style={chipAction}
            >
              {pattern}
            </button>
          ))}
        </Section>
      )}

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
    </>
  );
};
