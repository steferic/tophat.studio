/**
 * Path Interpolator
 *
 * Smooth interpolation for camera paths using:
 * - Catmull-Rom splines for position
 * - SLERP for rotation (quaternions)
 */

import type { CameraKeyframe, Vector3, Vector4 } from '../types/scene';

// ============================================================================
// Quaternion Helpers
// ============================================================================

/**
 * Spherical linear interpolation (SLERP) between two quaternions
 */
export function slerp(q1: Vector4, q2: Vector4, t: number): Vector4 {
  // Compute dot product
  let dot = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3];

  // If negative, negate one quaternion to take shorter path
  let q2Adj: Vector4 = [...q2] as Vector4;
  if (dot < 0) {
    q2Adj = [-q2[0], -q2[1], -q2[2], -q2[3]];
    dot = -dot;
  }

  // If very close, use linear interpolation
  if (dot > 0.9995) {
    const result: Vector4 = [
      q1[0] + t * (q2Adj[0] - q1[0]),
      q1[1] + t * (q2Adj[1] - q1[1]),
      q1[2] + t * (q2Adj[2] - q1[2]),
      q1[3] + t * (q2Adj[3] - q1[3]),
    ];
    return normalizeQuat(result);
  }

  // Standard SLERP
  const theta0 = Math.acos(dot);
  const theta = theta0 * t;
  const sinTheta = Math.sin(theta);
  const sinTheta0 = Math.sin(theta0);

  const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const s1 = sinTheta / sinTheta0;

  return [
    s0 * q1[0] + s1 * q2Adj[0],
    s0 * q1[1] + s1 * q2Adj[1],
    s0 * q1[2] + s1 * q2Adj[2],
    s0 * q1[3] + s1 * q2Adj[3],
  ];
}

/**
 * Normalize a quaternion
 */
export function normalizeQuat(q: Vector4): Vector4 {
  const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  if (len === 0) return [0, 0, 0, 1];
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

/**
 * Convert Euler angles (radians) to quaternion
 */
export function eulerToQuat(euler: Vector3): Vector4 {
  const [x, y, z] = euler;
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);

  // XYZ rotation order
  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ];
}

/**
 * Convert quaternion to Euler angles (radians)
 */
export function quatToEuler(q: Vector4): Vector3 {
  const [x, y, z, w] = q;

  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = (Math.sign(sinp) * Math.PI) / 2; // clamp to ±90°
  } else {
    pitch = Math.asin(sinp);
  }

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [roll, pitch, yaw];
}

// ============================================================================
// Catmull-Rom Spline
// ============================================================================

/**
 * Catmull-Rom interpolation for a single dimension
 */
function catmullRom1D(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
  tension: number = 0.5
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  const s = (1 - tension) / 2;

  const b0 = -s * t3 + 2 * s * t2 - s * t;
  const b1 = (2 - s) * t3 + (s - 3) * t2 + 1;
  const b2 = (s - 2) * t3 + (3 - 2 * s) * t2 + s * t;
  const b3 = s * t3 - s * t2;

  return b0 * p0 + b1 * p1 + b2 * p2 + b3 * p3;
}

/**
 * Catmull-Rom interpolation for Vector3
 */
function catmullRomV3(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  t: number,
  tension: number = 0.5
): Vector3 {
  return [
    catmullRom1D(p0[0], p1[0], p2[0], p3[0], t, tension),
    catmullRom1D(p0[1], p1[1], p2[1], p3[1], t, tension),
    catmullRom1D(p0[2], p1[2], p2[2], p3[2], t, tension),
  ];
}

// ============================================================================
// Camera Path Interpolation
// ============================================================================

export interface CameraState {
  position: Vector3;
  rotation: Vector4;
  fov: number;
}

/**
 * Interpolate camera state from keyframes at a given frame
 */
export function interpolateCameraPath(
  keyframes: CameraKeyframe[],
  frame: number,
  defaultFov: number = 50,
  tension: number = 0.5
): CameraState {
  if (keyframes.length === 0) {
    return {
      position: [0, 0, 10],
      rotation: [0, 0, 0, 1],
      fov: defaultFov,
    };
  }

  if (keyframes.length === 1) {
    return {
      position: keyframes[0].position,
      rotation: keyframes[0].rotation,
      fov: keyframes[0].fov ?? defaultFov,
    };
  }

  // Find surrounding keyframes
  let i1 = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].frame && frame < keyframes[i + 1].frame) {
      i1 = i;
      break;
    }
    if (i === keyframes.length - 2) {
      i1 = i;
    }
  }

  const i0 = Math.max(0, i1 - 1);
  const i2 = Math.min(keyframes.length - 1, i1 + 1);
  const i3 = Math.min(keyframes.length - 1, i1 + 2);

  const k0 = keyframes[i0];
  const k1 = keyframes[i1];
  const k2 = keyframes[i2];
  const k3 = keyframes[i3];

  // Calculate interpolation factor
  let t = 0;
  if (k2.frame !== k1.frame) {
    t = (frame - k1.frame) / (k2.frame - k1.frame);
  }
  t = Math.max(0, Math.min(1, t));

  // Interpolate position using Catmull-Rom
  const position = catmullRomV3(
    k0.position,
    k1.position,
    k2.position,
    k3.position,
    t,
    tension
  );

  // Interpolate rotation using SLERP
  const rotation = slerp(k1.rotation, k2.rotation, t);

  // Interpolate FOV linearly
  const fov1 = k1.fov ?? defaultFov;
  const fov2 = k2.fov ?? defaultFov;
  const fov = fov1 + (fov2 - fov1) * t;

  return { position, rotation, fov };
}

// ============================================================================
// Path Simplification (Ramer-Douglas-Peucker)
// ============================================================================

interface KeyframeWithDistance extends CameraKeyframe {
  _distance?: number;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(
  point: Vector3,
  lineStart: Vector3,
  lineEnd: Vector3
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const dz = lineEnd[2] - lineStart[2];

  const lineLengthSq = dx * dx + dy * dy + dz * dz;

  if (lineLengthSq === 0) {
    // Line is a point
    const pdx = point[0] - lineStart[0];
    const pdy = point[1] - lineStart[1];
    const pdz = point[2] - lineStart[2];
    return Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
  }

  // Project point onto line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - lineStart[0]) * dx +
        (point[1] - lineStart[1]) * dy +
        (point[2] - lineStart[2]) * dz) /
        lineLengthSq
    )
  );

  const projX = lineStart[0] + t * dx;
  const projY = lineStart[1] + t * dy;
  const projZ = lineStart[2] + t * dz;

  const pdx = point[0] - projX;
  const pdy = point[1] - projY;
  const pdz = point[2] - projZ;

  return Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
}

/**
 * Ramer-Douglas-Peucker path simplification
 * Reduces number of keyframes while preserving shape
 */
export function simplifyPath(
  keyframes: CameraKeyframe[],
  tolerance: number = 0.1
): CameraKeyframe[] {
  if (keyframes.length <= 2) {
    return keyframes;
  }

  // Find point with maximum distance
  let maxDistance = 0;
  let maxIndex = 0;

  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  for (let i = 1; i < keyframes.length - 1; i++) {
    const distance = perpendicularDistance(
      keyframes[i].position,
      first.position,
      last.position
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance > tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(keyframes.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(keyframes.slice(maxIndex), tolerance);

    // Combine results (remove duplicate middle point)
    return [...left.slice(0, -1), ...right];
  }

  // All points are within tolerance, return endpoints
  return [first, last];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resample keyframes to ensure consistent frame intervals
 */
export function resampleKeyframes(
  keyframes: CameraKeyframe[],
  interval: number
): CameraKeyframe[] {
  if (keyframes.length < 2) return keyframes;

  const result: CameraKeyframe[] = [];
  const startFrame = keyframes[0].frame;
  const endFrame = keyframes[keyframes.length - 1].frame;

  for (let frame = startFrame; frame <= endFrame; frame += interval) {
    const state = interpolateCameraPath(keyframes, frame);
    result.push({
      frame,
      position: state.position,
      rotation: state.rotation,
      fov: state.fov,
    });
  }

  return result;
}

/**
 * Smooth keyframes by averaging with neighbors
 */
export function smoothKeyframes(
  keyframes: CameraKeyframe[],
  windowSize: number = 3
): CameraKeyframe[] {
  if (keyframes.length < windowSize) return keyframes;

  const halfWindow = Math.floor(windowSize / 2);
  const result: CameraKeyframe[] = [];

  for (let i = 0; i < keyframes.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(keyframes.length - 1, i + halfWindow);

    let sumX = 0,
      sumY = 0,
      sumZ = 0;
    let count = 0;

    for (let j = start; j <= end; j++) {
      sumX += keyframes[j].position[0];
      sumY += keyframes[j].position[1];
      sumZ += keyframes[j].position[2];
      count++;
    }

    result.push({
      frame: keyframes[i].frame,
      position: [sumX / count, sumY / count, sumZ / count],
      rotation: keyframes[i].rotation, // Don't average quaternions this way
      fov: keyframes[i].fov,
    });
  }

  return result;
}
