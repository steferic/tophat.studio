import type React from 'react';

export const chipBase: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  lineHeight: 1.3,
};

export const chipOff: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.7)',
};

export const chipOn: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(100,180,255,0.25)',
  color: '#fff',
  borderColor: 'rgba(100,180,255,0.5)',
  boxShadow: '0 0 6px rgba(100,180,255,0.3)',
};

export const chipAction: React.CSSProperties = {
  ...chipBase,
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.7)',
};

export const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
};

export const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.6)',
  minWidth: 40,
};

export const monoValue: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'monospace',
  minWidth: 36,
  textAlign: 'right',
};
