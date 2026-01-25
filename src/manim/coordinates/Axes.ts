/**
 * Axes - X and Y coordinate axes
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import { NumberLine } from './NumberLine';
import type { Point2D, Vector2D, HexColor } from '../types';
import { WHITE } from '../constants';

export interface AxesConfig extends VMobjectConfig {
  xRange?: [number, number, number];
  yRange?: [number, number, number];
  xLength?: number;
  yLength?: number;
  includeTicks?: boolean;
  tickSize?: number;
  includeNumbers?: boolean;
  axisColor?: HexColor;
  tips?: boolean;
}

export class Axes extends VMobject {
  protected _xAxis: NumberLine;
  protected _yAxis: NumberLine;
  protected _xRange: [number, number, number];
  protected _yRange: [number, number, number];
  protected _xLength: number;
  protected _yLength: number;

  constructor(config: AxesConfig = {}) {
    super(config);

    this._xRange = config.xRange ?? [-5, 5, 1];
    this._yRange = config.yRange ?? [-3, 3, 1];
    this._xLength = config.xLength ?? 10;
    this._yLength = config.yLength ?? 6;

    const axisColor = config.axisColor ?? WHITE;
    const includeTicks = config.includeTicks ?? true;
    const tickSize = config.tickSize ?? 0.15;
    const includeNumbers = config.includeNumbers ?? false;

    // Create X axis
    this._xAxis = new NumberLine({
      xRange: this._xRange,
      length: this._xLength,
      includeTicks,
      tickSize,
      includeNumbers,
      color: axisColor,
    });

    // Create Y axis (rotated 90 degrees)
    this._yAxis = new NumberLine({
      xRange: this._yRange,
      length: this._yLength,
      includeTicks,
      tickSize,
      includeNumbers,
      color: axisColor,
    }).rotate(Math.PI / 2);

    this._stroke = { ...this._stroke, color: axisColor };

    this.generatePath();
  }

  protected generatePath(): void {
    // Combine both axes paths
    this._path = { segments: [], closed: false };

    for (const segment of this._xAxis.path.segments) {
      this._path.segments.push(segment);
    }

    for (const segment of this._yAxis.path.segments) {
      this._path.segments.push(segment);
    }
  }

  /**
   * Convert coordinates to Manim point
   */
  coordsToPoint(x: number, y: number): Vector2D {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    const xT = (x - xMin) / (xMax - xMin);
    const yT = (y - yMin) / (yMax - yMin);

    const px = -this._xLength / 2 + xT * this._xLength + this._position[0];
    const py = -this._yLength / 2 + yT * this._yLength + this._position[1];

    return [px, py];
  }

  /**
   * Alias for coordsToPoint
   */
  c2p(x: number, y: number): Vector2D {
    return this.coordsToPoint(x, y);
  }

  /**
   * Convert Manim point to coordinates
   */
  pointToCoords(point: Vector2D): [number, number] {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    const localX = point[0] - this._position[0];
    const localY = point[1] - this._position[1];

    const xT = (localX + this._xLength / 2) / this._xLength;
    const yT = (localY + this._yLength / 2) / this._yLength;

    return [xMin + xT * (xMax - xMin), yMin + yT * (yMax - yMin)];
  }

  /**
   * Alias for pointToCoords
   */
  p2c(point: Vector2D): [number, number] {
    return this.pointToCoords(point);
  }

  /**
   * Get the origin point in Manim coordinates
   */
  getOrigin(): Vector2D {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Plot a function on these axes
   */
  plot(
    fn: (x: number) => number,
    options: {
      xRange?: [number, number];
      color?: HexColor;
      strokeWidth?: number;
      numSamples?: number;
    } = {}
  ): VMobject {
    const xRange = options.xRange ?? [this._xRange[0], this._xRange[1]];
    const numSamples = options.numSamples ?? 100;
    const color = options.color ?? '#58C4DD'; // BLUE_C

    const graph = new VMobject();
    graph.setStroke({ color, width: options.strokeWidth ?? 4 });

    const [xMin, xMax] = xRange;
    const step = (xMax - xMin) / numSamples;

    let prevPoint: Vector2D | null = null;

    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y = fn(x);

        // Skip invalid values
        if (!isFinite(y)) continue;

        const point = this.coordsToPoint(x, y);

        if (prevPoint) {
          graph.addLine(
            { x: prevPoint[0], y: prevPoint[1] },
            { x: point[0], y: point[1] }
          );
        }

        prevPoint = point;
      } catch {
        prevPoint = null;
      }
    }

    return graph;
  }

  get xAxis(): NumberLine {
    return this._xAxis;
  }

  get yAxis(): NumberLine {
    return this._yAxis;
  }

  get xRange(): [number, number, number] {
    return [...this._xRange] as [number, number, number];
  }

  get yRange(): [number, number, number] {
    return [...this._yRange] as [number, number, number];
  }

  getBoundingBox(): { min: Point2D; max: Point2D } {
    return {
      min: {
        x: this._position[0] - this._xLength / 2,
        y: this._position[1] - this._yLength / 2,
      },
      max: {
        x: this._position[0] + this._xLength / 2,
        y: this._position[1] + this._yLength / 2,
      },
    };
  }

  clone(): Axes {
    return new Axes({
      xRange: [...this._xRange] as [number, number, number],
      yRange: [...this._yRange] as [number, number, number],
      xLength: this._xLength,
      yLength: this._yLength,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
