/**
 * Path Generator Interface - Pluggable motion system
 * All mathematical paths implement this interface
 */

import type { Vector3 } from '../../types/scene';

// ============================================================================
// Core Types
// ============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface PathConfig {
  /** Unique identifier for the path type */
  type: string;
  /** Human-readable name */
  name: string;
  /** Description of the path behavior */
  description: string;
  /** Default parameter values */
  defaultParams: Record<string, number>;
  /** Parameter metadata for UI */
  parameterMeta: ParameterMeta[];
}

export interface ParameterMeta {
  /** Parameter key */
  key: string;
  /** Display label */
  label: string;
  /** Min value */
  min: number;
  /** Max value */
  max: number;
  /** Step increment */
  step: number;
  /** Default value */
  default: number;
  /** Optional description */
  description?: string;
}

// ============================================================================
// Path Generator Interface
// ============================================================================

/**
 * PathGenerator interface - All path implementations must follow this contract
 *
 * Paths generate 3D positions based on a progress value (0 to 1).
 * They can optionally precompute points for performance.
 */
export interface PathGenerator {
  /**
   * Get position at a given progress (0 to 1)
   * @param progress - Progress along the path (0 = start, 1 = end)
   * @returns Point3D position in local space
   */
  getPositionAt(progress: number): Point3D;

  /**
   * Get tangent/direction at a given progress
   * Used for orienting objects along the path
   * @param progress - Progress along the path
   * @returns Normalized direction vector
   */
  getTangentAt(progress: number): Point3D;

  /**
   * Get path configuration/metadata
   */
  getConfig(): PathConfig;

  /**
   * Precompute path points for performance
   * Call this once when path parameters change
   * @param resolution - Number of points to generate
   * @returns Array of precomputed points
   */
  precomputePath(resolution: number): Point3D[];

  /**
   * Get total arc length of the path (approximate)
   */
  getLength(): number;

  /**
   * Update path parameters
   * @param params - New parameter values
   */
  setParams(params: Record<string, number>): void;

  /**
   * Get current parameters
   */
  getParams(): Record<string, number>;
}

// ============================================================================
// Path Factory Type
// ============================================================================

export type PathFactory = (params?: Record<string, number>) => PathGenerator;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Point3D to Vector3 tuple
 */
export function pointToVector3(point: Point3D): Vector3 {
  return [point.x, point.y, point.z];
}

/**
 * Convert Vector3 tuple to Point3D
 */
export function vector3ToPoint(vec: Vector3): Point3D {
  return { x: vec[0], y: vec[1], z: vec[2] };
}

/**
 * Interpolate between two points
 */
export function lerpPoint(a: Point3D, b: Point3D, t: number): Point3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Calculate distance between two points
 */
export function distancePoint(a: Point3D, b: Point3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize a vector
 */
export function normalizePoint(p: Point3D): Point3D {
  const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  if (len === 0) return { x: 0, y: 0, z: 1 };
  return { x: p.x / len, y: p.y / len, z: p.z / len };
}

/**
 * Add two points
 */
export function addPoints(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Multiply point by scalar
 */
export function scalePoint(p: Point3D, s: number): Point3D {
  return { x: p.x * s, y: p.y * s, z: p.z * s };
}

/**
 * Subtract two points
 */
export function subtractPoints(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
