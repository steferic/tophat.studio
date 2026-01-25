/**
 * Dot - A small circular point
 */

import { Circle, CircleConfig } from './Circle';
import { DEFAULT_DOT_RADIUS, DEFAULT_SMALL_DOT_RADIUS } from '../constants';
import type { Vector2D, HexColor } from '../types';
import { WHITE } from '../constants';

export interface DotConfig extends CircleConfig {
  point?: Vector2D;
  color?: HexColor;
}

export class Dot extends Circle {
  constructor(config: DotConfig = {}) {
    super({
      ...config,
      radius: config.radius ?? DEFAULT_DOT_RADIUS,
    });

    if (config.point) {
      this._position = [...config.point] as Vector2D;
    }

    // Dots are filled by default
    const color = config.color ?? WHITE;
    this._stroke = { ...this._stroke, color, width: 0 };
    this._fill = { ...this._fill, color, opacity: 1 };
  }

  // Set the point location
  setPoint(point: Vector2D): this {
    this._position = [...point] as Vector2D;
    return this;
  }

  get point(): Vector2D {
    return [...this._position] as Vector2D;
  }

  clone(): Dot {
    return new Dot({
      radius: this._radius,
      point: [...this._position],
      color: this._fill.color,
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Small dot variant
export class SmallDot extends Dot {
  constructor(config: DotConfig = {}) {
    super({
      ...config,
      radius: config.radius ?? DEFAULT_SMALL_DOT_RADIUS,
    });
  }
}
