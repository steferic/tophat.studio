import React from 'react';
import type { CameraAutomationState, CameraAutomationActions } from '../hooks/useCameraAutomation';
import { Section } from '../ui/Section';
import { chipOn, chipOff, sliderRowStyle, labelStyle, monoValue } from '../ui/chipStyles';

export interface CameraAutomationPanelProps {
  automation: CameraAutomationState;
  actions: CameraAutomationActions;
  filterQuery: string;
}

const MODES = [
  { key: 'orbit' as const, label: 'Auto-Orbit', desc: 'Continuous rotation' },
  { key: 'breathe' as const, label: 'Breathing Zoom', desc: 'Sinusoidal dolly' },
  { key: 'vertigo' as const, label: 'Dolly Zoom', desc: 'Vertigo effect' },
  { key: 'drift' as const, label: 'Drift', desc: 'Handheld wander' },
  { key: 'epicycle' as const, label: 'Epicycle Orbit', desc: 'Spirograph path' },
] as const;

export const CameraAutomationPanel: React.FC<CameraAutomationPanelProps> = ({
  automation,
  actions,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  if (q && !matchesAny(q, ['camera', 'orbit', 'zoom', 'vertigo', 'drift', 'epicycle', 'automation', 'breathe', 'dolly', 'spiral'])) {
    return null;
  }

  const activeCount = MODES.filter((m) => automation[m.key].enabled).length;

  return (
    <Section title="Camera Automation" count={activeCount}>
      {/* Mode toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => actions.toggle(m.key)}
            style={automation[m.key].enabled ? chipOn : chipOff}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Auto-Orbit params */}
      {automation.orbit.enabled && (
        <Slider
          label="Speed"
          value={automation.orbit.speed}
          min={-5} max={5} step={0.1}
          onChange={(v) => actions.setParam('orbit', 'speed', v)}
          format={(v) => v.toFixed(1)}
        />
      )}

      {/* Breathing Zoom params */}
      {automation.breathe.enabled && (
        <>
          <Slider
            label="Amp"
            value={automation.breathe.amplitude}
            min={0.05} max={1.0} step={0.05}
            onChange={(v) => actions.setParam('breathe', 'amplitude', v)}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Speed"
            value={automation.breathe.speed}
            min={0.1} max={3.0} step={0.1}
            onChange={(v) => actions.setParam('breathe', 'speed', v)}
            format={(v) => v.toFixed(1)}
          />
        </>
      )}

      {/* Dolly Zoom / Vertigo params */}
      {automation.vertigo.enabled && (
        <>
          <Slider
            label="Speed"
            value={automation.vertigo.speed}
            min={0.1} max={2.0} step={0.05}
            onChange={(v) => actions.setParam('vertigo', 'speed', v)}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Intns"
            value={automation.vertigo.intensity}
            min={0.1} max={1.0} step={0.05}
            onChange={(v) => actions.setParam('vertigo', 'intensity', v)}
            format={(v) => v.toFixed(2)}
          />
        </>
      )}

      {/* Drift params */}
      {automation.drift.enabled && (
        <>
          <Slider
            label="Intns"
            value={automation.drift.intensity}
            min={0.1} max={2.0} step={0.05}
            onChange={(v) => actions.setParam('drift', 'intensity', v)}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Speed"
            value={automation.drift.speed}
            min={0.1} max={3.0} step={0.1}
            onChange={(v) => actions.setParam('drift', 'speed', v)}
            format={(v) => v.toFixed(1)}
          />
        </>
      )}

      {/* Epicycle Orbit params */}
      {automation.epicycle.enabled && (
        <>
          <Slider
            label="Speed"
            value={automation.epicycle.speed}
            min={0.05} max={2.0} step={0.05}
            onChange={(v) => actions.setParam('epicycle', 'speed', v)}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Cmplx"
            value={automation.epicycle.complexity}
            min={2} max={9} step={0.5}
            onChange={(v) => actions.setParam('epicycle', 'complexity', v)}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Radius"
            value={automation.epicycle.radius}
            min={0.3} max={3.0} step={0.1}
            onChange={(v) => actions.setParam('epicycle', 'radius', v)}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="V-Amp"
            value={automation.epicycle.verticalAmp}
            min={0} max={1.0} step={0.05}
            onChange={(v) => actions.setParam('epicycle', 'verticalAmp', v)}
            format={(v) => v.toFixed(2)}
          />
        </>
      )}
    </Section>
  );
};

// ── Helpers ──────────────────────────────────────────────────

function matchesAny(query: string, terms: string[]): boolean {
  return terms.some((t) => t.includes(query) || query.includes(t));
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}> = ({ label, value, min, max, step, onChange, format }) => (
  <div style={sliderRowStyle}>
    <label style={labelStyle}>{label}</label>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1 }}
    />
    <span style={monoValue}>{format(value)}</span>
  </div>
);
