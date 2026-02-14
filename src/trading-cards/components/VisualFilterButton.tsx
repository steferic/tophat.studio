import React, { useState, useCallback } from 'react';

const CYCLE: (string | null)[] = [
  null,
  'blue-tint',
  'dither',
  'pixelation',
  'chromatic-aberration',
  'scanline',
  'noise',
  'vignette',
  'bloom',
  'glitch',
  'dot-screen',
  'sepia',
  'grayscale',
  'hue-shift',
  'night-vision',
  'thermal',
  'posterize',
  'crt',
  'vhs',
  'invert',
  'edge-detect',
  'underwater',
  'duotone',
  'hologram',
  'kaleidoscope',
  'retro-lcd',
  'emboss',
  'ripple',
];

const LABELS: Record<string, string> = {
  '': 'FLT',
  'blue-tint': '\u{1F48E} BLUE',
  'dither': '\u{25A6} DTHR',
  'pixelation': '\u{1F7E9} PXEL',
  'chromatic-aberration': '\u{1F308} CHRM',
  'scanline': '\u{2550} SCAN',
  'noise': '\u{26A1} NOIS',
  'vignette': '\u{25C9} VGNT',
  'bloom': '\u{2728} BLOM',
  'glitch': '\u{1F47E} GLTC',
  'dot-screen': '\u{25CF} DOTS',
  'sepia': '\u{1F4DC} SEPA',
  'grayscale': '\u{25D0} GRAY',
  'hue-shift': '\u{1F3A8} HUE',
  'night-vision': '\u{1F319} NGHT',
  'thermal': '\u{1F525} THRM',
  'posterize': '\u{1F3AD} POST',
  'crt': '\u{1F4FA} CRT',
  'vhs': '\u{1F4FC} VHS',
  'invert': '\u{1F503} INVT',
  'edge-detect': '\u{270F}\u{FE0F} EDGE',
  'underwater': '\u{1F30A} AQUA',
  'duotone': '\u{1F3B5} DUO',
  'hologram': '\u{1F4A0} HOLO',
  'kaleidoscope': '\u{1F52E} KLDO',
  'retro-lcd': '\u{1F3AE} LCD',
  'emboss': '\u{1FAA8} EMBS',
  'ripple': '\u{1F4A7} RPLE',
};

interface VisualFilterButtonProps {
  onSelect: (filter: string | null) => void;
}

export const VisualFilterButton: React.FC<VisualFilterButtonProps> = ({ onSelect }) => {
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
      title={current ? `Filter: ${current}` : 'Filter: off'}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: hovered ? 'rgba(236,72,153,0.35)' : 'rgba(236,72,153,0.15)',
        color: '#ec4899',
        cursor: 'pointer',
        transition: 'background 0.15s',
        lineHeight: 1.6,
      }}
    >
      {LABELS[current ?? '']}
    </button>
  );
};
