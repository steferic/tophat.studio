import React, { useState } from 'react';
import { ModelPanel } from './panels/ModelPanel';
import type { ModelPanelProps } from './panels/ModelPanel';
import { EnvironmentPanel } from './panels/EnvironmentPanel';
import type { EnvironmentPanelProps } from './panels/EnvironmentPanel';
import { EffectTogglePanel } from './panels/EffectTogglePanel';
import type { EffectTogglePanelProps } from './panels/EffectTogglePanel';
import { MaskPanel } from './panels/MaskPanel';
import type { MaskPanelProps } from './panels/MaskPanel';
import { StatusPanel } from './panels/StatusPanel';
import type { StatusPanelProps } from './panels/StatusPanel';
import { matchesSectionQuery } from './ui/matchesQuery';

export const RECORD_RESOLUTIONS = [
  { label: '1080\u00d71080 Square', w: 1080, h: 1080 },
  { label: '1080\u00d71920 Portrait', w: 1080, h: 1920 },
  { label: '1920\u00d71080 Landscape', w: 1920, h: 1080 },
  { label: '720\u00d7720 Small', w: 720, h: 720 },
] as const;

// ── Panel Props (grouped by sub-panel) ──────────────────────

export interface WorkshopPanelProps {
  model: ModelPanelProps;
  environment: EnvironmentPanelProps;
  effects: Omit<EffectTogglePanelProps, 'filterQuery'>;
  mask: MaskPanelProps;
  status: Omit<StatusPanelProps, 'filterQuery'>;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = (props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 48,
          bottom: 0,
          width: 36,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            padding: '8px 4px',
            fontSize: 14,
            backdropFilter: 'blur(12px)',
          }}
          title="Show panel"
        >
          {'\u25B6'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 48,
        bottom: 0,
        width: 320,
        zIndex: 50,
        background: 'rgba(10,10,20,0.85)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search effects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '7px 10px',
          fontSize: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          color: '#fff',
          outline: 'none',
          fontFamily: 'inherit',
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      <ModelPanel {...props.model} />
      <EnvironmentPanel {...props.environment} />
      <EffectTogglePanel {...props.effects} filterQuery={search} />
      {matchesSectionQuery(search, 'masked mask') && <MaskPanel {...props.mask} />}
      <StatusPanel {...props.status} filterQuery={search} />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(true)}
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {'\u25C0'} Hide Panel
      </button>
    </div>
  );
};
