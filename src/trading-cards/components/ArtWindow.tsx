import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { sweepAngle, artShimmer, artShimmerOpacity, artWindowGlow } from '../styles/holo';
import { computeArtGlow } from '../engines/glowEngine';
import type { ArtGlowDescriptor } from '../arena/descriptorTypes';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface SavedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

function storageKey(id: string) {
  return `camera-state-${id}`;
}

function loadSavedCamera(id: string): SavedCamera | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as SavedCamera;
  } catch {
    return null;
  }
}

/** Inner component that syncs OrbitControls with external save/restore */
const CameraManager: React.FC<{
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  savedCamera: SavedCamera | null;
}> = ({ controlsRef, savedCamera }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!savedCamera) return;
    camera.position.set(...savedCamera.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...savedCamera.target);
      controlsRef.current.update();
    }
  }, [camera, controlsRef, savedCamera]);

  return null;
};

interface ArtWindowProps {
  frame: number;
  fps: number;
  activeAttack: string | null;
  attackElapsed: number;
  children: React.ReactNode;
  /** Enable orbit controls for mouse interaction + save button */
  interactive?: boolean;
  /** Unique ID for persisting camera state per card (required when interactive) */
  cameraId?: string;
  /** Optional art glow descriptor — when provided, uses engine instead of legacy artWindowGlow */
  artGlowDescriptor?: ArtGlowDescriptor;
}

export const ArtWindow: React.FC<ArtWindowProps> = ({
  frame,
  fps,
  activeAttack,
  attackElapsed,
  children,
  interactive = false,
  cameraId = 'default',
  artGlowDescriptor,
}) => {
  const artAngle = sweepAngle(frame, fps, 1, [-45, 315]);
  const shimmerOpacity = artShimmerOpacity(frame, fps);

  let glowShadow: string;
  if (artGlowDescriptor && activeAttack) {
    glowShadow = computeArtGlow(attackElapsed, artGlowDescriptor);
  } else {
    const fakeStartFrame = activeAttack ? frame - Math.floor(attackElapsed * fps) : 0;
    glowShadow = artWindowGlow(activeAttack, frame, fps, fakeStartFrame);
  }

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const savedCamera = useRef(loadSavedCamera(cameraId)).current;
  const defaultPos: [number, number, number] = savedCamera?.position ?? [0, 10, 14];

  const handleSave = useCallback(() => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const tgt = controlsRef.current.target;
    const state: SavedCamera = {
      position: [cam.position.x, cam.position.y, cam.position.z],
      target: [tgt.x, tgt.y, tgt.z],
    };
    localStorage.setItem(storageKey(cameraId), JSON.stringify(state));
  }, [cameraId]);

  const handleReset = useCallback(() => {
    localStorage.removeItem(storageKey(cameraId));
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, 10, 14);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [cameraId]);

  return (
    <div
      style={{
        width: '100%',
        height: 180,
        border: '2px solid rgba(180,155,60,0.5)',
        borderRadius: 3,
        background: 'linear-gradient(180deg, #b5ddf0 0%, #7ec4e2 50%, #5aafcf 100%)',
        overflow: 'hidden',
        boxShadow: glowShadow,
        position: 'relative',
      }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={defaultPos} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        {interactive && (
          <>
            <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate zoomToCursor />
            <CameraManager controlsRef={controlsRef} savedCamera={savedCamera} />
          </>
        )}
        {children}
      </Canvas>
      {/* Holographic shimmer over art window */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: artShimmer(artAngle, shimmerOpacity),
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Save / Reset camera buttons */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            zIndex: 2,
            display: 'flex',
            gap: 3,
          }}
        >
          <button
            onClick={handleSave}
            title="Save current view as default"
            style={{
              padding: '2px 6px',
              fontSize: 8,
              fontWeight: 600,
              border: 'none',
              borderRadius: 3,
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            Save View
          </button>
          <button
            onClick={handleReset}
            title="Reset to default camera position"
            style={{
              padding: '2px 6px',
              fontSize: 8,
              fontWeight: 600,
              border: 'none',
              borderRadius: 3,
              background: 'rgba(0,0,0,0.35)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
