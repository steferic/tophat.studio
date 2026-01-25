/**
 * MathTex - LaTeX math expression rendering
 *
 * Note: This requires KaTeX to be installed for actual LaTeX rendering.
 * For basic usage without KaTeX, it falls back to plain text display.
 */

import { Text, TextConfig } from './Text';

export interface MathTexConfig extends Omit<TextConfig, 'text'> {
  tex?: string;
  displayMode?: boolean;
}

/**
 * MathTex renders LaTeX mathematical expressions
 *
 * Usage:
 * ```ts
 * const formula = new MathTex({ tex: 'E = mc^2' });
 * const integral = new MathTex({ tex: '\\int_0^\\infty e^{-x} dx = 1' });
 * ```
 */
export class MathTex extends Text {
  protected _tex: string;
  protected _displayMode: boolean;

  constructor(config: MathTexConfig = {}) {
    // For now, use the TeX string as text (will be rendered by component)
    super({ ...config, text: config.tex ?? '' });
    this._tex = config.tex ?? '';
    this._displayMode = config.displayMode ?? true;
  }

  get tex(): string {
    return this._tex;
  }

  setTex(tex: string): this {
    this._tex = tex;
    this._text = tex;
    return this;
  }

  get displayMode(): boolean {
    return this._displayMode;
  }

  /**
   * Get properties for KaTeX rendering
   */
  getKaTeXProps() {
    return {
      tex: this._tex,
      displayMode: this._displayMode,
      fontSize: this._fontSize,
      color: this._fill.color,
    };
  }

  clone(): MathTex {
    return new MathTex({
      tex: this._tex,
      displayMode: this._displayMode,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      color: this._fill.color,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
    });
  }
}

/**
 * Tex - alias for MathTex
 */
export const Tex = MathTex;

/**
 * Factory function for creating MathTex
 */
export function mathTex(tex: string, config: Omit<MathTexConfig, 'tex'> = {}): MathTex {
  return new MathTex({ ...config, tex });
}

// Common math expressions
export const commonTex = {
  /** E = mc² */
  emc2: 'E = mc^2',
  /** Euler's identity */
  euler: 'e^{i\\pi} + 1 = 0',
  /** Quadratic formula */
  quadratic: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  /** Pythagorean theorem */
  pythagoras: 'a^2 + b^2 = c^2',
  /** Definition of derivative */
  derivative: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
  /** Definite integral */
  integral: '\\int_a^b f(x) \\, dx',
  /** Sum notation */
  sum: '\\sum_{i=1}^n i = \\frac{n(n+1)}{2}',
  /** Product notation */
  product: '\\prod_{i=1}^n i = n!',
  /** Matrix 2x2 */
  matrix2x2: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  /** Gaussian distribution */
  gaussian: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
};
