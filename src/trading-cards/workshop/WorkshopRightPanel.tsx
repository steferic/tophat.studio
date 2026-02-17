import React, { useState } from 'react';
import { PresetPanel } from './panels/PresetPanel';
import type { PresetPanelProps } from './panels/PresetPanel';
import { CameraPanel } from './panels/CameraPanel';
import type { CameraPanelProps } from './panels/CameraPanel';
import { DecompositionPanel } from './panels/DecompositionPanel';
import type { DecompositionPanelProps } from './panels/DecompositionPanel';
import { ShakeAudioPanel } from './panels/ShakeAudioPanel';
import type { ShakeAudioPanelProps } from './panels/ShakeAudioPanel';
import { GlowBgPanel } from './panels/GlowBgPanel';
import type { GlowBgPanelProps } from './panels/GlowBgPanel';
import { BackgroundPanel } from './panels/BackgroundPanel';
import type { BackgroundPanelProps } from './panels/BackgroundPanel';
import { RecordPanel } from './panels/RecordPanel';
import type { RecordPanelProps } from './panels/RecordPanel';
import { AttackPanel } from './panels/AttackPanel';
import type { AttackPanelProps } from './panels/AttackPanel';
import { CameraAutomationPanel } from './panels/CameraAutomationPanel';
import type { CameraAutomationPanelProps } from './panels/CameraAutomationPanel';

export { RECORD_RESOLUTIONS } from './WorkshopPanel';

export interface WorkshopRightPanelProps {
  cameraAutomation: Omit<CameraAutomationPanelProps, 'filterQuery'>;
  preset: Omit<PresetPanelProps, 'filterQuery'>;
  camera: Omit<CameraPanelProps, 'filterQuery'>;
  decomposition: Omit<DecompositionPanelProps, 'filterQuery'>;
  shakeAudio: Omit<ShakeAudioPanelProps, 'filterQuery'>;
  glowBg: Omit<GlowBgPanelProps, 'filterQuery'>;
  background: Omit<BackgroundPanelProps, 'filterQuery'>;
  record: Omit<RecordPanelProps, 'filterQuery'>;
  attack: Omit<AttackPanelProps, 'filterQuery'> | null;
}

export const WorkshopRightPanel: React.FC<WorkshopRightPanelProps> = (props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 0,
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
          {'\u25C0'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 48,
        bottom: 0,
        width: 280,
        zIndex: 50,
        background: 'rgba(10,10,20,0.85)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
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

      <CameraAutomationPanel {...props.cameraAutomation} filterQuery={search} />
      <PresetPanel {...props.preset} filterQuery={search} />
      <CameraPanel {...props.camera} filterQuery={search} />
      <DecompositionPanel {...props.decomposition} filterQuery={search} />
      <ShakeAudioPanel {...props.shakeAudio} filterQuery={search} />
      <GlowBgPanel {...props.glowBg} filterQuery={search} />
      <BackgroundPanel {...props.background} filterQuery={search} />
      <RecordPanel {...props.record} filterQuery={search} />
      {props.attack && <AttackPanel {...props.attack} filterQuery={search} />}

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
          textAlign: 'right',
        }}
      >
        Hide Panel {'\u25B6'}
      </button>
    </div>
  );
};
