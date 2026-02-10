/**
 * SceneEditor - Right sidebar panel for editing the selected scene.
 * Prompt editing, model selection, duration, animation, transitions, audio.
 */

import React, { useRef, useState } from 'react';
import { useStoryboardStore, useSelectedScene } from '../state/storyboardStore';
import type { TransitionType, KenBurnsPreset, AIModel, VideoProject, AIImageScene, AIVideoScene, SegmentPurpose } from '../../types/project';
import type { AssetEntry } from '../state/storyboardStore';

const COLORS = {
  bg: '#1e1e2e',
  surface: '#181825',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  red: '#f38ba8',
  teal: '#94e2d5',
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

const PURPOSE_COLORS: Record<SegmentPurpose, string> = {
  hook: '#f38ba8',
  setup: '#89b4fa',
  progression: '#a6e3a1',
  're-engage': '#f9e2af',
  middle: '#94e2d5',
  climax: '#fab387',
  end: '#cba6f7',
  custom: '#6c7086',
};

const FormulaMetaSection: React.FC<{ scene: NonNullable<ReturnType<typeof useSelectedScene>> }> = ({ scene }) => {
  const meta = scene.formulaMeta;
  if (!meta) return null;

  const purposeColor = PURPOSE_COLORS[meta.purpose];

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        borderRadius: 8,
        backgroundColor: `${purposeColor}10`,
        border: `1px solid ${purposeColor}30`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: `${purposeColor}20`,
            color: purposeColor,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {meta.purpose}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
          {meta.segmentLabel}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>
        <span>Energy: {meta.style.energy}/10</span>
        <span>{meta.style.colorMood}</span>
        <span>{meta.style.audioMood}</span>
      </div>

      <div style={{ fontSize: 10, color: COLORS.textDim }}>
        Pacing: {meta.style.pacing.cutsPerMin} cuts/min &middot; {meta.style.pacing.shotDuration}s shots
      </div>

      {meta.promptHint && (
        <div style={{ fontSize: 11, color: COLORS.green, fontStyle: 'italic', marginTop: 6 }}>
          Hint: {meta.promptHint}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reference Image Field
// ---------------------------------------------------------------------------

const ReferenceImageField: React.FC<{
  scene: NonNullable<ReturnType<typeof useSelectedScene>>;
  project: VideoProject;
  assets: AssetEntry[];
  extractingFrame: boolean;
  onUpdate: (updates: Record<string, unknown>) => void;
  onExtractFrame: (videoPath: string) => void;
}> = ({ scene, project, assets, extractingFrame, onUpdate, onExtractFrame }) => {
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  if (scene.type !== 'ai-image' && scene.type !== 'ai-video') return null;
  const refImage = (scene as AIImageScene | AIVideoScene).referenceImage;

  // Find previous scene
  const sceneIndex = project.scenes.findIndex((s) => s.id === scene.id);
  const prevScene = sceneIndex > 0 ? project.scenes[sceneIndex - 1] : null;

  // Determine if we can extract a last frame from the previous scene
  const prevAssetPath = (() => {
    if (!prevScene) return null;
    if (prevScene.type === 'ai-image' || prevScene.type === 'ai-video') {
      return (prevScene as AIImageScene | AIVideoScene).assetPath ?? null;
    }
    if (prevScene.type === 'image') return prevScene.src;
    if (prevScene.type === 'video') return prevScene.src;
    return null;
  })();

  const prevIsVideo = prevScene?.type === 'ai-video' || prevScene?.type === 'video';
  const prevIsImage = prevScene?.type === 'ai-image' || prevScene?.type === 'image';

  // Filter assets to images only for the picker
  const imageAssets = assets.filter((a) => a.type === 'image');

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>Reference Image</div>

      {/* Current reference display */}
      {refImage ? (
        <div style={{ marginBottom: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
          }}>
            <img
              src={`/${refImage}`}
              alt=""
              style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: `1px solid ${COLORS.border}` }}
            />
            <span style={{ fontSize: 10, color: COLORS.green, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
              {refImage}
            </span>
            <button
              onClick={() => onUpdate({ referenceImage: undefined })}
              style={{
                padding: '2px 6px', borderRadius: 4, border: `1px solid ${COLORS.border}`,
                backgroundColor: 'transparent', color: COLORS.red, fontSize: 10, cursor: 'pointer',
              }}
            >
              x
            </button>
          </div>
          <div style={{ fontSize: 9, color: COLORS.textDim }}>
            {scene.type === 'ai-video'
              ? 'Will be used as the first frame of the video'
              : 'Will be used as input for image editing'}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>
          None set — generation will start from scratch
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Use last frame of previous scene */}
        {prevAssetPath && (
          <button
            onClick={() => {
              if (prevIsVideo) {
                onExtractFrame(prevAssetPath);
              } else if (prevIsImage) {
                onUpdate({ referenceImage: prevAssetPath });
              }
            }}
            disabled={extractingFrame}
            style={{
              ...smallBtnStyle,
              backgroundColor: `${COLORS.accent}15`,
              borderColor: `${COLORS.accent}40`,
              color: COLORS.accent,
            }}
          >
            {extractingFrame
              ? 'Extracting frame...'
              : prevIsVideo
                ? `Last frame of Scene ${sceneIndex}`
                : `Use Scene ${sceneIndex} image`}
          </button>
        )}

        {/* Pick from assets */}
        <button
          onClick={() => setShowAssetPicker(!showAssetPicker)}
          style={{
            ...smallBtnStyle,
            backgroundColor: `${COLORS.teal}15`,
            borderColor: `${COLORS.teal}40`,
            color: COLORS.teal,
          }}
        >
          {showAssetPicker ? 'Hide assets' : 'Browse assets'}
        </button>

        {/* Manual path input */}
        <input
          type="text"
          value={refImage ?? ''}
          onChange={(e) => onUpdate({ referenceImage: e.target.value || undefined })}
          placeholder="ai/my-image.png"
          style={{ ...inputStyle, fontSize: 10 }}
        />
      </div>

      {/* Asset picker dropdown */}
      {showAssetPicker && (
        <div style={{
          maxHeight: 150, overflowY: 'auto', marginTop: 6,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          backgroundColor: COLORS.inputBg,
        }}>
          {imageAssets.length === 0 ? (
            <div style={{ padding: 8, fontSize: 10, color: COLORS.textDim, textAlign: 'center' }}>
              No image assets found
            </div>
          ) : imageAssets.map((asset) => (
            <div
              key={asset.filename}
              onClick={() => {
                onUpdate({ referenceImage: asset.path });
                setShowAssetPicker(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 8px', cursor: 'pointer',
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <img
                src={`/${asset.path}`}
                alt=""
                style={{ width: 32, height: 22, objectFit: 'cover', borderRadius: 3 }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: COLORS.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {asset.filename}
                </div>
                {asset.meta?.prompt && (
                  <div style={{ fontSize: 9, color: COLORS.textDim, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {String(asset.meta.prompt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 5,
  border: '1px solid',
  backgroundColor: 'transparent',
  fontSize: 10,
  cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
  textAlign: 'left',
};

// ---------------------------------------------------------------------------
// Asset Preview (video player / image preview)
// ---------------------------------------------------------------------------

const AssetPreview: React.FC<{ scene: NonNullable<ReturnType<typeof useSelectedScene>> }> = ({ scene }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Resolve the preview source
  let src: string | null = null;
  let isVideo = false;

  if (scene.type === 'ai-image' || scene.type === 'ai-video') {
    const assetPath = (scene as AIImageScene | AIVideoScene).assetPath;
    if (assetPath) {
      src = `/${assetPath}`;
      isVideo = scene.type === 'ai-video';
    }
  } else if (scene.type === 'video') {
    src = `/${scene.src}`;
    isVideo = true;
  } else if (scene.type === 'image') {
    src = `/${scene.src}`;
  }

  if (!src) return null;

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#11111b',
          position: 'relative',
          cursor: isVideo ? 'pointer' : 'default',
        }}
        onClick={isVideo ? togglePlay : undefined}
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={src}
              style={{ width: '100%', display: 'block' }}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
            {!isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '8px 0 8px 14px',
                      borderColor: 'transparent transparent transparent #11111b',
                      marginLeft: 3,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <img src={src} alt="" style={{ width: '100%', display: 'block' }} />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene Editor
// ---------------------------------------------------------------------------

export const SceneEditor: React.FC = () => {
  const scene = useSelectedScene();
  const project = useStoryboardStore((s) => s.project);
  const assets = useStoryboardStore((s) => s.assets);
  const { updateScene, setSceneTransition, regenerateScene, generateScene } = useStoryboardStore();
  const generatingSceneId = useStoryboardStore((s) => s.generatingSceneId);
  const [extractingFrame, setExtractingFrame] = useState(false);

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

  // Find previous scene for "Continue" functionality
  const sceneIndex = project.scenes.findIndex((s) => s.id === scene.id);
  const prevScene = sceneIndex > 0 ? project.scenes[sceneIndex - 1] : null;

  const handleContinueFromPrevious = async () => {
    if (!prevScene) return;
    if (prevScene.type !== 'ai-image' && prevScene.type !== 'ai-video') return;

    const prev = prevScene as AIImageScene | AIVideoScene;
    const updates: Record<string, unknown> = {
      prompt: prev.prompt,
      model: scene.type === 'ai-video' ? (prev.model === 'veo-2' ? 'veo-2' : 'veo-2') : prev.model,
      duration: prev.duration,
    };

    // Set reference image from the previous scene's generated asset
    if (prev.assetPath) {
      const prevIsVideo = prevScene.type === 'ai-video';
      if (prevIsVideo) {
        // Extract last frame
        setExtractingFrame(true);
        try {
          const res = await fetch('/api/extract-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoPath: prev.assetPath }),
          });
          if (res.ok) {
            const { framePath } = await res.json();
            updates.referenceImage = framePath;
          }
        } catch { /* ignore extraction failure */ }
        setExtractingFrame(false);
      } else {
        updates.referenceImage = prev.assetPath;
      }
    }

    // For AI video scenes, keep model as veo-2
    if (scene.type === 'ai-video') {
      updates.model = 'veo-2';
    }
    // For AI image scenes, inherit the image model
    if (scene.type === 'ai-image' && (prev.model === 'dall-e-3' || prev.model === 'gpt-image-1' || prev.model === 'imagen-4')) {
      updates.model = prev.model;
    }

    update(updates);
  };

  // Can we show the "Continue" button?
  const canContinue = prevScene &&
    (prevScene.type === 'ai-image' || prevScene.type === 'ai-video') &&
    (scene.type === 'ai-image' || scene.type === 'ai-video');

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Scene Editor</div>

      {/* Continue from previous scene */}
      {canContinue && (
        <button
          onClick={handleContinueFromPrevious}
          disabled={extractingFrame}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: 12,
            borderRadius: 6,
            border: `1px solid ${COLORS.accent}50`,
            backgroundColor: `${COLORS.accent}15`,
            color: COLORS.accent,
            fontSize: 11,
            fontWeight: 600,
            cursor: extractingFrame ? 'default' : 'pointer',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'left',
            lineHeight: 1.5,
          }}
        >
          {extractingFrame ? 'Extracting frame...' : `Continue from Scene ${sceneIndex}`}
          <div style={{ fontSize: 9, fontWeight: 400, color: `${COLORS.accent}99`, marginTop: 2 }}>
            Copies prompt, model, duration + sets reference image
          </div>
        </button>
      )}

      {/* Formula metadata */}
      <FormulaMetaSection scene={scene} />

      {/* Asset Preview */}
      <AssetPreview scene={scene} />

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

          {/* Reference Image */}
          <ReferenceImageField
            scene={scene}
            project={project}
            assets={assets}
            extractingFrame={extractingFrame}
            onUpdate={update}
            onExtractFrame={async (videoPath: string) => {
              setExtractingFrame(true);
              try {
                const res = await fetch('/api/extract-frame', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ videoPath }),
                });
                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.error ?? 'Extraction failed');
                }
                const { framePath } = await res.json();
                update({ referenceImage: framePath });
              } catch (err: any) {
                alert(`Frame extraction failed: ${err.message}`);
              } finally {
                setExtractingFrame(false);
              }
            }}
          />

          {'assetPath' in scene && scene.assetPath && (
            <Field label="Asset">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: COLORS.green, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                  {scene.assetPath}
                </span>
              </div>
              <button
                onClick={() => regenerateScene(scene.id).catch((err: any) => alert(`Error: ${err.message}`))}
                disabled={generatingSceneId === scene.id}
                style={{
                  marginTop: 6,
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.yellow}50`,
                  backgroundColor: `${COLORS.yellow}15`,
                  color: COLORS.yellow,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: generatingSceneId === scene.id ? 'default' : 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                  opacity: generatingSceneId === scene.id ? 0.6 : 1,
                }}
              >
                {generatingSceneId === scene.id ? 'Regenerating...' : 'Regenerate with current prompt'}
              </button>
            </Field>
          )}

          {'assetPath' in scene && !scene.assetPath && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => generateScene(scene.id).catch((err: any) => alert(`Error: ${err.message}`))}
                disabled={generatingSceneId === scene.id}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.green}50`,
                  backgroundColor: `${COLORS.green}15`,
                  color: COLORS.green,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: generatingSceneId === scene.id ? 'default' : 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                  opacity: generatingSceneId === scene.id ? 0.6 : 1,
                }}
              >
                {generatingSceneId === scene.id ? 'Generating...' : 'Generate'}
              </button>
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
