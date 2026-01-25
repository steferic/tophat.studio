/**
 * Core vector and point types for Manim coordinate system
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export type Vector2D = [number, number];
export type Vector3D = [number, number, number];

export function point2D(x: number, y: number): Point2D {
  return { x, y };
}

export function point3D(x: number, y: number, z: number): Point3D {
  return { x, y, z };
}

export function toVector2D(p: Point2D): Vector2D {
  return [p.x, p.y];
}

export function toPoint2D(v: Vector2D): Point2D {
  return { x: v[0], y: v[1] };
}

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return [a[0] + b[0], a[1] + b[1]];
}

export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scaleVector(v: Vector2D, scalar: number): Vector2D {
  return [v[0] * scalar, v[1] * scalar];
}

export function vectorLength(v: Vector2D): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

export function normalizeVector(v: Vector2D): Vector2D {
  const len = vectorLength(v);
  if (len === 0) return [0, 0];
  return [v[0] / len, v[1] / len];
}

export function rotateVector(v: Vector2D, angle: number): Vector2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}

export function dotProduct(a: Vector2D, b: Vector2D): number {
  return a[0] * b[0] + a[1] * b[1];
}
