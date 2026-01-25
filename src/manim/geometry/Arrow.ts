/**
 * Arrow - A line with an arrowhead
 */

import { Line, LineConfig } from './Line';
import type { Point2D, Vector2D } from '../types';
import { normalizeVector, subtractVectors } from '../types';
import { DEFAULT_ARROW_TIP_LENGTH, DEFAULT_ARROW_TIP_WIDTH } from '../constants';

export interface ArrowConfig extends LineConfig {
  tipLength?: number;
  tipWidth?: number;
  tipAtStart?: boolean;
  tipAtEnd?: boolean;
}

export class Arrow extends Line {
  protected _tipLength: number;
  protected _tipWidth: number;
  protected _tipAtStart: boolean;
  protected _tipAtEnd: boolean;

  constructor(config: ArrowConfig = {}) {
    super(config);
    this._tipLength = config.tipLength ?? DEFAULT_ARROW_TIP_LENGTH;
    this._tipWidth = config.tipWidth ?? DEFAULT_ARROW_TIP_WIDTH;
    this._tipAtStart = config.tipAtStart ?? false;
    this._tipAtEnd = config.tipAtEnd ?? true;
    this.generatePath();
  }

  protected generatePath(): void {
    // Start with the line
    super.generatePath();

    // Add arrowhead(s)
    if (this._tipAtEnd) {
      this.addArrowTip(this._end, this._start);
    }

    if (this._tipAtStart) {
      this.addArrowTip(this._start, this._end);
    }
  }

  private addArrowTip(tipPoint: Vector2D, basePoint: Vector2D): void {
    // Direction from base to tip
    const direction = normalizeVector(subtractVectors(tipPoint, basePoint));

    // Perpendicular direction
    const perpendicular: Vector2D = [-direction[1], direction[0]];

    // Base of the arrowhead (offset from tip)
    const arrowBase: Vector2D = [
      tipPoint[0] - direction[0] * this._tipLength,
      tipPoint[1] - direction[1] * this._tipLength,
    ];

    // Wing points
    const halfWidth = this._tipWidth / 2;
    const leftWing: Point2D = {
      x: arrowBase[0] + perpendicular[0] * halfWidth,
      y: arrowBase[1] + perpendicular[1] * halfWidth,
    };

    const rightWing: Point2D = {
      x: arrowBase[0] - perpendicular[0] * halfWidth,
      y: arrowBase[1] - perpendicular[1] * halfWidth,
    };

    const tip: Point2D = { x: tipPoint[0], y: tipPoint[1] };

    // Add arrow tip as two line segments (triangle sides)
    // Left wing to tip
    const lw = leftWing;
    const dx1 = (tip.x - lw.x) / 3;
    const dy1 = (tip.y - lw.y) / 3;

    this._path.segments.push({
      start: lw,
      control1: { x: lw.x + dx1, y: lw.y + dy1 },
      control2: { x: lw.x + 2 * dx1, y: lw.y + 2 * dy1 },
      end: tip,
    });

    // Tip to right wing
    const rw = rightWing;
    const dx2 = (rw.x - tip.x) / 3;
    const dy2 = (rw.y - tip.y) / 3;

    this._path.segments.push({
      start: tip,
      control1: { x: tip.x + dx2, y: tip.y + dy2 },
      control2: { x: tip.x + 2 * dx2, y: tip.y + 2 * dy2 },
      end: rw,
    });
  }

  get tipLength(): number {
    return this._tipLength;
  }

  get tipWidth(): number {
    return this._tipWidth;
  }

  setTipLength(length: number): this {
    this._tipLength = length;
    this.generatePath();
    return this;
  }

  setTipWidth(width: number): this {
    this._tipWidth = width;
    this.generatePath();
    return this;
  }

  clone(): Arrow {
    return new Arrow({
      start: [...this._start],
      end: [...this._end],
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      tipAtStart: this._tipAtStart,
      tipAtEnd: this._tipAtEnd,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Double arrow (tips at both ends)
export class DoubleArrow extends Arrow {
  constructor(config: ArrowConfig = {}) {
    super({
      ...config,
      tipAtStart: true,
      tipAtEnd: true,
    });
  }
}

// Convenience functions
export function arrow(start: Vector2D, end: Vector2D): Arrow {
  return new Arrow({ start, end });
}

export function doubleArrow(start: Vector2D, end: Vector2D): DoubleArrow {
  return new DoubleArrow({ start, end });
}
