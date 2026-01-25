/**
 * Group of Mobjects
 */

import { Mobject, MobjectConfig } from './Mobject';
import type { Point2D, Vector2D } from '../types';

export class Group extends Mobject {
  protected _children: Mobject[] = [];

  constructor(children: Mobject[] = [], config: MobjectConfig = {}) {
    super(config);
    this._children = children;
  }

  // Child management
  add(...mobjects: Mobject[]): this {
    this._children.push(...mobjects);
    return this;
  }

  remove(...mobjects: Mobject[]): this {
    this._children = this._children.filter((c) => !mobjects.includes(c));
    return this;
  }

  clear(): this {
    this._children = [];
    return this;
  }

  get children(): Mobject[] {
    return [...this._children];
  }

  get length(): number {
    return this._children.length;
  }

  // Iteration
  [Symbol.iterator](): Iterator<Mobject> {
    return this._children[Symbol.iterator]();
  }

  forEach(callback: (mobject: Mobject, index: number) => void): this {
    this._children.forEach(callback);
    return this;
  }

  map<T>(callback: (mobject: Mobject, index: number) => T): T[] {
    return this._children.map(callback);
  }

  // Transform all children
  shift(direction: Vector2D): this {
    super.shift(direction);
    this._children.forEach((child) => child.shift(direction));
    return this;
  }

  rotate(angle: number, aboutPoint?: Vector2D): this {
    const c = this.getCenter();
    const center: Vector2D = aboutPoint ?? [c.x, c.y];
    super.rotate(angle, center);
    this._children.forEach((child) => child.rotate(angle, center));
    return this;
  }

  scale(factor: number | Vector2D, aboutPoint?: Vector2D): this {
    const c = this.getCenter();
    const center: Vector2D = aboutPoint ?? [c.x, c.y];
    super.scale(factor, center);
    this._children.forEach((child) => child.scale(factor, center));
    return this;
  }

  // Get bounding box of all children
  getBoundingBox(): { min: Point2D; max: Point2D } {
    if (this._children.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of this._children) {
      const bbox = child.getBoundingBox();
      minX = Math.min(minX, bbox.min.x);
      minY = Math.min(minY, bbox.min.y);
      maxX = Math.max(maxX, bbox.max.x);
      maxY = Math.max(maxY, bbox.max.y);
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  // Clone
  clone(): Group {
    return new Group(
      this._children.map((c) => c.clone()),
      {
        position: [...this._position],
        rotation: this._rotation,
        scale: [...this._scale],
        stroke: { ...this._stroke },
        fill: { ...this._fill },
      }
    );
  }

  // Arrange children
  arrange(
    direction: Vector2D = [1, 0],
    buffer = 0.25,
    center = true
  ): this {
    if (this._children.length === 0) return this;

    let currentPosition: Vector2D = [0, 0];

    for (const child of this._children) {
      const childCenter = child.getCenter();
      child.shift([
        currentPosition[0] - childCenter.x,
        currentPosition[1] - childCenter.y,
      ]);

      // Move to next position
      const childBox = child.getBoundingBox();
      const size =
        direction[0] !== 0
          ? childBox.max.x - childBox.min.x
          : childBox.max.y - childBox.min.y;

      currentPosition = [
        currentPosition[0] + direction[0] * (size + buffer),
        currentPosition[1] + direction[1] * (size + buffer),
      ];
    }

    if (center) {
      this.center();
    }

    return this;
  }

  // Arrange in a grid
  arrangeInGrid(
    _rows: number,
    cols: number,
    bufferX = 0.5,
    bufferY = 0.5
  ): this {
    const cellWidth = this._children.reduce(
      (max, c) => Math.max(max, c.getWidth()),
      0
    );
    const cellHeight = this._children.reduce(
      (max, c) => Math.max(max, c.getHeight()),
      0
    );

    this._children.forEach((child, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = col * (cellWidth + bufferX);
      const y = -row * (cellHeight + bufferY); // Negative because Y is up

      const childCenter = child.getCenter();
      child.shift([x - childCenter.x, y - childCenter.y]);
    });

    return this.center();
  }
}

// Convenience function
export function group(...mobjects: Mobject[]): Group {
  return new Group(mobjects);
}
