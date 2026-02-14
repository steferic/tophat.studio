import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getAllCards } from '../arena/cardRegistry';
import { STATUS_REGISTRY } from '../arena/statusRegistry';
import { SYNTH_PRESETS } from '../audio/synthPresets';
import { getAllItems } from '../items';
import { computeCardShake } from '../engines/cardShakeEngine';
import { playAttackSound } from '../engines/synthEngine';
import { WorkshopViewport } from './WorkshopViewport';
import { WorkshopPanel } from './WorkshopPanel';
import type { CameraPreset, ShakePattern, CameraMovementDescriptor, AttackParticleDescriptor, ActiveItem, ItemMovementPattern } from '../arena/descriptorTypes';
import type { HitReaction, StatusEffect } from '../arena/types';

// ── Pre-computed data ───────────────────────────────────────

const ALL_CARDS = getAllCards();
const ALL_ITEMS = getAllItems();

const STATUS_BLUEPRINTS = Object.values(STATUS_REGISTRY).map((bp) => ({
  id: bp.id,
  displayName: bp.displayName,
  icon: bp.icon,
}));

// ── Workshop ────────────────────────────────────────────────

export const Workshop: React.FC = () => {
  // Model
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);

  // Visual filter
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Camera — increment trigger counter to re-fire via new descriptor ref
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [cameraTrigger, setCameraTrigger] = useState(0);

  // Status effects
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);

  // Items
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);

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

  // ── Derived ───────────────────────────────────────────────

  const cardEntry = ALL_CARDS[selectedCardIndex];
  const definition = cardEntry.definition;

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

  const handleSelectCard = useCallback((index: number) => {
    setSelectedCardIndex(index);
    setActiveStatuses([]);
    setActiveItems([]);
    setActiveFilter(null);
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

  const handleSelectFilter = useCallback((filter: string | null) => {
    setActiveFilter(filter);
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

  const handleToggleItem = useCallback((itemId: string) => {
    setActiveItems((prev) => {
      const exists = prev.find((ai) => ai.itemId === itemId);
      if (exists) return prev.filter((ai) => ai.itemId !== itemId);
      const desc = ALL_ITEMS.find((d) => d.id === itemId);
      return [...prev, { itemId, movement: desc?.defaultMovement ?? 'orbit' }];
    });
  }, []);

  const handleChangeItemMovement = useCallback((itemId: string, movement: ItemMovementPattern) => {
    setActiveItems((prev) =>
      prev.map((ai) => (ai.itemId === itemId ? { ...ai, movement } : ai)),
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

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <WorkshopPanel
        cards={ALL_CARDS}
        selectedCardIndex={selectedCardIndex}
        statusBlueprints={STATUS_BLUEPRINTS}
        allItems={ALL_ITEMS}
        activeItems={activeItems}
        activeFilter={activeFilter}
        activeStatuses={activeStatuses}
        isDancing={isDancing}
        isEvolving={isEvolving}
        isEvolved={isEvolved}
        glowEnabled={glowEnabled}
        glowColor={glowColor}
        glowRadius={glowRadius}
        activeAttackKey={activeAttackKey}
        attackMode={attackMode}
        onSelectCard={handleSelectCard}
        onSelectFilter={handleSelectFilter}
        onTriggerCamera={handleTriggerCamera}
        onToggleStatus={handleToggleStatus}
        onToggleItem={handleToggleItem}
        onChangeItemMovement={handleChangeItemMovement}
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
      />

      {/* Spacer for panel width */}
      <div style={{ width: 320, flexShrink: 0 }} />

      <WorkshopViewport
        definition={definition}
        visualFilter={activeFilter}
        manualCameraMovement={derivedCameraDesc}
        statusEffects={statusEffects}
        activeItems={activeItems}
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
      />
    </div>
  );
};
