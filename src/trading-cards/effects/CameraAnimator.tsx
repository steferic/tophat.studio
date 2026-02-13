import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMovementDescriptor } from '../arena/descriptorTypes';
import { computeCameraState, getPresetDuration } from '../engines/cameraEngine';
import type { CameraHome } from '../engines/cameraEngine';

const EASE_BACK_DURATION = 0.3;

interface CameraAnimatorProps {
  descriptor: CameraMovementDescriptor | undefined;
  active: boolean;
  attackElapsed: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

export const CameraAnimator: React.FC<CameraAnimatorProps> = ({
  descriptor,
  active,
  attackElapsed,
  controlsRef,
}) => {
  const { camera } = useThree();
  const homeRef = useRef<CameraHome | null>(null);
  const animatingRef = useRef(false);
  const easingBackRef = useRef(false);
  const easeBackStartRef = useRef(0);
  const easeBackFromRef = useRef<CameraHome | null>(null);

  // Capture home position when animation starts
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

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    // Easing back to home after animation ends
    if (easingBackRef.current && homeRef.current && easeBackFromRef.current) {
      easeBackStartRef.current += delta;
      const t = Math.min(1, easeBackStartRef.current / EASE_BACK_DURATION);
      const s = t * t * (3 - 2 * t); // smoothstep

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

      if (t >= 1) {
        easingBackRef.current = false;
        animatingRef.current = false;
        if (controls) controls.enabled = true;
        homeRef.current = null;
        easeBackFromRef.current = null;
      }
      return;
    }

    // Main animation
    if (!animatingRef.current || !descriptor || !homeRef.current) return;

    const duration = getPresetDuration(descriptor.preset, descriptor.duration);
    const intensity = descriptor.intensity ?? 1;

    // Check if animation should end
    if (attackElapsed >= duration || !active) {
      // Start easing back
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
    if (controls) {
      controls.target.set(...state.target);
      controls.update();
    }
  });

  return null;
};
