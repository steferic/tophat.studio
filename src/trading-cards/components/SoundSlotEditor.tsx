import React from 'react';
import type { SOUND_SLOTS } from '../audio/soundSlots';
import type { StoredRecording, AudioEffects } from '../audio/recordingStore';

// ── Effect parameter config ─────────────────────────────────

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

type EffectKey = keyof AudioEffects;

const EFFECT_PARAMS: Record<EffectKey, ParamDef[]> = {
  reverb: [
    { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
    { key: 'decay', label: 'Decay', min: 0.1, max: 4.0, step: 0.1, format: (v) => `${v.toFixed(1)}s` },
  ],
  distortion: [
    { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
    { key: 'drive', label: 'Drive', min: 1, max: 100, step: 1, format: (v) => `${Math.round(v)}` },
  ],
  echo: [
    { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
    { key: 'delay', label: 'Dly', min: 0.05, max: 1.0, step: 0.05, format: (v) => `${v.toFixed(2)}s` },
    { key: 'feedback', label: 'Fb', min: 0, max: 0.85, step: 0.05, format: (v) => v.toFixed(2) },
  ],
  reverse: [
    { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  ],
};

// ── Component ───────────────────────────────────────────────

interface SoundSlotEditorProps {
  slot: (typeof SOUND_SLOTS)[number];
  recording: StoredRecording | null;
  isRecording: boolean;
  onRecord: () => void;
  onStopRecord: () => void;
  onPlay: () => void;
  onPitchChange: (rate: number) => void;
  onEffectToggle: (effect: EffectKey) => void;
  onEffectParamChange: (effect: EffectKey, param: string, value: number) => void;
  onDelete: () => void;
}

const btnBase: React.CSSProperties = {
  border: 'none',
  borderRadius: 4,
  padding: '3px 8px',
  fontSize: 9,
  fontWeight: 700,
  cursor: 'pointer',
  lineHeight: 1.4,
};

const EFFECT_CHIPS: { key: EffectKey; label: string; color: string }[] = [
  { key: 'reverb', label: 'REVERB', color: '#818cf8' },
  { key: 'distortion', label: 'DISTORT', color: '#f97316' },
  { key: 'echo', label: 'ECHO', color: '#22d3ee' },
  { key: 'reverse', label: 'REVERSE', color: '#a78bfa' },
];

export const SoundSlotEditor: React.FC<SoundSlotEditorProps> = ({
  slot,
  recording,
  isRecording,
  onRecord,
  onStopRecord,
  onPlay,
  onPitchChange,
  onEffectToggle,
  onEffectParamChange,
  onDelete,
}) => {
  const activeEffects = EFFECT_CHIPS.filter(
    ({ key }) => recording?.effects?.[key]?.enabled,
  );

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#e0e0e0' }}>
          {slot.icon} {slot.label}
        </span>
        {recording && (
          <button
            onClick={onDelete}
            style={{
              ...btnBase,
              background: 'rgba(239,68,68,0.2)',
              color: '#f87171',
              fontSize: 8,
            }}
          >
            DELETE
          </button>
        )}
      </div>

      {/* Description */}
      <div style={{ fontSize: 8, color: '#888', lineHeight: 1.3 }}>{slot.description}</div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isRecording ? (
          <button
            onClick={onStopRecord}
            style={{
              ...btnBase,
              background: '#ef4444',
              color: '#fff',
              animation: 'pulse-rec 1s ease-in-out infinite',
            }}
          >
            STOP
          </button>
        ) : (
          <button
            onClick={onRecord}
            style={{
              ...btnBase,
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
            }}
          >
            REC
          </button>
        )}

        <button
          onClick={onPlay}
          disabled={!recording}
          style={{
            ...btnBase,
            background: recording ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
            color: recording ? '#4ade80' : '#555',
            cursor: recording ? 'pointer' : 'default',
          }}
        >
          PLAY
        </button>

        {/* Pitch slider */}
        <span style={{ fontSize: 8, color: '#888', marginLeft: 'auto' }}>Pitch:</span>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.05}
          value={recording?.pitchRate ?? 1.0}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          disabled={!recording}
          style={{ width: 60, accentColor: '#e8d44d', height: 10 }}
        />
        <span style={{ fontSize: 8, color: '#aaa', minWidth: 22, textAlign: 'right' }}>
          {(recording?.pitchRate ?? 1.0).toFixed(2)}x
        </span>
      </div>

      {/* Effect toggle chips */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {EFFECT_CHIPS.map(({ key, label, color }) => {
          const active = recording?.effects?.[key]?.enabled ?? false;
          return (
            <button
              key={key}
              onClick={() => onEffectToggle(key)}
              disabled={!recording}
              style={{
                ...btnBase,
                fontSize: 7,
                padding: '2px 6px',
                borderRadius: 3,
                background: active ? `${color}33` : 'rgba(255,255,255,0.05)',
                color: active ? color : '#555',
                border: active ? `1px solid ${color}55` : '1px solid transparent',
                cursor: recording ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Per-effect parameter sliders */}
      {activeEffects.map(({ key, label, color }) => {
        const params = EFFECT_PARAMS[key];
        const effectState = recording!.effects[key] as unknown as Record<string, number>;
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              paddingLeft: 2,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 7, color, fontWeight: 700, minWidth: 32 }}>
              {label}:
            </span>
            {params.map((p) => (
              <React.Fragment key={p.key}>
                <span style={{ fontSize: 7, color: '#777' }}>{p.label}</span>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={effectState[p.key] ?? p.min}
                  onChange={(e) => onEffectParamChange(key, p.key, parseFloat(e.target.value))}
                  style={{ width: 48, height: 10, accentColor: color }}
                />
                <span style={{ fontSize: 7, color: '#aaa', minWidth: 24 }}>
                  {p.format(effectState[p.key] ?? p.min)}
                </span>
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
};
