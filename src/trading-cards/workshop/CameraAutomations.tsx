import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraAutomationState } from './hooks/useCameraAutomation';

// ── Cheap bounded pseudo-noise (sum-of-sines) ──────────────
function pseudoNoise(t: number, seed: number): number {
  return (
    Math.sin(t * 1.1 + seed) * 0.5 +
    Math.sin(t * 2.3 + seed * 1.7) * 0.3 +
    Math.sin(t * 4.1 + seed * 0.3) * 0.2
  );
}

interface Props {
  automation: CameraAutomationState;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

export const CameraAutomations: React.FC<Props> = ({ automation, controlsRef }) => {
  const { camera } = useThree();

  // ── Refs for captured base values ──────────────────────────
  const baseDistRef = useRef(14);
  const baseFovRef = useRef(50);
  const epicycleBaseRef = useRef<{ dist: number; height: number } | null>(null);
  const prevDriftRef = useRef({ x: 0, y: 0, z: 0 });

  // Capture base distance when breathe is toggled on
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (automation.breathe.enabled) {
      baseDistRef.current = camera.position.distanceTo(controls.target);
    }
  }, [automation.breathe.enabled, camera, controlsRef]);

  // Capture base FOV when vertigo is toggled on
  useEffect(() => {
    if (automation.vertigo.enabled) {
      baseFovRef.current = (camera as THREE.PerspectiveCamera).fov;
    }
  }, [automation.vertigo.enabled, camera]);

  // Restore FOV when vertigo is toggled off
  useEffect(() => {
    if (!automation.vertigo.enabled) {
      const cam = camera as THREE.PerspectiveCamera;
      if (Math.abs(cam.fov - baseFovRef.current) > 0.1) {
        cam.fov = baseFovRef.current;
        cam.updateProjectionMatrix();
      }
    }
  }, [automation.vertigo.enabled, camera]);

  // Capture base values when epicycle is toggled on
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (automation.epicycle.enabled) {
      epicycleBaseRef.current = {
        dist: camera.position.distanceTo(controls.target),
        height: camera.position.y,
      };
    } else {
      epicycleBaseRef.current = null;
    }
  }, [automation.epicycle.enabled, camera, controlsRef]);

  // Clean up drift when disabled
  useEffect(() => {
    if (!automation.drift.enabled) {
      const prev = prevDriftRef.current;
      if (prev.x !== 0 || prev.y !== 0 || prev.z !== 0) {
        camera.position.x -= prev.x;
        camera.position.y -= prev.y;
        camera.position.z -= prev.z;
        prevDriftRef.current = { x: 0, y: 0, z: 0 };
        controlsRef.current?.update();
      }
    }
  }, [automation.drift.enabled, camera, controlsRef]);

  useFrame(({ clock }) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const t = clock.getElapsedTime();
    const target = controls.target;
    const cam = camera as THREE.PerspectiveCamera;

    // ── Epicycle Orbit ────────────────────────────────────────
    // Takes over camera position entirely (Spirograph path)
    if (automation.epicycle.enabled && epicycleBaseRef.current) {
      const { speed, complexity, radius, verticalAmp } = automation.epicycle;
      const base = epicycleBaseRef.current;
      const s = t * speed;

      // 3 nested orbits with different frequency ratios
      const r1 = base.dist * radius;
      const r2 = r1 * 0.3;
      const r3 = r2 * 0.25;
      const f1 = 1;
      const f2 = complexity;
      const f3 = complexity * 2.5 + 1;

      const x =
        r1 * Math.cos(s * f1) +
        r2 * Math.cos(s * f2) +
        r3 * Math.cos(s * f3);
      const z =
        r1 * Math.sin(s * f1) +
        r2 * Math.sin(s * f2) +
        r3 * Math.sin(s * f3);
      const y = base.height + Math.sin(s * 0.7) * verticalAmp * base.dist * 0.5;

      cam.position.set(target.x + x, Math.max(y, 1), target.z + z);
      controls.update();
    }

    // ── Breathing Zoom ───────────────────────────────────────
    // Sinusoidal dolly in/out (skipped if epicycle is active)
    if (automation.breathe.enabled && !automation.epicycle.enabled) {
      const { amplitude, speed } = automation.breathe;
      const dir = cam.position.clone().sub(target).normalize();
      const factor = 1 + Math.sin(t * speed * Math.PI * 2) * amplitude * 0.5;
      const newDist = baseDistRef.current * factor;
      cam.position.copy(target).add(dir.multiplyScalar(Math.max(newDist, 1)));
      controls.update();
    }

    // ── Dolly Zoom / Vertigo ─────────────────────────────────
    // FOV oscillation + inverse distance = background warping
    if (automation.vertigo.enabled) {
      const { speed, intensity } = automation.vertigo;
      const bFov = baseFovRef.current;
      const fovRange = intensity * 40;
      const newFov = bFov + Math.sin(t * speed * Math.PI * 2) * fovRange;
      const clampedFov = Math.max(10, Math.min(120, newFov));

      // Adjust distance to keep subject same apparent size
      // dist * tan(fov/2) = constant → dist_new = dist_base * tan(baseFov/2) / tan(newFov/2)
      const baseHalfTan = Math.tan((bFov * Math.PI) / 360);
      const newHalfTan = Math.tan((clampedFov * Math.PI) / 360);
      const distRatio = baseHalfTan / newHalfTan;

      if (!automation.epicycle.enabled) {
        const dir = cam.position.clone().sub(target).normalize();
        const refDist = automation.breathe.enabled
          ? baseDistRef.current
          : cam.position.distanceTo(target);
        cam.position.copy(target).add(dir.multiplyScalar(Math.max(refDist * distRatio, 1)));
      }

      cam.fov = clampedFov;
      cam.updateProjectionMatrix();
      controls.update();
    }

    // ── Drift ────────────────────────────────────────────────
    // Pseudo-noise offset (handheld camera feel), non-compounding
    if (automation.drift.enabled) {
      const { intensity, speed } = automation.drift;
      const scale = intensity * 0.5;

      // Remove previous frame's drift
      cam.position.x -= prevDriftRef.current.x;
      cam.position.y -= prevDriftRef.current.y;
      cam.position.z -= prevDriftRef.current.z;

      // Compute new drift for this frame
      const dx = pseudoNoise(t * speed, 0) * scale;
      const dy = pseudoNoise(t * speed, 100) * scale * 0.3;
      const dz = pseudoNoise(t * speed, 200) * scale;

      cam.position.x += dx;
      cam.position.y += dy;
      cam.position.z += dz;

      prevDriftRef.current = { x: dx, y: dy, z: dz };
      controls.update();
    }
  });

  return null;
};
