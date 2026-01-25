/**
 * Polygon - An arbitrary polygon from vertices
 */

import { VMobject, VMobjectConfig } from '../core/VMobject';
import type { Point2D, Vector2D } from '../types';

export interface PolygonConfig extends VMobjectConfig {
  vertices?: Vector2D[];
}

export class Polygon extends VMobject {
  protected _vertices: Vector2D[];

  constructor(config: PolygonConfig = {}) {
    super(config);
    // Default: triangle
    this._vertices = config.vertices ?? [
      [0, 1],
      [-0.866, -0.5],
      [0.866, -0.5],
    ];
    this.generatePath();
  }

  protected generatePath(): void {
    if (this._vertices.length < 3) {
      this._path = { segments: [], closed: false };
      return;
    }

    this._path = { segments: [], closed: true };

    for (let i = 0; i < this._vertices.length; i++) {
      const start = this._vertices[i];
      const end = this._vertices[(i + 1) % this._vertices.length];

      const startPoint: Point2D = { x: start[0], y: start[1] };
      const endPoint: Point2D = { x: end[0], y: end[1] };

      const dx = (endPoint.x - startPoint.x) / 3;
      const dy = (endPoint.y - startPoint.y) / 3;

      this._path.segments.push({
        start: startPoint,
        control1: { x: startPoint.x + dx, y: startPoint.y + dy },
        control2: { x: startPoint.x + 2 * dx, y: startPoint.y + 2 * dy },
        end: endPoint,
      });
    }
  }

  get vertices(): Vector2D[] {
    return this._vertices.map((v) => [...v] as Vector2D);
  }

  setVertices(vertices: Vector2D[]): this {
    this._vertices = vertices.map((v) => [...v] as Vector2D);
    this.generatePath();
    return this;
  }

  getVertex(index: number): Vector2D {
    const i = ((index % this._vertices.length) + this._vertices.length) % this._vertices.length;
    return [...this._vertices[i]] as Vector2D;
  }

  // Get number of sides
  get numSides(): number {
    return this._vertices.length;
  }

  clone(): Polygon {
    return new Polygon({
      vertices: this._vertices.map((v) => [...v] as Vector2D),
      position: [...this._position],
      rotation: this._rotation,
      scale: [...this._scale],
      stroke: { ...this._stroke },
      fill: { ...this._fill },
    });
  }
}
