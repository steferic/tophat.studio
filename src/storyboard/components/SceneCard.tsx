/**
 * SceneCard - Visual card representing a single scene in the storyboard.
 * Shows type icon, prompt/source, duration, thumbnail, and actions.
 */

import React from 'react';
import type { Scene } from '../../types/project';
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
  const { selectScene, removeScene, moveScene, duplicateScene } = useStoryboardStore();

  const isSelected = selectedSceneId === scene.id;
  const isGenerating = generatingSceneId === scene.id;
  const config = TYPE_CONFIG[scene.type] ?? { label: scene.type, icon: '?', color: COLORS.textDim };

  const needsGeneration =
    (scene.type === 'ai-image' || scene.type === 'ai-video') && !('assetPath' in scene && scene.assetPath);

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

  const getAnimation = (): string | null => {
    if (scene.type === 'ai-image' || scene.type === 'image') {
      return (scene as { animation?: string }).animation ?? null;
    }
    return null;
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
          height: 100,
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
          }}
        >
          <SmallBtn label="^" title="Move up" onClick={() => moveScene(scene.id, 'up')} />
          <SmallBtn label="v" title="Move down" onClick={() => moveScene(scene.id, 'down')} />
          <SmallBtn label="dup" title="Duplicate" onClick={() => duplicateScene(scene.id)} />
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
