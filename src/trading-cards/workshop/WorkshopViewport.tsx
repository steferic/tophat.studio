import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { CameraAnimator } from '../effects/CameraAnimator';
import { VisualEffectPass } from '../effects/VisualEffectPass';
import { ModelScene } from '../effects/ModelScene';
import { DecompositionScene } from '../effects/decomposition';
import type { CardDefinition, CameraMovementDescriptor, AttackParticleDescriptor } from '../arena/descriptorTypes';
import type { HitReaction, StatusEffect } from '../arena/types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { EnvironmentConfig } from '../environment/environmentTypes';
import { EnvironmentSky } from '../environment/EnvironmentSky';
import { EnvironmentTerrain } from '../environment/EnvironmentTerrain';
import { EnvironmentWater } from '../environment/EnvironmentWater';
import { EnvironmentWeather } from '../environment/EnvironmentWeather';
import { EnvironmentGodRays } from '../environment/EnvironmentGodRays';
import { EnvironmentClouds } from '../environment/EnvironmentClouds';

// ── Saved Camera Persistence ────────────────────────────────

interface SavedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

function storageKey(id: string) {
  return `workshop-camera-${id}`;
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

// ── FPS Meter ───────────────────────────────────────────────

const FpsMeter: React.FC = () => {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let id: number;
    const tick = () => {
      frames.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      if (elapsed >= 500) {
        setFps(Math.round((frames.current / elapsed) * 1000));
        frames.current = 0;
        lastTime.current = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 3,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'monospace',
        color,
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 6px',
        borderRadius: 4,
        pointerEvents: 'none',
        lineHeight: 1.5,
      }}
    >
      {fps} fps
    </div>
  );
};

// ── WorkshopViewport ────────────────────────────────────────

export interface WorkshopViewportProps {
  definition: CardDefinition;
  activeFilters: string[];
  filterParams: Record<string, Record<string, any>>;
  manualCameraMovement: CameraMovementDescriptor | null;
  statusEffects: StatusEffect[];
  isDancing: boolean;
  isEvolving: boolean;
  isEvolved: boolean;
  containerStyle?: React.CSSProperties;
  // Attack preview
  activeAttack: string | null;
  attackElapsed: number;
  hitReaction: HitReaction;
  incomingParticles: AttackParticleDescriptor[];
  attackCameraMovement?: CameraMovementDescriptor;
  // Decomposition
  activeDecomposition: string | null;
  decompositionProgress: number;
  // Morphs
  activeMorphs?: string[];
  morphParams?: Record<string, Record<string, any>>;
  // Auras
  activeAuras?: string[];
  auraParams?: Record<string, Record<string, any>>;
  // Environment backdrop
  envConfig?: EnvironmentConfig | null;
  modelPosition?: [number, number, number];
  modelRotationY?: number;
  modelScale?: number;
}

export const WorkshopViewport: React.FC<WorkshopViewportProps> = ({
  definition,
  activeFilters,
  filterParams,
  manualCameraMovement,
  statusEffects,
  isDancing,
  isEvolving,
  isEvolved,
  containerStyle,
  activeAttack,
  attackElapsed,
  hitReaction,
  incomingParticles,
  attackCameraMovement,
  activeDecomposition,
  decompositionProgress,
  activeMorphs = [],
  morphParams = {},
  activeAuras = [],
  auraParams = {},
  envConfig = null,
  modelPosition: envModelPos,
  modelRotationY: envModelRotY = 0,
  modelScale: envModelScale = 1,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraId = `workshop-${definition.id}`;
  const savedCamera = useRef(loadSavedCamera(cameraId)).current;
  const defaultPos: [number, number, number] = savedCamera?.position ?? [0, 10, 14];

  const handleSave = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const tgt = controlsRef.current.target;
    const state: SavedCamera = {
      position: [cam.position.x, cam.position.y, cam.position.z],
      target: [tgt.x, tgt.y, tgt.z],
    };
    localStorage.setItem(storageKey(cameraId), JSON.stringify(state));
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey(cameraId));
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, 10, 14);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        background: envConfig ? '#000' : (definition.artBackground ?? 'linear-gradient(180deg, #0a0a1e 0%, #1a1a3e 100%)'),
        ...containerStyle,
      }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={defaultPos} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate zoomToCursor />
        <CameraManager controlsRef={controlsRef} savedCamera={savedCamera} />
        <CameraAnimator
          descriptor={attackCameraMovement}
          active={activeAttack !== null}
          attackElapsed={attackElapsed}
          controlsRef={controlsRef}
          manualDescriptor={manualCameraMovement}
        />
        {/* Environment backdrop */}
        {envConfig && (
          <>
            <EnvironmentSky settings={envConfig.sky} />
            <EnvironmentClouds settings={envConfig.clouds} boxSize={envConfig.boxSize} />
            <EnvironmentTerrain settings={envConfig.terrain} boxSize={envConfig.boxSize} />
            <EnvironmentWater settings={envConfig.water} boxSize={envConfig.boxSize} />
            <EnvironmentGodRays settings={envConfig.godRays} boxSize={envConfig.boxSize} />
            <EnvironmentWeather settings={envConfig.weather} boxSize={envConfig.boxSize} boxHeight={envConfig.boxHeight} />
          </>
        )}

        <group
          position={envModelPos}
          rotation={[0, (envModelRotY * Math.PI) / 180, 0]}
          scale={envModelScale}
        >
          <group visible={!activeDecomposition}>
            <ModelScene
              definition={definition}
              activeAttack={activeAttack}
              hitReaction={hitReaction}
              incomingParticles={incomingParticles}
              statusEffects={statusEffects}
              isDancing={isDancing}
              isEvolving={isEvolving}
              isEvolved={isEvolved}
              side="left"
              activeMorphs={activeMorphs}
              morphParams={morphParams}
              activeAuras={activeAuras}
              auraParams={auraParams}
            />
          </group>
          {activeDecomposition && (
            <DecompositionScene
              modelPath={definition.model.modelPath}
              baseScale={definition.model.baseScale}
              relativeSize={definition.model.relativeSize ?? 1.0}
              effectType={activeDecomposition as 'shatter' | 'dissolve' | 'slice'}
              progress={decompositionProgress}
            />
          )}
        </group>
        {(() => {
          const effectFilters = activeFilters.filter((f) => f !== 'blue-tint');
          if (effectFilters.length === 0) return null;
          return <VisualEffectPass filters={effectFilters} allParams={filterParams} />;
        })()}
      </Canvas>

      <FpsMeter />

      {/* Blue tint overlay */}
      {activeFilters.includes('blue-tint') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,80,200,0.25)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Save / Reset camera */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 2,
          display: 'flex',
          gap: 4,
        }}
      >
        <button
          onClick={handleSave}
          title="Save current view"
          style={{
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            border: 'none',
            borderRadius: 4,
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
          title="Reset camera"
          style={{
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            border: 'none',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.35)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
