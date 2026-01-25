/**
 * Rotation animations
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationConfig } from './Animation';
import type { Vector2D } from '../types';
import { PI, TAU } from '../constants';

export interface RotateAnimationConfig extends AnimationConfig {
  angle?: number;
  aboutPoint?: Vector2D;
  clockwise?: boolean;
}

export class RotateAnimation extends Animation {
  protected _angle: number;
  protected _aboutPoint: Vector2D | null;
  protected _startRotation = 0;

  constructor(mobject: Mobject, config: RotateAnimationConfig = {}) {
    super(mobject, config);
    let angle = config.angle ?? PI;
    if (config.clockwise) {
      angle = -Math.abs(angle);
    }
    this._angle = angle;
    this._aboutPoint = config.aboutPoint ?? null;
  }

  begin(): void {
    super.begin();
    this._startRotation = this._mobject.rotation;
  }

  interpolate(alpha: number): void {
    const currentAngle = this._angle * alpha;

    // Reset to starting state
    if (this._startingMobject) {
      this._mobject.moveTo(this._startingMobject.position);
    }

    // Apply rotation
    const rotateAbout = this._aboutPoint ?? undefined;
    this._mobject.rotate(currentAngle, rotateAbout);
  }

  /**
   * Get rotation angle at alpha
   */
  getRotationAt(alpha: number): number {
    return this._angle * alpha;
  }
}

/**
 * Rotate 180 degrees
 */
export class Rotate180 extends RotateAnimation {
  constructor(mobject: Mobject, config: Omit<RotateAnimationConfig, 'angle'> = {}) {
    super(mobject, { ...config, angle: PI });
  }
}

/**
 * Rotate 360 degrees
 */
export class Rotate360 extends RotateAnimation {
  constructor(mobject: Mobject, config: Omit<RotateAnimationConfig, 'angle'> = {}) {
    super(mobject, { ...config, angle: TAU });
  }
}

/**
 * Spin animation - continuous rotation
 */
export class Spin extends RotateAnimation {
  protected _rotationsPerDuration: number;

  constructor(mobject: Mobject, config: RotateAnimationConfig & { rotations?: number } = {}) {
    const rotations = config.rotations ?? 1;
    super(mobject, { ...config, angle: TAU * rotations });
    this._rotationsPerDuration = rotations;
  }

  /**
   * Get number of complete rotations at alpha
   */
  getRotationsAt(alpha: number): number {
    return this._rotationsPerDuration * alpha;
  }
}

/**
 * Wiggle animation - rotate back and forth
 */
export class Wiggle extends Animation {
  protected _angle: number;
  protected _wiggles: number;

  constructor(mobject: Mobject, config: AnimationConfig & { angle?: number; wiggles?: number } = {}) {
    super(mobject, config);
    this._angle = config.angle ?? PI / 12; // 15 degrees
    this._wiggles = config.wiggles ?? 6;
  }

  interpolate(alpha: number): void {
    const wiggleAlpha = Math.sin(this._wiggles * TAU * alpha);
    const fadeOut = 1 - alpha; // Dampen over time
    const currentAngle = this._angle * wiggleAlpha * fadeOut;

    // Reset and apply rotation
    if (this._startingMobject) {
      this._mobject.moveTo(this._startingMobject.position);
    }
    this._mobject.rotate(currentAngle);
  }

  getRotationAt(alpha: number): number {
    const wiggleAlpha = Math.sin(this._wiggles * TAU * alpha);
    const fadeOut = 1 - alpha;
    return this._angle * wiggleAlpha * fadeOut;
  }
}
