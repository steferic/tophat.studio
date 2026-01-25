/**
 * Text - Basic text rendering as a mobject
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, HexColor } from '../types';
import { WHITE } from '../constants';
import { DEFAULT_FONT_SIZE } from '../constants';

export interface TextConfig extends VMobjectConfig {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: HexColor;
  lineHeight?: number;
}

export class Text extends VMobject {
  protected _text: string;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _fontWeight: TextConfig['fontWeight'];
  protected _fontStyle: TextConfig['fontStyle'];
  protected _lineHeight: number;
  protected _textWidth = 0;
  protected _textHeight = 0;

  constructor(config: TextConfig = {}) {
    super(config);
    this._text = config.text ?? '';
    this._fontSize = config.fontSize ?? DEFAULT_FONT_SIZE;
    this._fontFamily = config.fontFamily ?? 'sans-serif';
    this._fontWeight = config.fontWeight ?? 'normal';
    this._fontStyle = config.fontStyle ?? 'normal';
    this._lineHeight = config.lineHeight ?? 1.2;

    // Set color
    const color = config.color ?? WHITE;
    this._stroke = { ...this._stroke, color, width: 0 };
    this._fill = { ...this._fill, color, opacity: 1 };

    // Approximate text dimensions
    this.calculateDimensions();
  }

  private calculateDimensions(): void {
    // Approximate character width (varies by font)
    const avgCharWidth = this._fontSize * 0.6;
    const lines = this._text.split('\n');

    this._textWidth = Math.max(...lines.map((line) => line.length)) * avgCharWidth / 100;
    this._textHeight = lines.length * this._fontSize * this._lineHeight / 100;
  }

  get text(): string {
    return this._text;
  }

  setText(text: string): this {
    this._text = text;
    this.calculateDimensions();
    return this;
  }

  get fontSize(): number {
    return this._fontSize;
  }

  setFontSize(size: number): this {
    this._fontSize = size;
    this.calculateDimensions();
    return this;
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  setFontFamily(family: string): this {
    this._fontFamily = family;
    return this;
  }

  get fontWeight(): TextConfig['fontWeight'] {
    return this._fontWeight;
  }

  get fontStyle(): TextConfig['fontStyle'] {
    return this._fontStyle;
  }

  get lineHeight(): number {
    return this._lineHeight;
  }

  getBoundingBox(): { min: Point2D; max: Point2D } {
    const hw = this._textWidth / 2;
    const hh = this._textHeight / 2;
    return {
      min: { x: this._position[0] - hw, y: this._position[1] - hh },
      max: { x: this._position[0] + hw, y: this._position[1] + hh },
    };
  }

  /**
   * Get text rendering properties for SVG
   */
  getSVGTextProps() {
    return {
      text: this._text,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      fontStyle: this._fontStyle,
      fill: this._fill.color,
      opacity: this._fill.opacity,
    };
  }

  clone(): Text {
    return new Text({
      text: this._text,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      fontStyle: this._fontStyle,
      color: this._fill.color,
      lineHeight: this._lineHeight,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
    });
  }
}

/**
 * Factory function for creating Text
 */
export function text(content: string, config: Omit<TextConfig, 'text'> = {}): Text {
  return new Text({ ...config, text: content });
}
