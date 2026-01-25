/**
 * FadeOut animation
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationConfig } from './Animation';
import type { Vector2D } from '../types';
import { scaleVector } from '../types';

export interface FadeOutConfig extends AnimationConfig {
  shiftDirection?: Vector2D;
  shiftDistance?: number;
  scaleTo?: number;
}

export class FadeOut extends Animation {
  protected _shiftDirection: Vector2D;
  protected _shiftDistance: number;
  protected _scaleTo: number;
  protected _initialOpacity = 1;

  constructor(mobject: Mobject, config: FadeOutConfig = {}) {
    super(mobject, { ...config, remover: true });
    this._shiftDirection = config.shiftDirection ?? [0, 0];
    this._shiftDistance = config.shiftDistance ?? 0.5;
    this._scaleTo = config.scaleTo ?? 1;
  }

  begin(): void {
    super.begin();
    this._initialOpacity = this._mobject.stroke.opacity ?? 1;
  }

  interpolate(alpha: number): void {
    // Opacity goes from initial to 0
    const newOpacity = (1 - alpha) * this._initialOpacity;
    this._mobject.setOpacity(newOpacity);

    // Handle shift
    if (this._startingMobject && (this._shiftDirection[0] !== 0 || this._shiftDirection[1] !== 0)) {
      const startPos = this._startingMobject.position;
      const shiftOffset = scaleVector(this._shiftDirection, this._shiftDistance * alpha);
      this._mobject.moveTo([
        startPos[0] + shiftOffset[0],
        startPos[1] + shiftOffset[1],
      ]);
    }
  }

  /**
   * Get opacity at alpha
   */
  getOpacity(alpha: number): number {
    return (1 - alpha) * this._initialOpacity;
  }

  /**
   * Get position offset at alpha
   */
  getPositionOffset(alpha: number): Vector2D {
    return scaleVector(this._shiftDirection, this._shiftDistance * alpha);
  }
}

/**
 * FadeOut to a specific direction
 */
export class FadeOutToDirection extends FadeOut {
  constructor(mobject: Mobject, direction: Vector2D, config: FadeOutConfig = {}) {
    super(mobject, {
      ...config,
      shiftDirection: direction,
    });
  }
}

/**
 * FadeOut with scale effect
 */
export class FadeOutWithScale extends FadeOut {
  constructor(mobject: Mobject, config: Omit<FadeOutConfig, 'scaleTo'> & { scaleTo?: number } = {}) {
    super(mobject, {
      ...config,
      scaleTo: config.scaleTo ?? 0,
    });
  }

  getScale(alpha: number): number {
    return 1 - (1 - this._scaleTo) * alpha;
  }
}

/**
 * ShrinkToCenter - fade out + scale to nothing
 */
export class ShrinkToCenter extends FadeOutWithScale {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { ...config, scaleTo: 0 });
  }
}
