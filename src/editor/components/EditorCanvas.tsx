/**
 * Editor Canvas
 *
 * Main 3D canvas for the scene editor.
 * Supports orbit and FPS camera modes, object selection, transform gizmos,
 * and real-time motion path preview.
 */

import React, { useRef, useCallback, Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  TransformControls,
  useGLTF,
  Clone,
  Line,
} from '@react-three/drei';
import * as THREE from 'three';

import { useEditorStore, useSelectedObject, useSceneObjects, useSceneLights } from '../state/editorStore';
import { FPSControls, useCameraRecording } from '../../three/camera';
import { MotionController, createPath } from '../../motion';
import type { SceneObject, Light as LightConfig } from '../../types/scene';
import type { Point3D } from '../../motion/types/path';

// ============================================================================
// Motion Preview Hook
// ============================================================================

const useMotionPreview = (object: SceneObject, isPlaying: boolean) => {
  const [animatedPosition, setAnimatedPosition] = useState<[number, number, number]>(
    object.transform.position
  );
  const [animatedRotation, setAnimatedRotation] = useState<[number, number, number]>(
    object.transform.rotation
  );
  const [animatedScale, setAnimatedScale] = useState<[number, number, number]>(
    object.transform.scale
  );

  // Create motion controller if object has motion config
  const motionController = useMemo(() => {
    if (!object.motion) return null;

    const config = {
      pathType: object.motion.pathType,
      pathParams: object.motion.pathParams,
      speed: object.motion.speed,
      progressOffset: object.motion.progressOffset,
      loop: object.motion.loop,
      modifiers: object.motion.modifiers.map((m) => ({
        type: m.type,
        enabled: true,
        params: m.params,
      })),
      duration: 600, // 10 seconds at 60fps for preview
      startFrame: 0,
    };

    return new MotionController(config);
  }, [object.motion]);

  // Get path points for visualization
  const pathPoints = useMemo(() => {
    if (!motionController) return null;
    const points = motionController.getPathPoints(200);
    return points.map((p) => new THREE.Vector3(
      object.transform.position[0] + p.x,
      object.transform.position[1] + p.y,
      object.transform.position[2] + p.z
    ));
  }, [motionController, object.transform.position]);

  // Animate on each frame
  useFrame((state) => {
    if (!motionController || !isPlaying) {
      // Reset to static position when not playing
      setAnimatedPosition(object.transform.position);
      setAnimatedRotation(object.transform.rotation);
      setAnimatedScale(object.transform.scale);
      return;
    }

    // Use elapsed time to simulate frame progression
    const elapsed = state.clock.getElapsedTime();
    const fps = 60;
    const frame = Math.floor(elapsed * fps);

    const motionState = motionController.evaluate(frame, fps);

    setAnimatedPosition([
      object.transform.position[0] + motionState.position.x,
      object.transform.position[1] + motionState.position.y,
      object.transform.position[2] + motionState.position.z,
    ]);

    setAnimatedRotation([
      object.transform.rotation[0] + motionState.rotation.x,
      object.transform.rotation[1] + motionState.rotation.y,
      object.transform.rotation[2] + motionState.rotation.z,
    ]);

    setAnimatedScale([
      object.transform.scale[0] * motionState.scale.x,
      object.transform.scale[1] * motionState.scale.y,
      object.transform.scale[2] * motionState.scale.z,
    ]);
  });

  return {
    position: animatedPosition,
    rotation: animatedRotation,
    scale: animatedScale,
    pathPoints,
    hasMotion: !!motionController,
  };
};

// ============================================================================
// Path Visualization
// ============================================================================

const PathVisualization: React.FC<{
  points: THREE.Vector3[];
  color?: string;
}> = ({ points, color = '#6366f1' }) => {
  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
      dashed
      dashSize={0.5}
      gapSize={0.3}
    />
  );
};

// ============================================================================
// Object Renderer with Motion
// ============================================================================

const SceneObjectMesh: React.FC<{
  object: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isPlaying: boolean;
  showPaths: boolean;
}> = ({ object, isSelected, onSelect, isPlaying, showPaths }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Get animated transform from motion system
  const { position, rotation, scale, pathPoints, hasMotion } = useMotionPreview(
    object,
    isPlaying
  );

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect(object.id);
    },
    [object.id, onSelect]
  );

  // Render based on object type
  const renderContent = () => {
    if (object.type === 'model' && object.modelPath) {
      return <ModelMesh src={object.modelPath} onClick={handleClick} />;
    }

    if (object.type === 'primitive' && object.primitiveType) {
      const props = object.primitiveProps || {};
      const color = isSelected ? '#ffaa00' : props.color || '#6366f1';
      const wireframe = props.wireframe || false;

      switch (object.primitiveType) {
        case 'box':
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <boxGeometry args={[props.width || 1, props.height || 1, props.depth || 1]} />
              <meshStandardMaterial color={color} wireframe={wireframe} />
            </mesh>
          );
        case 'sphere':
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <sphereGeometry args={[props.radius || 0.5, props.segments || 32, props.segments || 32]} />
              <meshStandardMaterial color={color} wireframe={wireframe} />
            </mesh>
          );
        case 'cylinder':
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <cylinderGeometry args={[props.radius || 0.5, props.radius || 0.5, props.height || 1, props.segments || 32]} />
              <meshStandardMaterial color={color} wireframe={wireframe} />
            </mesh>
          );
        case 'torus':
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <torusGeometry args={[props.radius || 0.5, props.width || 0.2, 16, 32]} />
              <meshStandardMaterial color={color} wireframe={wireframe} />
            </mesh>
          );
        case 'cone':
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <coneGeometry args={[props.radius || 0.5, props.height || 1, props.segments || 32]} />
              <meshStandardMaterial color={color} wireframe={wireframe} />
            </mesh>
          );
        default:
          return (
            <mesh ref={meshRef} onClick={handleClick}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={color} />
            </mesh>
          );
      }
    }

    return null;
  };

  return (
    <>
      {/* Show path visualization when selected and has motion */}
      {showPaths && hasMotion && pathPoints && (
        <PathVisualization
          points={pathPoints}
          color={isSelected ? '#ffaa00' : '#6366f1'}
        />
      )}

      <group
        position={position}
        rotation={rotation}
        scale={scale}
        visible={object.visible !== false}
      >
        {renderContent()}
      </group>
    </>
  );
};

// Model loader
const ModelMesh: React.FC<{ src: string; onClick?: (e: any) => void }> = ({ src, onClick }) => {
  const { scene } = useGLTF(src);
  return (
    <group onClick={onClick}>
      <Clone object={scene} />
    </group>
  );
};

// ============================================================================
// Light Renderer
// ============================================================================

const SceneLight: React.FC<{ config: LightConfig }> = ({ config }) => {
  switch (config.type) {
    case 'ambient':
      return <ambientLight color={config.color} intensity={config.intensity} />;
    case 'directional':
      return (
        <directionalLight
          color={config.color}
          intensity={config.intensity}
          position={config.position || [10, 10, 10]}
          castShadow={config.castShadow}
        />
      );
    case 'point':
      return (
        <>
          <pointLight
            color={config.color}
            intensity={config.intensity}
            position={config.position || [0, 5, 0]}
            distance={config.distance}
            castShadow={config.castShadow}
          />
          {/* Light helper */}
          <mesh position={config.position || [0, 5, 0]} scale={0.2}>
            <sphereGeometry />
            <meshBasicMaterial color={config.color} />
          </mesh>
        </>
      );
    case 'spot':
      return (
        <spotLight
          color={config.color}
          intensity={config.intensity}
          position={config.position || [0, 10, 0]}
          angle={config.angle || Math.PI / 4}
          penumbra={config.penumbra || 0.5}
          distance={config.distance}
          castShadow={config.castShadow}
        />
      );
    default:
      return null;
  }
};

// ============================================================================
// Scene Content
// ============================================================================

const SceneContent: React.FC<{ showPaths: boolean }> = ({ showPaths }) => {
  const objects = useSceneObjects();
  const lights = useSceneLights();
  const selectedObject = useSelectedObject();
  const {
    selectedObjectId,
    selectObject,
    updateObjectTransform,
    toolMode,
    showGrid,
    showAxes,
    cameraMode,
    isRecording,
    isPlaying,
    setRecording,
    setRecordedPath,
  } = useEditorStore();

  const transformRef = useRef<any>(null);
  const fpsControlsRef = useRef<any>(null);

  // Camera recording
  const { captureKeyframe } = useCameraRecording({
    fps: 60,
    onStart: () => setRecording(true),
    onStop: (path) => {
      setRecording(false);
      setRecordedPath(path);
    },
  });

  // Handle transform changes
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !selectedObjectId) return;

    const object = transformRef.current.object;
    if (object) {
      updateObjectTransform(selectedObjectId, {
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: [object.scale.x, object.scale.y, object.scale.z],
      });
    }
  }, [selectedObjectId, updateObjectTransform]);

  // Handle camera movement for recording
  const handleCameraMove = useCallback(
    (transform: any) => {
      if (isRecording) {
        captureKeyframe(transform);
      }
    },
    [isRecording, captureKeyframe]
  );

  return (
    <>
      {/* Camera controls based on mode */}
      {cameraMode === 'orbit' && (
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      )}
      {cameraMode === 'fps' && (
        <FPSControls
          ref={fpsControlsRef}
          onMove={handleCameraMove}
          config={{ moveSpeed: 15, sprintMultiplier: 3 }}
        />
      )}

      {/* Environment */}
      <ambientLight intensity={0.3} />

      {/* Scene lights */}
      {lights.map((light) => (
        <SceneLight key={light.id} config={light} />
      ))}

      {/* Scene objects with motion preview */}
      <Suspense fallback={null}>
        {objects.map((obj) => (
          <SceneObjectMesh
            key={obj.id}
            object={obj}
            isSelected={obj.id === selectedObjectId}
            onSelect={selectObject}
            isPlaying={isPlaying}
            showPaths={showPaths}
          />
        ))}
      </Suspense>

      {/* Transform gizmo for selected object */}
      {selectedObject && toolMode !== 'select' && !isPlaying && (
        <TransformControls
          ref={transformRef}
          object={undefined}
          mode={toolMode}
          onObjectChange={handleTransformChange}
        />
      )}

      {/* Grid */}
      {showGrid && (
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          cellThickness={0.5}
          sectionThickness={1}
          cellColor="#444"
          sectionColor="#666"
          fadeDistance={100}
          fadeStrength={1}
        />
      )}

      {/* Axes helper */}
      {showAxes && <axesHelper args={[5]} />}

      {/* Gizmo helper */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#f73', '#3f7', '#37f']} labelColor="white" />
      </GizmoHelper>
    </>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface EditorCanvasProps {
  className?: string;
  showPaths?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  className,
  showPaths = true,
}) => {
  const { scene } = useEditorStore();

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 60 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ background: scene.environment.background }}
      >
        <SceneContent showPaths={showPaths} />
      </Canvas>
    </div>
  );
};

export default EditorCanvas;
