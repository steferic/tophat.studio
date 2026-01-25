/**
 * ParametricFunction - Parametric curve (x(t), y(t))
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, HexColor, Vector2D } from '../types';
import { YELLOW_C } from '../constants';

export interface ParametricFunctionConfig extends VMobjectConfig {
  fn?: (t: number) => [number, number];
  tRange?: [number, number];
  numSamples?: number;
  color?: HexColor;
}

export class ParametricFunction extends VMobject {
  protected _fn: (t: number) => [number, number];
  protected _tRange: [number, number];
  protected _numSamples: number;

  constructor(config: ParametricFunctionConfig = {}) {
    super(config);
    this._fn = config.fn ?? ((t) => [Math.cos(t), Math.sin(t)]);
    this._tRange = config.tRange ?? [0, 2 * Math.PI];
    this._numSamples = config.numSamples ?? 100;

    const color = config.color ?? YELLOW_C;
    this._stroke = { ...this._stroke, color, width: 4 };

    this.generatePath();
  }

  protected generatePath(): void {
    const [tMin, tMax] = this._tRange;
    const step = (tMax - tMin) / this._numSamples;

    this._path = { segments: [], closed: false };

    let prevPoint: Point2D | null = null;

    for (let i = 0; i <= this._numSamples; i++) {
      const t = tMin + i * step;

      try {
        const [x, y] = this._fn(t);

        if (!isFinite(x) || !isFinite(y)) {
          prevPoint = null;
          continue;
        }

        const point: Point2D = { x, y };

        if (prevPoint) {
          this.addLine(prevPoint, point);
        }

        prevPoint = point;
      } catch {
        prevPoint = null;
      }
    }
  }

  /**
   * Get point at parameter t
   */
  getPointAt(t: number): Vector2D {
    const [x, y] = this._fn(t);
    return [x + this._position[0], y + this._position[1]];
  }

  /**
   * Get tangent vector at parameter t
   */
  getTangentAt(t: number, h = 0.0001): Vector2D {
    const [x1, y1] = this._fn(t - h);
    const [x2, y2] = this._fn(t + h);
    return [(x2 - x1) / (2 * h), (y2 - y1) / (2 * h)];
  }

  /**
   * Get arc length approximation
   */
  getArcLength(): number {
    const [tMin, tMax] = this._tRange;
    const step = (tMax - tMin) / this._numSamples;
    let length = 0;

    let [prevX, prevY] = this._fn(tMin);

    for (let i = 1; i <= this._numSamples; i++) {
      const t = tMin + i * step;
      const [x, y] = this._fn(t);
      length += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
      prevX = x;
      prevY = y;
    }

    return length;
  }

  get fn(): (t: number) => [number, number] {
    return this._fn;
  }

  get tRange(): [number, number] {
    return [...this._tRange] as [number, number];
  }

  getBoundingBox(): { min: Point2D; max: Point2D } {
    const [tMin, tMax] = this._tRange;
    const step = (tMax - tMin) / this._numSamples;

    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;

    for (let t = tMin; t <= tMax; t += step) {
      try {
        const [x, y] = this._fn(t);
        if (isFinite(x) && isFinite(y)) {
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } catch {}
    }

    return {
      min: { x: xMin + this._position[0], y: yMin + this._position[1] },
      max: { x: xMax + this._position[0], y: yMax + this._position[1] },
    };
  }

  clone(): ParametricFunction {
    return new ParametricFunction({
      fn: this._fn,
      tRange: [...this._tRange] as [number, number],
      numSamples: this._numSamples,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Common parametric curves
export const parametricCurves = {
  /** Circle */
  circle: (radius = 1): ((t: number) => [number, number]) =>
    (t) => [radius * Math.cos(t), radius * Math.sin(t)],

  /** Ellipse */
  ellipse: (a = 2, b = 1): ((t: number) => [number, number]) =>
    (t) => [a * Math.cos(t), b * Math.sin(t)],

  /** Lissajous curve */
  lissajous: (a = 3, b = 2, delta = Math.PI / 2): ((t: number) => [number, number]) =>
    (t) => [Math.sin(a * t + delta), Math.sin(b * t)],

  /** Spiral */
  spiral: (growth = 0.1): ((t: number) => [number, number]) =>
    (t) => [(1 + growth * t) * Math.cos(t), (1 + growth * t) * Math.sin(t)],

  /** Cardioid */
  cardioid: (): ((t: number) => [number, number]) =>
    (t) => [
      (1 - Math.cos(t)) * Math.cos(t),
      (1 - Math.cos(t)) * Math.sin(t),
    ],

  /** Rose curve */
  rose: (k = 3): ((t: number) => [number, number]) =>
    (t) => [Math.cos(k * t) * Math.cos(t), Math.cos(k * t) * Math.sin(t)],

  /** Hypotrochoid (spirograph) */
  hypotrochoid: (R = 5, r = 3, d = 5): ((t: number) => [number, number]) =>
    (t) => [
      (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t),
      (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t),
    ],

  /** Butterfly curve */
  butterfly: (): ((t: number) => [number, number]) =>
    (t) => {
      const sinT = Math.sin(t);
      const expTerm = Math.exp(Math.cos(t));
      const term = expTerm - 2 * Math.cos(4 * t) - Math.pow(sinT, 5);
      return [sinT * term * 0.5, Math.cos(t) * term * 0.5];
    },
};
