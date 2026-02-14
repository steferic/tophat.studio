import React from 'react';
import type { ParamDef } from './filterRegistry';

interface FilterParamControlsProps {
  filterDef: { params: ParamDef[] };
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.6)',
  minWidth: 80,
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'monospace',
  minWidth: 36,
  textAlign: 'right',
};

export const FilterParamControls: React.FC<FilterParamControlsProps> = ({
  filterDef,
  values,
  onChange,
}) => {
  return (
    <div
      style={{
        width: '100%',
        padding: '8px 0 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 4,
      }}
    >
      {filterDef.params.map((param) => {
        const val = values[param.key] ?? param.default;

        if (param.type === 'number') {
          return (
            <div key={param.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={labelStyle}>{param.label}</label>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={val as number}
                onChange={(e) => onChange(param.key, Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={valueStyle}>
                {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val}
              </span>
            </div>
          );
        }

        if (param.type === 'boolean') {
          const active = val as boolean;
          return (
            <div key={param.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={labelStyle}>{param.label}</label>
              <button
                onClick={() => onChange(param.key, !active)}
                style={{
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(100,180,255,0.25)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  borderColor: active ? 'rgba(100,180,255,0.5)' : 'rgba(255,255,255,0.12)',
                  boxShadow: active ? '0 0 6px rgba(100,180,255,0.3)' : 'none',
                }}
              >
                {active ? 'On' : 'Off'}
              </button>
            </div>
          );
        }

        if (param.type === 'select' && param.options) {
          return (
            <div key={param.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={labelStyle}>{param.label}</label>
              <select
                value={val as string | number}
                onChange={(e) => {
                  const opt = param.options!.find((o) => String(o.value) === e.target.value);
                  onChange(param.key, opt ? opt.value : e.target.value);
                }}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: 11,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                {param.options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value} style={{ background: '#1a1a2e' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (param.type === 'color') {
          return (
            <div key={param.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={labelStyle}>{param.label}</label>
              <input
                type="color"
                value={val as string}
                onChange={(e) => onChange(param.key, e.target.value)}
                style={{
                  width: 32,
                  height: 24,
                  padding: 0,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  background: 'none',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                {val}
              </span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
