/**
 * StoryboardApp - Main application shell for the storyboard UI.
 *
 * Layout:
 * ┌─ ProjectBar ──────────────────────────────────────────────┐
 * ├─ AssetLibrary │ SceneCards (storyboard)  │ SceneEditor ───┤
 * ├─ Timeline ────────────────────────────────────────────────┤
 * └───────────────────────────────────────────────────────────┘
 */

import React, { useEffect, useState } from 'react';
import { useStoryboardStore, useProjectScenes } from '../state/storyboardStore';
import { ProjectBar } from './ProjectBar';
import { AssetLibrary } from './AssetLibrary';
import { SceneCard } from './SceneCard';
import { SceneEditor } from './SceneEditor';
import { Timeline } from './Timeline';
import { PreviewPlayer } from './PreviewPlayer';
import { FormulaModal } from './FormulaModal';

const COLORS = {
  bg: '#11111b',
  surface: '#1e1e2e',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
};

export const StoryboardApp: React.FC = () => {
  const panels = useStoryboardStore((s) => s.panels);
  const scenes = useProjectScenes();
  const [showPreview, setShowPreview] = useState(false);

  // Load assets on mount
  useEffect(() => {
    useStoryboardStore.getState().refreshAssets();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const json = useStoryboardStore.getState().exportProjectJSON();
        const project = useStoryboardStore.getState().project;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.project.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Delete/Backspace: Remove selected scene
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

        const selectedId = useStoryboardStore.getState().selectedSceneId;
        if (selectedId) {
          useStoryboardStore.getState().removeScene(selectedId);
        }
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        useStoryboardStore.getState().selectScene(null);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={rootStyle}>
      {/* Top bar */}
      <ProjectBar />

      {/* Main content area */}
      <div style={mainStyle}>
        {/* Left: Asset Library */}
        {panels.assetLibrary && <AssetLibrary />}

        {/* Center: Storyboard */}
        <div style={centerStyle}>
          {scenes.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={storyboardStyle}>
              {scenes.map((scene, i) => (
                <React.Fragment key={scene.id}>
                  <SceneCard scene={scene} index={i} />
                  {/* Transition indicator between cards */}
                  {i < scenes.length - 1 && (
                    <TransitionIndicator
                      type={scenes[i + 1].transition?.type ?? useStoryboardStore.getState().project.defaultTransition?.type ?? 'none'}
                    />
                  )}
                </React.Fragment>
              ))}
              {/* Add more button at the end */}
              <AddMoreButton />
            </div>
          )}
        </div>

        {/* Right: Scene Editor */}
        {panels.sceneEditor && <SceneEditor />}
      </div>

      {/* Bottom: Timeline */}
      {panels.timeline && <Timeline onPlay={() => setShowPreview(true)} />}

      {/* Preview Player overlay */}
      {showPreview && (
        <PreviewPlayer
          scenes={scenes}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Formula Modal */}
      <FormulaModal />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      flex: 1,
      color: COLORS.textDim,
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div style={{ fontSize: 48, opacity: 0.3 }}>🎬</div>
    <div style={{ fontSize: 16, fontWeight: 500 }}>No scenes yet</div>
    <div style={{ fontSize: 13, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
      Use the panel on the left to add scenes. You can create AI-generated images
      and videos, add existing video files, or include Remotion compositions.
    </div>
    <div style={{ fontSize: 11, opacity: 0.7 }}>
      Keyboard: Delete to remove, Escape to deselect, Cmd+S to save
    </div>
  </div>
);

const TransitionIndicator: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'none') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>
        <div style={{ width: 12, height: 1, backgroundColor: COLORS.border }} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: '0 2px',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: `${COLORS.accent}20`,
          border: `1px solid ${COLORS.accent}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: COLORS.accent,
          fontFamily: 'system-ui, sans-serif',
        }}
        title={type}
      >
        ↔
      </div>
    </div>
  );
};

const AddMoreButton: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
      height: 140,
      border: `2px dashed ${COLORS.border}`,
      borderRadius: 10,
      color: COLORS.textDim,
      fontSize: 12,
      cursor: 'default',
      fontFamily: 'system-ui, sans-serif',
      flexShrink: 0,
    }}
  >
    ← add scenes
  </div>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  backgroundColor: COLORS.bg,
  color: COLORS.text,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  overflow: 'hidden',
};

const mainStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const centerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  padding: 16,
};

const storyboardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '20px 16px',
  overflowX: 'auto',
  overflowY: 'hidden',
  flex: 1,
  alignContent: 'center',
};
