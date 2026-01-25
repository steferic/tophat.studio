/**
 * Circle - A complete circular shape
 */

import { Arc, ArcConfig } from './Arc';
import { TAU } from '../constants';

export interface CircleConfig extends Omit<ArcConfig, 'startAngle' | 'angle'> {
  radius?: number;
}

export class Circle extends Arc {
  constructor(config: CircleConfig = {}) {
    super({
      ...config,
      radius: config.radius ?? 1,
      startAngle: 0,
      angle: TAU, // Full circle
      numComponents: 8,
    });
    this._path.closed = true;
  }

  // Override to ensure it stays a circle
  clone(): Circle {
    return new Circle({
      radius: this._radius,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }

  // Convenience: get circumference
  getCircumference(): number {
    return TAU * this._radius;
  }

  // Convenience: get area
  getArea(): number {
    return Math.PI * this._radius * this._radius;
  }

  // Get point on circle at given angle
  pointAtAngle(angle: number): { x: number; y: number } {
    return {
      x: this._radius * Math.cos(angle) + this._position[0],
      y: this._radius * Math.sin(angle) + this._position[1],
    };
  }
}
