/**
 * Circular/Orbit Path
 *
 * Simple circular or elliptical motion in 3D space.
 * Can be tilted, offset, and configured as spiral.
 */

import type {
  PathGenerator,
  PathConfig,
  Point3D,
} from '../types/path';
import { normalizePoint } from '../types/path';

// ============================================================================
// Circular Path Configuration
// ============================================================================

const CIRCULAR_CONFIG: PathConfig = {
  type: 'circular',
  name: 'Circular Orbit',
  description: 'Circular or elliptical orbital motion',
  defaultParams: {
    // Radius
    radiusX: 5,
    radiusY: 5,
    // Plane orientation (tilt angles)
    tiltX: 0,
    tiltY: 0,
    // Center offset
    centerX: 0,
    centerY: 0,
    centerZ: 0,
    // Vertical oscillation (for spiral)
    heightAmplitude: 0,
    heightFrequency: 1,
    // Clockwise or counter-clockwise
    clockwise: 1,
  },
  parameterMeta: [
    {
      key: 'radiusX',
      label: 'Radius X',
      min: 0.1,
      max: 50,
      step: 0.5,
      default: 5,
      description: 'Radius in X direction (ellipse major/minor)',
    },
    {
      key: 'radiusY',
      label: 'Radius Y',
      min: 0.1,
      max: 50,
      step: 0.5,
      default: 5,
      description: 'Radius in Y direction (ellipse major/minor)',
    },
    {
      key: 'tiltX',
      label: 'Tilt X',
      min: -Math.PI / 2,
      max: Math.PI / 2,
      step: 0.05,
      default: 0,
      description: 'Tilt the orbit plane around X axis',
    },
    {
      key: 'tiltY',
      label: 'Tilt Y',
      min: -Math.PI / 2,
      max: Math.PI / 2,
      step: 0.05,
      default: 0,
      description: 'Tilt the orbit plane around Y axis',
    },
    {
      key: 'centerX',
      label: 'Center X',
      min: -50,
      max: 50,
      step: 0.5,
      default: 0,
      description: 'Orbit center X position',
    },
    {
      key: 'centerY',
      label: 'Center Y',
      min: -50,
      max: 50,
      step: 0.5,
      default: 0,
      description: 'Orbit center Y position',
    },
    {
      key: 'centerZ',
      label: 'Center Z',
      min: -50,
      max: 50,
      step: 0.5,
      default: 0,
      description: 'Orbit center Z position',
    },
    {
      key: 'heightAmplitude',
      label: 'Height Wave',
      min: 0,
      max: 20,
      step: 0.5,
      default: 0,
      description: 'Vertical oscillation amplitude (0 for flat)',
    },
    {
      key: 'heightFrequency',
      label: 'Height Freq',
      min: 0.5,
      max: 10,
      step: 0.5,
      default: 1,
      description: 'Vertical oscillation frequency',
    },
    {
      key: 'clockwise',
      label: 'Direction',
      min: -1,
      max: 1,
      step: 2,
      default: 1,
      description: '1 = counter-clockwise, -1 = clockwise',
    },
  ],
};

// ============================================================================
// Circular Path Implementation
// ============================================================================

export class CircularPath implements PathGenerator {
  private params: Record<string, number>;

  constructor(params?: Partial<Record<string, number>>) {
    const merged = { ...CIRCULAR_CONFIG.defaultParams };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
    }
    this.params = merged;
  }

  /**
   * Calculate position at given progress (0-1)
   * Progress of 1 = one full orbit
   */
  getPositionAt(progress: number): Point3D {
    const {
      radiusX,
      radiusY,
      tiltX,
      tiltY,
      centerX,
      centerY,
      centerZ,
      heightAmplitude,
      heightFrequency,
      clockwise,
    } = this.params;

    // Angle around the circle
    const angle = progress * Math.PI * 2 * (clockwise || 1);

    // Base position on XZ plane
    let x = Math.cos(angle) * radiusX;
    let y = 0;
    let z = Math.sin(angle) * radiusY;

    // Add height oscillation
    if (heightAmplitude > 0) {
      y = Math.sin(angle * heightFrequency) * heightAmplitude;
    }

    // Apply tilt around X axis
    if (tiltX !== 0) {
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);
      const newY = y * cosX - z * sinX;
      const newZ = y * sinX + z * cosX;
      y = newY;
      z = newZ;
    }

    // Apply tilt around Y axis
    if (tiltY !== 0) {
      const cosY = Math.cos(tiltY);
      const sinY = Math.sin(tiltY);
      const newX = x * cosY + z * sinY;
      const newZ = -x * sinY + z * cosY;
      x = newX;
      z = newZ;
    }

    // Apply center offset
    return {
      x: x + centerX,
      y: y + centerY,
      z: z + centerZ,
    };
  }

  /**
   * Get tangent (direction of motion)
   */
  getTangentAt(progress: number): Point3D {
    const {
      radiusX,
      radiusY,
      tiltX,
      tiltY,
      clockwise,
    } = this.params;

    const angle = progress * Math.PI * 2 * (clockwise || 1);
    const direction = clockwise || 1;

    // Derivative of circular motion
    let tx = -Math.sin(angle) * radiusX * direction;
    let ty = 0;
    let tz = Math.cos(angle) * radiusY * direction;

    // Apply tilts to tangent as well
    if (tiltX !== 0) {
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);
      const newY = ty * cosX - tz * sinX;
      const newZ = ty * sinX + tz * cosX;
      ty = newY;
      tz = newZ;
    }

    if (tiltY !== 0) {
      const cosY = Math.cos(tiltY);
      const sinY = Math.sin(tiltY);
      const newX = tx * cosY + tz * sinY;
      const newZ = -tx * sinY + tz * cosY;
      tx = newX;
      tz = newZ;
    }

    return normalizePoint({ x: tx, y: ty, z: tz });
  }

  getConfig(): PathConfig {
    return CIRCULAR_CONFIG;
  }

  precomputePath(resolution: number): Point3D[] {
    const points: Point3D[] = [];
    for (let i = 0; i <= resolution; i++) {
      points.push(this.getPositionAt(i / resolution));
    }
    return points;
  }

  getLength(): number {
    const { radiusX, radiusY } = this.params;
    // Approximate ellipse circumference using Ramanujan's formula
    const a = Math.max(radiusX, radiusY);
    const b = Math.min(radiusX, radiusY);
    const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }

  setParams(params: Record<string, number>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): Record<string, number> {
    return { ...this.params } as Record<string, number>;
  }
}

export function createCircularPath(
  params?: Partial<Record<string, number>>
): CircularPath {
  return new CircularPath(params);
}

export default CircularPath;
