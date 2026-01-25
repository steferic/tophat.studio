/**
 * Hook for using Manim animations with Remotion's frame system
 */

import { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import type { Animation } from '../animations/Animation';
import type { Mobject } from '../core/Mobject';

export interface AnimationState {
  /** Current alpha value (0-1) */
  alpha: number;
  /** Whether animation is complete */
  isComplete: boolean;
  /** Whether animation has started */
  hasStarted: boolean;
  /** Current frame relative to animation start */
  localFrame: number;
}

export interface UseAnimationOptions {
  /** Frame offset from start of composition */
  startFrame?: number;
}

/**
 * Hook to get animation state at current frame
 */
export function useAnimation(
  animation: Animation,
  options: UseAnimationOptions = {}
): AnimationState {
  const currentFrame = useCurrentFrame();
  const startFrame = options.startFrame ?? 0;

  return useMemo(() => {
    const localFrame = currentFrame - startFrame;
    const hasStarted = localFrame >= 0;
    const isComplete = animation.isComplete(localFrame);

    let alpha = 0;
    if (hasStarted) {
      alpha = animation.getAlpha(localFrame);
    }

    return {
      alpha,
      isComplete,
      hasStarted,
      localFrame,
    };
  }, [currentFrame, startFrame, animation]);
}

/**
 * Hook to get the animated mobject state
 */
export function useAnimatedMobject<T extends Mobject>(
  animation: Animation<T>,
  options: UseAnimationOptions = {}
): { mobject: T; alpha: number; isComplete: boolean } {
  const frame = useCurrentFrame();
  const startFrame = options.startFrame ?? 0;

  return useMemo(() => {
    const localFrame = frame - startFrame;

    if (localFrame < 0) {
      // Animation hasn't started - return initial state
      return {
        mobject: animation.mobject,
        alpha: 0,
        isComplete: false,
      };
    }

    const { mobject, alpha } = animation.getStateAtFrame(localFrame);
    return {
      mobject,
      alpha,
      isComplete: animation.isComplete(localFrame),
    };
  }, [frame, startFrame, animation]);
}

/**
 * Hook for managing multiple sequential animations
 */
export function useAnimationSequence(
  animations: Animation[],
  startFrame = 0
): {
  currentAnimationIndex: number;
  currentAlpha: number;
  isComplete: boolean;
  activeAnimation: Animation | null;
} {
  const frame = useCurrentFrame();

  return useMemo(() => {
    let accumulatedFrames = startFrame;
    let currentIndex = -1;
    let currentAlpha = 0;
    let activeAnimation: Animation | null = null;

    for (let i = 0; i < animations.length; i++) {
      const anim = animations[i];
      const animStart = accumulatedFrames;
      const animEnd = animStart + anim.durationInFrames;

      if (frame >= animStart && frame < animEnd) {
        currentIndex = i;
        currentAlpha = anim.getAlpha(frame - animStart);
        activeAnimation = anim;
        break;
      }

      accumulatedFrames = animEnd;
    }

    // Check if we're past all animations
    const totalDuration = animations.reduce((sum, a) => sum + a.durationInFrames, 0);
    const isComplete = frame >= startFrame + totalDuration;

    return {
      currentAnimationIndex: currentIndex,
      currentAlpha,
      isComplete,
      activeAnimation,
    };
  }, [frame, animations, startFrame]);
}

/**
 * Hook for parallel animations (AnimationGroup)
 */
export function useParallelAnimations(
  animations: Animation[],
  startFrame = 0
): {
  alphas: number[];
  isComplete: boolean;
  allStarted: boolean;
} {
  const frame = useCurrentFrame();

  return useMemo(() => {
    const localFrame = frame - startFrame;
    const allStarted = localFrame >= 0;

    const alphas = animations.map((anim) => {
      if (localFrame < 0) return 0;
      return anim.getAlpha(localFrame);
    });

    const maxDuration = Math.max(...animations.map((a) => a.durationInFrames));
    const isComplete = localFrame >= maxDuration;

    return { alphas, isComplete, allStarted };
  }, [frame, animations, startFrame]);
}

/**
 * Hook for lagged start animations
 */
export function useLaggedStart(
  animations: Animation[],
  lagRatio: number = 0.5,
  startFrame = 0
): {
  alphas: number[];
  isComplete: boolean;
} {
  const frame = useCurrentFrame();

  return useMemo(() => {
    const localFrame = frame - startFrame;

    if (animations.length === 0) {
      return { alphas: [], isComplete: true };
    }

    // Calculate lag offset for each animation
    const firstDuration = animations[0].durationInFrames;
    const lagOffset = firstDuration * lagRatio;

    const alphas = animations.map((anim, index) => {
      const animStartFrame = index * lagOffset;
      const animLocalFrame = localFrame - animStartFrame;

      if (animLocalFrame < 0) return 0;
      return anim.getAlpha(animLocalFrame);
    });

    // Total duration considering lag
    const lastAnimStart = (animations.length - 1) * lagOffset;
    const lastAnimDuration = animations[animations.length - 1].durationInFrames;
    const totalDuration = lastAnimStart + lastAnimDuration;
    const isComplete = localFrame >= totalDuration;

    return { alphas, isComplete };
  }, [frame, animations, lagRatio, startFrame]);
}
