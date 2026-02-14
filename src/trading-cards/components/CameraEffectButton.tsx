import React, { useState, useCallback } from 'react';

const CYCLE: (string | null)[] = [null, 'face-to-face', 'barrel-roll'];
const LABELS: Record<string, string> = {
  '': 'CAM',
  'face-to-face': '\u{1F464} CAM',
  'barrel-roll': '\u{1F504} CAM',
};

interface CameraEffectButtonProps {
  onSelect: (preset: string | null) => void;
}

export const CameraEffectButton: React.FC<CameraEffectButtonProps> = ({ onSelect }) => {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const current = CYCLE[index % CYCLE.length];

  const handleClick = useCallback(() => {
    const nextIdx = (index + 1) % CYCLE.length;
    const next = CYCLE[nextIdx];
    setIndex(nextIdx);
    onSelect(next);
  }, [index, onSelect]);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={current ? `Camera: ${current}` : 'Camera: off'}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: hovered ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.15)',
        color: '#14b8a6',
        cursor: 'pointer',
        transition: 'background 0.15s',
        lineHeight: 1.6,
      }}
    >
      {LABELS[current ?? '']}
    </button>
  );
};
