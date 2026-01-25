/**
 * FadeIn animation
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationConfig } from './Animation';
import type { Vector2D } from '../types';
import { scaleVector } from '../types';

export interface FadeInConfig extends AnimationConfig {
  shiftDirection?: Vector2D;
  shiftDistance?: number;
  scaleFrom?: number;
}

export class FadeIn extends Animation {
  protected _shiftDirection: Vector2D;
  protected _shiftDistance: number;
  protected _scaleFrom: number;
  protected _initialOpacity = 1;

  constructor(mobject: Mobject, config: FadeInConfig = {}) {
    super(mobject, config);
    this._shiftDirection = config.shiftDirection ?? [0, 0];
    this._shiftDistance = config.shiftDistance ?? 0.5;
    this._scaleFrom = config.scaleFrom ?? 1;
  }

  begin(): void {
    super.begin();
    this._initialOpacity = this._mobject.stroke.opacity ?? 1;
  }

  interpolate(alpha: number): void {
    // Opacity goes from 0 to initial
    const newOpacity = alpha * this._initialOpacity;
    this._mobject.setOpacity(newOpacity);

    // Handle shift
    if (this._startingMobject && (this._shiftDirection[0] !== 0 || this._shiftDirection[1] !== 0)) {
      const startPos = this._startingMobject.position;
      const shiftOffset = scaleVector(this._shiftDirection, this._shiftDistance * (1 - alpha));
      this._mobject.moveTo([
        startPos[0] - shiftOffset[0],
        startPos[1] - shiftOffset[1],
      ]);
    }

    // Handle scale - actual scaling handled by getScale() for component use
  }

  /**
   * Get opacity at alpha
   */
  getOpacity(alpha: number): number {
    return alpha * this._initialOpacity;
  }

  /**
   * Get position offset at alpha (for shift animation)
   */
  getPositionOffset(alpha: number): Vector2D {
    return scaleVector(this._shiftDirection, this._shiftDistance * (1 - alpha));
  }
}

/**
 * FadeIn from a specific direction
 */
export class FadeInFromDirection extends FadeIn {
  constructor(mobject: Mobject, direction: Vector2D, config: FadeInConfig = {}) {
    super(mobject, {
      ...config,
      shiftDirection: direction,
    });
  }
}

/**
 * FadeIn with scale effect
 */
export class FadeInWithScale extends FadeIn {
  constructor(mobject: Mobject, config: Omit<FadeInConfig, 'scaleFrom'> & { scaleFrom?: number } = {}) {
    super(mobject, {
      ...config,
      scaleFrom: config.scaleFrom ?? 0,
    });
  }

  getScale(alpha: number): number {
    return this._scaleFrom + (1 - this._scaleFrom) * alpha;
  }
}

/**
 * GrowFromCenter - fade in + scale from center
 */
export class GrowFromCenter extends FadeInWithScale {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { ...config, scaleFrom: 0 });
  }
}

/**
 * SpinInFromNothing - fade in + rotate + scale
 */
export class SpinInFromNothing extends FadeIn {
  protected _angle: number;

  constructor(mobject: Mobject, config: FadeInConfig & { angle?: number } = {}) {
    super(mobject, { ...config, scaleFrom: 0 });
    this._angle = config.angle ?? Math.PI;
  }

  getRotation(alpha: number): number {
    return this._angle * (1 - alpha);
  }

  getScale(alpha: number): number {
    return this._scaleFrom + (1 - this._scaleFrom) * alpha;
  }
}
