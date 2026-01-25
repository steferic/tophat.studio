/**
 * Rectangle - A rectangular shape
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D } from '../types';

export interface RectangleConfig extends VMobjectConfig {
  width?: number;
  height?: number;
  cornerRadius?: number;
}

export class Rectangle extends VMobject {
  protected _width: number;
  protected _height: number;
  protected _cornerRadius: number;

  constructor(config: RectangleConfig = {}) {
    super(config);
    this._width = config.width ?? 2;
    this._height = config.height ?? 1;
    this._cornerRadius = config.cornerRadius ?? 0;
    this.generatePath();
  }

  protected generatePath(): void {
    const hw = this._width / 2;
    const hh = this._height / 2;
    const r = Math.min(this._cornerRadius, hw, hh);

    if (r <= 0) {
      // Sharp corners - simple rectangle
      const corners: Point2D[] = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
      ];

      this._path = { segments: [], closed: true };

      for (let i = 0; i < 4; i++) {
        const start = corners[i];
        const end = corners[(i + 1) % 4];
        const dx = (end.x - start.x) / 3;
        const dy = (end.y - start.y) / 3;

        this._path.segments.push({
          start,
          control1: { x: start.x + dx, y: start.y + dy },
          control2: { x: start.x + 2 * dx, y: start.y + 2 * dy },
          end,
        });
      }
    } else {
      // Rounded corners
      this._path = { segments: [], closed: true };

      // Magic number for bezier circle approximation
      const k = 0.5522847498 * r;

      // Bottom-left to bottom-right (bottom edge)
      this._path.segments.push(this.lineSegment(
        { x: -hw + r, y: -hh },
        { x: hw - r, y: -hh }
      ));

      // Bottom-right corner
      this._path.segments.push({
        start: { x: hw - r, y: -hh },
        control1: { x: hw - r + k, y: -hh },
        control2: { x: hw, y: -hh + r - k },
        end: { x: hw, y: -hh + r },
      });

      // Right edge
      this._path.segments.push(this.lineSegment(
        { x: hw, y: -hh + r },
        { x: hw, y: hh - r }
      ));

      // Top-right corner
      this._path.segments.push({
        start: { x: hw, y: hh - r },
        control1: { x: hw, y: hh - r + k },
        control2: { x: hw - r + k, y: hh },
        end: { x: hw - r, y: hh },
      });

      // Top edge
      this._path.segments.push(this.lineSegment(
        { x: hw - r, y: hh },
        { x: -hw + r, y: hh }
      ));

      // Top-left corner
      this._path.segments.push({
        start: { x: -hw + r, y: hh },
        control1: { x: -hw + r - k, y: hh },
        control2: { x: -hw, y: hh - r + k },
        end: { x: -hw, y: hh - r },
      });

      // Left edge
      this._path.segments.push(this.lineSegment(
        { x: -hw, y: hh - r },
        { x: -hw, y: -hh + r }
      ));

      // Bottom-left corner
      this._path.segments.push({
        start: { x: -hw, y: -hh + r },
        control1: { x: -hw, y: -hh + r - k },
        control2: { x: -hw + r - k, y: -hh },
        end: { x: -hw + r, y: -hh },
      });
    }
  }

  private lineSegment(start: Point2D, end: Point2D) {
    const dx = (end.x - start.x) / 3;
    const dy = (end.y - start.y) / 3;
    return {
      start,
      control1: { x: start.x + dx, y: start.y + dy },
      control2: { x: start.x + 2 * dx, y: start.y + 2 * dy },
      end,
    };
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get cornerRadius(): number {
    return this._cornerRadius;
  }

  setWidth(width: number): this {
    this._width = width;
    this.generatePath();
    return this;
  }

  setHeight(height: number): this {
    this._height = height;
    this.generatePath();
    return this;
  }

  setCornerRadius(radius: number): this {
    this._cornerRadius = radius;
    this.generatePath();
    return this;
  }

  clone(): Rectangle {
    return new Rectangle({
      width: this._width,
      height: this._height,
      cornerRadius: this._cornerRadius,
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
