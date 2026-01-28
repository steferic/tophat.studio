/**
 * Scene Player - Main Remotion composition for scene playback
 *
 * Loads a Scene JSON and renders it with:
 * - Environment setup (background, fog, lighting)
 * - Camera animation (static, keyframe, or path)
 * - Objects with motion paths
 */

import React, { useMemo, Suspense } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

import type {
  Scene,
  Light,
  SceneObject,
  Environment,
  CameraPath,
} from '../types/scene';
import { createDefaultScene } from '../types/scene';
import { MotionObject3D } from './MotionObject3D';
import {
  CameraPathPlayer,
  StaticCamera,
  CameraLookAt,
} from './CameraPathPlayer';

// ============================================================================
// Types
// ============================================================================

export interface ScenePlayerProps {
  /** Scene configuration (loaded from JSON) - uses default if not provided */
  scene?: Scene;
  /** Optional background override */
  backgroundColor?: string;
  /** Show debug helpers (grid, axes) */
  debug?: boolean;
}

// ============================================================================
// Light Components
// ============================================================================

const SceneLight: React.FC<{ light: Light }> = ({ light }) => {
  switch (light.type) {
    case 'ambient':
      return <ambientLight color={light.color} intensity={light.intensity} />;

    case 'directional':
      return (
        <directionalLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [10, 10, 10]}
          castShadow={light.castShadow}
        />
      );

    case 'point':
      return (
        <pointLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [0, 5, 0]}
          distance={light.distance || 0}
          castShadow={light.castShadow}
        />
      );

    case 'spot':
      return (
        <spotLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [0, 10, 0]}
          angle={light.angle || Math.PI / 4}
          penumbra={light.penumbra || 0.5}
          distance={light.distance || 0}
          castShadow={light.castShadow}
        />
      );

    default:
      return null;
  }
};

// ============================================================================
// Environment Component
// ============================================================================

const SceneEnvironment: React.FC<{
  environment: Environment;
  camera: CameraPath;
}> = ({ environment, camera }) => {
  return (
    <>
      {/* Background color */}
      <color attach="background" args={[environment.background]} />

      {/* Fog */}
      {environment.fog && (
        <fog
          attach="fog"
          args={[environment.fog.color, environment.fog.near, environment.fog.far]}
        />
      )}

      {/* Ambient light from environment */}
      <ambientLight
        color={environment.ambientLight.color}
        intensity={environment.ambientLight.intensity}
      />

      {/* Camera setup */}
      {camera.type === 'static' ? (
        <>
          <StaticCamera
            position={camera.position || [0, 0, 10]}
            fov={camera.fov}
          />
          {camera.lookAt && <CameraLookAt target={camera.lookAt} />}
        </>
      ) : (
        <CameraPathPlayer cameraPath={camera} />
      )}
    </>
  );
};

// ============================================================================
// Debug Helpers
// ============================================================================

const DebugHelpers: React.FC = () => {
  return (
    <>
      {/* Grid */}
      <gridHelper args={[50, 50, '#444444', '#222222']} />

      {/* Axes */}
      <axesHelper args={[5]} />
    </>
  );
};

// ============================================================================
// Scene Content
// ============================================================================

const SceneContent: React.FC<{
  scene: Scene;
  debug?: boolean;
}> = ({ scene, debug }) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <>
      {/* Environment setup */}
      <SceneEnvironment
        environment={scene.environment}
        camera={scene.camera}
      />

      {/* Lights */}
      {scene.lights.map((light) => (
        <SceneLight key={light.id} light={light} />
      ))}

      {/* Objects */}
      <Suspense fallback={null}>
        {scene.objects.map((obj) => (
          <MotionObject3D
            key={obj.id}
            config={obj}
            duration={durationInFrames}
          />
        ))}
      </Suspense>

      {/* Debug helpers */}
      {debug && <DebugHelpers />}
    </>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ScenePlayer: React.FC<ScenePlayerProps> = ({
  scene: sceneProp,
  backgroundColor,
  debug = false,
}) => {
  const { width, height } = useVideoConfig();

  // Use provided scene or default
  const scene = useMemo(() => sceneProp || createDefaultScene('Default Scene'), [sceneProp]);

  // Determine camera config for initial setup
  const cameraConfig = useMemo(() => {
    const defaultConfig = {
      position: [0, 0, 10] as [number, number, number],
      fov: scene.camera.fov,
      near: scene.camera.near ?? 0.1,
      far: scene.camera.far ?? 10000,
    };

    if (scene.camera.type === 'static' && scene.camera.position) {
      return {
        ...defaultConfig,
        position: scene.camera.position as [number, number, number],
      };
    }

    // For keyframe/path cameras, use first keyframe position if available
    if (scene.camera.keyframes && scene.camera.keyframes.length > 0) {
      return {
        ...defaultConfig,
        position: scene.camera.keyframes[0].position as [number, number, number],
      };
    }

    return defaultConfig;
  }, [scene.camera]);

  const bgColor = backgroundColor || scene.environment.background;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={cameraConfig}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        <SceneContent scene={scene} debug={debug} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// Composition Wrapper
// ============================================================================

export interface SceneCompositionProps {
  /** Path to scene JSON file (relative to public/) */
  scenePath: string;
  /** Fallback scene if loading fails */
  fallbackScene?: Scene;
  /** Show debug helpers */
  debug?: boolean;
}

/**
 * Wrapper that loads scene from JSON file
 * Use this as the Remotion composition component
 */
export const SceneComposition: React.FC<SceneCompositionProps> = ({
  scenePath,
  fallbackScene,
  debug = false,
}) => {
  // In Remotion, we'd load this at composition time via props
  // For now, expect scene to be passed via defaultProps
  // This is a placeholder for future JSON loading

  if (fallbackScene) {
    return <ScenePlayer scene={fallbackScene} debug={debug} />;
  }

  // Render error state if no scene
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <h2>Scene Not Loaded</h2>
        <p>Provide scene via props or fallbackScene</p>
        <code>{scenePath}</code>
      </div>
    </AbsoluteFill>
  );
};

export default ScenePlayer;
