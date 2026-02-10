/**
 * Timeline - Bottom panel showing a visual timeline of all scenes.
 * Horizontal bars representing duration, transition overlaps, and audio layers.
 */

import React from 'react';
import { useStoryboardStore } from '../state/storyboardStore';
import type { Scene } from '../../types/project';

const COLORS = {
  bg: '#11111b',
  surface: '#181825',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  green: '#a6e3a1',
  purple: '#cba6f7',
  teal: '#94e2d5',
  peach: '#fab387',
  yellow: '#f9e2af',
  red: '#f38ba8',
};

const TYPE_COLORS: Record<string, string> = {
  'ai-video': COLORS.purple,
  'ai-image': COLORS.teal,
  composition: COLORS.accent,
  video: COLORS.peach,
  image: COLORS.green,
};

export const Timeline: React.FC<{ onPlay?: () => void }> = ({ onPlay }) => {
  const project = useStoryboardStore((s) => s.project);
  const selectedSceneId = useStoryboardStore((s) => s.selectedSceneId);
  const totalDuration = useStoryboardStore((s) => s.totalDuration);
  const { selectScene } = useStoryboardStore();

  const pixelsPerSecond = totalDuration > 0 ? Math.max(60, Math.min(200, 900 / totalDuration)) : 100;

  // Calculate scene positions accounting for transition overlaps
  const scenePositions: Array<{
    scene: Scene;
    startSec: number;
    widthSec: number;
    transitionSec: number;
  }> = [];

  let currentTime = 0;
  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];
    const transitionSec =
      i > 0
        ? ((scene.transition?.type ?? project.defaultTransition?.type) !== 'none'
            ? (scene.transition?.duration ?? project.defaultTransition?.duration ?? 0)
            : 0)
        : 0;

    scenePositions.push({
      scene,
      startSec: currentTime - transitionSec,
      widthSec: scene.duration,
      transitionSec,
    });

    currentTime += scene.duration - transitionSec;
  }

  return (
    <div style={containerStyle}>
      {/* Header row */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>Timeline</span>
          {project.scenes.length > 0 && onPlay && (
            <button
              onClick={onPlay}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                border: 'none',
                backgroundColor: COLORS.accent,
                color: '#11111b',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              ▶ Preview
            </button>
          )}
        </div>
        <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: 'monospace' }}>
          {totalDuration.toFixed(1)}s total
        </span>
      </div>

      {/* Timeline tracks */}
      <div style={trackContainerStyle}>
        {/* Time ruler */}
        <div style={rulerStyle}>
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: i * pixelsPerSecond,
                top: 0,
                bottom: 0,
                borderLeft: `1px solid ${i % 5 === 0 ? COLORS.border : `${COLORS.border}60`}`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 3,
                  fontSize: 9,
                  color: COLORS.textDim,
                  fontFamily: 'monospace',
                }}
              >
                {i}s
              </span>
            </div>
          ))}
        </div>

        {/* Scene bars */}
        <div style={{ position: 'relative', height: 40, marginTop: 20 }}>
          {scenePositions.map(({ scene, startSec, widthSec, transitionSec }) => {
            const isSelected = selectedSceneId === scene.id;
            const color = TYPE_COLORS[scene.type] ?? COLORS.textDim;
            const needsGen =
              (scene.type === 'ai-image' || scene.type === 'ai-video') &&
              !('assetPath' in scene && scene.assetPath);

            return (
              <div
                key={scene.id}
                onClick={() => selectScene(scene.id)}
                style={{
                  position: 'absolute',
                  left: Math.max(0, startSec * pixelsPerSecond),
                  width: widthSec * pixelsPerSecond,
                  height: 36,
                  backgroundColor: `${color}${isSelected ? '40' : '25'}`,
                  border: `1.5px solid ${isSelected ? color : `${color}60`}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  gap: 6,
                  overflow: 'hidden',
                  transition: 'all 0.1s ease',
                }}
              >
                {/* Transition overlap indicator */}
                {transitionSec > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: transitionSec * pixelsPerSecond,
                      background: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        ${color}20 3px,
                        ${color}20 6px
                      )`,
                      borderRight: `1px dashed ${color}40`,
                    }}
                  />
                )}

                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {getSceneLabel(scene)}
                </span>

                {needsGen && (
                  <span style={{ fontSize: 8, color: COLORS.yellow, flexShrink: 0 }}>
                    *
                  </span>
                )}

                {/* Duration badge */}
                <span
                  style={{
                    fontSize: 9,
                    color: `${color}99`,
                    marginLeft: 'auto',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {widthSec.toFixed(1)}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Audio layers */}
        {project.audioLayers && project.audioLayers.length > 0 && (
          <div style={{ position: 'relative', height: 24, marginTop: 8 }}>
            <span
              style={{
                position: 'absolute',
                left: -45,
                top: 4,
                fontSize: 9,
                color: COLORS.textDim,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Audio
            </span>
            {project.audioLayers.map((layer, i) => {
              const startSec = layer.startAt ?? 0;
              const layerDuration = layer.loop ? totalDuration - startSec : totalDuration - startSec;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: startSec * pixelsPerSecond,
                    width: layerDuration * pixelsPerSecond,
                    height: 20,
                    backgroundColor: `${COLORS.yellow}20`,
                    border: `1px solid ${COLORS.yellow}40`,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 6px',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: COLORS.yellow,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {layer.src.split('/').pop()} {layer.loop ? '(loop)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {project.scenes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 20,
            color: COLORS.textDim,
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Add scenes to see the timeline
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSceneLabel(scene: Scene): string {
  switch (scene.type) {
    case 'ai-video':
    case 'ai-image':
      return scene.prompt.length > 30 ? scene.prompt.slice(0, 30) + '...' : scene.prompt;
    case 'composition':
      return scene.compositionId;
    case 'video':
      return scene.src.split('/').pop() ?? scene.src;
    case 'image':
      return scene.src.split('/').pop() ?? scene.src;
    default:
      return (scene as Scene & { id: string }).id;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  backgroundColor: COLORS.surface,
  borderTop: `1px solid ${COLORS.border}`,
  flexShrink: 0,
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 16px',
  borderBottom: `1px solid ${COLORS.border}`,
};

const trackContainerStyle: React.CSSProperties = {
  padding: '8px 16px 12px 60px',
  overflowX: 'auto',
  overflowY: 'hidden',
  position: 'relative',
  minHeight: 60,
};

const rulerStyle: React.CSSProperties = {
  position: 'relative',
  height: 18,
};
