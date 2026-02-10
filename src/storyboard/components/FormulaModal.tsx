import React, { useState } from 'react';
import { useStoryboardStore } from '../state/storyboardStore';
import { getAllFormulas } from '../../formulas';
import type { VideoFormula, SegmentPurpose } from '../../types/project';

const COLORS = {
  bg: '#181825',
  surface: '#1e1e2e',
  surfaceAlt: '#11111b',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  purple: '#cba6f7',
  green: '#a6e3a1',
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

const PurposeBadge: React.FC<{ purpose: SegmentPurpose }> = ({ purpose }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      backgroundColor: `${PURPOSE_COLORS[purpose]}20`,
      color: PURPOSE_COLORS[purpose],
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}
  >
    {purpose}
  </span>
);

const EnergyBar: React.FC<{ energy: number }> = ({ energy }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div
      style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${energy * 10}%`,
          height: '100%',
          borderRadius: 3,
          background:
            energy >= 8
              ? 'linear-gradient(90deg, #fab387, #f38ba8)'
              : energy >= 5
                ? 'linear-gradient(90deg, #f9e2af, #fab387)'
                : 'linear-gradient(90deg, #a6e3a1, #94e2d5)',
        }}
      />
    </div>
    <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: 'monospace', minWidth: 16 }}>
      {energy}
    </span>
  </div>
);

const FormulaCard: React.FC<{
  formula: VideoFormula;
  isSelected: boolean;
  onClick: () => void;
}> = ({ formula, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: 16,
      borderRadius: 10,
      border: `1.5px solid ${isSelected ? COLORS.purple : COLORS.border}`,
      backgroundColor: isSelected ? `${COLORS.purple}10` : COLORS.surface,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
      {formula.name}
    </div>
    <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.5, marginBottom: 8 }}>
      {formula.description}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {formula.tags.map((tag) => (
        <span
          key={tag}
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: `${COLORS.accent}15`,
            color: COLORS.accent,
            fontSize: 10,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
    <div style={{ fontSize: 10, color: COLORS.textDim }}>
      {formula.segments.length} segments &middot; {formula.targetDuration}s target
    </div>
  </div>
);

export const FormulaModal: React.FC = () => {
  const showFormulaModal = useStoryboardStore((s) => s.showFormulaModal);
  const project = useStoryboardStore((s) => s.project);
  const { setShowFormulaModal, applyFormula } = useStoryboardStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const formulas = getAllFormulas();
  const selected = formulas.find((f) => f.id === selectedId) ?? null;

  if (!showFormulaModal) return null;

  const handleApply = () => {
    if (!selected) return;
    if (project.scenes.length > 0) {
      setShowConfirm(true);
      return;
    }
    applyFormula(selected);
  };

  const confirmApply = () => {
    if (!selected) return;
    applyFormula(selected);
    setShowConfirm(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={() => setShowFormulaModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw',
          maxWidth: 900,
          height: '80vh',
          maxHeight: 700,
          backgroundColor: COLORS.bg,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
              Video Formulas
            </div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
              Production-tested templates that define your video's structure and pacing
            </div>
          </div>
          <button
            onClick={() => setShowFormulaModal(false)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: 'transparent',
              color: COLORS.textDim,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Formula list */}
          <div
            style={{
              width: 280,
              borderRight: `1px solid ${COLORS.border}`,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {formulas.map((f) => (
              <FormulaCard
                key={f.id}
                formula={f}
                isSelected={selectedId === f.id}
                onClick={() => setSelectedId(f.id)}
              />
            ))}
            {formulas.length === 0 && (
              <div style={{ color: COLORS.textDim, fontSize: 12, textAlign: 'center', padding: 20 }}>
                No formulas available
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            {selected ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 16 }}>
                  {selected.segments.length} segments &middot;{' '}
                  {selected.targetDuration}s total &middot;{' '}
                  {selected.fps}fps &middot;{' '}
                  {selected.resolution[0]}x{selected.resolution[1]}
                </div>

                {/* Segment timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.segments.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: COLORS.textDim,
                            fontFamily: 'monospace',
                            minWidth: 16,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, flex: 1 }}>
                          {seg.label}
                        </span>
                        <PurposeBadge purpose={seg.purpose} />
                        <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: 'monospace' }}>
                          {seg.duration}s
                        </span>
                      </div>

                      <div style={{ marginBottom: 4 }}>
                        <EnergyBar energy={seg.style.energy} />
                      </div>

                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>
                        <span>{seg.style.transition}</span>
                        <span>{seg.style.colorMood}</span>
                        <span>{seg.style.audioMood}</span>
                        <span>{seg.defaultSceneType}</span>
                      </div>

                      {seg.promptHint && (
                        <div
                          style={{
                            fontSize: 11,
                            color: COLORS.green,
                            fontStyle: 'italic',
                            marginTop: 4,
                          }}
                        >
                          {seg.promptHint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: COLORS.textDim,
                  fontSize: 13,
                }}
              >
                Select a formula to preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 20px',
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <button
            onClick={() => setShowFormulaModal(false)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: 'transparent',
              color: COLORS.text,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selected}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: selected ? COLORS.purple : COLORS.border,
              color: selected ? '#11111b' : COLORS.textDim,
              fontSize: 13,
              fontWeight: 600,
              cursor: selected ? 'pointer' : 'default',
            }}
          >
            Apply Formula
          </button>
        </div>

        {/* Confirmation dialog */}
        {showConfirm && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                maxWidth: 400,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
                Replace existing scenes?
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 16 }}>
                Your project has {project.scenes.length} scene{project.scenes.length !== 1 ? 's' : ''}.
                Applying a formula will replace all scenes with the formula template.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: 'transparent',
                    color: COLORS.text,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApply}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#f38ba8',
                    color: '#11111b',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Replace Scenes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
