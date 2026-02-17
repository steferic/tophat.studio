import React from 'react';
import type { CameraPreset } from '../../arena/descriptorTypes';
import { Section } from '../ui/Section';
import { chipAction } from '../ui/chipStyles';

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

export interface CameraPanelProps {
  onTriggerCamera: (preset: CameraPreset) => void;
  filterQuery: string;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({ onTriggerCamera, filterQuery }) => {
  const q = filterQuery.toLowerCase();
  const filtered = q ? CAMERA_PRESETS.filter((p) => p.toLowerCase().includes(q)) : CAMERA_PRESETS;
  if (filtered.length === 0) return null;

  return (
    <Section title="Camera" count={filtered.length}>
      {filtered.map((preset) => (
        <button
          key={preset}
          onClick={() => onTriggerCamera(preset)}
          style={chipAction}
        >
          {preset}
        </button>
      ))}
    </Section>
  );
};
