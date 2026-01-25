/**
 * Bezier curve types for VMobject paths
 */

import type { Point2D } from './vector';

/**
 * A cubic bezier segment with start, two control points, and end
 */
export interface CubicBezierSegment {
  start: Point2D;
  control1: Point2D;
  control2: Point2D;
  end: Point2D;
}

/**
 * A path made of multiple bezier segments
 */
export interface BezierPath {
  segments: CubicBezierSegment[];
  closed: boolean;
}

/**
 * Quadratic bezier (for simpler curves)
 */
export interface QuadraticBezierSegment {
  start: Point2D;
  control: Point2D;
  end: Point2D;
}

/**
 * Convert quadratic to cubic bezier
 */
export function quadraticToCubic(quad: QuadraticBezierSegment): CubicBezierSegment {
  const { start, control, end } = quad;
  return {
    start,
    control1: {
      x: start.x + (2 / 3) * (control.x - start.x),
      y: start.y + (2 / 3) * (control.y - start.y),
    },
    control2: {
      x: end.x + (2 / 3) * (control.x - end.x),
      y: end.y + (2 / 3) * (control.y - end.y),
    },
    end,
  };
}
