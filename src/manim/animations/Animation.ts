/**
 * Base Animation class
 */

import type { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { RateFunc, smooth } from './rateFuncs';

export interface AnimationConfig {
  durationInFrames?: number;
  rateFunc?: RateFunc;
  remover?: boolean;
  suspendMobjectUpdating?: boolean;
}

export abstract class Animation<T extends Mobject = Mobject> {
  protected _mobject: T;
  protected _durationInFrames: number;
  protected _rateFunc: RateFunc;
  protected _remover: boolean;
  protected _suspendMobjectUpdating: boolean;
  protected _startingMobject: T | null = null;

  constructor(mobject: T, config: AnimationConfig = {}) {
    this._mobject = mobject;
    this._durationInFrames = config.durationInFrames ?? 60;
    this._rateFunc = config.rateFunc ?? smooth;
    this._remover = config.remover ?? false;
    this._suspendMobjectUpdating = config.suspendMobjectUpdating ?? false;
  }

  get mobject(): T {
    return this._mobject;
  }

  get durationInFrames(): number {
    return this._durationInFrames;
  }

  /**
   * Initialize the animation - called before first frame
   */
  begin(): void {
    // Clone the initial state
    this._startingMobject = this._mobject.clone() as T;
  }

  /**
   * Finish the animation - called after last frame
   */
  finish(): void {
    this.interpolate(1);
  }

  /**
   * Clean up after animation
   */
  cleanUp(): void {
    this._startingMobject = null;
  }

  /**
   * Get the alpha value for a given frame
   */
  getAlpha(frame: number): number {
    if (this._durationInFrames <= 0) return 1;
    const rawAlpha = Math.min(1, Math.max(0, frame / this._durationInFrames));
    return this._rateFunc(rawAlpha);
  }

  /**
   * Get the state of the animation at a specific frame
   */
  getStateAtFrame(frame: number): { mobject: T; alpha: number } {
    const alpha = this.getAlpha(frame);
    this.interpolate(alpha);
    return { mobject: this._mobject, alpha };
  }

  /**
   * Interpolate the animation at a given alpha (0 to 1)
   * This is the main method that subclasses should override
   */
  abstract interpolate(alpha: number): void;

  /**
   * Check if animation is complete at given frame
   */
  isComplete(frame: number): boolean {
    return frame >= this._durationInFrames;
  }

  /**
   * Check if animation is a remover (removes object when done)
   */
  get isRemover(): boolean {
    return this._remover;
  }

  /**
   * Get a copy of the initial mobject state
   */
  get startingMobject(): T | null {
    return this._startingMobject;
  }
}

/**
 * Animation for VMobjects that can interpolate paths
 */
export abstract class VMobjectAnimation extends Animation<VMobject> {
  constructor(mobject: VMobject, config: AnimationConfig = {}) {
    super(mobject, config);
  }
}
