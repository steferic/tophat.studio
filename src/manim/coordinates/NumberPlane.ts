/**
 * NumberPlane - Axes with a grid background
 */

import { Axes, AxesConfig } from './Axes';
import type { HexColor } from '../types';
import { BLUE_D, BLUE_E } from '../constants';

export interface NumberPlaneConfig extends AxesConfig {
  backgroundLineColor?: HexColor;
  faintLineColor?: HexColor;
  fadeBackground?: boolean;
}

export class NumberPlane extends Axes {
  protected _backgroundLineColor: HexColor;
  protected _faintLineColor: HexColor;
  protected _fadeBackground: boolean;

  constructor(config: NumberPlaneConfig = {}) {
    super(config);
    this._backgroundLineColor = config.backgroundLineColor ?? BLUE_D;
    this._faintLineColor = config.faintLineColor ?? BLUE_E;
    this._fadeBackground = config.fadeBackground ?? true;

    this.generateGridPath();
  }

  protected generateGridPath(): void {
    // Add vertical lines
    for (let x = this._xRange[0]; x <= this._xRange[1]; x += this._xRange[2]) {
      if (x === 0) continue; // Skip origin line (covered by axis)

      const [px] = this.coordsToPoint(x, 0);
      const yBottom = this._position[1] - this._yLength / 2;
      const yTop = this._position[1] + this._yLength / 2;

      this.addLine({ x: px, y: yBottom }, { x: px, y: yTop });
    }

    // Add horizontal lines
    for (let y = this._yRange[0]; y <= this._yRange[1]; y += this._yRange[2]) {
      if (y === 0) continue;

      const [, py] = this.coordsToPoint(0, y);
      const xLeft = this._position[0] - this._xLength / 2;
      const xRight = this._position[0] + this._xLength / 2;

      this.addLine({ x: xLeft, y: py }, { x: xRight, y: py });
    }
  }

  /**
   * Get grid line information for rendering
   */
  getGridLines(): {
    vertical: { x: number; isMajor: boolean }[];
    horizontal: { y: number; isMajor: boolean }[];
  } {
    const vertical: { x: number; isMajor: boolean }[] = [];
    const horizontal: { y: number; isMajor: boolean }[] = [];

    // Vertical lines
    for (let x = this._xRange[0]; x <= this._xRange[1]; x += this._xRange[2]) {
      const [px] = this.coordsToPoint(x, 0);
      vertical.push({ x: px, isMajor: x === 0 });
    }

    // Horizontal lines
    for (let y = this._yRange[0]; y <= this._yRange[1]; y += this._yRange[2]) {
      const [, py] = this.coordsToPoint(0, y);
      horizontal.push({ y: py, isMajor: y === 0 });
    }

    return { vertical, horizontal };
  }

  get backgroundLineColor(): HexColor {
    return this._backgroundLineColor;
  }

  get faintLineColor(): HexColor {
    return this._faintLineColor;
  }

  clone(): NumberPlane {
    return new NumberPlane({
      xRange: [...this._xRange] as [number, number, number],
      yRange: [...this._yRange] as [number, number, number],
      xLength: this._xLength,
      yLength: this._yLength,
      backgroundLineColor: this._backgroundLineColor,
      faintLineColor: this._faintLineColor,
      fadeBackground: this._fadeBackground,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
