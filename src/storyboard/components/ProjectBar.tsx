/**
 * ProjectBar - Top toolbar for project-level actions.
 * Title editing, new/save/load, generate all, export.
 */

import React, { useRef } from 'react';
import { useStoryboardStore } from '../state/storyboardStore';
import { getFormulaById } from '../../formulas';

const COLORS = {
  bg: '#181825',
  surface: '#1e1e2e',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  accentHover: '#74c7ec',
  green: '#a6e3a1',
  red: '#f38ba8',
  yellow: '#f9e2af',
};

export const ProjectBar: React.FC = () => {
  const project = useStoryboardStore((s) => s.project);
  const isDirty = useStoryboardStore((s) => s.isDirty);
  const totalDuration = useStoryboardStore((s) => s.totalDuration);
  const isGenerating = useStoryboardStore((s) => s.isGenerating);
  const activeFormulaId = useStoryboardStore((s) => s.activeFormulaId);
  const {
    updateProjectMeta,
    newProject,
    exportProjectJSON,
    importProjectJSON,
    generateAllScenes,
    setShowFormulaModal,
  } = useStoryboardStore();

  const activeFormula = activeFormulaId ? getFormulaById(activeFormulaId) : null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    newProject();
  };

  const handleSave = () => {
    const json = exportProjectJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importProjectJSON(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportTS = () => {
    const json = exportProjectJSON();
    const ts = `import type { VideoProject } from '../types/project';\n\nexport const project: VideoProject = ${json};\n\nexport default project;\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.project.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sceneCount = project.scenes.length;
  const aiScenes = project.scenes.filter(
    (s) => (s.type === 'ai-image' || s.type === 'ai-video') && !('assetPath' in s && s.assetPath)
  ).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        backgroundColor: COLORS.bg,
        borderBottom: `1px solid ${COLORS.border}`,
        height: 48,
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <input
        type="text"
        value={project.title}
        onChange={(e) => updateProjectMeta({ title: e.target.value })}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.text,
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          width: 200,
          outline: 'none',
        }}
      />
      {isDirty && (
        <span style={{ color: COLORS.yellow, fontSize: 11 }}>unsaved</span>
      )}

      <div style={{ flex: 1 }} />

      {/* Stats */}
      <span style={{ color: COLORS.textDim, fontSize: 12, marginRight: 8 }}>
        {sceneCount} scene{sceneCount !== 1 ? 's' : ''} &middot;{' '}
        {totalDuration.toFixed(1)}s
        {aiScenes > 0 && (
          <span style={{ color: COLORS.yellow }}>
            {' '}&middot; {aiScenes} to generate
          </span>
        )}
        {activeFormula && (
          <span style={{ color: '#cba6f7' }}>
            {' '}&middot; {activeFormula.name}
          </span>
        )}
      </span>

      {/* Actions */}
      <BarButton
        label="Formula"
        onClick={() => setShowFormulaModal(true)}
        style={{
          backgroundColor: activeFormula ? '#cba6f7' : 'transparent',
          color: activeFormula ? '#11111b' : '#cba6f7',
          borderColor: '#cba6f7',
        }}
      />
      <BarButton label="New" onClick={handleNew} />
      <BarButton label="Load" onClick={handleLoad} />
      <BarButton label="Save JSON" onClick={handleSave} />
      <BarButton label="Export .ts" onClick={handleExportTS} accent />

      {aiScenes > 0 && (
        <BarButton
          label={isGenerating ? 'Generating...' : `Generate ${aiScenes}`}
          onClick={() => {
            generateAllScenes().catch((err) => {
              alert(`Generation error: ${err.message}`);
            });
          }}
          accent
          disabled={isGenerating}
          style={{ backgroundColor: isGenerating ? COLORS.textDim : COLORS.green, color: '#11111b' }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.project.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

// --- Small button component ---

const BarButton: React.FC<{
  label: string;
  onClick: () => void;
  accent?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ label, onClick, accent, disabled, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '4px 12px',
      borderRadius: 6,
      border: `1px solid ${accent ? 'transparent' : COLORS.border}`,
      backgroundColor: accent ? COLORS.accent : 'transparent',
      color: accent ? '#11111b' : COLORS.text,
      fontSize: 12,
      fontWeight: 500,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'system-ui, sans-serif',
      ...style,
    }}
  >
    {label}
  </button>
);
