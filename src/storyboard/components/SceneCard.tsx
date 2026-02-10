/**
 * SceneCard - Visual card representing a single scene in the storyboard.
 * Shows type icon, prompt/source, duration, thumbnail, and actions.
 */

import React, { useRef, useState } from 'react';
import type { Scene, SegmentPurpose } from '../../types/project';
import { useStoryboardStore } from '../state/storyboardStore';

const COLORS = {
  bg: '#1e1e2e',
  bgHover: '#252536',
  bgSelected: '#2a2a40',
  border: '#313244',
  borderSelected: '#89b4fa',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  green: '#a6e3a1',
  red: '#f38ba8',
  yellow: '#f9e2af',
  purple: '#cba6f7',
  teal: '#94e2d5',
  peach: '#fab387',
};

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

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  'ai-video': { label: 'AI Video', icon: '🎬', color: COLORS.purple },
  'ai-image': { label: 'AI Image', icon: '🖼', color: COLORS.teal },
  composition: { label: 'Composition', icon: '📐', color: COLORS.accent },
  video: { label: 'Video', icon: '📹', color: COLORS.peach },
  image: { label: 'Image', icon: '🏞', color: COLORS.green },
};

export interface SceneCardProps {
  scene: Scene;
  index: number;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, index }) => {
  const selectedSceneId = useStoryboardStore((s) => s.selectedSceneId);
  const generatingSceneId = useStoryboardStore((s) => s.generatingSceneId);
  const { selectScene, removeScene, moveScene, duplicateScene, generateScene } = useStoryboardStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isSelected = selectedSceneId === scene.id;
  const isGenerating = generatingSceneId === scene.id;
  const config = TYPE_CONFIG[scene.type] ?? { label: scene.type, icon: '?', color: COLORS.textDim };

  const needsGeneration =
    (scene.type === 'ai-image' || scene.type === 'ai-video') && !('assetPath' in scene && scene.assetPath);
  const hasAsset =
    (scene.type === 'ai-image' || scene.type === 'ai-video') && 'assetPath' in scene && !!scene.assetPath;

  const getSubtitle = (): string => {
    switch (scene.type) {
      case 'ai-image':
      case 'ai-video':
        return scene.prompt.length > 80 ? scene.prompt.slice(0, 80) + '...' : scene.prompt;
      case 'composition':
        return scene.compositionId;
      case 'video':
        return scene.src;
      case 'image':
        return scene.src;
      default:
        return '';
    }
  };

  const getThumbnailSrc = (): string | null => {
    if (scene.type === 'ai-image' || scene.type === 'ai-video') {
      const assetPath = (scene as { assetPath?: string }).assetPath;
      if (assetPath) return `/${assetPath}`;
    }
    if (scene.type === 'image') return `/${scene.src}`;
    if (scene.type === 'video') return `/${scene.src}`;
    return null;
  };

  const thumbnailSrc = getThumbnailSrc();
  const isVideo = scene.type === 'ai-video' || scene.type === 'video';

  const getAnimation = (): string | null => {
    if (scene.type === 'ai-image' || scene.type === 'image') {
      return (scene as { animation?: string }).animation ?? null;
    }
    return null;
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div
      onClick={() => selectScene(scene.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 12,
        backgroundColor: isSelected ? COLORS.bgSelected : COLORS.bg,
        border: `1.5px solid ${isSelected ? COLORS.borderSelected : COLORS.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        minWidth: 180,
        maxWidth: 220,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Index badge */}
      <div
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: config.color,
          color: '#11111b',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {index + 1}
      </div>

      {/* Thumbnail area */}
      <div
        style={{
          width: '100%',
          height: 120,
          borderRadius: 6,
          backgroundColor: '#11111b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {needsGeneration ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{config.icon}</div>
            <div style={{ fontSize: 10, color: COLORS.yellow, marginTop: 4 }}>
              {isGenerating ? 'generating...' : 'needs generation'}
            </div>
          </div>
        ) : thumbnailSrc ? (
          isVideo ? (
            <div
              onClick={handleVideoClick}
              style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
            >
              <video
                ref={videoRef}
                src={thumbnailSrc}
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
              {/* Play/pause overlay */}
              {!isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.85)',
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
                        borderWidth: '6px 0 6px 10px',
                        borderColor: 'transparent transparent transparent #11111b',
                        marginLeft: 2,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <img
              src={thumbnailSrc}
              alt={(scene as any).prompt ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        ) : (
          <span>{config.icon}</span>
        )}

        {/* Duration badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: COLORS.text,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'monospace',
          }}
        >
          {scene.duration.toFixed(1)}s
        </div>

        {/* Animation badge */}
        {getAnimation() && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: COLORS.teal,
              fontSize: 9,
              padding: '2px 5px',
              borderRadius: 3,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {getAnimation()}
          </div>
        )}

        {/* Formula purpose badge */}
        {scene.formulaMeta && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: PURPOSE_COLORS[scene.formulaMeta.purpose],
              fontSize: 9,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 3,
              fontFamily: 'system-ui, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            {scene.formulaMeta.purpose}
          </div>
        )}
      </div>

      {/* Type label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {config.label}
        </span>
        {scene.transition && scene.transition.type !== 'none' && (
          <span style={{ fontSize: 9, color: COLORS.textDim }}>
            {scene.transition.type}
          </span>
        )}
      </div>

      {/* Subtitle / prompt */}
      <div
        style={{
          fontSize: 11,
          color: COLORS.textDim,
          lineHeight: 1.4,
          fontFamily: 'system-ui, sans-serif',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {getSubtitle()}
      </div>

      {/* Action buttons (visible on selection) */}
      {isSelected && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 2,
            flexWrap: 'wrap',
          }}
        >
          <SmallBtn label="^" title="Move up" onClick={() => moveScene(scene.id, 'up')} />
          <SmallBtn label="v" title="Move down" onClick={() => moveScene(scene.id, 'down')} />
          <SmallBtn label="dup" title="Duplicate" onClick={() => duplicateScene(scene.id)} />
          {needsGeneration && (
            <SmallBtn
              label={isGenerating ? '...' : 'gen'}
              title="Generate asset"
              onClick={(e) => {
                e.stopPropagation();
                generateScene(scene.id).catch((err) => alert(`Error: ${err.message}`));
              }}
              color={COLORS.green}
            />
          )}
          {hasAsset && (
            <SmallBtn
              label={isGenerating ? '...' : 'regen'}
              title="Re-generate with current prompt"
              onClick={(e) => {
                e.stopPropagation();
                useStoryboardStore.getState().regenerateScene(scene.id)
                  .catch((err) => alert(`Error: ${err.message}`));
              }}
              color={COLORS.yellow}
            />
          )}
          <div style={{ flex: 1 }} />
          <SmallBtn
            label="x"
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              removeScene(scene.id);
            }}
            color={COLORS.red}
          />
        </div>
      )}
    </div>
  );
};

const SmallBtn: React.FC<{
  label: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  color?: string;
}> = ({ label, title, onClick, color }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    title={title}
    style={{
      padding: '2px 6px',
      borderRadius: 4,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: 'transparent',
      color: color ?? COLORS.textDim,
      fontSize: 10,
      cursor: 'pointer',
      fontFamily: 'monospace',
    }}
  >
    {label}
  </button>
);
