/**
 * Motion Controller
 *
 * Evaluates object motion at a given frame.
 * Combines path traversal with modifiers.
 */

import type { PathGenerator } from './types/path';
import type {
  MotionState,
  MotionModifier,
  MotionControllerConfig,
} from './types/controller';
import {
  calculateProgress,
  createDefaultMotionState,
} from './types/controller';
import { PathRegistry } from './PathRegistry';

// ============================================================================
// Motion Controller
// ============================================================================

export class MotionController {
  private config: MotionControllerConfig;
  private path: PathGenerator | null = null;
  private modifiers: MotionModifier[] = [];

  constructor(config: MotionControllerConfig) {
    this.config = config;
    this.initializePath();
    this.initializeModifiers();
  }

  /**
   * Initialize the path generator
   */
  private initializePath(): void {
    this.path = PathRegistry.create(
      this.config.pathType,
      this.config.pathParams
    );

    if (!this.path) {
      console.warn(
        `MotionController: Could not create path of type "${this.config.pathType}"`
      );
    }
  }

  /**
   * Initialize modifiers
   */
  private initializeModifiers(): void {
    // TODO: Implement modifier initialization from config
    // For now, modifiers are handled inline in evaluate()
    this.modifiers = [];
  }

  /**
   * Evaluate motion state at a given frame
   */
  evaluate(frame: number, fps: number): MotionState {
    // Calculate base progress
    const progress = calculateProgress(
      frame,
      this.config.startFrame,
      this.config.duration,
      this.config.speed,
      this.config.progressOffset,
      this.config.loop
    );

    // Get position from path
    let state: MotionState;

    if (this.path) {
      const position = this.path.getPositionAt(progress);
      const tangent = this.path.getTangentAt(progress);

      state = {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        progress,
        tangent,
      };
    } else {
      state = createDefaultMotionState();
      state.progress = progress;
    }

    // Apply modifiers
    state = this.applyModifiers(state, frame, fps);

    return state;
  }

  /**
   * Apply all modifiers to motion state
   */
  private applyModifiers(
    state: MotionState,
    frame: number,
    fps: number
  ): MotionState {
    let result = state;
    const time = frame / fps;

    // Process inline modifiers from config
    for (const modConfig of this.config.modifiers) {
      if (!modConfig.enabled) continue;

      switch (modConfig.type) {
        case 'rotation':
          result = this.applyRotationModifier(result, time, modConfig.params);
          break;

        case 'wobble':
          result = this.applyWobbleModifier(result, time, modConfig.params);
          break;

        case 'scalePulse':
          result = this.applyScalePulseModifier(result, time, modConfig.params);
          break;

        case 'lookAt':
          result = this.applyLookAtModifier(result, modConfig.params);
          break;
      }
    }

    // Apply any registered modifier instances
    for (const modifier of this.modifiers) {
      result = modifier.apply(result, frame, fps);
    }

    return result;
  }

  /**
   * Rotation modifier - continuous rotation on one or more axes
   */
  private applyRotationModifier(
    state: MotionState,
    time: number,
    params: Record<string, number | string | boolean>
  ): MotionState {
    const speedX = (params.speedX as number) || 0;
    const speedY = (params.speedY as number) || 0;
    const speedZ = (params.speedZ as number) || 0;
    const additive = params.additive !== false;

    const rotX = time * speedX * Math.PI * 2;
    const rotY = time * speedY * Math.PI * 2;
    const rotZ = time * speedZ * Math.PI * 2;

    if (additive) {
      return {
        ...state,
        rotation: {
          x: state.rotation.x + rotX,
          y: state.rotation.y + rotY,
          z: state.rotation.z + rotZ,
        },
      };
    }

    return {
      ...state,
      rotation: { x: rotX, y: rotY, z: rotZ },
    };
  }

  /**
   * Wobble modifier - oscillating offset
   */
  private applyWobbleModifier(
    state: MotionState,
    time: number,
    params: Record<string, number | string | boolean>
  ): MotionState {
    const amplitudeX = (params.amplitudeX as number) || 0;
    const amplitudeY = (params.amplitudeY as number) || 0;
    const amplitudeZ = (params.amplitudeZ as number) || 0;
    const frequency = (params.frequency as number) || 1;
    const phase = (params.phase as number) || 0;

    const t = time * frequency * Math.PI * 2 + phase;

    return {
      ...state,
      position: {
        x: state.position.x + Math.sin(t) * amplitudeX,
        y: state.position.y + Math.sin(t * 1.3 + 0.5) * amplitudeY,
        z: state.position.z + Math.sin(t * 0.7 + 1.0) * amplitudeZ,
      },
    };
  }

  /**
   * Scale pulse modifier - breathing/pulsing effect
   */
  private applyScalePulseModifier(
    state: MotionState,
    time: number,
    params: Record<string, number | string | boolean>
  ): MotionState {
    const minScale = (params.minScale as number) ?? 0.9;
    const maxScale = (params.maxScale as number) ?? 1.1;
    const frequency = (params.frequency as number) || 1;
    const phase = (params.phase as number) || 0;
    const uniform = params.uniform !== false;

    const t = time * frequency * Math.PI * 2 + phase;
    const wave = (Math.sin(t) + 1) / 2; // 0 to 1
    const scaleMult = minScale + wave * (maxScale - minScale);

    if (uniform) {
      return {
        ...state,
        scale: {
          x: state.scale.x * scaleMult,
          y: state.scale.y * scaleMult,
          z: state.scale.z * scaleMult,
        },
      };
    }

    // Non-uniform: slightly different frequencies per axis
    const waveY = (Math.sin(t * 1.1 + 0.3) + 1) / 2;
    const waveZ = (Math.sin(t * 0.9 + 0.7) + 1) / 2;
    const scaleMultY = minScale + waveY * (maxScale - minScale);
    const scaleMultZ = minScale + waveZ * (maxScale - minScale);

    return {
      ...state,
      scale: {
        x: state.scale.x * scaleMult,
        y: state.scale.y * scaleMultY,
        z: state.scale.z * scaleMultZ,
      },
    };
  }

  /**
   * Look-at modifier - orient object toward a point or along path
   */
  private applyLookAtModifier(
    state: MotionState,
    params: Record<string, number | string | boolean>
  ): MotionState {
    const followPath = params.followPath === true;

    if (followPath) {
      // Orient along path tangent
      const { x, y, z } = state.tangent;

      // Calculate rotation from tangent direction
      const yaw = Math.atan2(x, z);
      const pitch = Math.asin(-y);

      return {
        ...state,
        rotation: {
          x: pitch,
          y: yaw,
          z: 0,
        },
      };
    }

    // Look at specific target
    const targetX = (params.targetX as number) || 0;
    const targetY = (params.targetY as number) || 0;
    const targetZ = (params.targetZ as number) || 0;

    const dx = targetX - state.position.x;
    const dy = targetY - state.position.y;
    const dz = targetZ - state.position.z;

    const yaw = Math.atan2(dx, dz);
    const dist = Math.sqrt(dx * dx + dz * dz);
    const pitch = Math.atan2(-dy, dist);

    return {
      ...state,
      rotation: {
        x: pitch,
        y: yaw,
        z: 0,
      },
    };
  }

  /**
   * Add a modifier instance
   */
  addModifier(modifier: MotionModifier): void {
    this.modifiers.push(modifier);
  }

  /**
   * Remove a modifier by type
   */
  removeModifier(type: string): boolean {
    const index = this.modifiers.findIndex((m) => m.type === type);
    if (index !== -1) {
      this.modifiers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<MotionControllerConfig>): void {
    const pathChanged =
      config.pathType !== undefined &&
      config.pathType !== this.config.pathType;

    const paramsChanged =
      config.pathParams !== undefined &&
      JSON.stringify(config.pathParams) !==
        JSON.stringify(this.config.pathParams);

    this.config = { ...this.config, ...config };

    if (pathChanged || paramsChanged) {
      this.initializePath();
    }

    if (config.modifiers !== undefined) {
      this.initializeModifiers();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MotionControllerConfig {
    return { ...this.config };
  }

  /**
   * Get the underlying path generator
   */
  getPath(): PathGenerator | null {
    return this.path;
  }

  /**
   * Get path visualization points
   */
  getPathPoints(resolution: number = 500): { x: number; y: number; z: number }[] {
    if (!this.path) return [];
    return this.path.precomputePath(resolution);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMotionController(
  config: MotionControllerConfig
): MotionController {
  return new MotionController(config);
}

export default MotionController;
