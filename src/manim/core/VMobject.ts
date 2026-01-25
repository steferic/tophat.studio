/**
 * Vector-based Mobject with Bezier path representation
 */

import { Mobject, MobjectConfig } from './Mobject';
import type { BezierPath, CubicBezierSegment, Point2D } from '../types';
import { bezierPathToSvg, getPartialPath, interpolatePaths } from '../utils';

export interface VMobjectConfig extends MobjectConfig {
  path?: BezierPath;
}

export class VMobject extends Mobject {
  protected _path: BezierPath = { segments: [], closed: false };

  constructor(config: VMobjectConfig = {}) {
    super(config);
    if (config.path) {
      this._path = config.path;
    }
  }

  // Path access
  get path(): BezierPath {
    return this._path;
  }

  set path(value: BezierPath) {
    this._path = value;
  }

  // Set path points
  setPath(path: BezierPath): this {
    this._path = path;
    return this;
  }

  // Check if path is closed
  get isClosed(): boolean {
    return this._path.closed;
  }

  // Close/open the path
  closePath(): this {
    this._path.closed = true;
    return this;
  }

  openPath(): this {
    this._path.closed = false;
    return this;
  }

  // Get all points on the path
  getPoints(): Point2D[] {
    const points: Point2D[] = [];
    for (const segment of this._path.segments) {
      points.push(segment.start, segment.control1, segment.control2, segment.end);
    }
    return points;
  }

  // Transform the path points
  protected transformPoint(point: Point2D): Point2D {
    // Apply scale
    let x = point.x * this._scale[0];
    let y = point.y * this._scale[1];

    // Apply rotation
    if (this._rotation !== 0) {
      const cos = Math.cos(this._rotation);
      const sin = Math.sin(this._rotation);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      x = rx;
      y = ry;
    }

    // Apply translation
    x += this._position[0];
    y += this._position[1];

    return { x, y };
  }

  // Get the transformed path
  getTransformedPath(): BezierPath {
    return {
      segments: this._path.segments.map((seg) => ({
        start: this.transformPoint(seg.start),
        control1: this.transformPoint(seg.control1),
        control2: this.transformPoint(seg.control2),
        end: this.transformPoint(seg.end),
      })),
      closed: this._path.closed,
    };
  }

  // Convert to SVG path data
  toSVGPath(): string {
    return bezierPathToSvg(this.getTransformedPath());
  }

  // Get partial path for drawing animations
  getPartialPath(alpha: number): string {
    const partial = getPartialPath(this.getTransformedPath(), alpha);
    return bezierPathToSvg(partial);
  }

  // Interpolate to another VMobject
  interpolateTo(other: VMobject, t: number): VMobject {
    const result = this.clone();
    result._path = interpolatePaths(this._path, other._path, t);

    // Interpolate styles
    result._stroke = {
      ...this._stroke,
      width: this._stroke.width + (other._stroke.width - this._stroke.width) * t,
      opacity:
        (this._stroke.opacity ?? 1) +
        ((other._stroke.opacity ?? 1) - (this._stroke.opacity ?? 1)) * t,
    };

    result._fill = {
      ...this._fill,
      opacity:
        (this._fill.opacity ?? 0) +
        ((other._fill.opacity ?? 0) - (this._fill.opacity ?? 0)) * t,
    };

    return result;
  }

  // Get bounding box
  getBoundingBox(): { min: Point2D; max: Point2D } {
    const transformed = this.getTransformedPath();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const segment of transformed.segments) {
      for (const point of [segment.start, segment.control1, segment.control2, segment.end]) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    // Handle empty path
    if (minX === Infinity) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  // Clone
  clone(): VMobject {
    const cloned = new VMobject({
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
      path: {
        segments: this._path.segments.map((seg) => ({
          start: { ...seg.start },
          control1: { ...seg.control1 },
          control2: { ...seg.control2 },
          end: { ...seg.end },
        })),
        closed: this._path.closed,
      },
    });
    return cloned;
  }

  // Add a bezier segment
  addSegment(segment: CubicBezierSegment): this {
    this._path.segments.push(segment);
    return this;
  }

  // Add a line segment (converted to bezier)
  addLine(start: Point2D, end: Point2D): this {
    const dx = (end.x - start.x) / 3;
    const dy = (end.y - start.y) / 3;
    this._path.segments.push({
      start,
      control1: { x: start.x + dx, y: start.y + dy },
      control2: { x: start.x + 2 * dx, y: start.y + 2 * dy },
      end,
    });
    return this;
  }

  // Clear the path
  clearPath(): this {
    this._path = { segments: [], closed: false };
    return this;
  }
}
