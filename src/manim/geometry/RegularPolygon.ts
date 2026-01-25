/**
 * RegularPolygon - A polygon with equal sides and angles
 */

import { Polygon, PolygonConfig } from './Polygon';
import type { Vector2D } from '../types';
import { PI } from '../constants';

export interface RegularPolygonConfig extends Omit<PolygonConfig, 'vertices'> {
  n?: number; // Number of sides
  radius?: number;
  startAngle?: number;
}

export class RegularPolygon extends Polygon {
  protected _n: number;
  protected _radius: number;
  protected _startAngle: number;

  constructor(config: RegularPolygonConfig = {}) {
    const n = config.n ?? 6; // Default hexagon
    const radius = config.radius ?? 1;
    const startAngle = config.startAngle ?? PI / 2; // Start from top

    // Generate vertices
    const vertices: Vector2D[] = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + (2 * PI * i) / n;
      vertices.push([
        radius * Math.cos(angle),
        radius * Math.sin(angle),
      ]);
    }

    super({ ...config, vertices });
    this._n = n;
    this._radius = radius;
    this._startAngle = startAngle;
  }

  get n(): number {
    return this._n;
  }

  get radius(): number {
    return this._radius;
  }

  get startAngle(): number {
    return this._startAngle;
  }

  // Interior angle in radians
  getInteriorAngle(): number {
    return ((this._n - 2) * PI) / this._n;
  }

  // Exterior angle in radians
  getExteriorAngle(): number {
    return (2 * PI) / this._n;
  }

  clone(): RegularPolygon {
    return new RegularPolygon({
      n: this._n,
      radius: this._radius,
      startAngle: this._startAngle,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Convenience class for Triangle
export class Triangle extends RegularPolygon {
  constructor(config: Omit<RegularPolygonConfig, 'n'> = {}) {
    super({ ...config, n: 3 });
  }

  clone(): Triangle {
    return new Triangle({
      radius: this._radius,
      startAngle: this._startAngle,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}

// Pentagon
export class Pentagon extends RegularPolygon {
  constructor(config: Omit<RegularPolygonConfig, 'n'> = {}) {
    super({ ...config, n: 5 });
  }
}

// Hexagon
export class Hexagon extends RegularPolygon {
  constructor(config: Omit<RegularPolygonConfig, 'n'> = {}) {
    super({ ...config, n: 6 });
  }
}

// Octagon
export class Octagon extends RegularPolygon {
  constructor(config: Omit<RegularPolygonConfig, 'n'> = {}) {
    super({ ...config, n: 8 });
  }
}
