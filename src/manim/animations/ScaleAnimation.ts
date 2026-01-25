/**
 * Scale animations
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationConfig } from './Animation';
import type { Vector2D } from '../types';

export interface ScaleAnimationConfig extends AnimationConfig {
  scaleFactor?: number | Vector2D;
  aboutPoint?: Vector2D;
}

export class ScaleAnimation extends Animation {
  protected _scaleFactor: Vector2D;
  protected _aboutPoint: Vector2D | null;
  protected _startScale: Vector2D = [1, 1];

  constructor(mobject: Mobject, config: ScaleAnimationConfig = {}) {
    super(mobject, config);
    const factor = config.scaleFactor ?? 2;
    this._scaleFactor = typeof factor === 'number' ? [factor, factor] : factor;
    this._aboutPoint = config.aboutPoint ?? null;
  }

  begin(): void {
    super.begin();
    this._startScale = this._mobject.scaleValue;
  }

  interpolate(alpha: number): void {
    // Calculate intermediate scale
    const currentScale: Vector2D = [
      this._startScale[0] + (this._scaleFactor[0] - 1) * this._startScale[0] * alpha,
      this._startScale[1] + (this._scaleFactor[1] - 1) * this._startScale[1] * alpha,
    ];

    // Reset to starting state and apply new scale
    if (this._startingMobject) {
      this._mobject.moveTo(this._startingMobject.position);
    }

    // Apply scale factor relative to current position
    const scaleDiff: Vector2D = [
      currentScale[0] / this._startScale[0],
      currentScale[1] / this._startScale[1],
    ];

    this._mobject.scale(scaleDiff, this._aboutPoint ?? undefined);
  }

  /**
   * Get scale value at alpha
   */
  getScaleAt(alpha: number): Vector2D {
    return [
      1 + (this._scaleFactor[0] - 1) * alpha,
      1 + (this._scaleFactor[1] - 1) * alpha,
    ];
  }
}

/**
 * Grow animation - scale from 0 to 1
 */
export class Grow extends ScaleAnimation {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { ...config, scaleFactor: 1 });
  }

  begin(): void {
    super.begin();
    // Start from scale 0
    this._startScale = [0, 0];
  }

  getScaleAt(alpha: number): Vector2D {
    return [alpha, alpha];
  }
}

/**
 * Shrink animation - scale from 1 to 0
 */
export class Shrink extends ScaleAnimation {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { ...config, scaleFactor: 0 });
  }

  getScaleAt(alpha: number): Vector2D {
    return [1 - alpha, 1 - alpha];
  }
}

/**
 * Pulse animation - scale up then back
 */
export class Pulse extends Animation {
  protected _scaleFactor: number;
  protected _scaleAbout: Vector2D | null;

  constructor(mobject: Mobject, config: AnimationConfig & { scaleFactor?: number; scaleAbout?: Vector2D } = {}) {
    super(mobject, config);
    this._scaleFactor = config.scaleFactor ?? 1.2;
    this._scaleAbout = config.scaleAbout ?? null;
  }

  interpolate(_alpha: number): void {
    // Pulse animation is handled by getScaleAt for component use
  }

  getScaleAt(alpha: number): number {
    const t = alpha < 0.5 ? 2 * alpha : 2 * (1 - alpha);
    return 1 + (this._scaleFactor - 1) * t;
  }
}
