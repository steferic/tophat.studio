/**
 * Square - A rectangle with equal sides
 */

import { Rectangle, RectangleConfig } from './Rectangle';

export interface SquareConfig extends Omit<RectangleConfig, 'width' | 'height'> {
  sideLength?: number;
}

export class Square extends Rectangle {
  constructor(config: SquareConfig = {}) {
    const sideLength = config.sideLength ?? 2;
    super({
      ...config,
      width: sideLength,
      height: sideLength,
    });
  }

  get sideLength(): number {
    return this._width;
  }

  setSideLength(length: number): this {
    this._width = length;
    this._height = length;
    this.generatePath();
    return this;
  }

  clone(): Square {
    return new Square({
      sideLength: this._width,
      cornerRadius: this._cornerRadius,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
