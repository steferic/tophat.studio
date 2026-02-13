import type { CameraPreset } from '../arena/descriptorTypes';

export interface CameraHome {
  position: [number, number, number];
  target: [number, number, number];
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

/** Default durations per preset (seconds) */
const PRESET_DURATIONS: Record<CameraPreset, number> = {
  'close-up': 1.2,
  'orbit-360': 2.0,
  'zoom-punch': 0.8,
  'dramatic-low': 1.5,
  'pull-back': 1.8,
  'shake-focus': 1.0,
};

export function getPresetDuration(preset: CameraPreset, override?: number): number {
  return override ?? PRESET_DURATIONS[preset];
}

/** Smooth hermite interpolation */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpV3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Pure function: compute camera position + target for a given preset at a given time.
 */
export function computeCameraState(
  elapsed: number,
  duration: number,
  home: CameraHome,
  preset: CameraPreset,
  intensity: number,
): CameraState {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  const s = smoothstep(t);

  switch (preset) {
    case 'close-up': {
      // Smooth zoom 60% toward target, then ease back
      const zoomIn = t < 0.6 ? smoothstep(t / 0.6) : 1;
      const zoomOut = t > 0.6 ? smoothstep((t - 0.6) / 0.4) : 0;
      const factor = (zoomIn - zoomOut) * 0.6 * intensity;
      return {
        position: lerpV3(home.position, home.target, factor),
        target: home.target,
      };
    }

    case 'orbit-360': {
      // Rotate position around Y axis through 360 degrees
      const angle = s * Math.PI * 2 * intensity;
      const dx = home.position[0] - home.target[0];
      const dz = home.position[2] - home.target[2];
      const radius = Math.sqrt(dx * dx + dz * dz);
      const baseAngle = Math.atan2(dz, dx);
      const newAngle = baseAngle + angle;
      return {
        position: [
          home.target[0] + Math.cos(newAngle) * radius,
          home.position[1],
          home.target[2] + Math.sin(newAngle) * radius,
        ],
        target: home.target,
      };
    }

    case 'zoom-punch': {
      // Quick 70% zoom in first 30%, hold briefly, ease back
      let factor: number;
      if (t < 0.3) {
        factor = smoothstep(t / 0.3) * 0.7 * intensity;
      } else if (t < 0.5) {
        factor = 0.7 * intensity;
      } else {
        factor = (1 - smoothstep((t - 0.5) / 0.5)) * 0.7 * intensity;
      }
      return {
        position: lerpV3(home.position, home.target, factor),
        target: home.target,
      };
    }

    case 'dramatic-low': {
      // Move camera down and tilt up
      const ramp = t < 0.4 ? smoothstep(t / 0.4) : 1;
      const release = t > 0.7 ? smoothstep((t - 0.7) / 0.3) : 0;
      const factor = (ramp - release) * intensity;
      const lowPos: [number, number, number] = [
        home.position[0],
        home.position[1] - 6 * factor,
        home.position[2] - 2 * factor,
      ];
      const upTarget: [number, number, number] = [
        home.target[0],
        home.target[1] + 4 * factor,
        home.target[2],
      ];
      return { position: lowPos, target: upTarget };
    }

    case 'pull-back': {
      // Move camera away 2x distance, then ease back
      const dx = home.position[0] - home.target[0];
      const dy = home.position[1] - home.target[1];
      const dz = home.position[2] - home.target[2];
      const outFactor = t < 0.4 ? smoothstep(t / 0.4) : 1;
      const backFactor = t > 0.4 ? smoothstep((t - 0.4) / 0.6) : 0;
      const scale = 1 + (outFactor - backFactor) * intensity;
      return {
        position: [
          home.target[0] + dx * scale,
          home.target[1] + dy * scale,
          home.target[2] + dz * scale,
        ],
        target: home.target,
      };
    }

    case 'shake-focus': {
      // Sine-based offsets, damped over time
      const decay = 1 - s;
      const freq = 18 * intensity;
      const amp = 0.8 * intensity * decay;
      return {
        position: [
          home.position[0] + Math.sin(elapsed * freq) * amp,
          home.position[1] + Math.cos(elapsed * freq * 1.3) * amp * 0.6,
          home.position[2] + Math.sin(elapsed * freq * 0.7) * amp * 0.4,
        ],
        target: home.target,
      };
    }

    default:
      return { position: home.position, target: home.target };
  }
}
