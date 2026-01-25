/**
 * Star - A star shape with customizable points
 */

import { Polygon, PolygonConfig } from './Polygon';
import type { Vector2D } from '../types';
import { PI } from '../constants';

export interface StarConfig extends Omit<PolygonConfig, 'vertices'> {
  n?: number; // Number of points
  outerRadius?: number;
  innerRadius?: number;
  startAngle?: number;
}

export class Star extends Polygon {
  protected _n: number;
  protected _outerRadius: number;
  protected _innerRadius: number;
  protected _starStartAngle: number;

  constructor(config: StarConfig = {}) {
    const n = config.n ?? 5;
    const outerRadius = config.outerRadius ?? 1;
    // Default inner radius creates nice-looking star
    const innerRadius = config.innerRadius ?? outerRadius * 0.382;
    const startAngle = config.startAngle ?? PI / 2;

    // Generate star vertices alternating between outer and inner radii
    const vertices: Vector2D[] = [];
    const totalPoints = n * 2;

    for (let i = 0; i < totalPoints; i++) {
      const angle = startAngle + (2 * PI * i) / totalPoints;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push([
        radius * Math.cos(angle),
        radius * Math.sin(angle),
      ]);
    }

    super({ ...config, vertices });
    this._n = n;
    this._outerRadius = outerRadius;
    this._innerRadius = innerRadius;
    this._starStartAngle = startAngle;
  }

  get n(): number {
    return this._n;
  }

  get outerRadius(): number {
    return this._outerRadius;
  }

  get innerRadius(): number {
    return this._innerRadius;
  }

  clone(): Star {
    return new Star({
      n: this._n,
      outerRadius: this._outerRadius,
      innerRadius: this._innerRadius,
      startAngle: this._starStartAngle,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
