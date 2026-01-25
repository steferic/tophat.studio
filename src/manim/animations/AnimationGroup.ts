/**
 * AnimationGroup - Run multiple animations in parallel
 */

import { Animation, AnimationConfig } from './Animation';

export interface AnimationGroupConfig extends AnimationConfig {
  /** Lag ratio for staggered start (0 = all start together, 1 = sequential) */
  lagRatio?: number;
}

export class AnimationGroup extends Animation {
  protected _animations: Animation[];
  protected _lagRatio: number;
  protected _groupDuration: number;

  constructor(animations: Animation[], config: AnimationGroupConfig = {}) {
    // Create a dummy mobject for the group
    const dummyMobject = animations[0]?.mobject;
    super(dummyMobject, config);

    this._animations = animations;
    this._lagRatio = config.lagRatio ?? 0;

    // Calculate group duration
    if (this._lagRatio === 0) {
      // All animations run in parallel - duration is the max
      this._groupDuration = Math.max(...animations.map((a) => a.durationInFrames));
    } else {
      // Staggered - last animation starts at lagRatio * (n-1) * firstDuration
      const firstDuration = animations[0]?.durationInFrames ?? 60;
      const lagOffset = firstDuration * this._lagRatio;
      const lastStart = (animations.length - 1) * lagOffset;
      const lastDuration = animations[animations.length - 1]?.durationInFrames ?? 60;
      this._groupDuration = lastStart + lastDuration;
    }

    // Override duration if explicitly set
    if (config.durationInFrames !== undefined) {
      this._durationInFrames = config.durationInFrames;
    } else {
      this._durationInFrames = this._groupDuration;
    }
  }

  begin(): void {
    for (const animation of this._animations) {
      animation.begin();
    }
  }

  interpolate(alpha: number): void {
    const currentFrame = alpha * this._durationInFrames;

    for (let i = 0; i < this._animations.length; i++) {
      const animation = this._animations[i];

      // Calculate start frame for this animation
      let startFrame = 0;
      if (this._lagRatio > 0) {
        const firstDuration = this._animations[0].durationInFrames;
        startFrame = i * firstDuration * this._lagRatio;
      }

      const localFrame = currentFrame - startFrame;

      if (localFrame >= 0) {
        const localAlpha = animation.getAlpha(localFrame);
        animation.interpolate(localAlpha);
      }
    }
  }

  finish(): void {
    for (const animation of this._animations) {
      animation.finish();
    }
  }

  cleanUp(): void {
    super.cleanUp();
    for (const animation of this._animations) {
      animation.cleanUp();
    }
  }

  get animations(): Animation[] {
    return [...this._animations];
  }

  get lagRatio(): number {
    return this._lagRatio;
  }

  /**
   * Get individual animation alphas at current frame
   */
  getAlphasAtFrame(frame: number): number[] {
    return this._animations.map((animation, i) => {
      let startFrame = 0;
      if (this._lagRatio > 0) {
        const firstDuration = this._animations[0].durationInFrames;
        startFrame = i * firstDuration * this._lagRatio;
      }

      const localFrame = frame - startFrame;
      if (localFrame < 0) return 0;
      return animation.getAlpha(localFrame);
    });
  }
}

/**
 * Convenience function
 */
export function animationGroup(
  animations: Animation[],
  config: AnimationGroupConfig = {}
): AnimationGroup {
  return new AnimationGroup(animations, config);
}
