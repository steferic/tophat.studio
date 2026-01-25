/**
 * Line - A straight line segment
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, Vector2D } from '../types';
import { subtractVectors, vectorLength, normalizeVector } from '../types';

export interface LineConfig extends VMobjectConfig {
  start?: Vector2D;
  end?: Vector2D;
}

export class Line extends VMobject {
  protected _start: Vector2D;
  protected _end: Vector2D;

  constructor(config: LineConfig = {}) {
    super(config);
    this._start = config.start ?? [-1, 0];
    this._end = config.end ?? [1, 0];
    this.generatePath();
  }

  protected generatePath(): void {
    const start: Point2D = { x: this._start[0], y: this._start[1] };
    const end: Point2D = { x: this._end[0], y: this._end[1] };

    // Create a straight line as a degenerate bezier (control points on line)
    const dx = (end.x - start.x) / 3;
    const dy = (end.y - start.y) / 3;

    this._path = {
      segments: [
        {
          start,
          control1: { x: start.x + dx, y: start.y + dy },
          control2: { x: start.x + 2 * dx, y: start.y + 2 * dy },
          end,
        },
      ],
      closed: false,
    };
  }

  get start(): Vector2D {
    return [...this._start] as Vector2D;
  }

  get end(): Vector2D {
    return [...this._end] as Vector2D;
  }

  // Set start point
  setStart(point: Vector2D): this {
    this._start = [...point] as Vector2D;
    this.generatePath();
    return this;
  }

  // Set end point
  setEnd(point: Vector2D): this {
    this._end = [...point] as Vector2D;
    this.generatePath();
    return this;
  }

  // Get length of the line
  getLength(): number {
    return vectorLength(subtractVectors(this._end, this._start));
  }

  // Get unit direction vector
  getDirection(): Vector2D {
    return normalizeVector(subtractVectors(this._end, this._start));
  }

  // Get point at parameter t (0 = start, 1 = end)
  pointAlongLine(t: number): Vector2D {
    return [
      this._start[0] + t * (this._end[0] - this._start[0]),
      this._start[1] + t * (this._end[1] - this._start[1]),
    ];
  }

  // Get midpoint
  getMidpoint(): Vector2D {
    return this.pointAlongLine(0.5);
  }

  clone(): Line {
    return new Line({
      start: [...this._start],
      end: [...this._end],
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Convenience function
export function line(start: Vector2D, end: Vector2D): Line {
  return new Line({ start, end });
}
