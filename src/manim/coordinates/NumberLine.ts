/**
 * NumberLine - A number line with ticks and optional labels
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import type { Point2D, Vector2D, HexColor } from '../types';
import { WHITE } from '../constants';

export interface NumberLineConfig extends VMobjectConfig {
  xRange?: [number, number, number]; // [min, max, step]
  length?: number;
  includeTicks?: boolean;
  tickSize?: number;
  includeNumbers?: boolean;
  numberScale?: number;
  includeArrowTips?: boolean;
  color?: HexColor;
  rotation?: number;
}

export class NumberLine extends VMobject {
  protected _xRange: [number, number, number];
  protected _length: number;
  protected _includeTicks: boolean;
  protected _tickSize: number;
  protected _includeNumbers: boolean;
  protected _numberScale: number;
  protected _includeArrowTips: boolean;
  protected _lineColor: HexColor;

  // Child elements
  protected _line: Line;
  protected _ticks: Line[] = [];
  protected _numbers: Text[] = [];

  constructor(config: NumberLineConfig = {}) {
    super(config);
    this._xRange = config.xRange ?? [-5, 5, 1];
    this._length = config.length ?? 10;
    this._includeTicks = config.includeTicks ?? true;
    this._tickSize = config.tickSize ?? 0.15;
    this._includeNumbers = config.includeNumbers ?? true;
    this._numberScale = config.numberScale ?? 0.5;
    this._includeArrowTips = config.includeArrowTips ?? false;
    this._lineColor = config.color ?? WHITE;

    // Set stroke color
    this._stroke = { ...this._stroke, color: this._lineColor };

    // Create the main line
    this._line = new Line({
      start: [-this._length / 2, 0],
      end: [this._length / 2, 0],
      stroke: this._stroke,
    });

    this.generatePath();
  }

  protected generatePath(): void {
    // Copy the line's path
    this._path = this._line.path;

    // Generate ticks
    if (this._includeTicks) {
      this._ticks = [];
      for (let x = this._xRange[0]; x <= this._xRange[1]; x += this._xRange[2]) {
        const screenX = this.numberToPoint(x)[0];
        const tick = new Line({
          start: [screenX, -this._tickSize / 2],
          end: [screenX, this._tickSize / 2],
          stroke: this._stroke,
        });
        this._ticks.push(tick);

        // Add tick path to main path
        for (const segment of tick.path.segments) {
          this._path.segments.push(segment);
        }
      }
    }
  }

  /**
   * Convert a number to its position on the line
   */
  numberToPoint(n: number): Vector2D {
    const [min, max] = this._xRange;
    const t = (n - min) / (max - min);
    const x = -this._length / 2 + t * this._length;
    return [x + this._position[0], this._position[1]];
  }

  /**
   * Convert a point to its number value
   */
  pointToNumber(point: Vector2D): number {
    const [min, max] = this._xRange;
    const localX = point[0] - this._position[0];
    const t = (localX + this._length / 2) / this._length;
    return min + t * (max - min);
  }

  get xRange(): [number, number, number] {
    return [...this._xRange] as [number, number, number];
  }

  get length(): number {
    return this._length;
  }

  get ticks(): Line[] {
    return [...this._ticks];
  }

  get numbers(): Text[] {
    return [...this._numbers];
  }

  /**
   * Get the numbers to display along the line
   */
  getNumberLabels(): { value: number; position: Vector2D }[] {
    const labels: { value: number; position: Vector2D }[] = [];

    for (let x = this._xRange[0]; x <= this._xRange[1]; x += this._xRange[2]) {
      // Skip 0 if showing both axes
      labels.push({
        value: x,
        position: this.numberToPoint(x),
      });
    }

    return labels;
  }

  getBoundingBox(): { min: Point2D; max: Point2D } {
    const halfLength = this._length / 2;
    const tickOffset = this._includeTicks ? this._tickSize : 0;
    const numberOffset = this._includeNumbers ? 0.5 : 0;

    return {
      min: {
        x: this._position[0] - halfLength,
        y: this._position[1] - tickOffset / 2 - numberOffset,
      },
      max: {
        x: this._position[0] + halfLength,
        y: this._position[1] + tickOffset / 2,
      },
    };
  }

  clone(): NumberLine {
    return new NumberLine({
      xRange: [...this._xRange] as [number, number, number],
      length: this._length,
      includeTicks: this._includeTicks,
      tickSize: this._tickSize,
      includeNumbers: this._includeNumbers,
      numberScale: this._numberScale,
      includeArrowTips: this._includeArrowTips,
      color: this._lineColor,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
