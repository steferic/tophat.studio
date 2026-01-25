/**
 * AnimatedMobject - Wrapper component that renders a mobject with animation
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { VMobject } from '../core/VMobject';
import { Animation } from '../animations/Animation';
import { Create, DrawBorderThenFill } from '../animations/Create';
import { FadeIn, FadeInWithScale, GrowFromCenter, SpinInFromNothing } from '../animations/FadeIn';
import { FadeOut, FadeOutWithScale, ShrinkToCenter } from '../animations/FadeOut';
// Transform imported for future use with morph animations
import { MobjectRenderer } from './MobjectRenderer';
import { useCoordinates } from '../hooks/useCoordinates';

export interface AnimatedMobjectProps {
  animation: Animation<VMobject>;
  startFrame?: number;
}

export const AnimatedMobject: React.FC<AnimatedMobjectProps> = ({
  animation,
  startFrame = 0,
}) => {
  const currentFrame = useCurrentFrame();
  const coords = useCoordinates();
  const localFrame = currentFrame - startFrame;

  // Not started yet
  if (localFrame < 0) {
    return null;
  }

  // Get alpha
  const alpha = animation.getAlpha(localFrame);

  // Initialize animation if first frame
  if (localFrame === 0) {
    animation.begin();
  }

  // Apply animation interpolation
  animation.interpolate(alpha);

  const mobject = animation.mobject;

  // Handle different animation types
  let opacity = 1;
  let strokeOpacity: number | undefined;
  let fillOpacity: number | undefined;
  let pathProgress: number | undefined;
  let transform: string | undefined;

  // Create animation - progressive path drawing
  if (animation instanceof Create) {
    pathProgress = alpha;
  }

  // DrawBorderThenFill
  if (animation instanceof DrawBorderThenFill) {
    const opacities = animation.getOpacities(alpha);
    strokeOpacity = opacities.strokeOpacity;
    fillOpacity = opacities.fillOpacity;
    pathProgress = alpha < 0.5 ? alpha * 2 : 1;
  }

  // FadeIn
  if (animation instanceof FadeIn) {
    opacity = animation.getOpacity(alpha);

    // Handle scale animations
    if (animation instanceof FadeInWithScale || animation instanceof GrowFromCenter) {
      const scale = (animation as FadeInWithScale).getScale(alpha);
      const center = mobject.getCenter();
      const screenCenter = coords.toPixel(center);
      transform = `translate(${screenCenter.x}, ${screenCenter.y}) scale(${scale}) translate(${-screenCenter.x}, ${-screenCenter.y})`;
    }

    // Handle spin
    if (animation instanceof SpinInFromNothing) {
      const scale = animation.getScale(alpha);
      const rotation = animation.getRotation(alpha);
      const center = mobject.getCenter();
      const screenCenter = coords.toPixel(center);
      transform = `translate(${screenCenter.x}, ${screenCenter.y}) rotate(${rotation * 180 / Math.PI}) scale(${scale}) translate(${-screenCenter.x}, ${-screenCenter.y})`;
    }
  }

  // FadeOut
  if (animation instanceof FadeOut) {
    opacity = animation.getOpacity(alpha);

    if (animation instanceof FadeOutWithScale || animation instanceof ShrinkToCenter) {
      const scale = (animation as FadeOutWithScale).getScale(alpha);
      const center = mobject.getCenter();
      const screenCenter = coords.toPixel(center);
      transform = `translate(${screenCenter.x}, ${screenCenter.y}) scale(${scale}) translate(${-screenCenter.x}, ${-screenCenter.y})`;
    }
  }

  // After animation completes, check if it's a remover
  if (animation.isComplete(localFrame) && animation.isRemover) {
    return null;
  }

  return (
    <MobjectRenderer
      mobject={mobject}
      opacity={opacity}
      strokeOpacity={strokeOpacity}
      fillOpacity={fillOpacity}
      pathProgress={pathProgress}
      transform={transform}
    />
  );
};

export default AnimatedMobject;
