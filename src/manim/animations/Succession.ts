/**
 * Succession - Sequential animations (one after another)
 */

import { Animation, AnimationConfig } from './Animation';
import { AnimationGroup } from './AnimationGroup';

export interface SuccessionConfig extends AnimationConfig {
  /** Gap between animations in frames */
  lagFrames?: number;
}

/**
 * Succession runs animations one after another
 */
export class Succession extends AnimationGroup {
  protected _lagFrames: number;
  protected _animationStarts: number[] = [];

  constructor(animations: Animation[], config: SuccessionConfig = {}) {
    // Calculate start times for each animation
    const lagFrames = config.lagFrames ?? 0;
    let totalDuration = 0;
    const starts: number[] = [];

    for (const animation of animations) {
      starts.push(totalDuration);
      totalDuration += animation.durationInFrames + lagFrames;
    }

    // Remove last lag
    if (animations.length > 0 && lagFrames > 0) {
      totalDuration -= lagFrames;
    }

    super(animations, {
      ...config,
      lagRatio: 1, // Full sequential
      durationInFrames: config.durationInFrames ?? totalDuration,
    });

    this._lagFrames = lagFrames;
    this._animationStarts = starts;
  }

  interpolate(alpha: number): void {
    const currentFrame = alpha * this._durationInFrames;

    for (let i = 0; i < this._animations.length; i++) {
      const animation = this._animations[i];
      const startFrame = this._animationStarts[i];
      const endFrame = startFrame + animation.durationInFrames;

      if (currentFrame >= startFrame && currentFrame < endFrame) {
        // This animation is active
        const localFrame = currentFrame - startFrame;
        const localAlpha = animation.getAlpha(localFrame);
        animation.interpolate(localAlpha);
      } else if (currentFrame >= endFrame) {
        // Animation is complete
        animation.interpolate(1);
      }
    }
  }

  /**
   * Get which animation is currently active
   */
  getActiveAnimationIndex(frame: number): number {
    for (let i = 0; i < this._animationStarts.length; i++) {
      const start = this._animationStarts[i];
      const end = start + this._animations[i].durationInFrames;

      if (frame >= start && frame < end) {
        return i;
      }
    }
    return -1; // All complete or not started
  }

  /**
   * Get start frame for a specific animation
   */
  getAnimationStartFrame(index: number): number {
    return this._animationStarts[index] ?? 0;
  }
}

/**
 * Convenience function
 */
export function succession(
  animations: Animation[],
  lagFrames = 0
): Succession {
  return new Succession(animations, { lagFrames });
}

/**
 * Wait animation - does nothing for a duration (useful in sequences)
 */
export class Wait extends Animation {
  constructor(durationInFrames: number) {
    // Create a minimal mobject-like object
    const dummy = {
      clone: () => dummy,
      getBoundingBox: () => ({ min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }),
    } as any;

    super(dummy, { durationInFrames });
  }

  interpolate(_alpha: number): void {
    // Do nothing - just wait
  }
}

export function wait(durationInFrames: number): Wait {
  return new Wait(durationInFrames);
}
