/**
 * Editor App - Main 3D Scene Editor Application
 *
 * A standalone editor for creating and editing 3D scenes.
 * Features:
 * - FPS camera controls with pointer lock
 * - Camera path recording
 * - Object placement and transform gizmos
 * - Motion path assignment
 * - Scene export to JSON for Remotion
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  useEditorStore,
  useCanUndo,
  useCanRedo,
} from './state/editorStore';
import { EditorCanvas } from './components/EditorCanvas';
import { ObjectHierarchy } from './components/ObjectHierarchy';
import { PropertiesPanel } from './components/PropertiesPanel';
import { AssetBrowser } from './components/AssetBrowser';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#11111b',
    color: '#cdd6f4',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#1e1e2e',
    borderBottom: '1px solid #313244',
    gap: 8,
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    paddingRight: 12,
    borderRight: '1px solid #313244',
    marginRight: 4,
  },
  toolbarButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.1s',
  },
  toolbarButtonActive: {
    backgroundColor: '#45475a',
    borderColor: '#89b4fa',
  },
  toolbarButtonHover: {
    backgroundColor: '#313244',
  },
  toolbarSpacer: {
    flex: 1,
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    width: 280,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1e1e2e',
    borderRight: '1px solid #313244',
  },
  leftPanelTabs: {
    display: 'flex',
    borderBottom: '1px solid #313244',
  },
  leftPanelTab: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6c7086',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  leftPanelTabActive: {
    backgroundColor: '#313244',
    color: '#cdd6f4',
  },
  leftPanelContent: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  rightPanel: {
    width: 300,
    flexShrink: 0,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 16px',
    backgroundColor: '#1e1e2e',
    borderTop: '1px solid #313244',
    fontSize: 11,
    color: '#6c7086',
    gap: 16,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#f38ba8',
    animation: 'pulse 1s ease-in-out infinite',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    backgroundColor: 'rgba(30, 30, 46, 0.9)',
    borderRadius: 8,
    border: '1px solid #313244',
    fontSize: 12,
    color: '#cdd6f4',
    pointerEvents: 'none',
  },
};

// ============================================================================
// Icons
// ============================================================================

const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
  </svg>
);

const MoveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

const RotateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
  </svg>
);

const ScaleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M15 3v18" />
    <path d="M3 15h18" />
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const RecordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" />
  </svg>
);

// ============================================================================
// Toolbar Button Component
// ============================================================================

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}> = ({ icon, label, active, disabled, onClick, title }) => {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      style={{
        ...styles.toolbarButton,
        ...(active ? styles.toolbarButtonActive : {}),
        ...(hover && !active && !disabled ? styles.toolbarButtonHover : {}),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
};

// ============================================================================
// Main Editor App
// ============================================================================

export const EditorApp: React.FC = () => {
  const {
    toolMode,
    setToolMode,
    cameraMode,
    setCameraMode,
    isRecording,
    setRecording,
    isPlaying,
    play,
    pause,
    stop,
    recordedPath,
    undo,
    redo,
    exportSceneToJSON,
    scene,
  } = useEditorStore();

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [leftPanelTab, setLeftPanelTab] = useState<'assets' | 'hierarchy'>('assets');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tool shortcuts
      if (e.key === 'q') setToolMode('select');
      if (e.key === 'w') setToolMode('translate');
      if (e.key === 'e') setToolMode('rotate');
      if (e.key === 'r') setToolMode('scale');

      // Camera mode
      if (e.key === 'f') {
        setCameraMode(cameraMode === 'fps' ? 'orbit' : 'fps');
      }

      // Recording
      if (e.key === 'p' && cameraMode === 'fps') {
        setRecording(!isRecording);
      }

      // Playback toggle
      if (e.key === ' ') {
        if (isPlaying) {
          pause();
        } else {
          play();
        }
        e.preventDefault();
      }

      // Undo/Redo
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }

      // Export
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        handleExport();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setToolMode, cameraMode, setCameraMode, isRecording, setRecording, isPlaying, play, pause, undo, redo]);

  // Export scene
  const handleExport = useCallback(() => {
    const json = exportSceneToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.metadata.name.toLowerCase().replace(/\s+/g, '-')}.scene.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSceneToJSON, scene.metadata.name]);

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        {/* Tool Mode */}
        <div style={styles.toolbarGroup}>
          <ToolbarButton
            icon={<SelectIcon />}
            active={toolMode === 'select'}
            onClick={() => setToolMode('select')}
            title="Select (Q)"
          />
          <ToolbarButton
            icon={<MoveIcon />}
            active={toolMode === 'translate'}
            onClick={() => setToolMode('translate')}
            title="Move (W)"
          />
          <ToolbarButton
            icon={<RotateIcon />}
            active={toolMode === 'rotate'}
            onClick={() => setToolMode('rotate')}
            title="Rotate (E)"
          />
          <ToolbarButton
            icon={<ScaleIcon />}
            active={toolMode === 'scale'}
            onClick={() => setToolMode('scale')}
            title="Scale (R)"
          />
        </div>

        {/* Camera Mode */}
        <div style={styles.toolbarGroup}>
          <ToolbarButton
            icon={<CameraIcon />}
            label={cameraMode === 'fps' ? 'FPS' : 'Orbit'}
            active={cameraMode === 'fps'}
            onClick={() => setCameraMode(cameraMode === 'fps' ? 'orbit' : 'fps')}
            title="Toggle Camera Mode (F)"
          />
          <ToolbarButton
            icon={
              <span style={{ color: isRecording ? '#f38ba8' : 'inherit' }}>
                <RecordIcon />
              </span>
            }
            label={isRecording ? 'Stop' : 'Record'}
            active={isRecording}
            onClick={() => setRecording(!isRecording)}
            title="Record Camera Path (P)"
            disabled={cameraMode !== 'fps'}
          />
        </div>

        {/* Playback Controls */}
        <div style={styles.toolbarGroup}>
          <ToolbarButton
            icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
            label={isPlaying ? 'Pause' : 'Play'}
            active={isPlaying}
            onClick={() => isPlaying ? pause() : play()}
            title="Play/Pause Motion Preview (Space)"
          />
          <ToolbarButton
            icon={<StopIcon />}
            label="Stop"
            onClick={stop}
            title="Stop Playback"
            disabled={!isPlaying}
          />
        </div>

        {/* History */}
        <div style={styles.toolbarGroup}>
          <ToolbarButton
            icon={<UndoIcon />}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
          />
          <ToolbarButton
            icon={<RedoIcon />}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
          />
        </div>

        <div style={styles.toolbarSpacer} />

        {/* Export */}
        <ToolbarButton
          icon={<SaveIcon />}
          label="Export"
          onClick={handleExport}
          title="Export Scene (Cmd+S)"
        />
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Panel - Assets & Hierarchy */}
        <div style={styles.leftPanel}>
          <div style={styles.leftPanelTabs}>
            <button
              style={{
                ...styles.leftPanelTab,
                ...(leftPanelTab === 'assets' ? styles.leftPanelTabActive : {}),
              }}
              onClick={() => setLeftPanelTab('assets')}
            >
              📦 Assets
            </button>
            <button
              style={{
                ...styles.leftPanelTab,
                ...(leftPanelTab === 'hierarchy' ? styles.leftPanelTabActive : {}),
              }}
              onClick={() => setLeftPanelTab('hierarchy')}
            >
              🌳 Hierarchy
            </button>
          </div>
          <div style={styles.leftPanelContent}>
            {leftPanelTab === 'assets' && <AssetBrowser />}
            {leftPanelTab === 'hierarchy' && <ObjectHierarchy />}
          </div>
        </div>

        {/* Canvas Area */}
        <div style={styles.canvasArea}>
          <EditorCanvas />

          {/* FPS Mode Overlay */}
          {cameraMode === 'fps' && (
            <div style={styles.overlay}>
              Click to enter FPS mode • WASD to move • Mouse to look • Shift to sprint • ESC to exit
            </div>
          )}

          {/* Recording Overlay */}
          {isRecording && (
            <div style={{ ...styles.overlay, top: 56, backgroundColor: 'rgba(243, 139, 168, 0.9)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={styles.recordingIndicator} />
                Recording camera path...
              </span>
            </div>
          )}

          {/* Playing Overlay */}
          {isPlaying && !isRecording && (
            <div style={{ ...styles.overlay, top: 56, backgroundColor: 'rgba(166, 227, 161, 0.9)', color: '#1e1e2e' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                ▶ Motion Preview Active - Press Space to pause
              </span>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div style={styles.rightPanel}>
          <PropertiesPanel />
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span>Objects: {scene.objects.length}</span>
        </div>
        <div style={styles.statusItem}>
          <span>Lights: {scene.lights.length}</span>
        </div>
        <div style={styles.statusItem}>
          <span>Duration: {scene.metadata.duration} frames @ {scene.metadata.fps}fps</span>
        </div>
        {recordedPath && (
          <div style={styles.statusItem}>
            <span>Recorded: {recordedPath.keyframes.length} keyframes</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={styles.statusItem}>
          <span>Press H for help</span>
        </div>
      </div>

      {/* Pulse animation for recording indicator */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
};

export default EditorApp;
