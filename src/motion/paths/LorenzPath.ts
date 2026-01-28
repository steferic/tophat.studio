/**
 * Lorenz Attractor Path
 *
 * The Lorenz system is a chaotic system that produces the famous "butterfly" pattern.
 * Equations:
 *   dx/dt = σ(y - x)
 *   dy/dt = x(ρ - z) - y
 *   dz/dt = xy - βz
 *
 * Default parameters: σ=10, ρ=28, β=8/3
 */

import type {
  PathGenerator,
  PathConfig,
  ParameterMeta,
  Point3D,
} from '../types/path';
import { distancePoint, normalizePoint, subtractPoints } from '../types/path';

// ============================================================================
// Lorenz Path Configuration
// ============================================================================

const LORENZ_CONFIG: PathConfig = {
  type: 'lorenz',
  name: 'Lorenz Attractor',
  description: 'Chaotic butterfly-shaped attractor from the Lorenz system',
  defaultParams: {
    sigma: 10,
    rho: 28,
    beta: 8 / 3,
    scale: 6.0,
    dt: 0.005,
    steps: 8000,
    centerAtOrigin: 1,
  },
  parameterMeta: [
    {
      key: 'sigma',
      label: 'Sigma (σ)',
      min: 0,
      max: 50,
      step: 0.5,
      default: 10,
      description: 'Rate of rotation in x-y plane',
    },
    {
      key: 'rho',
      label: 'Rho (ρ)',
      min: 0,
      max: 100,
      step: 1,
      default: 28,
      description: 'Controls behavior - chaos above 24.74',
    },
    {
      key: 'beta',
      label: 'Beta (β)',
      min: 0,
      max: 10,
      step: 0.1,
      default: 8 / 3,
      description: 'Geometric factor of the system',
    },
    {
      key: 'scale',
      label: 'Scale',
      min: 0.1,
      max: 20,
      step: 0.1,
      default: 6.0,
      description: 'Overall size of the attractor',
    },
    {
      key: 'dt',
      label: 'Time Step',
      min: 0.001,
      max: 0.02,
      step: 0.001,
      default: 0.005,
      description: 'Integration time step (smaller = more accurate)',
    },
    {
      key: 'steps',
      label: 'Steps',
      min: 1000,
      max: 20000,
      step: 500,
      default: 8000,
      description: 'Number of integration steps',
    },
  ],
};

// ============================================================================
// Lorenz Path Implementation
// ============================================================================

export class LorenzPath implements PathGenerator {
  private params: Record<string, number>;
  private points: Point3D[] = [];
  private arcLengths: number[] = [];
  private totalLength: number = 0;

  constructor(params?: Partial<Record<string, number>>) {
    // Merge defaults with provided params, filtering out undefined
    const merged = { ...LORENZ_CONFIG.defaultParams };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
    }
    this.params = merged;
    this.computePath();
  }

  /**
   * Compute the Lorenz attractor path
   */
  private computePath(): void {
    const { sigma, rho, beta, scale, dt, steps, centerAtOrigin } = this.params;

    const rawPoints: Point3D[] = [];

    // Initial conditions (slightly off origin to start movement)
    let x = 0.1;
    let y = 0;
    let z = 0;

    // Integrate the Lorenz equations
    for (let i = 0; i < steps; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      // Map coordinates: x->x, y->z, z->y for better viewing
      rawPoints.push({
        x: x * scale,
        y: z * scale,
        z: y * scale,
      });
    }

    // Optionally center at origin
    if (centerAtOrigin) {
      const bounds = this.computeBounds(rawPoints);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const centerZ = (bounds.minZ + bounds.maxZ) / 2;

      this.points = rawPoints.map((p) => ({
        x: p.x - centerX,
        y: p.y - centerY,
        z: p.z - centerZ,
      }));
    } else {
      this.points = rawPoints;
    }

    // Compute arc lengths for uniform-speed traversal
    this.computeArcLengths();
  }

  /**
   * Compute bounding box
   */
  private computeBounds(points: Point3D[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  /**
   * Precompute arc lengths for uniform-speed parameterization
   */
  private computeArcLengths(): void {
    this.arcLengths = [0];
    this.totalLength = 0;

    for (let i = 1; i < this.points.length; i++) {
      const dist = distancePoint(this.points[i - 1], this.points[i]);
      this.totalLength += dist;
      this.arcLengths.push(this.totalLength);
    }
  }

  /**
   * Get position at progress (0 to 1)
   */
  getPositionAt(progress: number): Point3D {
    if (this.points.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    // Clamp progress
    const p = Math.max(0, Math.min(1, progress));

    // Simple index-based lookup (uniform in index space)
    const index = p * (this.points.length - 1);
    const i0 = Math.floor(index);
    const i1 = Math.min(i0 + 1, this.points.length - 1);
    const t = index - i0;

    const p0 = this.points[i0];
    const p1 = this.points[i1];

    return {
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
      z: p0.z + (p1.z - p0.z) * t,
    };
  }

  /**
   * Get tangent/direction at progress
   */
  getTangentAt(progress: number): Point3D {
    if (this.points.length < 2) {
      return { x: 0, y: 0, z: 1 };
    }

    const p = Math.max(0, Math.min(1, progress));
    const index = p * (this.points.length - 1);
    const i0 = Math.max(0, Math.floor(index) - 1);
    const i1 = Math.min(i0 + 2, this.points.length - 1);

    const tangent = subtractPoints(this.points[i1], this.points[i0]);
    return normalizePoint(tangent);
  }

  /**
   * Get path configuration
   */
  getConfig(): PathConfig {
    return LORENZ_CONFIG;
  }

  /**
   * Precompute path points (already done in constructor)
   */
  precomputePath(resolution: number): Point3D[] {
    // If resolution differs from current, recompute
    if (resolution !== this.params.steps) {
      this.params.steps = resolution;
      this.computePath();
    }
    return [...this.points];
  }

  /**
   * Get total arc length
   */
  getLength(): number {
    return this.totalLength;
  }

  /**
   * Update parameters
   */
  setParams(params: Record<string, number>): void {
    const hasChanges = Object.keys(params).some(
      (key) => this.params[key] !== params[key]
    );

    if (hasChanges) {
      this.params = { ...this.params, ...params };
      this.computePath();
    }
  }

  /**
   * Get current parameters
   */
  getParams(): Record<string, number> {
    return { ...this.params } as Record<string, number>;
  }

  /**
   * Get raw points array (useful for visualization)
   */
  getPoints(): Point3D[] {
    return [...this.points];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createLorenzPath(
  params?: Partial<Record<string, number>>
): LorenzPath {
  return new LorenzPath(params);
}

export default LorenzPath;
