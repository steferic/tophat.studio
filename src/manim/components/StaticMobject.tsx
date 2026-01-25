/**
 * StaticMobject - Renders a VMobject without animation
 */

import React from 'react';
import { VMobject } from '../core/VMobject';
import { MobjectRenderer } from './MobjectRenderer';

export interface StaticMobjectProps {
  mobject: VMobject;
  opacity?: number;
}

/**
 * StaticMobject renders a VMobject as-is (no animation)
 */
export const StaticMobject: React.FC<StaticMobjectProps> = ({
  mobject,
  opacity = 1,
}) => {
  return <MobjectRenderer mobject={mobject} opacity={opacity} />;
};

export default StaticMobject;
