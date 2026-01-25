/**
 * Play component - Declarative animation trigger
 * Similar to Manim's self.play()
 */

import React from 'react';
import { VMobject } from '../core/VMobject';
import { Animation } from '../animations/Animation';
import { AnimatedMobject } from './AnimatedMobject';

export interface PlayProps {
  animation: Animation<VMobject>;
}

/**
 * Play component renders an animation
 *
 * Usage:
 * ```tsx
 * <Sequence from={0} durationInFrames={60}>
 *   <Play animation={new Create(circle)} />
 * </Sequence>
 * ```
 */
export const Play: React.FC<PlayProps> = ({ animation }) => {
  return <AnimatedMobject animation={animation} startFrame={0} />;
};

export default Play;
