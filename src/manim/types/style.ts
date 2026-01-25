/**
 * Style types for stroke and fill
 */

import type { HexColor } from './color';

export interface StrokeStyle {
  color: HexColor;
  width: number;
  opacity?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  dashArray?: number[];
  dashOffset?: number;
}

export interface FillStyle {
  color: HexColor;
  opacity?: number;
}

export interface MobjectStyle {
  stroke?: StrokeStyle;
  fill?: FillStyle;
}

export const DEFAULT_STROKE: StrokeStyle = {
  color: '#FFFFFF',
  width: 4,
  opacity: 1,
  lineCap: 'round',
  lineJoin: 'round',
};

export const DEFAULT_FILL: FillStyle = {
  color: '#FFFFFF',
  opacity: 0,
};

export function mergeStroke(base: StrokeStyle, override: Partial<StrokeStyle>): StrokeStyle {
  return { ...base, ...override };
}

export function mergeFill(base: FillStyle, override: Partial<FillStyle>): FillStyle {
  return { ...base, ...override };
}
