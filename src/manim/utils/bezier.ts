/**
 * Bezier curve math utilities
 */

import type { Point2D, CubicBezierSegment, BezierPath } from '../types';
import { lerp } from './math';

/**
 * Evaluate a cubic bezier curve at parameter t
 */
export function evaluateCubicBezier(segment: CubicBezierSegment, t: number): Point2D {
  const { start, control1, control2, end } = segment;
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * start.x + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * end.x,
    y: uuu * start.y + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * end.y,
  };
}

/**
 * Get the tangent of a cubic bezier at parameter t
 */
export function bezierTangent(segment: CubicBezierSegment, t: number): Point2D {
  const { start, control1, control2, end } = segment;
  const u = 1 - t;

  return {
    x:
      3 * u * u * (control1.x - start.x) +
      6 * u * t * (control2.x - control1.x) +
      3 * t * t * (end.x - control2.x),
    y:
      3 * u * u * (control1.y - start.y) +
      6 * u * t * (control2.y - control1.y) +
      3 * t * t * (end.y - control2.y),
  };
}

/**
 * Split a bezier segment at parameter t using de Casteljau's algorithm
 */
export function splitBezier(
  segment: CubicBezierSegment,
  t: number
): [CubicBezierSegment, CubicBezierSegment] {
  const { start, control1, control2, end } = segment;

  // First level
  const p01 = { x: lerp(start.x, control1.x, t), y: lerp(start.y, control1.y, t) };
  const p12 = { x: lerp(control1.x, control2.x, t), y: lerp(control1.y, control2.y, t) };
  const p23 = { x: lerp(control2.x, end.x, t), y: lerp(control2.y, end.y, t) };

  // Second level
  const p012 = { x: lerp(p01.x, p12.x, t), y: lerp(p01.y, p12.y, t) };
  const p123 = { x: lerp(p12.x, p23.x, t), y: lerp(p12.y, p23.y, t) };

  // Third level (the split point)
  const p0123 = { x: lerp(p012.x, p123.x, t), y: lerp(p012.y, p123.y, t) };

  return [
    { start, control1: p01, control2: p012, end: p0123 },
    { start: p0123, control1: p123, control2: p23, end },
  ];
}

/**
 * Approximate the arc length of a bezier segment
 */
export function bezierArcLength(segment: CubicBezierSegment, steps = 100): number {
  let length = 0;
  let prevPoint = segment.start;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const point = evaluateCubicBezier(segment, t);
    const dx = point.x - prevPoint.x;
    const dy = point.y - prevPoint.y;
    length += Math.sqrt(dx * dx + dy * dy);
    prevPoint = point;
  }

  return length;
}

/**
 * Get the total arc length of a bezier path
 */
export function pathArcLength(path: BezierPath): number {
  return path.segments.reduce((total, segment) => total + bezierArcLength(segment), 0);
}

/**
 * Get partial path from 0 to alpha (0-1)
 */
export function getPartialPath(path: BezierPath, alpha: number): BezierPath {
  if (alpha <= 0) return { segments: [], closed: false };
  if (alpha >= 1) return path;

  const totalLength = pathArcLength(path);
  const targetLength = totalLength * alpha;

  let currentLength = 0;
  const partialSegments: CubicBezierSegment[] = [];

  for (const segment of path.segments) {
    const segmentLength = bezierArcLength(segment);

    if (currentLength + segmentLength <= targetLength) {
      // Include the full segment
      partialSegments.push(segment);
      currentLength += segmentLength;
    } else {
      // Need to split this segment
      const remainingLength = targetLength - currentLength;
      const t = remainingLength / segmentLength;
      const [firstHalf] = splitBezier(segment, t);
      partialSegments.push(firstHalf);
      break;
    }
  }

  return { segments: partialSegments, closed: false };
}

/**
 * Interpolate between two bezier paths
 */
export function interpolatePaths(
  path1: BezierPath,
  path2: BezierPath,
  t: number
): BezierPath {
  // Ensure paths have same number of segments
  const maxSegments = Math.max(path1.segments.length, path2.segments.length);
  const segments1 = normalizePath(path1, maxSegments);
  const segments2 = normalizePath(path2, maxSegments);

  const interpolatedSegments: CubicBezierSegment[] = [];

  for (let i = 0; i < maxSegments; i++) {
    interpolatedSegments.push(interpolateSegment(segments1[i], segments2[i], t));
  }

  return {
    segments: interpolatedSegments,
    closed: t < 0.5 ? path1.closed : path2.closed,
  };
}

/**
 * Normalize a path to have exactly n segments
 */
function normalizePath(path: BezierPath, n: number): CubicBezierSegment[] {
  if (path.segments.length === 0) {
    // Create degenerate segments at origin
    const origin: Point2D = { x: 0, y: 0 };
    return Array(n).fill({
      start: origin,
      control1: origin,
      control2: origin,
      end: origin,
    });
  }

  if (path.segments.length === n) {
    return [...path.segments];
  }

  if (path.segments.length < n) {
    // Subdivide segments to add more
    const result: CubicBezierSegment[] = [];
    const subsPerSegment = Math.ceil(n / path.segments.length);

    for (const segment of path.segments) {
      let current = segment;
      for (let i = 0; i < subsPerSegment && result.length < n; i++) {
        const [first, second] = splitBezier(current, 0.5);
        result.push(first);
        current = second;
      }
    }

    while (result.length < n) {
      result.push(result[result.length - 1]);
    }

    return result.slice(0, n);
  }

  // Merge segments (take evenly spaced samples)
  const result: CubicBezierSegment[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor((i / n) * path.segments.length);
    result.push(path.segments[idx]);
  }
  return result;
}

/**
 * Interpolate between two bezier segments
 */
function interpolateSegment(
  seg1: CubicBezierSegment,
  seg2: CubicBezierSegment,
  t: number
): CubicBezierSegment {
  return {
    start: {
      x: lerp(seg1.start.x, seg2.start.x, t),
      y: lerp(seg1.start.y, seg2.start.y, t),
    },
    control1: {
      x: lerp(seg1.control1.x, seg2.control1.x, t),
      y: lerp(seg1.control1.y, seg2.control1.y, t),
    },
    control2: {
      x: lerp(seg1.control2.x, seg2.control2.x, t),
      y: lerp(seg1.control2.y, seg2.control2.y, t),
    },
    end: {
      x: lerp(seg1.end.x, seg2.end.x, t),
      y: lerp(seg1.end.y, seg2.end.y, t),
    },
  };
}
