/**
 * FPS Controls
 *
 * First-person shooter style camera controls:
 * - WASD movement
 * - Mouse look (with pointer lock)
 * - Space/C for vertical movement
 * - Shift for sprint
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type {
  FPSControlConfig,
  FPSKeyState,
  CameraTransform,
} from './types';
import {
  DEFAULT_FPS_CONFIG,
  INITIAL_KEY_STATE,
} from './types';
import { eulerToQuat } from '../../player/PathInterpolator';

// ============================================================================
// Types
// ============================================================================

export interface FPSControlsProps {
  /** Control configuration */
  config?: Partial<FPSControlConfig>;
  /** Called when camera moves */
  onMove?: (transform: CameraTransform) => void;
  /** Called when pointer lock changes */
  onLockChange?: (locked: boolean) => void;
  /** Initial position */
  initialPosition?: [number, number, number];
  /** Initial rotation (euler angles) */
  initialRotation?: [number, number, number];
  /** Enable/disable controls */
  enabled?: boolean;
}

export interface FPSControlsRef {
  /** Lock pointer */
  lock: () => void;
  /** Unlock pointer */
  unlock: () => void;
  /** Get current transform */
  getTransform: () => CameraTransform;
  /** Set camera position */
  setPosition: (position: [number, number, number]) => void;
  /** Set camera rotation */
  setRotation: (rotation: [number, number, number]) => void;
  /** Reset to initial state */
  reset: () => void;
}

// ============================================================================
// Key Mapping
// ============================================================================

const KEY_MAP: Record<string, keyof FPSKeyState> = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'up',
  KeyC: 'down',
  ControlLeft: 'down',
  ControlRight: 'down',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
};

// ============================================================================
// Component
// ============================================================================

export const FPSControls = forwardRef<FPSControlsRef, FPSControlsProps>(
  (
    {
      config: configOverrides,
      onMove,
      onLockChange,
      initialPosition = [0, 2, 10],
      initialRotation = [0, 0, 0],
      enabled = true,
    },
    ref
  ) => {
    const { camera, gl } = useThree();
    const domElement = gl.domElement;

    // Merge config with defaults
    const config: FPSControlConfig = {
      ...DEFAULT_FPS_CONFIG,
      ...configOverrides,
    };

    // State refs (avoid re-renders)
    const isLockedRef = useRef(false);
    const keysRef = useRef<FPSKeyState>({ ...INITIAL_KEY_STATE });
    const velocityRef = useRef(new THREE.Vector3());
    const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

    // Track lock state for UI
    const [isLocked, setIsLocked] = useState(false);

    // ========================================================================
    // Pointer Lock
    // ========================================================================

    const handleLock = useCallback(() => {
      if (!enabled) return;
      domElement.requestPointerLock();
    }, [domElement, enabled]);

    const handleUnlock = useCallback(() => {
      document.exitPointerLock();
    }, []);

    const handlePointerLockChange = useCallback(() => {
      const locked = document.pointerLockElement === domElement;
      isLockedRef.current = locked;
      setIsLocked(locked);
      onLockChange?.(locked);
    }, [domElement, onLockChange]);

    const handlePointerLockError = useCallback(() => {
      console.warn('FPSControls: Pointer lock error');
    }, []);

    // ========================================================================
    // Mouse Movement
    // ========================================================================

    const handleMouseMove = useCallback(
      (event: MouseEvent) => {
        if (!isLockedRef.current || !enabled) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Update euler angles
        eulerRef.current.y -= movementX * config.lookSensitivity;
        eulerRef.current.x -= movementY * config.lookSensitivity * (config.invertY ? -1 : 1);

        // Clamp vertical look
        eulerRef.current.x = Math.max(
          -Math.PI / 2 + 0.01,
          Math.min(Math.PI / 2 - 0.01, eulerRef.current.x)
        );
      },
      [config.lookSensitivity, config.invertY, enabled]
    );

    // ========================================================================
    // Keyboard Input
    // ========================================================================

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (!enabled) return;

        const key = KEY_MAP[event.code];
        if (key) {
          keysRef.current[key] = true;
          event.preventDefault();
        }
      },
      [enabled]
    );

    const handleKeyUp = useCallback(
      (event: KeyboardEvent) => {
        const key = KEY_MAP[event.code];
        if (key) {
          keysRef.current[key] = false;
        }
      },
      []
    );

    // ========================================================================
    // Setup Event Listeners
    // ========================================================================

    useEffect(() => {
      // Set initial position and rotation
      camera.position.set(...initialPosition);
      eulerRef.current.set(initialRotation[0], initialRotation[1], initialRotation[2], 'YXZ');

      // Pointer lock events
      document.addEventListener('pointerlockchange', handlePointerLockChange);
      document.addEventListener('pointerlockerror', handlePointerLockError);

      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);

      // Keyboard events
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      // Click to lock
      domElement.addEventListener('click', handleLock);

      return () => {
        document.removeEventListener('pointerlockchange', handlePointerLockChange);
        document.removeEventListener('pointerlockerror', handlePointerLockError);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        domElement.removeEventListener('click', handleLock);
      };
    }, [
      camera,
      domElement,
      initialPosition,
      initialRotation,
      handlePointerLockChange,
      handlePointerLockError,
      handleMouseMove,
      handleKeyDown,
      handleKeyUp,
      handleLock,
    ]);

    // ========================================================================
    // Frame Update
    // ========================================================================

    useFrame((_, delta) => {
      if (!enabled) return;

      // Apply rotation
      camera.quaternion.setFromEuler(eulerRef.current);

      // Calculate movement direction
      const keys = keysRef.current;
      const direction = new THREE.Vector3();

      if (keys.forward) direction.z -= 1;
      if (keys.backward) direction.z += 1;
      if (keys.left) direction.x -= 1;
      if (keys.right) direction.x += 1;

      if (direction.lengthSq() > 0) {
        direction.normalize();

        // Apply camera rotation to movement
        direction.applyQuaternion(camera.quaternion);

        // Keep movement horizontal (remove Y component from camera rotation)
        if (!config.enableVertical) {
          direction.y = 0;
          direction.normalize();
        }
      }

      // Vertical movement (independent of camera rotation)
      if (config.enableVertical) {
        if (keys.up) direction.y += 1;
        if (keys.down) direction.y -= 1;
      }

      // Calculate speed
      let speed = config.moveSpeed;
      if (keys.sprint) {
        speed *= config.sprintMultiplier;
      }

      // Apply velocity with smoothing
      const targetVelocity = direction.multiplyScalar(speed);

      if (config.smoothing > 0) {
        velocityRef.current.lerp(targetVelocity, 1 - Math.pow(config.smoothing, delta * 60));
      } else {
        velocityRef.current.copy(targetVelocity);
      }

      // Move camera
      camera.position.addScaledVector(velocityRef.current, delta);

      // Notify listener
      if (onMove && (direction.lengthSq() > 0 || velocityRef.current.lengthSq() > 0.001)) {
        onMove(getTransformInternal());
      }
    });

    // ========================================================================
    // Helper Functions
    // ========================================================================

    const getTransformInternal = useCallback((): CameraTransform => {
      return {
        position: [
          camera.position.x,
          camera.position.y,
          camera.position.z,
        ],
        rotation: [
          camera.quaternion.x,
          camera.quaternion.y,
          camera.quaternion.z,
          camera.quaternion.w,
        ],
        fov: config.fov,
      };
    }, [camera, config.fov]);

    // ========================================================================
    // Imperative Handle
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        lock: handleLock,
        unlock: handleUnlock,
        getTransform: getTransformInternal,
        setPosition: (position: [number, number, number]) => {
          camera.position.set(...position);
        },
        setRotation: (rotation: [number, number, number]) => {
          eulerRef.current.set(rotation[0], rotation[1], rotation[2], 'YXZ');
          camera.quaternion.setFromEuler(eulerRef.current);
        },
        reset: () => {
          camera.position.set(...initialPosition);
          eulerRef.current.set(initialRotation[0], initialRotation[1], initialRotation[2], 'YXZ');
          velocityRef.current.set(0, 0, 0);
          keysRef.current = { ...INITIAL_KEY_STATE };
        },
      }),
      [
        camera,
        handleLock,
        handleUnlock,
        getTransformInternal,
        initialPosition,
        initialRotation,
      ]
    );

    // No visible render - this is a controller component
    return null;
  }
);

FPSControls.displayName = 'FPSControls';

export default FPSControls;
