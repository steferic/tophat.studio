/**
 * Rate functions (easing functions) for animations
 * These control how animations progress over time
 */

export type RateFunc = (t: number) => number;

/**
 * Linear interpolation - constant speed
 */
export const linear: RateFunc = (t) => t;

/**
 * Smooth start and end - standard Manim smooth function
 * Uses smoothstep polynomial
 */
export const smooth: RateFunc = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
};

/**
 * Even smoother - uses Perlin's improved smoothstep
 */
export const smootherStep: RateFunc = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/**
 * Rush into the end - slow start, fast finish
 */
export const rushInto: RateFunc = (t) => {
  return 2 * smooth(t / 2);
};

/**
 * Rush from the start - fast start, slow finish
 */
export const rushFrom: RateFunc = (t) => {
  return 2 * smooth(t / 2 + 0.5) - 1;
};

/**
 * There and back - goes to 1 and returns to 0
 */
export const thereAndBack: RateFunc = (t) => {
  const newT = 2 * t;
  if (newT < 1) {
    return smooth(newT);
  }
  return smooth(2 - newT);
};

/**
 * There and back with pause at the peak
 */
export const thereAndBackWithPause: (pauseRatio?: number) => RateFunc =
  (pauseRatio = 0.3) => (t) => {
    const a = 1 / (1 - pauseRatio);
    if (t < 0.5 - pauseRatio / 2) {
      return smooth(a * t);
    }
    if (t < 0.5 + pauseRatio / 2) {
      return 1;
    }
    return smooth(a - a * t);
  };

/**
 * Double smooth - stays at 0, goes to 1, stays at 1
 */
export const doubleSmooth: RateFunc = (t) => {
  if (t < 0.5) {
    return 2 * smooth(t);
  }
  return 2 * smooth(t) - 1;
};

/**
 * Exponential decay
 */
export const exponentialDecay: (halfLife?: number) => RateFunc =
  (halfLife = 0.1) => (t) => {
    return 1 - Math.pow(2, -t / halfLife);
  };

/**
 * Ease in - start slow
 */
export const easeInQuad: RateFunc = (t) => t * t;
export const easeInCubic: RateFunc = (t) => t * t * t;
export const easeInQuart: RateFunc = (t) => t * t * t * t;
export const easeInQuint: RateFunc = (t) => t * t * t * t * t;
export const easeInExpo: RateFunc = (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1)));
export const easeInCirc: RateFunc = (t) => 1 - Math.sqrt(1 - t * t);

/**
 * Ease out - end slow
 */
export const easeOutQuad: RateFunc = (t) => 1 - (1 - t) * (1 - t);
export const easeOutCubic: RateFunc = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart: RateFunc = (t) => 1 - Math.pow(1 - t, 4);
export const easeOutQuint: RateFunc = (t) => 1 - Math.pow(1 - t, 5);
export const easeOutExpo: RateFunc = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutCirc: RateFunc = (t) => Math.sqrt(1 - Math.pow(t - 1, 2));

/**
 * Ease in and out
 */
export const easeInOutQuad: RateFunc = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInOutCubic: RateFunc = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeInOutQuart: RateFunc = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/**
 * Bounce effects
 */
export const easeOutBounce: RateFunc = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const easeInBounce: RateFunc = (t) => 1 - easeOutBounce(1 - t);

export const easeInOutBounce: RateFunc = (t) =>
  t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;

/**
 * Elastic effects
 */
export const easeOutElastic: RateFunc = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInElastic: RateFunc = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

/**
 * Back effects (overshoot)
 */
export const easeInBack: RateFunc = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};

export const easeOutBack: RateFunc = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Wiggle effect
 */
export const wiggle: (numWiggles?: number) => RateFunc =
  (numWiggles = 2) => (t) => {
    return thereAndBack(t) * Math.sin(numWiggles * Math.PI * t);
  };

/**
 * Lingering - fast start, very slow end
 */
export const lingering: RateFunc = (t) => {
  return smooth(smooth(smooth(t)));
};

/**
 * Not quite there - doesn't quite reach 1
 */
export const notQuiteThere: (proportion?: number) => RateFunc =
  (proportion = 0.7) => (t) => {
    return proportion * smooth(t);
  };

/**
 * Running start - backs up before going forward
 */
export const runningStart: (pullBack?: number) => RateFunc =
  (pullBack = 0.3) => (t) => {
    if (t < 0.2) {
      return -pullBack * smooth(t / 0.2);
    }
    return smooth((t - 0.2) / 0.8) * (1 + pullBack) - pullBack;
  };
