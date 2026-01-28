/**
 * Camera Path Player
 *
 * Animates the camera along a recorded path with smooth interpolation.
 * Works with both keyframe-based and procedural camera paths.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { CameraPath, CameraKeyframe, Vector3, Vector4 } from '../types/scene';
import {
  interpolateCameraPath,
  quatToEuler,
  type CameraState,
} from './PathInterpolator';

// ============================================================================
// Types
// ============================================================================

export interface CameraPathPlayerProps {
  /** Camera path configuration */
  cameraPath: CameraPath;
  /** Optional override for current frame */
  frame?: number;
  /** Smoothing tension (0-1, lower = smoother) */
  tension?: number;
}

// ============================================================================
// Hook: Apply camera state to Three.js camera
// ============================================================================

export function useCameraPathPlayer(
  cameraPath: CameraPath,
  frame?: number,
  tension: number = 0.5
): CameraState | null {
  const currentFrame = useCurrentFrame();
  const { camera } = useThree();

  const actualFrame = frame ?? currentFrame;

  // Calculate camera state based on path type
  const cameraState = useMemo((): CameraState | null => {
    switch (cameraPath.type) {
      case 'static': {
        const position = cameraPath.position || [0, 0, 10];
        return {
          position,
          rotation: [0, 0, 0, 1], // Identity quaternion
          fov: cameraPath.fov,
        };
      }

      case 'keyframe': {
        if (!cameraPath.keyframes || cameraPath.keyframes.length === 0) {
          return null;
        }
        return interpolateCameraPath(
          cameraPath.keyframes,
          actualFrame,
          cameraPath.fov,
          tension
        );
      }

      case 'path': {
        // For path type, keyframes represent the path
        if (!cameraPath.keyframes || cameraPath.keyframes.length === 0) {
          return null;
        }
        return interpolateCameraPath(
          cameraPath.keyframes,
          actualFrame,
          cameraPath.fov,
          tension
        );
      }

      default:
        return null;
    }
  }, [cameraPath, actualFrame, tension]);

  // Apply camera state
  useEffect(() => {
    if (!cameraState) return;

    // Set position
    camera.position.set(
      cameraState.position[0],
      cameraState.position[1],
      cameraState.position[2]
    );

    // Set rotation from quaternion
    const quat = new THREE.Quaternion(
      cameraState.rotation[0],
      cameraState.rotation[1],
      cameraState.rotation[2],
      cameraState.rotation[3]
    );
    camera.setRotationFromQuaternion(quat);

    // Set FOV if perspective camera
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cameraState.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraState]);

  return cameraState;
}

// ============================================================================
// Component: Camera Path Player
// ============================================================================

export const CameraPathPlayer: React.FC<CameraPathPlayerProps> = ({
  cameraPath,
  frame,
  tension = 0.5,
}) => {
  useCameraPathPlayer(cameraPath, frame, tension);

  // This component doesn't render anything visible
  return null;
};

// ============================================================================
// Component: Camera Look-At Helper
// ============================================================================

export interface CameraLookAtProps {
  /** Target position to look at */
  target: Vector3;
  /** Smoothing factor (0-1) */
  smoothing?: number;
}

export const CameraLookAt: React.FC<CameraLookAtProps> = ({
  target,
  smoothing = 0,
}) => {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const targetVec = new THREE.Vector3(target[0], target[1], target[2]);

    if (smoothing > 0) {
      targetRef.current.lerp(targetVec, 1 - smoothing);
    } else {
      targetRef.current.copy(targetVec);
    }

    camera.lookAt(targetRef.current);
  }, [camera, target, smoothing]);

  return null;
};

// ============================================================================
// Component: Static Camera
// ============================================================================

export interface StaticCameraProps {
  position: Vector3;
  lookAt?: Vector3;
  fov?: number;
}

export const StaticCamera: React.FC<StaticCameraProps> = ({
  position,
  lookAt,
  fov = 50,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);

    if (lookAt) {
      camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, lookAt, fov]);

  return null;
};

// ============================================================================
// Component: Orbit Camera (for previews)
// ============================================================================

export interface OrbitCameraProps {
  /** Center point to orbit around */
  center?: Vector3;
  /** Distance from center */
  distance?: number;
  /** Orbit speed (revolutions per second) */
  speed?: number;
  /** Vertical angle (0 = level, positive = above) */
  elevation?: number;
  /** Initial angle offset */
  offset?: number;
  /** FOV */
  fov?: number;
}

export const OrbitCamera: React.FC<OrbitCameraProps> = ({
  center = [0, 0, 0],
  distance = 10,
  speed = 0.1,
  elevation = 0.3,
  offset = 0,
  fov = 50,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();

  useEffect(() => {
    const time = currentFrame / fps;
    const angle = (time * speed * Math.PI * 2) + offset;

    const x = center[0] + Math.cos(angle) * distance;
    const y = center[1] + Math.sin(elevation * Math.PI) * distance;
    const z = center[2] + Math.sin(angle) * distance;

    camera.position.set(x, y, z);
    camera.lookAt(center[0], center[1], center[2]);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, currentFrame, fps, center, distance, speed, elevation, offset, fov]);

  return null;
};

export default CameraPathPlayer;
