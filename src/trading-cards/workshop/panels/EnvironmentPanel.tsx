import React from 'react';
import type { EnvironmentConfig } from '../../environment/environmentTypes';
import { Section } from '../ui/Section';

export interface EnvironmentPanelProps {
  envConfigs: EnvironmentConfig[];
  selectedEnvId: string | null;
  onSelectEnv: (id: string | null) => void;
  modelPosition: [number, number, number];
  modelRotationY: number;
  modelScale: number;
  onChangeModelPosition: (axis: 0 | 1 | 2, value: number) => void;
  onChangeModelRotationY: (value: number) => void;
  onChangeModelScale: (value: number) => void;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({
  envConfigs,
  selectedEnvId,
  onSelectEnv,
  modelPosition,
  modelRotationY,
  modelScale,
  onChangeModelPosition,
  onChangeModelRotationY,
  onChangeModelScale,
}) => (
  <Section title="Environment" count={envConfigs.length} defaultOpen>
    <select
      value={selectedEnvId ?? ''}
      onChange={(e) => onSelectEnv(e.target.value || null)}
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
      <option value="" style={{ background: '#1a1a2e' }}>
        None
      </option>
      {envConfigs.map((cfg) => (
        <option key={cfg.id} value={cfg.id} style={{ background: '#1a1a2e' }}>
          {cfg.name}
        </option>
      ))}
    </select>
    {envConfigs.length === 0 && (
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '2px 0' }}>
        Save environments in the Environment tab first
      </div>
    )}
    {selectedEnvId && (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Model Transform
        </div>
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <label key={axis} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ width: 14 }}>{axis}</span>
            <input
              type="range"
              min={-80}
              max={80}
              step={0.5}
              value={modelPosition[i]}
              onChange={(e) => onChangeModelPosition(i as 0 | 1 | 2, parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#64b4ff' }}
            />
            <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
              {modelPosition[i].toFixed(1)}
            </span>
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
          <span style={{ width: 14 }}>R</span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={modelRotationY}
            onChange={(e) => onChangeModelRotationY(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#64b4ff' }}
          />
          <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
            {modelRotationY.toFixed(0)}
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
          <span style={{ width: 14 }}>S</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={modelScale}
            onChange={(e) => onChangeModelScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#64b4ff' }}
          />
          <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
            {modelScale.toFixed(1)}
          </span>
        </label>
      </div>
    )}
  </Section>
);
