import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { STATUS_REGISTRY } from '../arena/statusRegistry';
import { SYNTH_PRESETS } from '../audio/synthPresets';
import { computeCardShake } from '../engines/cardShakeEngine';
import { playAttackSound } from '../engines/synthEngine';
import { getFilterDef, getFilterDefaults } from './filterRegistry';
import { getMorphDef, getMorphDefaults } from './morphRegistry';
import { getAuraDef, getAuraDefaults } from './auraRegistry';
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

  // Attack preview
  const [attackMode, setAttackMode] = useState<'give' | 'take' | null>(null);
  const [activeAttackKey, setActiveAttackKey] = useState<string | null>(null);
  const [attackElapsed, setAttackElapsed] = useState(0);
  const attackRaf = useRef<number>(0);

  // Presets
  const [presets, setPresets] = useState<WorkshopPreset[]>(() => getAllPresets());

  // Viewport ref + recording
  const viewportRef = useRef<WorkshopViewportRef>(null);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordResIdx, setRecordResIdx] = useState(0);
  const [recordFps, setRecordFps] = useState(30);
  const captureAspect = useMemo(
    () => RECORD_RESOLUTIONS[recordResIdx].w / RECORD_RESOLUTIONS[recordResIdx].h,
    [recordResIdx],
  );
  const [previewGif, setPreviewGif] = useState<{ url: string; filename: string } | null>(null);
  const [recordingLoop, setRecordingLoop] = useState<{ duration: number } | null>(null);
  const [loopMode, setLoopMode] = useState<'loop' | 'pingpong'>('loop');

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
    setActiveStatuses([]);
    setActiveFilters([]);
    setActiveMorphs([]);
    setActiveAuras([]);
    setIsDancing(false);
    setIsEvolving(false);
    setIsEvolved(false);
    // Reset decomposition
    cancelAnimationFrame(decompositionRaf.current);
    setActiveDecomposition(null);
    setDecompositionProgress(0);
    // Reset any running attack
    cancelAnimationFrame(attackRaf.current);
    setAttackMode(null);
    setActiveAttackKey(null);
    setAttackElapsed(0);
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
          filters: { active: activeFilters, params: filterParams },
          state: { evolved: isEvolved, dancing: isDancing },
          glow: { enabled: glowEnabled, color: glowColor, radius: glowRadius },
        },
      };
      savePreset(preset);
      setPresets(getAllPresets());
    },
    [selectedModelId, activeMorphs, morphParams, activeAuras, auraParams, activeFilters, filterParams, isEvolved, isDancing, glowEnabled, glowColor, glowRadius],
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

    try {
      const captureInterval = 1000 / fps;

      // Offscreen canvas at target resolution
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d')!;

      // Center-crop source canvas to match target aspect ratio
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

      // How many raw frames to capture
      const totalOutputFrames = durationSec * fps;
      const captureFrames = isPingPong
        ? Math.ceil((totalOutputFrames + 2) / 2)
        : totalOutputFrames;

      // For true loop mode: activate clock override so time cycles
      if (!isPingPong) {
        setRecordingLoop({ duration: durationSec });

        // Warm-up — one full cycle so particles reach steady state
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
      }

      // Capture frames via RAF
      const progressBase = isPingPong ? 0 : 0.15;
      const progressCapture = 0.35;
      const frameDataList: ImageData[] = [];
      await new Promise<void>((resolve) => {
        let count = 0;
        let lastCapture = 0;
        const tick = (time: number) => {
          if (count >= captureFrames) { resolve(); return; }
          if (time - lastCapture >= captureInterval) {
            ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, width, height);
            frameDataList.push(ctx.getImageData(0, 0, width, height));
            count++;
            lastCapture = time;
            setRecordProgress(progressBase + (count / captureFrames) * progressCapture);
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      // Deactivate clock override
      setRecordingLoop(null);

      // Assemble final frame sequence
      const outputFrames = isPingPong
        ? [...frameDataList, ...frameDataList.slice(1, -1).reverse()]
        : frameDataList;

      // Build global palette from sampled pixels
      const paletteStart = progressBase + progressCapture;
      setRecordProgress(paletteStart);
      const PIXEL_STRIDE = 4;
      const frameStep = Math.max(1, Math.floor(outputFrames.length / 8));
      const palettePixels: number[] = [];
      for (let f = 0; f < outputFrames.length; f += frameStep) {
        const d = outputFrames[f].data;
        for (let p = 0; p < d.length; p += PIXEL_STRIDE * 4) {
          palettePixels.push(d[p], d[p + 1], d[p + 2], d[p + 3]);
        }
      }
      const globalPalette = quantize(new Uint8ClampedArray(palettePixels), 256);

      const encodeStart = paletteStart + 0.05;
      setRecordProgress(encodeStart);

      // Encode GIF
      const delay = Math.round(1000 / fps);
      const gif = GIFEncoder();
      for (let i = 0; i < outputFrames.length; i++) {
        const rgba = outputFrames[i].data;
        const index = applyPalette(rgba, globalPalette);
        gif.writeFrame(index, width, height, {
          palette: globalPalette,
          delay,
          ...(i === 0 ? { repeat: 0 } : {}),
        });
        setRecordProgress(encodeStart + ((i + 1) / outputFrames.length) * (1 - encodeStart));
        if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      gif.finish();

      // Show preview
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const modeLabel = isPingPong ? 'pingpong' : 'loop';
      setPreviewGif({ url, filename: `nft-${modeLabel}-${width}x${height}-${durationSec}s.gif` });
    } finally {
      setRecording(false);
      setRecordProgress(0);
      setRecordingLoop(null);
    }
  }, [recording, loopMode]);

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
        envConfig={envConfigs.find((c) => c.id === selectedEnvId) ?? null}
        modelPosition={modelPosition}
        modelRotationY={modelRotationY}
        modelScale={modelScale}
        captureAspect={captureAspect}
        recordingLoop={recordingLoop}
      />

      {/* GIF Preview Overlay */}
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
            <img
              src={previewGif.url}
              alt="GIF preview"
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
