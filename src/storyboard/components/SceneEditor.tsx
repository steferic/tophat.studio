/**
 * SceneEditor - Right sidebar panel for editing the selected scene.
 * Prompt editing, model selection, duration, animation, transitions, audio.
 */

import React from 'react';
import { useStoryboardStore, useSelectedScene } from '../state/storyboardStore';
import type { TransitionType, KenBurnsPreset, AIModel } from '../../types/project';

const COLORS = {
  bg: '#1e1e2e',
  surface: '#181825',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  inputBg: '#11111b',
};

const TRANSITION_OPTIONS: TransitionType[] = [
  'none', 'crossfade', 'fade', 'slide', 'wipe', 'dissolve',
];

const KEN_BURNS_OPTIONS: KenBurnsPreset[] = [
  'zoom-in', 'zoom-out', 'pan-left', 'pan-right',
  'pan-up', 'pan-down', 'zoom-in-pan-right', 'zoom-out-pan-left',
];

const IMAGE_MODELS: AIModel[] = ['dall-e-3', 'gpt-image-1', 'imagen-4'];
const VIDEO_MODELS: AIModel[] = ['veo-2'];

export const SceneEditor: React.FC = () => {
  const scene = useSelectedScene();
  const { updateScene, setSceneTransition } = useStoryboardStore();

  if (!scene) {
    return (
      <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.textDim, fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>
          Select a scene to edit
        </span>
      </div>
    );
  }

  const update = (updates: Record<string, unknown>) => updateScene(scene.id, updates);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Scene Editor</div>

      {/* Scene ID */}
      <Field label="ID">
        <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: 'monospace' }}>
          {scene.id}
        </span>
      </Field>

      {/* Duration */}
      <Field label="Duration (s)">
        <NumberInput
          value={scene.duration}
          onChange={(v) => update({ duration: v })}
          min={0.5}
          max={60}
          step={0.5}
        />
      </Field>

      {/* Type-specific fields */}
      {(scene.type === 'ai-image' || scene.type === 'ai-video') && (
        <>
          <Field label="Prompt">
            <textarea
              value={scene.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 60,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            />
          </Field>

          <Field label="Model">
            <select
              value={scene.model}
              onChange={(e) => update({ model: e.target.value })}
              style={inputStyle}
            >
              {(scene.type === 'ai-image' ? IMAGE_MODELS : VIDEO_MODELS).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          {'assetPath' in scene && scene.assetPath && (
            <Field label="Asset">
              <span style={{ color: COLORS.green, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {scene.assetPath}
              </span>
            </Field>
          )}

          {'assetPath' in scene && !scene.assetPath && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: `${COLORS.yellow}15`,
                border: `1px solid ${COLORS.yellow}30`,
                borderRadius: 6,
                fontSize: 11,
                color: COLORS.yellow,
                fontFamily: 'system-ui, sans-serif',
                marginBottom: 8,
              }}
            >
              Not yet generated. Run batch generate or generate individually.
            </div>
          )}
        </>
      )}

      {scene.type === 'ai-image' && (
        <>
          <Field label="Animation">
            <select
              value={(scene as { animation?: string }).animation ?? ''}
              onChange={(e) => update({ animation: e.target.value || undefined })}
              style={inputStyle}
            >
              <option value="">None</option>
              {KEN_BURNS_OPTIONS.map((kb) => (
                <option key={kb} value={kb}>{kb}</option>
              ))}
            </select>
          </Field>

          <Field label="Size">
            <input
              type="text"
              value={(scene as { size?: string }).size ?? ''}
              onChange={(e) => update({ size: e.target.value })}
              placeholder="1792x1024"
              style={inputStyle}
            />
          </Field>
        </>
      )}

      {scene.type === 'image' && (
        <>
          <Field label="Source">
            <input
              type="text"
              value={scene.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="path/to/image.png"
              style={inputStyle}
            />
          </Field>
          <Field label="Animation">
            <select
              value={scene.animation ?? ''}
              onChange={(e) => update({ animation: e.target.value || undefined })}
              style={inputStyle}
            >
              <option value="">None</option>
              {KEN_BURNS_OPTIONS.map((kb) => (
                <option key={kb} value={kb}>{kb}</option>
              ))}
            </select>
          </Field>
        </>
      )}

      {scene.type === 'video' && (
        <>
          <Field label="Source">
            <input
              type="text"
              value={scene.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="videos/clip.mp4"
              style={inputStyle}
            />
          </Field>
          <Field label="Volume">
            <NumberInput
              value={scene.volume ?? 1}
              onChange={(v) => update({ volume: v })}
              min={0}
              max={1}
              step={0.1}
            />
          </Field>
          <Field label="Playback Rate">
            <NumberInput
              value={scene.playbackRate ?? 1}
              onChange={(v) => update({ playbackRate: v })}
              min={0.25}
              max={4}
              step={0.25}
            />
          </Field>
        </>
      )}

      {scene.type === 'composition' && (
        <Field label="Composition ID">
          <input
            type="text"
            value={scene.compositionId}
            onChange={(e) => update({ compositionId: e.target.value })}
            placeholder="LorenzAttractor"
            style={inputStyle}
          />
        </Field>
      )}

      {/* Transition */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 12 }}>
        <div style={{ ...labelStyle, marginBottom: 8 }}>Transition In</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={scene.transition?.type ?? 'none'}
            onChange={(e) =>
              setSceneTransition(scene.id, e.target.value as TransitionType, scene.transition?.duration)
            }
            style={{ ...inputStyle, flex: 2 }}
          >
            {TRANSITION_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <NumberInput
            value={scene.transition?.duration ?? 0.5}
            onChange={(v) =>
              setSceneTransition(scene.id, scene.transition?.type ?? 'crossfade', v)
            }
            min={0.1}
            max={3}
            step={0.1}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={labelStyle}>{label}</div>
    {children}
  </div>
);

const NumberInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: React.CSSProperties;
}> = ({ value, onChange, min, max, step, style }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    min={min}
    max={max}
    step={step}
    style={{ ...inputStyle, ...style }}
  />
);

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  width: 280,
  backgroundColor: COLORS.surface,
  borderLeft: `1px solid ${COLORS.border}`,
  padding: 16,
  overflowY: 'auto',
  flexShrink: 0,
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.text,
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: `1px solid ${COLORS.border}`,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: COLORS.textDim,
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: COLORS.inputBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  color: COLORS.text,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};
