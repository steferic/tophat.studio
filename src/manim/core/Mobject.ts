/**
 * Base class for all Manim objects
 */

import type { Vector2D, Point2D, StrokeStyle, FillStyle, HexColor } from '../types';
import { DEFAULT_STROKE, DEFAULT_FILL } from '../types';
import { addVectors, rotateVector } from '../types';

export interface MobjectConfig {
  position?: Vector2D;
  rotation?: number;
  scale?: Vector2D;
  stroke?: Partial<StrokeStyle>;
  fill?: Partial<FillStyle>;
}

export abstract class Mobject {
  protected _position: Vector2D = [0, 0];
  protected _rotation = 0;
  protected _scale: Vector2D = [1, 1];
  protected _stroke: StrokeStyle;
  protected _fill: FillStyle;
  protected _parent: Mobject | null = null;

  constructor(config: MobjectConfig = {}) {
    this._position = config.position ?? [0, 0];
    this._rotation = config.rotation ?? 0;
    this._scale = config.scale ?? [1, 1];
    this._stroke = { ...DEFAULT_STROKE, ...config.stroke };
    this._fill = { ...DEFAULT_FILL, ...config.fill };
  }

  // Position getters/setters
  get position(): Vector2D {
    return [...this._position] as Vector2D;
  }

  get x(): number {
    return this._position[0];
  }

  get y(): number {
    return this._position[1];
  }

  // Transform methods that return this for chaining
  shift(direction: Vector2D): this {
    this._position = addVectors(this._position, direction);
    return this;
  }

  moveTo(position: Vector2D): this {
    this._position = [...position] as Vector2D;
    return this;
  }

  moveToPoint(point: Point2D): this {
    this._position = [point.x, point.y];
    return this;
  }

  rotate(angle: number, aboutPoint?: Vector2D): this {
    this._rotation += angle;

    if (aboutPoint) {
      const relPos: Vector2D = [
        this._position[0] - aboutPoint[0],
        this._position[1] - aboutPoint[1],
      ];
      const rotated = rotateVector(relPos, angle);
      this._position = [aboutPoint[0] + rotated[0], aboutPoint[1] + rotated[1]];
    }

    return this;
  }

  scale(factor: number | Vector2D, aboutPoint?: Vector2D): this {
    const scaleVec: Vector2D = typeof factor === 'number' ? [factor, factor] : factor;

    this._scale = [this._scale[0] * scaleVec[0], this._scale[1] * scaleVec[1]];

    if (aboutPoint) {
      const relPos: Vector2D = [
        this._position[0] - aboutPoint[0],
        this._position[1] - aboutPoint[1],
      ];
      this._position = [
        aboutPoint[0] + relPos[0] * scaleVec[0],
        aboutPoint[1] + relPos[1] * scaleVec[1],
      ];
    }

    return this;
  }

  // Style methods
  setStroke(options: Partial<StrokeStyle>): this {
    this._stroke = { ...this._stroke, ...options };
    return this;
  }

  setFill(options: Partial<FillStyle>): this {
    this._fill = { ...this._fill, ...options };
    return this;
  }

  setColor(color: HexColor): this {
    this._stroke = { ...this._stroke, color };
    this._fill = { ...this._fill, color };
    return this;
  }

  setOpacity(opacity: number): this {
    this._stroke = { ...this._stroke, opacity };
    this._fill = { ...this._fill, opacity };
    return this;
  }

  // Getters for style
  get stroke(): StrokeStyle {
    return { ...this._stroke };
  }

  get fill(): FillStyle {
    return { ...this._fill };
  }

  get rotation(): number {
    return this._rotation;
  }

  get scaleValue(): Vector2D {
    return [...this._scale] as Vector2D;
  }

  // Abstract methods that subclasses must implement
  abstract clone(): Mobject;

  // Get bounding box
  abstract getBoundingBox(): { min: Point2D; max: Point2D };

  // Get center of the mobject
  getCenter(): Point2D {
    const bbox = this.getBoundingBox();
    return {
      x: (bbox.min.x + bbox.max.x) / 2,
      y: (bbox.min.y + bbox.max.y) / 2,
    };
  }

  // Get width and height
  getWidth(): number {
    const bbox = this.getBoundingBox();
    return bbox.max.x - bbox.min.x;
  }

  getHeight(): number {
    const bbox = this.getBoundingBox();
    return bbox.max.y - bbox.min.y;
  }

  // Alignment helpers
  nextTo(other: Mobject, direction: Vector2D, buffer = 0.25): this {
    const otherBox = other.getBoundingBox();
    const otherCenter = other.getCenter();

    let targetX = otherCenter.x;
    let targetY = otherCenter.y;

    if (direction[0] > 0) {
      // Right of other
      targetX = otherBox.max.x + buffer + (this.getWidth() / 2);
    } else if (direction[0] < 0) {
      // Left of other
      targetX = otherBox.min.x - buffer - (this.getWidth() / 2);
    }

    if (direction[1] > 0) {
      // Above other
      targetY = otherBox.max.y + buffer + (this.getHeight() / 2);
    } else if (direction[1] < 0) {
      // Below other
      targetY = otherBox.min.y - buffer - (this.getHeight() / 2);
    }

    const currentCenter = this.getCenter();
    this.shift([targetX - currentCenter.x, targetY - currentCenter.y]);

    return this;
  }

  alignTo(other: Mobject, direction: Vector2D): this {
    const otherBox = other.getBoundingBox();
    const thisCenter = this.getCenter();

    if (direction[0] !== 0) {
      const targetX = direction[0] > 0 ? otherBox.max.x : otherBox.min.x;
      const edgeX = direction[0] > 0
        ? thisCenter.x + this.getWidth() / 2
        : thisCenter.x - this.getWidth() / 2;
      this.shift([targetX - edgeX, 0]);
    }

    if (direction[1] !== 0) {
      const targetY = direction[1] > 0 ? otherBox.max.y : otherBox.min.y;
      const edgeY = direction[1] > 0
        ? thisCenter.y + this.getHeight() / 2
        : thisCenter.y - this.getHeight() / 2;
      this.shift([0, targetY - edgeY]);
    }

    return this;
  }

  // Center the object at origin
  center(): this {
    const center = this.getCenter();
    return this.shift([-center.x, -center.y]);
  }

  // Copy configuration from another mobject
  matchStyle(other: Mobject): this {
    this._stroke = { ...other._stroke };
    this._fill = { ...other._fill };
    return this;
  }
}
