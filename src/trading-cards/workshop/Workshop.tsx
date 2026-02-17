import React, { useCallback, useMemo, useRef } from 'react';
import { STATUS_REGISTRY } from '../arena/statusRegistry';
import { SYNTH_PRESETS } from '../audio/synthPresets';
import { getFilterDef, getFilterDefaults } from './filterRegistry';
import { getMorphDef, getMorphDefaults } from './morphRegistry';
import { getAuraDef, getAuraDefaults } from './auraRegistry';
import { getShieldDef, getShieldDefaults } from './shieldRegistry';
import { getSceneFxDef, getSceneFxDefaults } from './sceneFxRegistry';
import { ALL_WORKSHOP_MODELS, getWorkshopModel } from './modelRegistry';
import { WorkshopViewport } from './WorkshopViewport';
import type { WorkshopViewportRef } from './WorkshopViewport';
import { WorkshopPanel } from './WorkshopPanel';
import { WorkshopRightPanel } from './WorkshopRightPanel';
import {
  useToggleGroup,
  useModelState,
  useMaskState,
  useCameraState,
  useShakeState,
  useDecompositionState,
  useGlowState,
  useStatusState,
  useAttackPreview,
  useEnvironmentState,
  useRecordingState,
  usePresets,
  useCameraAutomation,
  useBackgroundState,
} from './hooks';

// ── Pre-computed data ───────────────────────────────────────

const STATUS_BLUEPRINTS = Object.values(STATUS_REGISTRY).map((bp) => ({
  id: bp.id,
  displayName: bp.displayName,
  icon: bp.icon,
}));

const filterConfig = { getDef: getFilterDef, getDefaults: getFilterDefaults } as const;
const morphConfig = { getDef: getMorphDef, getDefaults: getMorphDefaults } as const;
const auraConfig = { getDef: getAuraDef, getDefaults: getAuraDefaults } as const;
const shieldConfig = { getDef: getShieldDef, getDefaults: getShieldDefaults } as const;
const sceneFxConfig = { getDef: getSceneFxDef, getDefaults: getSceneFxDefaults } as const;

// ── Workshop ────────────────────────────────────────────────

export const Workshop: React.FC = () => {
  // Domain hooks
  const [model, modelActions] = useModelState();
  const [filters, filterActions] = useToggleGroup(filterConfig);
  const [morphs, morphActions] = useToggleGroup(morphConfig);
  const [auras, auraActions] = useToggleGroup(auraConfig);
  const [shields, shieldActions] = useToggleGroup(shieldConfig);
  const [sceneFx, sceneFxActions] = useToggleGroup(sceneFxConfig);
  const [maskConfig, maskActions] = useMaskState();
  const [camera, cameraActions] = useCameraState();
  const [shake, shakeActions] = useShakeState();
  const [decomp, decompActions] = useDecompositionState();
  const [glow, glowActions] = useGlowState();
  const [statuses, statusActions] = useStatusState();

  // Derived
  const modelEntry = getWorkshopModel(model.selectedModelId);
  const definition = modelEntry.definition;

  const [attack, attackActions, attackViewportProps] = useAttackPreview(definition, shakeActions.setShakeTransform);

  const viewportRef = useRef<WorkshopViewportRef>(null);
  const [rec, recActions] = useRecordingState(viewportRef);

  const [env, envActions] = useEnvironmentState();
  const [cameraAutomation, cameraAutoActions] = useCameraAutomation();

  const [presetState, presetActions] = usePresets({
    selectedModelId: model.selectedModelId,
    filters, filterActions,
    morphs, morphActions,
    auras, auraActions,
    shields, shieldActions,
    sceneFx, sceneFxActions,
    isDancing: model.isDancing,
    isEvolved: model.isEvolved,
    setIsDancing: modelActions.setIsDancing,
    setIsEvolved: modelActions.setIsEvolved,
    glow, glowActions,
  });

  // Background pattern
  const [bgPatternState, bgPatternActions] = useBackgroundState();
  const bgColor = (bgPatternState.bgPattern.params.color1 as string) ?? '#000000';

  // ── Cross-cutting: model selection resets ─────────────────

  const handleSelectModel = useCallback((id: string) => {
    modelActions.selectModel(id);
    attackActions.reset();
    decompActions.reset();
    statusActions.setActiveStatuses([]);
  }, [modelActions, attackActions, decompActions, statusActions]);

  // ── Synth ─────────────────────────────────────────────────

  const handlePlaySynth = useCallback((key: string) => {
    const play = SYNTH_PRESETS[key];
    if (play) play();
  }, []);

  // ── Derived styles ────────────────────────────────────────

  const containerStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    if (shake.shakeTransform) {
      style.transform = shake.shakeTransform;
    }
    if (glow.glowEnabled) {
      style.boxShadow = `0 0 ${glow.glowRadius}px ${glow.glowColor}, 0 0 ${glow.glowRadius * 2}px ${glow.glowColor}44`;
    }
    return style;
  }, [shake.shakeTransform, glow.glowEnabled, glow.glowRadius, glow.glowColor]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <WorkshopPanel
        model={{
          models: ALL_WORKSHOP_MODELS,
          selectedModelId: model.selectedModelId,
          isDancing: model.isDancing,
          isEvolving: model.isEvolving,
          isEvolved: model.isEvolved,
          onSelectModel: handleSelectModel,
          onToggleDance: () => modelActions.setIsDancing((v) => !v),
          onToggleEvolving: () => modelActions.setIsEvolving((v) => !v),
          onToggleEvolved: () => modelActions.setIsEvolved((v) => !v),
        }}
        environment={{
          envConfigs: env.envConfigs,
          selectedEnvId: env.selectedEnvId,
          onSelectEnv: envActions.setSelectedEnvId,
          modelPosition: env.modelPosition,
          modelRotationY: env.modelRotationY,
          modelScale: env.modelScale,
          onChangeModelPosition: envActions.changeModelPosition,
          onChangeModelRotationY: envActions.setModelRotationY,
          onChangeModelScale: envActions.setModelScale,
        }}
        effects={{
          filters, filterActions,
          morphs, morphActions,
          auras, auraActions,
          shields, shieldActions,
          sceneFx, sceneFxActions,
        }}
        mask={{
          maskConfig: maskConfig,
          onToggleMask: maskActions.toggleMask,
          onChangeMaskParam: maskActions.changeMaskParam,
          onChangeMaskPattern: maskActions.changeMaskPattern,
          onChangeZoneParam: maskActions.changeZoneParam,
        }}
        status={{
          statusBlueprints: STATUS_BLUEPRINTS,
          activeStatuses: statuses.activeStatuses,
          onToggleStatus: statusActions.toggleStatus,
        }}
      />

      {/* Spacer for panel width */}
      <div style={{ width: 320, flexShrink: 0 }} />

      <WorkshopViewport
        ref={viewportRef}
        definition={definition}
        activeFilters={filters.active}
        filterParams={filters.params}
        manualCameraMovement={camera.derivedCameraDesc}
        statusEffects={statuses.statusEffects}
        isDancing={model.isDancing}
        isEvolving={model.isEvolving}
        isEvolved={model.isEvolved}
        containerStyle={containerStyle}
        activeAttack={attackViewportProps.activeAttack}
        attackElapsed={attack.attackElapsed}
        hitReaction={attackViewportProps.hitReaction}
        incomingParticles={attackViewportProps.incomingParticles}
        attackCameraMovement={attackViewportProps.attackCameraMovement}
        activeDecomposition={decomp.activeDecomposition}
        decompositionProgress={decomp.decompositionProgress}
        activeMorphs={morphs.active}
        morphParams={morphs.params}
        activeAuras={auras.active}
        auraParams={auras.params}
        activeShields={shields.active}
        shieldParams={shields.params}
        activeSceneFx={sceneFx.active}
        sceneFxParams={sceneFx.params}
        maskConfig={maskConfig}
        envConfig={env.envConfigs.find((c) => c.id === env.selectedEnvId) ?? null}
        modelPosition={env.modelPosition}
        modelRotationY={env.modelRotationY}
        modelScale={env.modelScale}
        bgColor={bgColor}
        bgPattern={bgPatternState.bgPattern}
        captureAspect={rec.captureAspect}
        recordingLoop={rec.recordingLoop}
        loopSync={rec.loopSync}
        recordingTimeRef={rec.recordingTimeRef}
        trailEffect={rec.trailEffect}
        trailDecay={rec.trailDecay}
        cameraAutomation={cameraAutomation}
      />

      {/* Spacer for right panel width */}
      <div style={{ width: 280, flexShrink: 0 }} />

      <WorkshopRightPanel
        cameraAutomation={{
          automation: cameraAutomation,
          actions: cameraAutoActions,
        }}
        preset={{
          presets: presetState.presets,
          selectedModelId: model.selectedModelId,
          onSavePreset: presetActions.saveCurrentPreset,
          onLoadPreset: presetActions.loadPreset,
          onDeletePreset: presetActions.deletePreset,
          onCopyPresetJSON: presetActions.copyPresetJSON,
        }}
        camera={{
          onTriggerCamera: cameraActions.triggerCamera,
        }}
        decomposition={{
          activeDecomposition: decomp.activeDecomposition,
          onToggleDecomposition: decompActions.toggleDecomposition,
        }}
        shakeAudio={{
          onTriggerShake: shakeActions.triggerShake,
          onPlaySynth: handlePlaySynth,
        }}
        glowBg={{
          glowEnabled: glow.glowEnabled,
          glowColor: glow.glowColor,
          glowRadius: glow.glowRadius,
          onToggleGlow: () => glowActions.setGlowEnabled((v) => !v),
          onChangeGlowColor: glowActions.setGlowColor,
          onChangeGlowRadius: glowActions.setGlowRadius,
        }}
        background={{
          bgPattern: bgPatternState.bgPattern,
          onSetPattern: bgPatternActions.setPattern,
          onSetParam: bgPatternActions.setParam,
        }}
        record={{
          recording: rec.recording,
          recordProgress: rec.recordProgress,
          recordResIdx: rec.recordResIdx,
          onChangeRecordResIdx: recActions.setRecordResIdx,
          recordFps: rec.recordFps,
          onChangeRecordFps: recActions.setRecordFps,
          loopMode: rec.loopMode,
          onChangeLoopMode: recActions.setLoopMode,
          loopSync: rec.loopSync,
          onChangeLoopSync: recActions.setLoopSync,
          trailEffect: rec.trailEffect,
          onChangeTrailEffect: recActions.setTrailEffect,
          trailDecay: rec.trailDecay,
          onChangeTrailDecay: recActions.setTrailDecay,
          paintMode: rec.paintMode,
          onChangePaintMode: recActions.setPaintMode,
          paintOpacity: rec.paintOpacity,
          onChangePaintOpacity: recActions.setPaintOpacity,
          bgColor,
          onRecord: recActions.handleRecord,
        }}
        attack={{
          definition,
          activeAttackKey: attack.activeAttackKey,
          attackMode: attack.attackMode,
          onGiveAttack: attackActions.giveAttack,
          onTakeAttack: attackActions.takeAttack,
        }}
      />

      {/* Video Preview Overlay */}
      {rec.previewGif && (
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
          onClick={() => { URL.revokeObjectURL(rec.previewGif!.url); recActions.setPreviewGif(null); }}
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
              src={rec.previewGif.url}
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
                  a.href = rec.previewGif!.url;
                  a.download = rec.previewGif!.filename;
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
                onClick={() => { URL.revokeObjectURL(rec.previewGif!.url); recActions.setPreviewGif(null); }}
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
              {rec.previewGif.filename}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
