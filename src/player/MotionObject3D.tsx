/**
 * MotionObject3D - 3D object with mathematical motion
 *
 * Renders a model or primitive that follows a motion path.
 * Used within Remotion compositions for frame-accurate playback.
 */

import React, { useMemo, Suspense } from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneObject, MotionConfig } from '../types/scene';
import { MotionController, createMotionController } from '../motion';
import type { MotionControllerConfig, ModifierConfig } from '../motion/types';

// ============================================================================
// Types
// ============================================================================

export interface MotionObject3DProps {
  /** Scene object configuration */
  config: SceneObject;
  /** Current frame (optional - uses useCurrentFrame by default) */
  frame?: number;
  /** FPS (optional - uses useVideoConfig by default) */
  fps?: number;
  /** Total scene duration in frames */
  duration?: number;
  /** Start frame for this object's motion */
  startFrame?: number;
}

// ============================================================================
// Primitive Components
// ============================================================================

const PrimitiveBox: React.FC<{
  width: number;
  height: number;
  depth: number;
  color: string;
  wireframe: boolean;
}> = ({ width, height, depth, color, wireframe }) => (
  <mesh>
    <boxGeometry args={[width, height, depth]} />
    <meshStandardMaterial color={color} wireframe={wireframe} />
  </mesh>
);

const PrimitiveSphere: React.FC<{
  radius: number;
  segments: number;
  color: string;
  wireframe: boolean;
}> = ({ radius, segments, color, wireframe }) => (
  <mesh>
    <sphereGeometry args={[radius, segments, segments]} />
    <meshStandardMaterial color={color} wireframe={wireframe} />
  </mesh>
);

const PrimitiveCylinder: React.FC<{
  radius: number;
  height: number;
  segments: number;
  color: string;
  wireframe: boolean;
}> = ({ radius, height, segments, color, wireframe }) => (
  <mesh>
    <cylinderGeometry args={[radius, radius, height, segments]} />
    <meshStandardMaterial color={color} wireframe={wireframe} />
  </mesh>
);

const PrimitiveCone: React.FC<{
  radius: number;
  height: number;
  segments: number;
  color: string;
  wireframe: boolean;
}> = ({ radius, height, segments, color, wireframe }) => (
  <mesh>
    <coneGeometry args={[radius, height, segments]} />
    <meshStandardMaterial color={color} wireframe={wireframe} />
  </mesh>
);

const PrimitiveTorus: React.FC<{
  radius: number;
  tube: number;
  segments: number;
  color: string;
  wireframe: boolean;
}> = ({ radius, tube, segments, color, wireframe }) => (
  <mesh>
    <torusGeometry args={[radius, tube, segments, segments * 2]} />
    <meshStandardMaterial color={color} wireframe={wireframe} />
  </mesh>
);

const PrimitivePlane: React.FC<{
  width: number;
  height: number;
  color: string;
  wireframe: boolean;
}> = ({ width, height, color, wireframe }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[width, height]} />
    <meshStandardMaterial color={color} wireframe={wireframe} side={THREE.DoubleSide} />
  </mesh>
);

// ============================================================================
// Model Component
// ============================================================================

const ModelMesh: React.FC<{ src: string }> = ({ src }) => {
  const { scene } = useGLTF(src);
  return <Clone object={scene} />;
};

// ============================================================================
// Main Component
// ============================================================================

export const MotionObject3D: React.FC<MotionObject3DProps> = ({
  config,
  frame: frameProp,
  fps: fpsProp,
  duration: durationProp,
  startFrame: startFrameProp,
}) => {
  const currentFrame = useCurrentFrame();
  const videoConfig = useVideoConfig();

  // Use props or fallback to Remotion hooks
  const frame = frameProp ?? currentFrame;
  const fps = fpsProp ?? videoConfig.fps;
  const duration = durationProp ?? videoConfig.durationInFrames;
  const startFrame = startFrameProp ?? 0;

  // Create motion controller if object has motion config
  const motionController = useMemo(() => {
    if (!config.motion) return null;

    const motionConfig = config.motion;
    const controllerConfig: MotionControllerConfig = {
      pathType: motionConfig.pathType,
      pathParams: motionConfig.pathParams,
      speed: motionConfig.speed,
      progressOffset: motionConfig.progressOffset,
      loop: motionConfig.loop,
      modifiers: motionConfig.modifiers.map((m) => ({
        type: m.type,
        enabled: true,
        params: m.params,
      })) as ModifierConfig[],
      duration,
      startFrame,
    };

    return createMotionController(controllerConfig);
  }, [config.motion, duration, startFrame]);

  // Evaluate motion at current frame
  const motionState = useMemo(() => {
    if (!motionController) return null;
    return motionController.evaluate(frame, fps);
  }, [motionController, frame, fps]);

  // Calculate final transform
  const position = useMemo<[number, number, number]>(() => {
    if (motionState) {
      return [
        config.transform.position[0] + motionState.position.x,
        config.transform.position[1] + motionState.position.y,
        config.transform.position[2] + motionState.position.z,
      ];
    }
    return config.transform.position;
  }, [config.transform.position, motionState]);

  const rotation = useMemo<[number, number, number]>(() => {
    if (motionState) {
      return [
        config.transform.rotation[0] + motionState.rotation.x,
        config.transform.rotation[1] + motionState.rotation.y,
        config.transform.rotation[2] + motionState.rotation.z,
      ];
    }
    return config.transform.rotation;
  }, [config.transform.rotation, motionState]);

  const scale = useMemo<[number, number, number]>(() => {
    if (motionState) {
      return [
        config.transform.scale[0] * motionState.scale.x,
        config.transform.scale[1] * motionState.scale.y,
        config.transform.scale[2] * motionState.scale.z,
      ];
    }
    return config.transform.scale;
  }, [config.transform.scale, motionState]);

  // Don't render if not visible
  if (config.visible === false) {
    return null;
  }

  // Render content based on type
  const renderContent = () => {
    if (config.type === 'model' && config.modelPath) {
      const src = config.modelPath.startsWith('models/')
        ? staticFile(config.modelPath)
        : config.modelPath;

      return (
        <Suspense fallback={null}>
          <ModelMesh src={src} />
        </Suspense>
      );
    }

    if (config.type === 'primitive' && config.primitiveType) {
      const props = config.primitiveProps || {};
      const color = props.color || '#6366f1';
      const wireframe = props.wireframe || false;
      const segments = props.segments || 32;

      switch (config.primitiveType) {
        case 'box':
          return (
            <PrimitiveBox
              width={props.width || 1}
              height={props.height || 1}
              depth={props.depth || 1}
              color={color}
              wireframe={wireframe}
            />
          );
        case 'sphere':
          return (
            <PrimitiveSphere
              radius={props.radius || 0.5}
              segments={segments}
              color={color}
              wireframe={wireframe}
            />
          );
        case 'cylinder':
          return (
            <PrimitiveCylinder
              radius={props.radius || 0.5}
              height={props.height || 1}
              segments={segments}
              color={color}
              wireframe={wireframe}
            />
          );
        case 'cone':
          return (
            <PrimitiveCone
              radius={props.radius || 0.5}
              height={props.height || 1}
              segments={segments}
              color={color}
              wireframe={wireframe}
            />
          );
        case 'torus':
          return (
            <PrimitiveTorus
              radius={props.radius || 0.5}
              tube={props.width || 0.2}
              segments={segments}
              color={color}
              wireframe={wireframe}
            />
          );
        case 'plane':
          return (
            <PrimitivePlane
              width={props.width || 10}
              height={props.height || 10}
              color={color}
              wireframe={wireframe}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <group
      name={config.name}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={config.castShadow}
      receiveShadow={config.receiveShadow}
    >
      {renderContent()}
    </group>
  );
};

export default MotionObject3D;
