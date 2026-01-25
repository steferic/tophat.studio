/**
 * SVG path generation utilities
 */

import type { BezierPath, CubicBezierSegment, Point2D } from '../types';

/**
 * Convert a bezier path to SVG path data string
 */
export function bezierPathToSvg(path: BezierPath): string {
  if (path.segments.length === 0) return '';

  const parts: string[] = [];
  let currentEnd: Point2D | null = null;

  for (let i = 0; i < path.segments.length; i++) {
    const segment = path.segments[i];

    // Move to start if this is the first segment or if there's a gap
    if (i === 0 || !pointsEqual(currentEnd!, segment.start)) {
      parts.push(`M ${formatPoint(segment.start)}`);
    }

    // Cubic bezier curve
    parts.push(
      `C ${formatPoint(segment.control1)} ${formatPoint(segment.control2)} ${formatPoint(
        segment.end
      )}`
    );

    currentEnd = segment.end;
  }

  if (path.closed && path.segments.length > 0) {
    parts.push('Z');
  }

  return parts.join(' ');
}

/**
 * Convert a single bezier segment to SVG path data
 */
export function segmentToSvg(segment: CubicBezierSegment): string {
  return `M ${formatPoint(segment.start)} C ${formatPoint(segment.control1)} ${formatPoint(
    segment.control2
  )} ${formatPoint(segment.end)}`;
}

/**
 * Create SVG path for a line
 */
export function lineSvg(start: Point2D, end: Point2D): string {
  return `M ${formatPoint(start)} L ${formatPoint(end)}`;
}

/**
 * Create SVG path for a circle (using 4 bezier curves)
 */
export function circleSvg(center: Point2D, radius: number): string {
  // Magic number for bezier circle approximation
  const k = 0.5522847498;
  const kRadius = k * radius;
  const { x, y } = center;

  return [
    `M ${x + radius} ${y}`,
    `C ${x + radius} ${y + kRadius} ${x + kRadius} ${y + radius} ${x} ${y + radius}`,
    `C ${x - kRadius} ${y + radius} ${x - radius} ${y + kRadius} ${x - radius} ${y}`,
    `C ${x - radius} ${y - kRadius} ${x - kRadius} ${y - radius} ${x} ${y - radius}`,
    `C ${x + kRadius} ${y - radius} ${x + radius} ${y - kRadius} ${x + radius} ${y}`,
    'Z',
  ].join(' ');
}

/**
 * Create SVG path for a rectangle
 */
export function rectangleSvg(
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius = 0
): string {
  if (cornerRadius <= 0) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }

  const r = Math.min(cornerRadius, width / 2, height / 2);

  return [
    `M ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    `L ${x + r} ${y + height}`,
    `Q ${x} ${y + height} ${x} ${y + height - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    'Z',
  ].join(' ');
}

/**
 * Create SVG path for a regular polygon
 */
export function regularPolygonSvg(
  center: Point2D,
  radius: number,
  sides: number,
  startAngle = -Math.PI / 2
): string {
  const points: Point2D[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (2 * Math.PI * i) / sides;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  return polygonSvg(points);
}

/**
 * Create SVG path for an arbitrary polygon
 */
export function polygonSvg(points: Point2D[]): string {
  if (points.length < 3) return '';

  return [
    `M ${formatPoint(points[0])}`,
    ...points.slice(1).map((p) => `L ${formatPoint(p)}`),
    'Z',
  ].join(' ');
}

/**
 * Create SVG path for an arc
 */
export function arcSvg(
  center: Point2D,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  const angleDiff = endAngle - startAngle;
  const largeArc = Math.abs(angleDiff) > Math.PI ? 1 : 0;
  const sweep = angleDiff > 0 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
}

// Helper functions

function formatPoint(p: Point2D): string {
  return `${formatNumber(p.x)} ${formatNumber(p.y)}`;
}

function formatNumber(n: number): string {
  // Round to 4 decimal places to avoid floating point issues
  return Number(n.toFixed(4)).toString();
}

function pointsEqual(a: Point2D, b: Point2D, epsilon = 1e-10): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}
