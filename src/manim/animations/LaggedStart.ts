/**
 * LaggedStart - Animations with staggered start times
 */

import { Animation, AnimationConfig } from './Animation';
import { AnimationGroup } from './AnimationGroup';

export interface LaggedStartConfig extends AnimationConfig {
  /** Lag ratio between 0 and 1 */
  lagRatio?: number;
}

/**
 * LaggedStart runs animations with staggered start times
 *
 * With lagRatio = 0.5, each animation starts when the previous is 50% complete
 */
export class LaggedStart extends AnimationGroup {
  constructor(animations: Animation[], config: LaggedStartConfig = {}) {
    super(animations, {
      ...config,
      lagRatio: config.lagRatio ?? 0.5,
    });
  }
}

/**
 * Convenience function
 */
export function laggedStart(
  animations: Animation[],
  lagRatio = 0.5
): LaggedStart {
  return new LaggedStart(animations, { lagRatio });
}

/**
 * LaggedStartMap - Apply the same animation to multiple mobjects with lag
 */
export class LaggedStartMap<A extends Animation> extends LaggedStart {
  constructor(
    AnimationClass: new (mobject: any, config?: AnimationConfig) => A,
    mobjects: any[],
    config: LaggedStartConfig & AnimationConfig = {}
  ) {
    const animations = mobjects.map(
      (mobject) => new AnimationClass(mobject, config)
    );
    super(animations, config);
  }
}
