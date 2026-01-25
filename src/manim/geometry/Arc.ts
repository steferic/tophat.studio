/**
 * Arc - A portion of a circle
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, CubicBezierSegment } from '../types';
import { PI, TAU } from '../constants';

export interface ArcConfig extends VMobjectConfig {
  radius?: number;
  startAngle?: number;
  angle?: number;
  numComponents?: number;
}

export class Arc extends VMobject {
  protected _radius: number;
  protected _startAngle: number;
  protected _angle: number;

  constructor(config: ArcConfig = {}) {
    super(config);
    this._radius = config.radius ?? 1;
    this._startAngle = config.startAngle ?? 0;
    this._angle = config.angle ?? TAU / 4; // Default 90 degrees
    this.generatePath();
  }

  protected generatePath(): void {
    // Number of bezier curves to use
    const numCurves = Math.max(1, Math.ceil(Math.abs(this._angle) / (PI / 2)));
    const anglePerCurve = this._angle / numCurves;

    this._path = { segments: [], closed: false };

    for (let i = 0; i < numCurves; i++) {
      const startAngle = this._startAngle + i * anglePerCurve;
      const endAngle = startAngle + anglePerCurve;

      const segment = this.createArcSegment(startAngle, endAngle);
      this._path.segments.push(segment);
    }
  }

  private createArcSegment(startAngle: number, endAngle: number): CubicBezierSegment {
    const r = this._radius;

    // Calculate control point distance for bezier approximation of arc
    const angleDiff = endAngle - startAngle;
    const k = (4 / 3) * Math.tan(angleDiff / 4);

    const start: Point2D = {
      x: r * Math.cos(startAngle),
      y: r * Math.sin(startAngle),
    };

    const end: Point2D = {
      x: r * Math.cos(endAngle),
      y: r * Math.sin(endAngle),
    };

    // Tangent directions
    const startTangent: Point2D = {
      x: -Math.sin(startAngle),
      y: Math.cos(startAngle),
    };

    const endTangent: Point2D = {
      x: -Math.sin(endAngle),
      y: Math.cos(endAngle),
    };

    return {
      start,
      control1: {
        x: start.x + k * r * startTangent.x,
        y: start.y + k * r * startTangent.y,
      },
      control2: {
        x: end.x - k * r * endTangent.x,
        y: end.y - k * r * endTangent.y,
      },
      end,
    };
  }

  get radius(): number {
    return this._radius;
  }

  get startAngle(): number {
    return this._startAngle;
  }

  get angle(): number {
    return this._angle;
  }

  // Get the start point of the arc
  getStart(): Point2D {
    return {
      x: this._radius * Math.cos(this._startAngle) + this._position[0],
      y: this._radius * Math.sin(this._startAngle) + this._position[1],
    };
  }

  // Get the end point of the arc
  getEnd(): Point2D {
    const endAngle = this._startAngle + this._angle;
    return {
      x: this._radius * Math.cos(endAngle) + this._position[0],
      y: this._radius * Math.sin(endAngle) + this._position[1],
    };
  }

  clone(): Arc {
    return new Arc({
      radius: this._radius,
      startAngle: this._startAngle,
      angle: this._angle,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
