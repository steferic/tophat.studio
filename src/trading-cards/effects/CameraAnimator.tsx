import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMovementDescriptor } from '../arena/descriptorTypes';
import { computeCameraState, getPresetDuration } from '../engines/cameraEngine';
import type { CameraHome } from '../engines/cameraEngine';

const EASE_BACK_DURATION = 0.3;
const DEFAULT_UP = new THREE.Vector3(0, 1, 0);

function applyRoll(camera: THREE.Camera, roll: number | undefined) {
  if (!roll) {
    camera.up.copy(DEFAULT_UP);
    return;
  }
  // Rotate the default up vector around the camera's forward axis
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const up = DEFAULT_UP.clone().applyAxisAngle(forward, roll);
  camera.up.copy(up);
}

interface CameraAnimatorProps {
  descriptor: CameraMovementDescriptor | undefined;
  active: boolean;
  attackElapsed: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  /** Manual camera movement triggered by user button (separate from attack) */
  manualDescriptor?: CameraMovementDescriptor | null;
}

export const CameraAnimator: React.FC<CameraAnimatorProps> = ({
  descriptor,
  active,
  attackElapsed,
  controlsRef,
  manualDescriptor,
}) => {
  const { camera } = useThree();

  // ── Attack animation refs ──
  const homeRef = useRef<CameraHome | null>(null);
  const animatingRef = useRef(false);
  const easingBackRef = useRef(false);
  const easeBackStartRef = useRef(0);
  const easeBackFromRef = useRef<CameraHome | null>(null);

  // ── Manual animation refs ──
  const manualHomeRef = useRef<CameraHome | null>(null);
  const manualAnimatingRef = useRef(false);
  const manualElapsedRef = useRef(0);
  const manualEasingBackRef = useRef(false);
  const manualEaseBackStartRef = useRef(0);
  const manualEaseBackFromRef = useRef<CameraHome | null>(null);
  const manualDescRef = useRef<CameraMovementDescriptor | null>(null);

  // Capture home position when attack animation starts
  useEffect(() => {
    if (active && descriptor && !animatingRef.current) {
      const controls = controlsRef.current;
      homeRef.current = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: controls
          ? [controls.target.x, controls.target.y, controls.target.z]
          : [0, 0, 0],
      };
      animatingRef.current = true;
      easingBackRef.current = false;
      if (controls) controls.enabled = false;
    }
  }, [active, descriptor, camera, controlsRef]);

  // Trigger manual animation when manualDescriptor changes (and no attack active)
  useEffect(() => {
    if (!manualDescriptor || animatingRef.current || easingBackRef.current) return;

    const controls = controlsRef.current;
    manualHomeRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: controls
        ? [controls.target.x, controls.target.y, controls.target.z]
        : [0, 0, 0],
    };
    manualDescRef.current = manualDescriptor;
    manualElapsedRef.current = 0;
    manualAnimatingRef.current = true;
    manualEasingBackRef.current = false;
    if (controls) controls.enabled = false;
  }, [manualDescriptor, camera, controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    // ── Attack: ease back ──
    if (easingBackRef.current && homeRef.current && easeBackFromRef.current) {
      easeBackStartRef.current += delta;
      const t = Math.min(1, easeBackStartRef.current / EASE_BACK_DURATION);
      const s = t * t * (3 - 2 * t);

      const from = easeBackFromRef.current;
      const home = homeRef.current;
      camera.position.set(
        from.position[0] + (home.position[0] - from.position[0]) * s,
        from.position[1] + (home.position[1] - from.position[1]) * s,
        from.position[2] + (home.position[2] - from.position[2]) * s,
      );
      if (controls) {
        controls.target.set(
          from.target[0] + (home.target[0] - from.target[0]) * s,
          from.target[1] + (home.target[1] - from.target[1]) * s,
          from.target[2] + (home.target[2] - from.target[2]) * s,
        );
        controls.update();
      }
      applyRoll(camera, undefined);

      if (t >= 1) {
        easingBackRef.current = false;
        animatingRef.current = false;
        if (controls) controls.enabled = true;
        homeRef.current = null;
        easeBackFromRef.current = null;
      }
      return;
    }

    // ── Attack: main animation ──
    if (animatingRef.current && descriptor && homeRef.current) {
      const duration = getPresetDuration(descriptor.preset, descriptor.duration);
      const intensity = descriptor.intensity ?? 1;

      if (attackElapsed >= duration || !active) {
        easeBackFromRef.current = {
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: controls
            ? [controls.target.x, controls.target.y, controls.target.z]
            : [0, 0, 0],
        };
        easeBackStartRef.current = 0;
        easingBackRef.current = true;
        return;
      }

      const state = computeCameraState(
        attackElapsed,
        duration,
        homeRef.current,
        descriptor.preset,
        intensity,
      );

      camera.position.set(...state.position);
      applyRoll(camera, state.roll);
      if (controls) {
        controls.target.set(...state.target);
        controls.update();
      }
      return;
    }

    // ── Manual: ease back ──
    if (manualEasingBackRef.current && manualHomeRef.current && manualEaseBackFromRef.current) {
      manualEaseBackStartRef.current += delta;
      const t = Math.min(1, manualEaseBackStartRef.current / EASE_BACK_DURATION);
      const s = t * t * (3 - 2 * t);

      const from = manualEaseBackFromRef.current;
      const home = manualHomeRef.current;
      camera.position.set(
        from.position[0] + (home.position[0] - from.position[0]) * s,
        from.position[1] + (home.position[1] - from.position[1]) * s,
        from.position[2] + (home.position[2] - from.position[2]) * s,
      );
      if (controls) {
        controls.target.set(
          from.target[0] + (home.target[0] - from.target[0]) * s,
          from.target[1] + (home.target[1] - from.target[1]) * s,
          from.target[2] + (home.target[2] - from.target[2]) * s,
        );
        controls.update();
      }
      applyRoll(camera, undefined);

      if (t >= 1) {
        manualEasingBackRef.current = false;
        manualAnimatingRef.current = false;
        if (controls) controls.enabled = true;
        manualHomeRef.current = null;
        manualEaseBackFromRef.current = null;
        manualDescRef.current = null;
      }
      return;
    }

    // ── Manual: main animation ──
    if (manualAnimatingRef.current && manualDescRef.current && manualHomeRef.current) {
      manualElapsedRef.current += delta;
      const desc = manualDescRef.current;
      const duration = getPresetDuration(desc.preset, desc.duration);
      const intensity = desc.intensity ?? 1;

      if (manualElapsedRef.current >= duration) {
        manualEaseBackFromRef.current = {
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: controls
            ? [controls.target.x, controls.target.y, controls.target.z]
            : [0, 0, 0],
        };
        manualEaseBackStartRef.current = 0;
        manualEasingBackRef.current = true;
        return;
      }

      const state = computeCameraState(
        manualElapsedRef.current,
        duration,
        manualHomeRef.current,
        desc.preset,
        intensity,
      );

      camera.position.set(...state.position);
      applyRoll(camera, state.roll);
      if (controls) {
        controls.target.set(...state.target);
        controls.update();
      }
    }
  });

  return null;
};
