import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraAnimator } from '../effects/CameraAnimator';
import { VisualEffectPass } from '../effects/VisualEffectPass';
import { ModelScene } from '../effects/ModelScene';
import { DecompositionScene } from '../effects/decomposition';
import type { CardDefinition, CameraMovementDescriptor, AttackParticleDescriptor } from '../arena/descriptorTypes';
import type { HitReaction, StatusEffect } from '../arena/types';
import type { MaskConfig } from '../workshop/maskRegistry';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { EnvironmentConfig } from '../environment/environmentTypes';
import { EnvironmentSky } from '../environment/EnvironmentSky';
import { EnvironmentTerrain } from '../environment/EnvironmentTerrain';
import { EnvironmentWater } from '../environment/EnvironmentWater';
import { EnvironmentWeather } from '../environment/EnvironmentWeather';
import { EnvironmentGodRays } from '../environment/EnvironmentGodRays';
import { EnvironmentClouds } from '../environment/EnvironmentClouds';
import { LoopProvider } from './loopContext';

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

// ── Recording Clock Override ────────────────────────────────
// Overrides the R3F clock so elapsed time cycles modularly.
// All useFrame-based animations see looped time → perfect seamless loop.

const RecordingClock: React.FC<{
  loopDuration: number;
  timeRef?: React.MutableRefObject<number | null>;
}> = ({ loopDuration, timeRef }) => {
  const startRef = useRef(-1);

  useFrame((state) => {
    let loopedTime: number;
    if (timeRef?.current !== null && timeRef?.current !== undefined) {
      // Deterministic mode: use exact time from capture loop
      loopedTime = timeRef.current;
    } else {
      // Real-time mode: modular wall-clock time (warmup, preview)
      if (startRef.current < 0) {
        startRef.current = performance.now() / 1000;
      }
      const elapsed = performance.now() / 1000 - startRef.current;
      loopedTime = elapsed % loopDuration;
    }

    state.clock.elapsedTime = loopedTime;
    state.clock.getElapsedTime = () => loopedTime;
  }, -1000); // run before all other useFrame callbacks

  return null;
};

// ── Trail Fade ──────────────────────────────────────────────
// Prevents framebuffer clear, renders a semi-transparent background quad each
// frame so previous content fades out gradually → motion trail effect.

const TrailFade: React.FC<{ enabled: boolean; bgColor: string; decay: number }> = ({ enabled, bgColor, decay }) => {
  const { gl } = useThree();

  const { fadeScene, fadeMat } = useMemo(() => {
    const scene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(geo, mat));
    return { fadeScene: scene, fadeMat: mat };
  }, []);

  const fadeCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Sync color/opacity
  useEffect(() => {
    fadeMat.color.set(bgColor);
    fadeMat.opacity = decay;
  }, [bgColor, decay, fadeMat]);

  // Restore autoClear on unmount
  useEffect(() => {
    return () => { gl.autoClear = true; };
  }, [gl]);

  useFrame(() => {
    // Enforce autoClear every frame — other components (EffectComposer) may reset it
    gl.autoClear = !enabled;
    if (!enabled) return;
    // Blend fade quad onto previous framebuffer content
    gl.render(fadeScene, fadeCam);
    // Clear depth only so the main scene renders with correct z-testing
    gl.clear(false, true, false);
  }, -500); // After RecordingClock (-1000), before everything else

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

export interface WorkshopViewportRef {
  getCanvas: () => HTMLCanvasElement | null;
  /**
   * Temporarily boost the Canvas DPR so the backing buffer is large enough
   * for recording at the given resolution. Returns a restore function.
   * Must wait a couple of rAFs after calling for R3F to propagate the change.
   */
  setCaptureDpr: (targetW: number, targetH: number) => (() => void) | null;
}

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
  // Shields
  activeShields?: string[];
  shieldParams?: Record<string, Record<string, any>>;
  // Masked effects
  maskConfig?: MaskConfig;
  // Background color
  bgColor?: string;
  // Environment backdrop
  envConfig?: EnvironmentConfig | null;
  modelPosition?: [number, number, number];
  modelRotationY?: number;
  modelScale?: number;
  // Capture preview overlay
  captureAspect?: number;
  // Recording clock override
  recordingLoop?: { duration: number } | null;
  /** When false, qf() loop quantization is disabled during recording */
  loopSync?: boolean;
  recordingTimeRef?: React.MutableRefObject<number | null>;
  // Trail effect (live preview)
  trailEffect?: boolean;
  trailDecay?: number;
}

export const WorkshopViewport = forwardRef<WorkshopViewportRef, WorkshopViewportProps>(({
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
  activeShields = [],
  shieldParams = {},
  maskConfig,
  bgColor,
  envConfig = null,
  modelPosition: envModelPos,
  modelRotationY: envModelRotY = 0,
  modelScale: envModelScale = 1,
  captureAspect,
  recordingLoop = null,
  loopSync = true,
  recordingTimeRef,
  trailEffect = false,
  trailDecay = 0.08,
}, ref) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [overrideDpr, setOverrideDpr] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => containerRef.current?.querySelector('canvas') ?? null,
    setCaptureDpr: (targetW: number, targetH: number) => {
      const el = containerRef.current;
      if (!el) return null;
      const cssW = el.clientWidth;
      const cssH = el.clientHeight;
      const baseDpr = window.devicePixelRatio || 1;

      // Current canvas pixel dimensions
      const canvasW = cssW * baseDpr;
      const canvasH = cssH * baseDpr;

      // Compute how large the center-crop region is at current DPR
      const targetAspect = targetW / targetH;
      const canvasAspect = canvasW / canvasH;
      const cropW = canvasAspect > targetAspect ? canvasH * targetAspect : canvasW;
      const cropH = canvasAspect > targetAspect ? canvasH : canvasW / targetAspect;

      // Scale factor so the crop region >= target resolution
      const scale = Math.max(targetW / cropW, targetH / cropH, 1);
      if (scale <= 1) return null; // already large enough

      const captureDpr = Math.ceil(baseDpr * scale * 10) / 10; // round up to 0.1
      setOverrideDpr(captureDpr);
      return () => setOverrideDpr(null);
    },
  }));

  // Track container dimensions for capture preview overlay
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
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
      ref={containerRef}
      style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        background: bgColor || '#000000',
        ...containerStyle,
      }}
    >
      <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }} dpr={overrideDpr ?? [1, 2]}>
        <LoopProvider value={loopSync ? (recordingLoop?.duration ?? null) : null}>
        {/* Standalone TrailFade is only used when VisualEffectPass is NOT mounted.
            When VisualEffectPass is active (any filters, mask, OR trail), the
            TrailFeedbackEffect inside EffectComposer handles trail accumulation. */}
        <TrailFade enabled={false} bgColor={bgColor || '#000000'} decay={trailDecay} />
        <PerspectiveCamera makeDefault position={defaultPos} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate zoomToCursor />
        <CameraManager controlsRef={controlsRef} savedCamera={savedCamera} />
        {recordingLoop && <RecordingClock loopDuration={recordingLoop.duration} timeRef={recordingTimeRef} />}
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
              activeShields={activeShields}
              shieldParams={shieldParams}
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
          const needsComposer = effectFilters.length > 0 || !!maskConfig?.enabled || trailEffect;
          if (!needsComposer) return null;
          return (
            <VisualEffectPass
              filters={effectFilters}
              allParams={filterParams}
              maskConfig={maskConfig}
              trailEffect={trailEffect}
              trailDecay={trailDecay}
              bgColor={bgColor || '#000000'}
            />
          );
        })()}
        </LoopProvider>
      </Canvas>

      <FpsMeter />

      {/* Capture area preview */}
      {captureAspect != null && containerSize.w > 0 && containerSize.h > 0 && (() => {
        const cAspect = containerSize.w / containerSize.h;
        let pw: number, ph: number;
        if (captureAspect > cAspect) {
          pw = containerSize.w;
          ph = containerSize.w / captureAspect;
        } else {
          ph = containerSize.h;
          pw = containerSize.h * captureAspect;
        }
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: pw,
                height: ph,
                border: '2px dashed rgba(168,85,247,0.6)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }}
            />
          </div>
        );
      })()}

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
});

WorkshopViewport.displayName = 'WorkshopViewport';
