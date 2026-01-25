/**
 * Transform animation - morphs one VMobject into another
 */

import { VMobject } from '../core/VMobject';
import { VMobjectAnimation, AnimationConfig } from './Animation';
import { interpolatePaths } from '../utils';
import { interpolateColor } from '../types';
import type { BezierPath, HexColor } from '../types';

export interface TransformConfig extends AnimationConfig {
  pathArcAngle?: number;
  replaceOnFinish?: boolean;
}

export class Transform extends VMobjectAnimation {
  protected _targetMobject: VMobject;
  protected _pathArcAngle: number;
  protected _replaceOnFinish: boolean;
  protected _startPath: BezierPath | null = null;
  protected _endPath: BezierPath | null = null;
  protected _startStrokeColor: HexColor = '#FFFFFF';
  protected _endStrokeColor: HexColor = '#FFFFFF';
  protected _startFillColor: HexColor = '#FFFFFF';
  protected _endFillColor: HexColor = '#FFFFFF';

  constructor(mobject: VMobject, targetMobject: VMobject, config: TransformConfig = {}) {
    super(mobject, config);
    this._targetMobject = targetMobject;
    this._pathArcAngle = config.pathArcAngle ?? 0;
    this._replaceOnFinish = config.replaceOnFinish ?? false;
  }

  get targetMobject(): VMobject {
    return this._targetMobject;
  }

  begin(): void {
    super.begin();
    // Store initial and target paths
    this._startPath = this._mobject.path;
    this._endPath = this._targetMobject.path;

    // Store colors
    this._startStrokeColor = this._mobject.stroke.color;
    this._endStrokeColor = this._targetMobject.stroke.color;
    this._startFillColor = this._mobject.fill.color;
    this._endFillColor = this._targetMobject.fill.color;
  }

  interpolate(alpha: number): void {
    if (!this._startPath || !this._endPath) return;

    // Interpolate the path
    const interpolatedPath = interpolatePaths(this._startPath, this._endPath, alpha);
    this._mobject.setPath(interpolatedPath);

    // Interpolate colors
    const strokeColor = interpolateColor(this._startStrokeColor, this._endStrokeColor, alpha);
    const fillColor = interpolateColor(this._startFillColor, this._endFillColor, alpha);

    this._mobject.setStroke({ color: strokeColor });
    this._mobject.setFill({ color: fillColor });

    // Interpolate stroke width
    const startWidth = this._startingMobject?.stroke.width ?? this._mobject.stroke.width;
    const endWidth = this._targetMobject.stroke.width;
    this._mobject.setStroke({ width: startWidth + (endWidth - startWidth) * alpha });

    // Interpolate opacity
    const startStrokeOpacity = this._startingMobject?.stroke.opacity ?? 1;
    const endStrokeOpacity = this._targetMobject.stroke.opacity ?? 1;
    const startFillOpacity = this._startingMobject?.fill.opacity ?? 0;
    const endFillOpacity = this._targetMobject.fill.opacity ?? 0;

    this._mobject.setStroke({
      opacity: startStrokeOpacity + (endStrokeOpacity - startStrokeOpacity) * alpha,
    });
    this._mobject.setFill({
      opacity: startFillOpacity + (endFillOpacity - startFillOpacity) * alpha,
    });
  }

  finish(): void {
    super.finish();
    if (this._replaceOnFinish) {
      // Replace mobject with target
      this._mobject.setPath(this._targetMobject.path);
      this._mobject.matchStyle(this._targetMobject);
    }
  }
}

/**
 * ReplacementTransform - replaces the source with target at the end
 */
export class ReplacementTransform extends Transform {
  constructor(mobject: VMobject, targetMobject: VMobject, config: TransformConfig = {}) {
    super(mobject, targetMobject, { ...config, replaceOnFinish: true });
  }
}

/**
 * ClockwiseTransform - transform along clockwise arc
 */
export class ClockwiseTransform extends Transform {
  constructor(mobject: VMobject, targetMobject: VMobject, config: TransformConfig = {}) {
    super(mobject, targetMobject, { ...config, pathArcAngle: -Math.PI });
  }
}

/**
 * CounterclockwiseTransform - transform along counterclockwise arc
 */
export class CounterclockwiseTransform extends Transform {
  constructor(mobject: VMobject, targetMobject: VMobject, config: TransformConfig = {}) {
    super(mobject, targetMobject, { ...config, pathArcAngle: Math.PI });
  }
}

/**
 * MoveToTarget - transform mobject to its own target attribute
 * (useful when you've set mobject.target = something)
 */
export class MoveToTarget extends Transform {
  constructor(mobject: VMobject & { target?: VMobject }, config: TransformConfig = {}) {
    if (!mobject.target) {
      throw new Error('MoveToTarget requires mobject.target to be set');
    }
    super(mobject, mobject.target, config);
  }
}
