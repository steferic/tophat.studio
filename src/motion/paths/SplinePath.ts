/**
 * Spline Path - Catmull-Rom Spline through control points
 *
 * Creates smooth curves through a series of control points.
 * Uses Catmull-Rom interpolation for natural-looking curves.
 */

import type {
  PathGenerator,
  PathConfig,
  Point3D,
} from '../types/path';
import { normalizePoint, subtractPoints, distancePoint } from '../types/path';

// ============================================================================
// Spline Configuration
// ============================================================================

const SPLINE_CONFIG: PathConfig = {
  type: 'spline',
  name: 'Catmull-Rom Spline',
  description: 'Smooth curve through control points',
  defaultParams: {
    tension: 0.5,
    closed: 0,
  },
  parameterMeta: [
    {
      key: 'tension',
      label: 'Tension',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: 'Curve tightness (0=loose, 1=tight)',
    },
    {
      key: 'closed',
      label: 'Closed Loop',
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      description: '1 = loop back to start, 0 = open curve',
    },
  ],
};

// ============================================================================
// Catmull-Rom Interpolation
// ============================================================================

/**
 * Catmull-Rom spline interpolation
 * Returns point on curve between p1 and p2
 */
function catmullRom(
  p0: Point3D,
  p1: Point3D,
  p2: Point3D,
  p3: Point3D,
  t: number,
  tension: number = 0.5
): Point3D {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom basis functions with tension
  const s = (1 - tension) / 2;

  const b0 = -s * t3 + 2 * s * t2 - s * t;
  const b1 = (2 - s) * t3 + (s - 3) * t2 + 1;
  const b2 = (s - 2) * t3 + (3 - 2 * s) * t2 + s * t;
  const b3 = s * t3 - s * t2;

  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
    z: b0 * p0.z + b1 * p1.z + b2 * p2.z + b3 * p3.z,
  };
}

/**
 * Derivative of Catmull-Rom (for tangent)
 */
function catmullRomDerivative(
  p0: Point3D,
  p1: Point3D,
  p2: Point3D,
  p3: Point3D,
  t: number,
  tension: number = 0.5
): Point3D {
  const t2 = t * t;

  const s = (1 - tension) / 2;

  const db0 = -3 * s * t2 + 4 * s * t - s;
  const db1 = 3 * (2 - s) * t2 + 2 * (s - 3) * t;
  const db2 = 3 * (s - 2) * t2 + 2 * (3 - 2 * s) * t + s;
  const db3 = 3 * s * t2 - 2 * s * t;

  return {
    x: db0 * p0.x + db1 * p1.x + db2 * p2.x + db3 * p3.x,
    y: db0 * p0.y + db1 * p1.y + db2 * p2.y + db3 * p3.y,
    z: db0 * p0.z + db1 * p1.z + db2 * p2.z + db3 * p3.z,
  };
}

// ============================================================================
// Spline Path Implementation
// ============================================================================

export class SplinePath implements PathGenerator {
  private params: Record<string, number>;
  private controlPoints: Point3D[] = [];
  private cachedPoints: Point3D[] = [];
  private totalLength: number = 0;
  private cacheResolution: number = 0;

  constructor(
    controlPoints?: Point3D[],
    params?: Partial<Record<string, number>>
  ) {
    const merged = { ...SPLINE_CONFIG.defaultParams };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
    }
    this.params = merged;
    this.controlPoints = controlPoints || [
      { x: -5, y: 0, z: 0 },
      { x: 0, y: 5, z: 0 },
      { x: 5, y: 0, z: 0 },
      { x: 0, y: -5, z: 0 },
    ];
  }

  /**
   * Set control points for the spline
   */
  setControlPoints(points: Point3D[]): void {
    this.controlPoints = points;
    this.cachedPoints = [];
    this.totalLength = 0;
  }

  /**
   * Get control points
   */
  getControlPoints(): Point3D[] {
    return [...this.controlPoints];
  }

  /**
   * Add a control point
   */
  addControlPoint(point: Point3D): void {
    this.controlPoints.push(point);
    this.cachedPoints = [];
    this.totalLength = 0;
  }

  /**
   * Get the appropriate control points for a segment
   */
  private getSegmentPoints(segmentIndex: number): {
    p0: Point3D;
    p1: Point3D;
    p2: Point3D;
    p3: Point3D;
  } {
    const n = this.controlPoints.length;
    const closed = this.params.closed === 1;

    if (closed) {
      // Closed loop: wrap around
      const i0 = ((segmentIndex - 1) % n + n) % n;
      const i1 = segmentIndex % n;
      const i2 = (segmentIndex + 1) % n;
      const i3 = (segmentIndex + 2) % n;

      return {
        p0: this.controlPoints[i0],
        p1: this.controlPoints[i1],
        p2: this.controlPoints[i2],
        p3: this.controlPoints[i3],
      };
    } else {
      // Open curve: clamp indices
      const i0 = Math.max(0, segmentIndex - 1);
      const i1 = segmentIndex;
      const i2 = Math.min(n - 1, segmentIndex + 1);
      const i3 = Math.min(n - 1, segmentIndex + 2);

      return {
        p0: this.controlPoints[i0],
        p1: this.controlPoints[i1],
        p2: this.controlPoints[i2],
        p3: this.controlPoints[i3],
      };
    }
  }

  /**
   * Get position at progress (0-1)
   */
  getPositionAt(progress: number): Point3D {
    const n = this.controlPoints.length;
    if (n < 2) {
      return n === 1 ? this.controlPoints[0] : { x: 0, y: 0, z: 0 };
    }

    const p = Math.max(0, Math.min(1, progress));
    const closed = this.params.closed === 1;
    const numSegments = closed ? n : n - 1;

    // Map progress to segment and local t
    const scaledProgress = p * numSegments;
    const segmentIndex = Math.min(
      Math.floor(scaledProgress),
      numSegments - 1
    );
    const t = scaledProgress - segmentIndex;

    const { p0, p1, p2, p3 } = this.getSegmentPoints(segmentIndex);

    return catmullRom(p0, p1, p2, p3, t, this.params.tension);
  }

  /**
   * Get tangent at progress
   */
  getTangentAt(progress: number): Point3D {
    const n = this.controlPoints.length;
    if (n < 2) {
      return { x: 0, y: 0, z: 1 };
    }

    const p = Math.max(0, Math.min(1, progress));
    const closed = this.params.closed === 1;
    const numSegments = closed ? n : n - 1;

    const scaledProgress = p * numSegments;
    const segmentIndex = Math.min(
      Math.floor(scaledProgress),
      numSegments - 1
    );
    const t = scaledProgress - segmentIndex;

    const { p0, p1, p2, p3 } = this.getSegmentPoints(segmentIndex);

    const tangent = catmullRomDerivative(
      p0,
      p1,
      p2,
      p3,
      t,
      this.params.tension
    );
    return normalizePoint(tangent);
  }

  getConfig(): PathConfig {
    return SPLINE_CONFIG;
  }

  precomputePath(resolution: number): Point3D[] {
    if (this.cachedPoints.length > 0 && this.cacheResolution === resolution) {
      return [...this.cachedPoints];
    }

    this.cachedPoints = [];
    this.totalLength = 0;
    this.cacheResolution = resolution;

    for (let i = 0; i <= resolution; i++) {
      const point = this.getPositionAt(i / resolution);
      this.cachedPoints.push(point);

      if (i > 0) {
        this.totalLength += distancePoint(
          this.cachedPoints[i - 1],
          point
        );
      }
    }

    return [...this.cachedPoints];
  }

  getLength(): number {
    if (this.totalLength === 0 && this.controlPoints.length >= 2) {
      this.precomputePath(100);
    }
    return this.totalLength;
  }

  setParams(params: Record<string, number>): void {
    const hasChanges = Object.keys(params).some(
      (key) => this.params[key] !== params[key]
    );

    if (hasChanges) {
      this.params = { ...this.params, ...params };
      this.cachedPoints = [];
      this.totalLength = 0;
    }
  }

  getParams(): Record<string, number> {
    return { ...this.params } as Record<string, number>;
  }
}

export function createSplinePath(
  controlPoints?: Point3D[],
  params?: Partial<Record<string, number>>
): SplinePath {
  return new SplinePath(controlPoints, params);
}

export default SplinePath;
