import React from 'react';
import { Section } from '../ui/Section';
import { chipBase, chipOn, chipOff } from '../ui/chipStyles';
import { RECORD_RESOLUTIONS } from '../WorkshopPanel';
import { matchesSectionQuery } from '../ui/matchesQuery';

export interface RecordPanelProps {
  recording: boolean;
  recordProgress: number;
  recordResIdx: number;
  onChangeRecordResIdx: (idx: number) => void;
  recordFps: number;
  onChangeRecordFps: (fps: number) => void;
  loopMode: 'loop' | 'pingpong';
  onChangeLoopMode: (mode: 'loop' | 'pingpong') => void;
  loopSync: boolean;
  onChangeLoopSync: (sync: boolean) => void;
  trailEffect: boolean;
  onChangeTrailEffect: (enabled: boolean) => void;
  trailDecay: number;
  onChangeTrailDecay: (decay: number) => void;
  paintMode: boolean;
  onChangePaintMode: (enabled: boolean) => void;
  paintOpacity: number;
  onChangePaintOpacity: (opacity: number) => void;
  bgColor: string;
  onRecord: (durationSec: number, width: number, height: number, fps: number, bgColor: string) => void;
  filterQuery: string;
}

export const RecordPanel: React.FC<RecordPanelProps> = ({
  recording,
  recordProgress,
  recordResIdx,
  onChangeRecordResIdx,
  recordFps,
  onChangeRecordFps,
  loopMode,
  onChangeLoopMode,
  loopSync,
  onChangeLoopSync,
  trailEffect,
  onChangeTrailEffect,
  trailDecay,
  onChangeTrailDecay,
  paintMode,
  onChangePaintMode,
  paintOpacity,
  onChangePaintOpacity,
  bgColor,
  onRecord,
  filterQuery,
}) => {
  if (!matchesSectionQuery(filterQuery, 'record nft loop')) return null;

  return (
    <Section title="Record Loop" count={1}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {recording ? (
          <>
            <div style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${recordProgress * 100}%`,
                background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
                borderRadius: 2,
                transition: 'width 0.1s linear',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(168,85,247,0.8)', textAlign: 'center' }}>
              {recordProgress < 0.15 ? 'Warming up' : recordProgress < 0.5 ? 'Capturing' : 'Encoding'}... {Math.round(recordProgress * 100)}%
            </div>
          </>
        ) : (
          <>
            <select
              value={recordResIdx}
              onChange={(e) => onChangeRecordResIdx(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: 11,
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              {RECORD_RESOLUTIONS.map((res, i) => (
                <option key={i} value={i} style={{ background: '#1a1a2e' }}>
                  {res.label}
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', width: '100%' }}>
              <span style={{ minWidth: 24 }}>FPS</span>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={recordFps}
                onChange={(e) => onChangeRecordFps(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#a855f7' }}
              />
              <span style={{ width: 20, textAlign: 'right', fontSize: 10, fontFamily: 'monospace' }}>
                {recordFps}
              </span>
            </label>
            <div style={{ display: 'flex', gap: 4, width: '100%' }}>
              {(['loop', 'pingpong'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeLoopMode(mode)}
                  style={{
                    ...chipBase,
                    flex: 1,
                    textAlign: 'center' as const,
                    ...(loopMode === mode
                      ? { background: 'rgba(168,85,247,0.3)', color: '#fff', borderColor: 'rgba(168,85,247,0.5)' }
                      : {}),
                  }}
                >
                  {mode === 'loop' ? 'Loop' : 'Ping-Pong'}
                </button>
              ))}
            </div>
            <button
              onClick={() => onChangeLoopSync(!loopSync)}
              style={loopSync ? chipOn : chipOff}
              title={loopSync
                ? 'Animations quantized to loop seamlessly (slow animations may freeze)'
                : 'Animations run at original speed (may not loop seamlessly)'}
            >
              Loop Sync
            </button>
            <button
              onClick={() => onChangeTrailEffect(!trailEffect)}
              style={trailEffect ? chipOn : chipOff}
            >
              Trail Effect
            </button>
            {trailEffect && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 40 }}>Fade</span>
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={trailDecay}
                    onChange={(e) => onChangeTrailDecay(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 30, textAlign: 'right' }}>
                    {trailDecay.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>
                  Lower = longer trails, higher = faster fade
                </div>
              </div>
            )}
            <button
              onClick={() => onChangePaintMode(!paintMode)}
              style={paintMode ? chipOn : chipOff}
            >
              Paint Mode
            </button>
            {paintMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 40 }}>Alpha</span>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={paintOpacity}
                    onChange={(e) => onChangePaintOpacity(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 30, textAlign: 'right' }}>
                    {paintOpacity.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>
                  Each frame stamps the model onto the canvas. Lower alpha = softer layering.
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {[3, 5, 10].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    const res = RECORD_RESOLUTIONS[recordResIdx];
                    onRecord(sec, res.w, res.h, recordFps, bgColor);
                  }}
                  style={{
                    ...chipBase,
                    flex: 1,
                    textAlign: 'center' as const,
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(59,130,246,0.35))',
                    color: '#fff',
                    borderColor: 'rgba(168,85,247,0.5)',
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
          Records a seamless loop as .webm (VP9) at the selected resolution.
        </div>
      </div>
    </Section>
  );
};
