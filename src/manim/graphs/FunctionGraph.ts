/**
 * FunctionGraph - Graph of a mathematical function y = f(x)
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, HexColor, Vector2D } from '../types';
import { BLUE_C } from '../constants';

export interface FunctionGraphConfig extends VMobjectConfig {
  fn?: (x: number) => number;
  xRange?: [number, number];
  numSamples?: number;
  color?: HexColor;
  discontinuities?: number[];
  useSmoothing?: boolean;
}

export class FunctionGraph extends VMobject {
  protected _fn: (x: number) => number;
  protected _xRange: [number, number];
  protected _numSamples: number;
  protected _discontinuities: number[];
  protected _useSmoothing: boolean;

  constructor(config: FunctionGraphConfig = {}) {
    super(config);
    this._fn = config.fn ?? ((x) => x);
    this._xRange = config.xRange ?? [-5, 5];
    this._numSamples = config.numSamples ?? 100;
    this._discontinuities = config.discontinuities ?? [];
    this._useSmoothing = config.useSmoothing ?? true;

    const color = config.color ?? BLUE_C;
    this._stroke = { ...this._stroke, color, width: 4 };

    this.generatePath();
  }

  protected generatePath(): void {
    const [xMin, xMax] = this._xRange;
    const step = (xMax - xMin) / this._numSamples;

    this._path = { segments: [], closed: false };

    let prevPoint: Point2D | null = null;
    let prevValid = false;

    for (let i = 0; i <= this._numSamples; i++) {
      const x = xMin + i * step;

      // Check for discontinuities
      const isNearDiscontinuity = this._discontinuities.some(
        (d) => Math.abs(x - d) < step * 2
      );

      if (isNearDiscontinuity) {
        prevPoint = null;
        prevValid = false;
        continue;
      }

      try {
        const y = this._fn(x);

        if (!isFinite(y) || Math.abs(y) > 1000) {
          prevPoint = null;
          prevValid = false;
          continue;
        }

        const point: Point2D = { x, y };

        if (prevValid && prevPoint) {
          // Add line segment
          this.addLine(prevPoint, point);
        }

        prevPoint = point;
        prevValid = true;
      } catch {
        prevPoint = null;
        prevValid = false;
      }
    }
  }

  /**
   * Get function value at x
   */
  getValue(x: number): number {
    return this._fn(x);
  }

  /**
   * Get point on the graph at x
   */
  getPointAt(x: number): Vector2D {
    return [x + this._position[0], this._fn(x) + this._position[1]];
  }

  /**
   * Get derivative (approximation)
   */
  getDerivativeAt(x: number, h = 0.0001): number {
    return (this._fn(x + h) - this._fn(x - h)) / (2 * h);
  }

  /**
   * Get tangent line at x
   */
  getTangentLine(x: number, length = 2): { start: Vector2D; end: Vector2D } {
    const y = this._fn(x);
    const slope = this.getDerivativeAt(x);

    const halfLen = length / 2;
    const angle = Math.atan(slope);
    const dx = halfLen * Math.cos(angle);
    const dy = halfLen * Math.sin(angle);

    return {
      start: [x - dx + this._position[0], y - dy + this._position[1]],
      end: [x + dx + this._position[0], y + dy + this._position[1]],
    };
  }

  get fn(): (x: number) => number {
    return this._fn;
  }

  get xRange(): [number, number] {
    return [...this._xRange] as [number, number];
  }

  getBoundingBox(): { min: Point2D; max: Point2D } {
    const [xMin, xMax] = this._xRange;
    let yMin = Infinity;
    let yMax = -Infinity;

    const step = (xMax - xMin) / this._numSamples;
    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y = this._fn(x);
        if (isFinite(y)) {
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

  clone(): FunctionGraph {
    return new FunctionGraph({
      fn: this._fn,
      xRange: [...this._xRange] as [number, number],
      numSamples: this._numSamples,
      discontinuities: [...this._discontinuities],
      useSmoothing: this._useSmoothing,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Common functions
export const commonFunctions = {
  sin: (x: number) => Math.sin(x),
  cos: (x: number) => Math.cos(x),
  tan: (x: number) => Math.tan(x),
  exp: (x: number) => Math.exp(x),
  log: (x: number) => Math.log(x),
  sqrt: (x: number) => Math.sqrt(x),
  abs: (x: number) => Math.abs(x),
  parabola: (x: number) => x * x,
  cubic: (x: number) => x * x * x,
  reciprocal: (x: number) => 1 / x,
  sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
  gaussian: (x: number) => Math.exp(-x * x),
};
