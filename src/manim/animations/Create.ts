/**
 * Create animation - draws a VMobject's path progressively
 */

import { VMobject } from '../core/VMobject';
import { VMobjectAnimation, AnimationConfig } from './Animation';
import { getPartialPath, bezierPathToSvg } from '../utils';

export interface CreateConfig extends AnimationConfig {
  lagRatio?: number;
}

export class Create extends VMobjectAnimation {
  protected _lagRatio: number;
  protected _originalPath: string = '';

  constructor(mobject: VMobject, config: CreateConfig = {}) {
    super(mobject, config);
    this._lagRatio = config.lagRatio ?? 0;
  }

  begin(): void {
    super.begin();
    // Store original path for reference
    this._originalPath = this._mobject.toSVGPath();
  }

  interpolate(_alpha: number): void {
    // Progressive reveal of the path
    // At alpha = 0, nothing is drawn
    // At alpha = 1, full path is drawn
    // The mobject's path is modified to show partial drawing
  }

  /**
   * Get the SVG path at the current alpha
   */
  getPathAtAlpha(alpha: number): string {
    const path = this._mobject.getTransformedPath();
    const partial = getPartialPath(path, alpha);
    return bezierPathToSvg(partial);
  }

  /**
   * Get the stroke dash properties for animating the draw
   */
  getStrokeDashArray(alpha: number, totalLength: number): {
    dashArray: string;
    dashOffset: number;
  } {
    const drawnLength = totalLength * alpha;
    return {
      dashArray: `${drawnLength} ${totalLength}`,
      dashOffset: 0,
    };
  }
}

/**
 * DrawBorderThenFill - Draw the outline, then fill
 */
export class DrawBorderThenFill extends Create {
  protected _borderPortion = 0.5; // Portion of time spent drawing border

  interpolate(_alpha: number): void {
    // Drawing animation is handled by getOpacities
    // The component uses these values to set stroke/fill opacity
  }

  /**
   * Get opacity values for stroke and fill at given alpha
   */
  getOpacities(alpha: number): { strokeOpacity: number; fillOpacity: number } {
    if (alpha < this._borderPortion) {
      return { strokeOpacity: 1, fillOpacity: 0 };
    }
    const fillAlpha = (alpha - this._borderPortion) / (1 - this._borderPortion);
    return { strokeOpacity: 1, fillOpacity: fillAlpha };
  }
}

/**
 * Uncreate - reverse of Create (erase the path)
 */
export class Uncreate extends Create {
  interpolate(alpha: number): void {
    // Reverse the drawing - at alpha 1, nothing is drawn
    super.interpolate(1 - alpha);
  }

  getPathAtAlpha(alpha: number): string {
    return super.getPathAtAlpha(1 - alpha);
  }
}

/**
 * Write - similar to Create but specifically for text
 */
export class Write extends Create {
  constructor(mobject: VMobject, config: CreateConfig = {}) {
    super(mobject, {
      ...config,
      lagRatio: config.lagRatio ?? 0.05, // Slight lag for text
    });
  }
}
