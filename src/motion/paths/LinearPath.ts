/**
 * Linear Path - Simple point-to-point motion
 *
 * Moves in a straight line between start and end points.
 * Useful for simple animations and as a building block.
 */

import type {
  PathGenerator,
  PathConfig,
  Point3D,
} from '../types/path';
import { normalizePoint, distancePoint } from '../types/path';

// ============================================================================
// Linear Path Configuration
// ============================================================================

const LINEAR_CONFIG: PathConfig = {
  type: 'linear',
  name: 'Linear Path',
  description: 'Straight line between two points',
  defaultParams: {
    startX: 0,
    startY: 0,
    startZ: 0,
    endX: 10,
    endY: 0,
    endZ: 0,
  },
  parameterMeta: [
    {
      key: 'startX',
      label: 'Start X',
      min: -100,
      max: 100,
      step: 0.5,
      default: 0,
      description: 'Starting X position',
    },
    {
      key: 'startY',
      label: 'Start Y',
      min: -100,
      max: 100,
      step: 0.5,
      default: 0,
      description: 'Starting Y position',
    },
    {
      key: 'startZ',
      label: 'Start Z',
      min: -100,
      max: 100,
      step: 0.5,
      default: 0,
      description: 'Starting Z position',
    },
    {
      key: 'endX',
      label: 'End X',
      min: -100,
      max: 100,
      step: 0.5,
      default: 10,
      description: 'Ending X position',
    },
    {
      key: 'endY',
      label: 'End Y',
      min: -100,
      max: 100,
      step: 0.5,
      default: 0,
      description: 'Ending Y position',
    },
    {
      key: 'endZ',
      label: 'End Z',
      min: -100,
      max: 100,
      step: 0.5,
      default: 0,
      description: 'Ending Z position',
    },
  ],
};

// ============================================================================
// Linear Path Implementation
// ============================================================================

export class LinearPath implements PathGenerator {
  private params: Record<string, number>;
  private start: Point3D;
  private end: Point3D;
  private direction: Point3D;
  private length: number;

  constructor(params?: Partial<Record<string, number>>) {
    const merged = { ...LINEAR_CONFIG.defaultParams };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
    }
    this.params = merged;
    this.start = { x: 0, y: 0, z: 0 };
    this.end = { x: 10, y: 0, z: 0 };
    this.direction = { x: 1, y: 0, z: 0 };
    this.length = 10;
    this.updateFromParams();
  }

  private updateFromParams(): void {
    const { startX, startY, startZ, endX, endY, endZ } = this.params;

    this.start = { x: startX, y: startY, z: startZ };
    this.end = { x: endX, y: endY, z: endZ };
    this.length = distancePoint(this.start, this.end);

    if (this.length > 0) {
      this.direction = normalizePoint({
        x: this.end.x - this.start.x,
        y: this.end.y - this.start.y,
        z: this.end.z - this.start.z,
      });
    } else {
      this.direction = { x: 0, y: 0, z: 1 };
    }
  }

  getPositionAt(progress: number): Point3D {
    const p = Math.max(0, Math.min(1, progress));

    return {
      x: this.start.x + (this.end.x - this.start.x) * p,
      y: this.start.y + (this.end.y - this.start.y) * p,
      z: this.start.z + (this.end.z - this.start.z) * p,
    };
  }

  getTangentAt(_progress: number): Point3D {
    // Tangent is constant for linear path
    return this.direction;
  }

  getConfig(): PathConfig {
    return LINEAR_CONFIG;
  }

  precomputePath(resolution: number): Point3D[] {
    const points: Point3D[] = [];
    for (let i = 0; i <= resolution; i++) {
      points.push(this.getPositionAt(i / resolution));
    }
    return points;
  }

  getLength(): number {
    return this.length;
  }

  setParams(params: Record<string, number>): void {
    this.params = { ...this.params, ...params };
    this.updateFromParams();
  }

  getParams(): Record<string, number> {
    return { ...this.params } as Record<string, number>;
  }

  /**
   * Convenience method to set start and end points directly
   */
  setPoints(start: Point3D, end: Point3D): void {
    this.setParams({
      startX: start.x,
      startY: start.y,
      startZ: start.z,
      endX: end.x,
      endY: end.y,
      endZ: end.z,
    });
  }
}

export function createLinearPath(
  params?: Partial<Record<string, number>>
): LinearPath {
  return new LinearPath(params);
}

export default LinearPath;
