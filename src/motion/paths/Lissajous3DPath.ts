/**
 * 3D Lissajous Curve Path
 *
 * Parametric curves that create beautiful 3D patterns
 * x(t) = A * sin(a*t + δ)
 * y(t) = B * sin(b*t)
 * z(t) = C * sin(c*t + φ)
 */

import type {
  PathGenerator,
  PathConfig,
  Point3D,
} from '../types/path';
import { normalizePoint, subtractPoints } from '../types/path';

// ============================================================================
// Lissajous Configuration
// ============================================================================

const LISSAJOUS_CONFIG: PathConfig = {
  type: 'lissajous',
  name: '3D Lissajous Curve',
  description: 'Parametric curves that create intricate 3D patterns',
  defaultParams: {
    // Amplitudes
    amplitudeX: 5,
    amplitudeY: 5,
    amplitudeZ: 5,
    // Frequencies
    freqX: 3,
    freqY: 2,
    freqZ: 1,
    // Phase offsets
    phaseX: Math.PI / 2,
    phaseY: 0,
    phaseZ: 0,
    // Resolution
    resolution: 1000,
  },
  parameterMeta: [
    {
      key: 'amplitudeX',
      label: 'Amplitude X',
      min: 0.1,
      max: 20,
      step: 0.5,
      default: 5,
      description: 'Size in X direction',
    },
    {
      key: 'amplitudeY',
      label: 'Amplitude Y',
      min: 0.1,
      max: 20,
      step: 0.5,
      default: 5,
      description: 'Size in Y direction',
    },
    {
      key: 'amplitudeZ',
      label: 'Amplitude Z',
      min: 0.1,
      max: 20,
      step: 0.5,
      default: 5,
      description: 'Size in Z direction',
    },
    {
      key: 'freqX',
      label: 'Frequency X',
      min: 1,
      max: 10,
      step: 1,
      default: 3,
      description: 'Oscillation frequency in X',
    },
    {
      key: 'freqY',
      label: 'Frequency Y',
      min: 1,
      max: 10,
      step: 1,
      default: 2,
      description: 'Oscillation frequency in Y',
    },
    {
      key: 'freqZ',
      label: 'Frequency Z',
      min: 1,
      max: 10,
      step: 1,
      default: 1,
      description: 'Oscillation frequency in Z',
    },
    {
      key: 'phaseX',
      label: 'Phase X',
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      default: Math.PI / 2,
      description: 'Phase offset for X',
    },
    {
      key: 'phaseY',
      label: 'Phase Y',
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      default: 0,
      description: 'Phase offset for Y',
    },
    {
      key: 'phaseZ',
      label: 'Phase Z',
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      default: 0,
      description: 'Phase offset for Z',
    },
  ],
};

// ============================================================================
// Lissajous Path Implementation
// ============================================================================

export class Lissajous3DPath implements PathGenerator {
  private params: Record<string, number>;
  private points: Point3D[] = [];
  private totalLength: number = 0;

  constructor(params?: Partial<Record<string, number>>) {
    const merged = { ...LISSAJOUS_CONFIG.defaultParams };
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

  private computePath(): void {
    const {
      amplitudeX,
      amplitudeY,
      amplitudeZ,
      freqX,
      freqY,
      freqZ,
      phaseX,
      phaseY,
      phaseZ,
      resolution,
    } = this.params;

    this.points = [];
    this.totalLength = 0;

    for (let i = 0; i <= resolution; i++) {
      const t = (i / resolution) * Math.PI * 2;

      const point: Point3D = {
        x: amplitudeX * Math.sin(freqX * t + phaseX),
        y: amplitudeY * Math.sin(freqY * t + phaseY),
        z: amplitudeZ * Math.sin(freqZ * t + phaseZ),
      };

      if (i > 0) {
        const prev = this.points[i - 1];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const dz = point.z - prev.z;
        this.totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      this.points.push(point);
    }
  }

  getPositionAt(progress: number): Point3D {
    if (this.points.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const p = Math.max(0, Math.min(1, progress));
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

  getConfig(): PathConfig {
    return LISSAJOUS_CONFIG;
  }

  precomputePath(resolution: number): Point3D[] {
    if (resolution !== this.params.resolution) {
      this.params.resolution = resolution;
      this.computePath();
    }
    return [...this.points];
  }

  getLength(): number {
    return this.totalLength;
  }

  setParams(params: Record<string, number>): void {
    const hasChanges = Object.keys(params).some(
      (key) => this.params[key] !== params[key]
    );

    if (hasChanges) {
      this.params = { ...this.params, ...params };
      this.computePath();
    }
  }

  getParams(): Record<string, number> {
    return { ...this.params } as Record<string, number>;
  }
}

export function createLissajous3DPath(
  params?: Partial<Record<string, number>>
): Lissajous3DPath {
  return new Lissajous3DPath(params);
}

export default Lissajous3DPath;
