import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { ModelScene } from '../effects/ModelScene';
import { getWorkshopModel } from '../workshop/modelRegistry';
import type { PlacedModel, FloorSettings, WallSettings, SkySettings, TerrainSettings, WaterSettings, WeatherSettings, CloudSettings, GodRaysSettings } from './environmentTypes';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EnvironmentSky } from './EnvironmentSky';
import { EnvironmentTerrain } from './EnvironmentTerrain';
import { EnvironmentWater } from './EnvironmentWater';
import { EnvironmentWeather } from './EnvironmentWeather';
import { EnvironmentGodRays } from './EnvironmentGodRays';
import { EnvironmentClouds } from './EnvironmentClouds';

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

// ── Wireframe Walls ────────────────────────────────────────

const WireframeWalls: React.FC<{ boxSize: number; boxHeight: number; walls: WallSettings }> = ({ boxSize, boxHeight, walls }) => {
  if (!walls.visible) return null;

  const halfW = boxSize / 2;
  const halfH = boxHeight / 2;
  const color = new THREE.Color(walls.wireColor);

  // 5 walls: back, front, left, right, top (no floor — Grid handles it)
  // Side walls are boxSize wide x boxHeight tall, ceiling is boxSize x boxSize
  const wallConfigs: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }[] = [
    { position: [0, halfH, -halfW], rotation: [0, 0, 0], size: [boxSize, boxHeight] },           // back
    { position: [0, halfH, halfW], rotation: [0, Math.PI, 0], size: [boxSize, boxHeight] },      // front
    { position: [-halfW, halfH, 0], rotation: [0, Math.PI / 2, 0], size: [boxSize, boxHeight] }, // left
    { position: [halfW, halfH, 0], rotation: [0, -Math.PI / 2, 0], size: [boxSize, boxHeight] }, // right
    { position: [0, boxHeight, 0], rotation: [Math.PI / 2, 0, 0], size: [boxSize, boxSize] },    // top
  ];

  return (
    <group>
      {wallConfigs.map((cfg, i) => (
        <mesh key={i} position={cfg.position} rotation={cfg.rotation}>
          <planeGeometry args={cfg.size} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={walls.wireOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// ── Selection indicator ─────────────────────────────────────

const SelectionBox: React.FC<{ size: number }> = ({ size }) => {
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
      <lineBasicMaterial color="#ffcc00" transparent opacity={0.6} />
    </lineSegments>
  );
};

// ── Placed Model Renderer ──────────────────────────────────

const PlacedModelRenderer: React.FC<{
  model: PlacedModel;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ model, isSelected, onSelect }) => {
  const entry = useMemo(() => {
    try {
      return getWorkshopModel(model.modelId);
    } catch {
      return null;
    }
  }, [model.modelId]);

  if (!entry) return null;

  const preset = model.presetConfig;

  return (
    <group
      position={model.position}
      rotation={model.rotation.map((r) => (r * Math.PI) / 180) as unknown as [number, number, number]}
      scale={model.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <ModelScene
        definition={entry.definition}
        activeAttack={null}
        hitReaction={null}
        isDancing={preset?.state.dancing ?? false}
        isEvolved={preset?.state.evolved ?? false}
        activeMorphs={preset?.morphs.active ?? []}
        morphParams={preset?.morphs.params ?? {}}
        activeAuras={preset?.auras.active ?? []}
        auraParams={preset?.auras.params ?? {}}
      />
      {isSelected && <SelectionBox size={8} />}
    </group>
  );
};

// ── Camera Persistence ──────────────────────────────────────

interface SavedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

const ENV_CAMERA_KEY = 'environment-camera';

function loadSavedCamera(): SavedCamera | null {
  try {
    const raw = localStorage.getItem(ENV_CAMERA_KEY);
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

// ── Viewport ────────────────────────────────────────────────

export interface EnvironmentViewportProps {
  boxSize: number;
  boxHeight: number;
  floor: FloorSettings;
  walls: WallSettings;
  sky: SkySettings;
  terrain: TerrainSettings;
  water: WaterSettings;
  weather: WeatherSettings;
  clouds: CloudSettings;
  godRays: GodRaysSettings;
  models: PlacedModel[];
  selectedInstanceId: string | null;
  onSelectModel: (instanceId: string | null) => void;
}

export const EnvironmentViewport: React.FC<EnvironmentViewportProps> = ({
  boxSize,
  boxHeight,
  floor,
  walls,
  sky,
  terrain,
  water,
  weather,
  clouds,
  godRays,
  models,
  selectedInstanceId,
  onSelectModel,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const savedCamera = useRef(loadSavedCamera()).current;
  const defaultPos: [number, number, number] = savedCamera?.position ?? [0, boxSize * 0.4, boxSize * 0.7];

  const handleSave = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const tgt = controlsRef.current.target;
    const state: SavedCamera = {
      position: [cam.position.x, cam.position.y, cam.position.z],
      target: [tgt.x, tgt.y, tgt.z],
    };
    localStorage.setItem(ENV_CAMERA_KEY, JSON.stringify(state));
  };

  const handleReset = () => {
    localStorage.removeItem(ENV_CAMERA_KEY);
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, boxSize * 0.4, boxSize * 0.7);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        background: sky.enabled ? '#000' : 'linear-gradient(180deg, #0a0a1e 0%, #1a1a3e 100%)',
      }}
    >
      <Canvas
        onPointerMissed={() => onSelectModel(null)}
      >
        <PerspectiveCamera makeDefault position={defaultPos} far={boxSize * 4} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[boxSize * 0.3, boxSize * 0.5, boxSize * 0.3]}
          angle={0.3}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-boxSize * 0.3, -boxSize * 0.2, -boxSize * 0.3]} decay={0} intensity={Math.PI} />
        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          zoomToCursor
          maxDistance={boxSize * 2}
        />
        <CameraManager controlsRef={controlsRef} savedCamera={savedCamera} />

        {/* Sky (background sphere, first) */}
        <EnvironmentSky settings={sky} />

        {/* Clouds */}
        <EnvironmentClouds settings={clouds} boxSize={boxSize} />

        {/* Terrain (ground mesh) */}
        <EnvironmentTerrain settings={terrain} boxSize={boxSize} />

        {/* Grid floor — hidden when terrain.hideGrid */}
        {floor.visible && !(terrain.type !== 'none' && terrain.hideGrid) && (
          <Grid
            args={[boxSize, boxSize]}
            cellSize={floor.gridSize}
            sectionSize={100}
            cellColor={floor.gridColor}
            sectionColor={floor.gridColor}
            cellThickness={0.8}
            sectionThickness={1.2}
            fadeDistance={boxSize}
            fadeStrength={1}
            position={[0, 0, 0]}
          />
        )}

        {/* Water (transparent plane) */}
        <EnvironmentWater settings={water} boxSize={boxSize} />

        {/* God Rays (additive cones) */}
        <EnvironmentGodRays settings={godRays} boxSize={boxSize} />

        {/* Weather (instanced particles) */}
        <EnvironmentWeather settings={weather} boxSize={boxSize} boxHeight={boxHeight} />

        {/* Wireframe walls */}
        <WireframeWalls boxSize={boxSize} boxHeight={boxHeight} walls={walls} />

        {/* Placed models */}
        {models.map((m) => (
          <PlacedModelRenderer
            key={m.instanceId}
            model={m}
            isSelected={m.instanceId === selectedInstanceId}
            onSelect={() => onSelectModel(m.instanceId)}
          />
        ))}
      </Canvas>

      <FpsMeter />

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
