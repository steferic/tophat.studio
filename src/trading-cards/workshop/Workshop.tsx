import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import { STATUS_REGISTRY } from '../arena/statusRegistry';
import { SYNTH_PRESETS } from '../audio/synthPresets';
import { computeCardShake } from '../engines/cardShakeEngine';
import { playAttackSound } from '../engines/synthEngine';
import { getFilterDef, getFilterDefaults } from './filterRegistry';
import { getMorphDef, getMorphDefaults } from './morphRegistry';
import { getAuraDef, getAuraDefaults } from './auraRegistry';
import { getShieldDef, getShieldDefaults } from './shieldRegistry';
import type { MaskConfig } from './maskRegistry';
import { getDefaultMaskConfig } from './maskRegistry';
import { ALL_WORKSHOP_MODELS, getWorkshopModel } from './modelRegistry';
import { getAllPresets, savePreset, deletePreset, exportPresetJSON } from './presetStorage';
import { getAllEnvironmentConfigs } from '../environment/environmentStorage';
import type { EnvironmentConfig } from '../environment/environmentTypes';
import { WorkshopViewport } from './WorkshopViewport';
import type { WorkshopViewportRef } from './WorkshopViewport';
import { WorkshopPanel, RECORD_RESOLUTIONS } from './WorkshopPanel';
import type { CameraPreset, ShakePattern, CameraMovementDescriptor, AttackParticleDescriptor } from '../arena/descriptorTypes';
import type { HitReaction, StatusEffect } from '../arena/types';
import type { WorkshopPreset } from './presetTypes';

// ── Pre-computed data ───────────────────────────────────────

const STATUS_BLUEPRINTS = Object.values(STATUS_REGISTRY).map((bp) => ({
  id: bp.id,
  displayName: bp.displayName,
  icon: bp.icon,
}));

// ── Workshop ────────────────────────────────────────────────

export const Workshop: React.FC = () => {
  // Model
  const [selectedModelId, setSelectedModelId] = useState(ALL_WORKSHOP_MODELS[0].id);
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);

  // Visual filters (multi-select)
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterParams, setFilterParams] = useState<Record<string, Record<string, any>>>({});

  // Model morphs (multi-select)
  const [activeMorphs, setActiveMorphs] = useState<string[]>([]);
  const [morphParams, setMorphParams] = useState<Record<string, Record<string, any>>>({});

  // Auras (multi-select)
  const [activeAuras, setActiveAuras] = useState<string[]>([]);
  const [auraParams, setAuraParams] = useState<Record<string, Record<string, any>>>({});

  // Shields (multi-select)
  const [activeShields, setActiveShields] = useState<string[]>([]);
  const [shieldParams, setShieldParams] = useState<Record<string, Record<string, any>>>({});

  // Masked effects
  const [maskConfig, setMaskConfig] = useState<MaskConfig>(() => getDefaultMaskConfig());

  // Camera — increment trigger counter to re-fire via new descriptor ref
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [cameraTrigger, setCameraTrigger] = useState(0);

  // Status effects
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);

  // Shake
  const [shakeTransform, setShakeTransform] = useState<string | undefined>();
  const shakeRaf = useRef<number>(0);

  // Decomposition
  const [activeDecomposition, setActiveDecomposition] = useState<string | null>(null);
  const [decompositionProgress, setDecompositionProgress] = useState(0);
  const decompositionRaf = useRef<number>(0);

  // Glow
  const [glowEnabled, setGlowEnabled] = useState(false);
  const [glowColor, setGlowColor] = useState('#64b4ff');
  const [glowRadius, setGlowRadius] = useState(30);

  // Background color
  const [bgColor, setBgColor] = useState('#000000');

  // Attack preview
  const [attackMode, setAttackMode] = useState<'give' | 'take' | null>(null);
  const [activeAttackKey, setActiveAttackKey] = useState<string | null>(null);
  const [attackElapsed, setAttackElapsed] = useState(0);
  const attackRaf = useRef<number>(0);

  // Presets
  const [presets, setPresets] = useState<WorkshopPreset[]>(() => getAllPresets());

  // Viewport ref + recording
  const viewportRef = useRef<WorkshopViewportRef>(null);
  const recordingTimeRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordResIdx, setRecordResIdx] = useState(0);
  const [recordFps, setRecordFps] = useState(60);
  const captureAspect = useMemo(
    () => RECORD_RESOLUTIONS[recordResIdx].w / RECORD_RESOLUTIONS[recordResIdx].h,
    [recordResIdx],
  );
  const [previewGif, setPreviewGif] = useState<{ url: string; filename: string } | null>(null);
  const [recordingLoop, setRecordingLoop] = useState<{ duration: number } | null>(null);
  const [loopMode, setLoopMode] = useState<'loop' | 'pingpong'>('loop');
  const [loopSync, setLoopSync] = useState(true);
  const [trailEffect, setTrailEffect] = useState(false);
  const [trailDecay, setTrailDecay] = useState(0.08);

  // Environment
  const [envConfigs, setEnvConfigs] = useState<EnvironmentConfig[]>(() => getAllEnvironmentConfigs());
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [modelPosition, setModelPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [modelRotationY, setModelRotationY] = useState(0);
  const [modelScale, setModelScale] = useState(1);

  // Refresh env configs when tab mounts (they may have changed in Environment tab)
  useEffect(() => {
    setEnvConfigs(getAllEnvironmentConfigs());
  }, []);

  const handleChangeModelPosition = useCallback((axis: 0 | 1 | 2, value: number) => {
    setModelPosition((prev) => {
      const next = [...prev] as [number, number, number];
      next[axis] = value;
      return next;
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────

  const modelEntry = getWorkshopModel(selectedModelId);
  const definition = modelEntry.definition;

  // Status effects array
  const statusEffects: StatusEffect[] = activeStatuses.map((id) => ({
    blueprintId: id,
    expiresAt: Date.now() + 60_000,
    appliedAt: Date.now() - 1_000,
    stacks: 1,
    lastTickAt: Date.now(),
  }));

  // Container style (shake + glow)
  const containerStyle: React.CSSProperties = {};
  if (shakeTransform) {
    containerStyle.transform = shakeTransform;
  }
  if (glowEnabled) {
    containerStyle.boxShadow = `0 0 ${glowRadius}px ${glowColor}, 0 0 ${glowRadius * 2}px ${glowColor}44`;
  }

  // ── Handlers ──────────────────────────────────────────────

  const handleSelectModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    // Only reset transient / model-specific state.
    // Visual preset state (filters, morphs, auras, shields, dancing, evolved,
    // glow, params) is preserved so loaded presets survive model changes.
    setActiveStatuses([]);
    // Reset decomposition
    cancelAnimationFrame(decompositionRaf.current);
    setActiveDecomposition(null);
    setDecompositionProgress(0);
    // Reset any running attack
    cancelAnimationFrame(attackRaf.current);
    setAttackMode(null);
    setActiveAttackKey(null);
    setAttackElapsed(0);
    // Reset evolving animation (but keep isEvolved if already set)
    setIsEvolving(false);
  }, []);

  const handleToggleFilter = useCallback((filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
    if (!filterParams[filter]) {
      const def = getFilterDef(filter);
      if (def) {
        setFilterParams((prev) => ({ ...prev, [filter]: getFilterDefaults(filter) }));
      }
    }
  }, [filterParams]);

  const handleChangeFilterParam = useCallback((filterId: string, key: string, value: any) => {
    setFilterParams((prev) => ({
      ...prev,
      [filterId]: { ...(prev[filterId] ?? {}), [key]: value },
    }));
  }, []);

  const handleToggleMorph = useCallback((morphId: string) => {
    setActiveMorphs((prev) =>
      prev.includes(morphId) ? prev.filter((m) => m !== morphId) : [...prev, morphId],
    );
    if (!morphParams[morphId]) {
      const def = getMorphDef(morphId);
      if (def) {
        setMorphParams((prev) => ({ ...prev, [morphId]: getMorphDefaults(morphId) }));
      }
    }
  }, [morphParams]);

  const handleChangeMorphParam = useCallback((morphId: string, key: string, value: any) => {
    setMorphParams((prev) => ({
      ...prev,
      [morphId]: { ...(prev[morphId] ?? {}), [key]: value },
    }));
  }, []);

  const handleToggleAura = useCallback((auraId: string) => {
    setActiveAuras((prev) =>
      prev.includes(auraId) ? prev.filter((a) => a !== auraId) : [...prev, auraId],
    );
    if (!auraParams[auraId]) {
      const def = getAuraDef(auraId);
      if (def) {
        setAuraParams((prev) => ({ ...prev, [auraId]: getAuraDefaults(auraId) }));
      }
    }
  }, [auraParams]);

  const handleChangeAuraParam = useCallback((auraId: string, key: string, value: any) => {
    setAuraParams((prev) => ({
      ...prev,
      [auraId]: { ...(prev[auraId] ?? {}), [key]: value },
    }));
  }, []);

  const handleToggleShield = useCallback((shieldId: string) => {
    setActiveShields((prev) =>
      prev.includes(shieldId) ? prev.filter((s) => s !== shieldId) : [...prev, shieldId],
    );
    if (!shieldParams[shieldId]) {
      const def = getShieldDef(shieldId);
      if (def) {
        setShieldParams((prev) => ({ ...prev, [shieldId]: getShieldDefaults(shieldId) }));
      }
    }
  }, [shieldParams]);

  const handleChangeShieldParam = useCallback((shieldId: string, key: string, value: any) => {
    setShieldParams((prev) => ({
      ...prev,
      [shieldId]: { ...(prev[shieldId] ?? {}), [key]: value },
    }));
  }, []);

  const handleToggleMask = useCallback(() => {
    setMaskConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const handleChangeMaskParam = useCallback((key: string, value: any) => {
    setMaskConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleChangeMaskPattern = useCallback((pattern: string) => {
    setMaskConfig((prev) => ({ ...prev, pattern }));
  }, []);

  const handleChangeZoneParam = useCallback((zone: 'zoneA' | 'zoneB', key: string, value: any) => {
    setMaskConfig((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [key]: value },
    }));
  }, []);

  const handleTriggerCamera = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setCameraTrigger((c) => c + 1);
  }, []);

  const handleToggleStatus = useCallback((id: string) => {
    setActiveStatuses((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const handleTriggerShake = useCallback((pattern: ShakePattern) => {
    const duration = 1.0;
    const start = performance.now();

    cancelAnimationFrame(shakeRaf.current);

    const animate = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed >= duration) {
        setShakeTransform(undefined);
        return;
      }
      const result = computeCardShake(elapsed, { pattern, duration, intensity: 1.5 });
      setShakeTransform(result.transform);
      shakeRaf.current = requestAnimationFrame(animate);
    };
    shakeRaf.current = requestAnimationFrame(animate);
  }, []);

  const handlePlaySynth = useCallback((key: string) => {
    const play = SYNTH_PRESETS[key];
    if (play) play();
  }, []);

  const handleToggleDecomposition = useCallback((type: string) => {
    cancelAnimationFrame(decompositionRaf.current);

    if (activeDecomposition === type) {
      // Toggle off
      setActiveDecomposition(null);
      setDecompositionProgress(0);
      return;
    }

    // Start new effect
    setActiveDecomposition(type);
    setDecompositionProgress(0);

    const duration = 2500; // 2.5s
    const start = performance.now();
    const animate = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / duration, 1.0);
      setDecompositionProgress(p);
      if (p < 1.0) {
        decompositionRaf.current = requestAnimationFrame(animate);
      }
    };
    decompositionRaf.current = requestAnimationFrame(animate);
  }, [activeDecomposition]);

  // ── Attack preview handlers ─────────────────────────────

  const resetAttack = useCallback(() => {
    cancelAnimationFrame(attackRaf.current);
    setAttackMode(null);
    setActiveAttackKey(null);
    setAttackElapsed(0);
  }, []);

  const handleGiveAttack = useCallback(
    (attackKey: string) => {
      // Toggle off if same attack
      if (activeAttackKey === attackKey && attackMode === 'give') {
        resetAttack();
        return;
      }
      resetAttack();

      const effects = definition.attackEffects[attackKey];
      const durationMs = definition.attackDurations[attackKey] ?? 2000;

      setActiveAttackKey(attackKey);
      setAttackMode('give');

      // Play audio
      if (effects?.audio) {
        playAttackSound(effects.audio);
      }

      // Start rAF loop
      const start = performance.now();
      const animate = () => {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed >= durationMs / 1000) {
          resetAttack();
          return;
        }
        setAttackElapsed(elapsed);

        // Apply card shake from attack's cardShake config
        if (effects?.cardShake) {
          const result = computeCardShake(elapsed, effects.cardShake);
          setShakeTransform(result.transform);
        }

        attackRaf.current = requestAnimationFrame(animate);
      };
      attackRaf.current = requestAnimationFrame(animate);
    },
    [activeAttackKey, attackMode, definition, resetAttack],
  );

  const handleTakeAttack = useCallback(
    (attackKey: string) => {
      // Toggle off if same attack
      if (activeAttackKey === attackKey && attackMode === 'take') {
        resetAttack();
        return;
      }
      resetAttack();

      setActiveAttackKey(attackKey);
      setAttackMode('take');

      const HIT_DURATION = 1.0; // 1 second for hit reaction
      const start = performance.now();
      const animate = () => {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed >= HIT_DURATION) {
          resetAttack();
          return;
        }
        setAttackElapsed(elapsed);
        attackRaf.current = requestAnimationFrame(animate);
      };
      attackRaf.current = requestAnimationFrame(animate);
    },
    [activeAttackKey, attackMode, resetAttack],
  );

  // Derive attack viewport props
  const attackViewportProps = (() => {
    if (!activeAttackKey || !attackMode) {
      return {
        activeAttack: null as string | null,
        hitReaction: null as HitReaction,
        incomingParticles: [] as AttackParticleDescriptor[],
        attackCameraMovement: undefined as CameraMovementDescriptor | undefined,
      };
    }
    const effects = definition.attackEffects[activeAttackKey];
    if (attackMode === 'give') {
      return {
        activeAttack: activeAttackKey,
        hitReaction: null as HitReaction,
        incomingParticles: [] as AttackParticleDescriptor[],
        attackCameraMovement: effects?.camera,
      };
    }
    // take
    return {
      activeAttack: null as string | null,
      hitReaction: 'hit-heavy' as HitReaction,
      incomingParticles: (effects?.hitParticles ?? []) as AttackParticleDescriptor[],
      attackCameraMovement: undefined as CameraMovementDescriptor | undefined,
    };
  })();

  // Derive a unique CameraMovementDescriptor per trigger
  const [derivedCameraDesc, setDerivedCameraDesc] = useState<CameraMovementDescriptor | null>(null);
  useEffect(() => {
    if (cameraPreset) {
      setDerivedCameraDesc({ preset: cameraPreset, intensity: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTrigger]);

  // Clear camera descriptor after it's consumed (reset to null so next trigger works)
  useEffect(() => {
    if (!derivedCameraDesc) return;
    const timer = setTimeout(() => setDerivedCameraDesc(null), 3000);
    return () => clearTimeout(timer);
  }, [derivedCameraDesc]);

  // ── Preset handlers ──────────────────────────────────────

  const handleSavePreset = useCallback(
    (name: string) => {
      const preset: WorkshopPreset = {
        version: 1,
        id: crypto.randomUUID(),
        name,
        modelId: selectedModelId,
        savedAt: Date.now(),
        config: {
          morphs: { active: activeMorphs, params: morphParams },
          auras: { active: activeAuras, params: auraParams },
          shields: { active: activeShields, params: shieldParams },
          filters: { active: activeFilters, params: filterParams },
          state: { evolved: isEvolved, dancing: isDancing },
          glow: { enabled: glowEnabled, color: glowColor, radius: glowRadius },
        },
      };
      savePreset(preset);
      setPresets(getAllPresets());
    },
    [selectedModelId, activeMorphs, morphParams, activeAuras, auraParams, activeShields, shieldParams, activeFilters, filterParams, isEvolved, isDancing, glowEnabled, glowColor, glowRadius],
  );

  const handleLoadPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      const { config } = preset;
      setActiveMorphs(config.morphs.active);
      setMorphParams(config.morphs.params);
      setActiveAuras(config.auras.active);
      setAuraParams(config.auras.params);
      if (config.shields) {
        setActiveShields(config.shields.active);
        setShieldParams(config.shields.params);
      } else {
        setActiveShields([]);
        setShieldParams({});
      }
      setActiveFilters(config.filters.active);
      setFilterParams(config.filters.params);
      setIsEvolved(config.state.evolved);
      setIsDancing(config.state.dancing);
      setGlowEnabled(config.glow.enabled);
      setGlowColor(config.glow.color);
      setGlowRadius(config.glow.radius);
    },
    [presets],
  );

  const handleDeletePreset = useCallback(
    (id: string) => {
      deletePreset(id);
      setPresets(getAllPresets());
    },
    [],
  );

  const handleCopyPresetJSON = useCallback(
    (id: string) => {
      const json = exportPresetJSON(id);
      navigator.clipboard.writeText(json);
    },
    [],
  );

  // ── NFT Recording (GIF loop) ───────────────────────────────

  const handleRecord = useCallback(async (durationSec: number, width: number, height: number, fps: number) => {
    const sourceCanvas = viewportRef.current?.getCanvas();
    if (!sourceCanvas || recording) return;

    setRecording(true);
    setRecordProgress(0);
    const isPingPong = loopMode === 'pingpong';

    // Boost DPR so the canvas backing buffer >= recording resolution
    const restoreDpr = viewportRef.current?.setCaptureDpr(width, height);

    try {
      // How many raw frames to capture
      const totalOutputFrames = durationSec * fps;
      // For loop mode: capture extra overlap frames for cross-dissolve
      const BLEND_SEC = 1.0;
      const blendFrames = isPingPong ? 0 : Math.ceil(fps * BLEND_SEC);
      const captureFrames = isPingPong
        ? Math.ceil((totalOutputFrames + 2) / 2)
        : totalOutputFrames + blendFrames;

      // Activate clock override (loopDuration drives qf() frequency quantization).
      // When loopSync is off, we still use the recording clock for deterministic
      // frame capture, but don't pass loopDuration to qf() so animations run at
      // their original speeds without quantization.
      setRecordingLoop({ duration: durationSec });

      // Warm-up — one full cycle in real-time so particles reach steady state.
      // This also gives R3F time to propagate the DPR boost.
      recordingTimeRef.current = null; // real-time mode for warmup
      await new Promise<void>((resolve) => {
        const warmupMs = durationSec * 1000;
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          setRecordProgress(Math.min(elapsed / warmupMs, 1) * 0.15);
          if (elapsed >= warmupMs) { resolve(); return; }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      // Offscreen canvas at target resolution
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d')!;

      // Center-crop source canvas to match target aspect ratio.
      // Read dimensions AFTER warmup so the DPR boost has taken effect.
      const srcW = sourceCanvas.width;
      const srcH = sourceCanvas.height;
      const targetAspect = width / height;
      const srcAspect = srcW / srcH;
      let sx: number, sy: number, sw: number, sh: number;
      if (srcAspect > targetAspect) {
        sh = srcH;
        sw = Math.round(srcH * targetAspect);
        sx = Math.round((srcW - sw) / 2);
        sy = 0;
      } else {
        sw = srcW;
        sh = Math.round(srcW / targetAspect);
        sx = 0;
        sy = Math.round((srcH - sh) / 2);
      }

      // Deterministic capture: set exact time per frame, wait for render, capture
      // Time advances linearly at 1/fps per frame (may exceed durationSec for overlap)
      //
      // 'copy' composite: each drawImage fully replaces the canvas (clean frames).
      // 'source-over': semi-transparent WebGL pixels composite on top of the
      // previous frame, creating an accumulation / motion-trail effect.
      ctx.globalCompositeOperation = trailEffect ? 'source-over' : 'copy';
      const progressBase = 0.15;
      const progressCapture = 0.35;
      const frameDataList: ImageData[] = [];
      for (let i = 0; i < captureFrames; i++) {
        const t = i / fps;
        recordingTimeRef.current = t;
        // Wait two rAFs: one for R3F to process the new time, one for GPU to finish
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, width, height);
        frameDataList.push(ctx.getImageData(0, 0, width, height));
        setRecordProgress(progressBase + ((i + 1) / captureFrames) * progressCapture);
      }

      // Deactivate clock override
      recordingTimeRef.current = null;
      setRecordingLoop(null);

      // Assemble final frame sequence
      let outputFrames: ImageData[];
      if (isPingPong) {
        outputFrames = [...frameDataList, ...frameDataList.slice(1, -1).reverse()];
      } else {
        // Overlap cross-dissolve: blend the extra frames INTO the start
        // frame[N+i] is temporally adjacent to frame[N-1], so the loop
        // boundary (last output frame → first output frame) is seamless.
        outputFrames = frameDataList.slice(0, totalOutputFrames);
        for (let i = 0; i < blendFrames; i++) {
          const t = i / blendFrames; // 0→1
          const overlapData = frameDataList[totalOutputFrames + i].data;
          const startData = outputFrames[i].data;
          for (let p = 0; p < startData.length; p++) {
            startData[p] = Math.round(overlapData[p] * (1 - t) + startData[p] * t);
          }
        }
      }

      // Encode WebM via WebCodecs + webm-muxer (VP9, full color, hardware-accelerated)
      const encodeStart = progressBase + progressCapture;
      setRecordProgress(encodeStart);

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: 'V_VP9', width, height, frameRate: fps },
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder error:', e),
      });

      encoder.configure({
        codec: 'vp09.00.10.08',
        width,
        height,
        bitrate: 20_000_000,
        bitrateMode: 'variable',
        latencyMode: 'quality',
      });

      const frameDurationUs = Math.round(1_000_000 / fps);
      for (let i = 0; i < outputFrames.length; i++) {
        const frame = new VideoFrame(outputFrames[i].data, {
          format: 'RGBA',
          codedWidth: width,
          codedHeight: height,
          timestamp: i * frameDurationUs,
          duration: frameDurationUs,
        });
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
        frame.close();
        setRecordProgress(encodeStart + ((i + 1) / outputFrames.length) * (1 - encodeStart));
        if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      await encoder.flush();
      encoder.close();
      muxer.finalize();

      // Show preview
      const blob = new Blob([target.buffer], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const modeLabel = isPingPong ? 'pingpong' : 'loop';
      setPreviewGif({ url, filename: `nft-${modeLabel}-${width}x${height}-${durationSec}s.webm` });
    } finally {
      restoreDpr?.();
      setRecording(false);
      setRecordProgress(0);
      setRecordingLoop(null);
    }
  }, [recording, loopMode, trailEffect]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <WorkshopPanel
        models={ALL_WORKSHOP_MODELS}
        selectedModelId={selectedModelId}
        statusBlueprints={STATUS_BLUEPRINTS}
        activeFilters={activeFilters}
        activeStatuses={activeStatuses}
        isDancing={isDancing}
        isEvolving={isEvolving}
        isEvolved={isEvolved}
        glowEnabled={glowEnabled}
        glowColor={glowColor}
        glowRadius={glowRadius}
        activeAttackKey={activeAttackKey}
        attackMode={attackMode}
        onSelectModel={handleSelectModel}
        onToggleFilter={handleToggleFilter}
        onTriggerCamera={handleTriggerCamera}
        onToggleStatus={handleToggleStatus}
        onTriggerShake={handleTriggerShake}
        onPlaySynth={handlePlaySynth}
        onToggleDance={() => setIsDancing((v) => !v)}
        onToggleEvolving={() => setIsEvolving((v) => !v)}
        onToggleEvolved={() => setIsEvolved((v) => !v)}
        onToggleGlow={() => setGlowEnabled((v) => !v)}
        onChangeGlowColor={setGlowColor}
        onChangeGlowRadius={setGlowRadius}
        bgColor={bgColor}
        onChangeBgColor={setBgColor}
        onGiveAttack={handleGiveAttack}
        onTakeAttack={handleTakeAttack}
        activeDecomposition={activeDecomposition}
        onToggleDecomposition={handleToggleDecomposition}
        filterParams={filterParams}
        onChangeFilterParam={handleChangeFilterParam}
        activeMorphs={activeMorphs}
        morphParams={morphParams}
        onToggleMorph={handleToggleMorph}
        onChangeMorphParam={handleChangeMorphParam}
        activeAuras={activeAuras}
        auraParams={auraParams}
        onToggleAura={handleToggleAura}
        onChangeAuraParam={handleChangeAuraParam}
        activeShields={activeShields}
        shieldParams={shieldParams}
        onToggleShield={handleToggleShield}
        onChangeShieldParam={handleChangeShieldParam}
        maskConfig={maskConfig}
        onToggleMask={handleToggleMask}
        onChangeMaskParam={handleChangeMaskParam}
        onChangeMaskPattern={handleChangeMaskPattern}
        onChangeZoneParam={handleChangeZoneParam}
        presets={presets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        onCopyPresetJSON={handleCopyPresetJSON}
        envConfigs={envConfigs}
        selectedEnvId={selectedEnvId}
        onSelectEnv={setSelectedEnvId}
        modelPosition={modelPosition}
        modelRotationY={modelRotationY}
        modelScale={modelScale}
        onChangeModelPosition={handleChangeModelPosition}
        onChangeModelRotationY={setModelRotationY}
        onChangeModelScale={setModelScale}
        onRecord={handleRecord}
        recording={recording}
        recordProgress={recordProgress}
        recordResIdx={recordResIdx}
        onChangeRecordResIdx={setRecordResIdx}
        recordFps={recordFps}
        onChangeRecordFps={setRecordFps}
        loopMode={loopMode}
        onChangeLoopMode={setLoopMode}
        loopSync={loopSync}
        onChangeLoopSync={setLoopSync}
        trailEffect={trailEffect}
        onChangeTrailEffect={setTrailEffect}
        trailDecay={trailDecay}
        onChangeTrailDecay={setTrailDecay}
      />

      {/* Spacer for panel width */}
      <div style={{ width: 320, flexShrink: 0 }} />

      <WorkshopViewport
        ref={viewportRef}
        definition={definition}
        activeFilters={activeFilters}
        filterParams={filterParams}
        manualCameraMovement={derivedCameraDesc}
        statusEffects={statusEffects}
        isDancing={isDancing}
        isEvolving={isEvolving}
        isEvolved={isEvolved}
        containerStyle={containerStyle}
        activeAttack={attackViewportProps.activeAttack}
        attackElapsed={attackElapsed}
        hitReaction={attackViewportProps.hitReaction}
        incomingParticles={attackViewportProps.incomingParticles}
        attackCameraMovement={attackViewportProps.attackCameraMovement}
        activeDecomposition={activeDecomposition}
        decompositionProgress={decompositionProgress}
        activeMorphs={activeMorphs}
        morphParams={morphParams}
        activeAuras={activeAuras}
        auraParams={auraParams}
        activeShields={activeShields}
        shieldParams={shieldParams}
        maskConfig={maskConfig}
        envConfig={envConfigs.find((c) => c.id === selectedEnvId) ?? null}
        modelPosition={modelPosition}
        modelRotationY={modelRotationY}
        modelScale={modelScale}
        bgColor={bgColor}
        captureAspect={captureAspect}
        recordingLoop={recordingLoop}
        loopSync={loopSync}
        recordingTimeRef={recordingTimeRef}
        trailEffect={trailEffect}
        trailDecay={trailDecay}
      />

      {/* Video Preview Overlay */}
      {previewGif && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => { URL.revokeObjectURL(previewGif.url); setPreviewGif(null); }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={previewGif.url}
              autoPlay
              loop
              muted
              playsInline
              style={{
                maxWidth: '80vw',
                maxHeight: '70vh',
                borderRadius: 8,
                border: '2px solid rgba(168,85,247,0.5)',
                boxShadow: '0 0 40px rgba(168,85,247,0.2)',
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewGif.url;
                  a.download = previewGif.filename;
                  a.click();
                }}
                style={{
                  padding: '8px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Download
              </button>
              <button
                onClick={() => { URL.revokeObjectURL(previewGif.url); setPreviewGif(null); }}
                style={{
                  padding: '8px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Dismiss
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {previewGif.filename}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
