import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  CardShell,
  CardHeader,
  ArtWindow,
  AttacksSection,
  StatsBar,
  FlavorText,
  CardFooter,
  DanceButton,
  EvolveButton,
  StatusEffectButton,
  CameraEffectButton,
  VisualFilterButton,
} from './index';
import { CardBack } from './CardBack';
import { AudioEditorPanel } from './AudioEditorPanel';
import { ModelScene } from '../effects';
import { computeCardShake } from '../engines/cardShakeEngine';
import { computeGlowShadow } from '../engines/glowEngine';
import { getBlueprint, type StatusEffectBlueprint } from '../arena/statusRegistry';
import type { StatusEffect, HitReaction } from '../arena/types';
import type { CardDefinition, AttackParticleDescriptor, CameraPreset } from '../arena/descriptorTypes';
import type { TeleportAttacker } from '../arena/types';
import { CardThemeProvider } from '../styles/CardThemeContext';
import { resolveTheme } from '../styles/resolveTheme';

// ── Shared hooks ──────────────────────────────────────────

export function useAnimationFrame() {
  const [frame, setFrame] = useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    let id: number;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setFrame(Math.floor(elapsed * 60));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return { frame, fps: 60 };
}

// ── HP Bar ────────────────────────────────────────────────

const HpBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const [displayed, setDisplayed] = useState(current);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setDisplayed((prev) => {
        const diff = current - prev;
        if (Math.abs(diff) < 0.5) return current;
        return prev + diff * 0.08;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [current]);

  const pct = Math.max(0, displayed / max);
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';

  return (
    <div
      style={{
        width: '100%',
        height: 6,
        background: 'rgba(0,0,0,0.15)',
        borderRadius: 3,
        overflow: 'hidden',
        margin: '2px 0 4px',
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'background 0.3s',
        }}
      />
    </div>
  );
};

// ── Status Badges ─────────────────────────────────────────

const StatusBadges: React.FC<{ effects: StatusEffect[] }> = ({ effects }) => {
  const active = effects.filter((e) => e.expiresAt > Date.now());
  if (active.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 2, padding: '1px 4px', flexWrap: 'wrap' }}>
      {active.map((e) => {
        const bp = getBlueprint(e.blueprintId);
        return (
          <span
            key={e.blueprintId}
            title={`${bp.displayName}${e.stacks > 1 ? ` x${e.stacks}` : ''}`}
            style={{
              fontSize: 9,
              lineHeight: 1,
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 3,
              padding: '1px 3px',
              border: bp.visual.cardBorderColor
                ? `1px solid ${bp.visual.cardBorderColor}`
                : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {bp.icon}
            {e.stacks > 1 && <span style={{ marginLeft: 1 }}>{e.stacks}</span>}
          </span>
        );
      })}
    </div>
  );
};

// ── GameCard ──────────────────────────────────────────────

export interface GameCardProps {
  definition: CardDefinition;
  /** Displayed HP value */
  hp: number;
  /** If provided, shows animated HP bar (for arena) */
  maxHp?: number;
  /** Current attack animation key */
  activeAttack: string | null;
  /** Seconds since attack started */
  attackElapsed: number;
  /** Hit reaction on this card's model */
  hitReaction?: HitReaction;
  /** Called when an attack row is clicked. If undefined, attacks are non-interactive. */
  onClickAttack?: (attackKey: string, isEvolved: boolean) => void;
  /** Grey out attacks (turn not yours, blocked, etc.) */
  attacksDisabled?: boolean;
  /** External status effects (from arena reducer). Merged with local FX-button effects. */
  statusEffects?: StatusEffect[];
  /** Incoming particle effects from opponent's attack */
  incomingParticles?: AttackParticleDescriptor[];
  /** Teleporting attacker clone to render */
  teleportAttacker?: TeleportAttacker | null;
  teleportElapsed?: number;
  side?: 'left' | 'right';
}

/**
 * The single card renderer used everywhere — standalone pages and arena battles.
 * All visual features live here. Wrappers only provide state.
 */
export const GameCard: React.FC<GameCardProps> = ({
  definition,
  hp,
  maxHp,
  activeAttack,
  attackElapsed,
  hitReaction = null,
  onClickAttack,
  attacksDisabled = false,
  statusEffects: externalEffects = [],
  incomingParticles = [],
  teleportAttacker = null,
  teleportElapsed = 0,
  side,
}) => {
  const { cardData, attackKeys } = definition;
  const { frame, fps } = useAnimationFrame();
  const theme = resolveTheme(definition);

  // ── Local state (same in all contexts) ──
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);
  const [localEffects, setLocalEffects] = useState<StatusEffect[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [manualCamera, setManualCamera] = useState<string | null>(null);
  const [visualFilter, setVisualFilter] = useState<string | null>(null);
  const [manualCameraTrigger, setManualCameraTrigger] = useState(0);

  const handleEvolve = useCallback(() => {
    if (isEvolving || isEvolved) return;
    setIsDancing(false);
    setIsEvolving(true);
    setTimeout(() => {
      setIsEvolving(false);
      setIsEvolved(true);
    }, 2500);
  }, [isEvolving, isEvolved]);

  const handleApplyEffect = useCallback((bp: StatusEffectBlueprint) => {
    const now = Date.now();
    setLocalEffects((prev) => {
      const existing = prev.find((e) => e.blueprintId === bp.id && e.expiresAt > now);
      if (existing) {
        const maxStacks = bp.maxStacks ?? 99;
        return prev.map((e) =>
          e === existing
            ? {
                ...e,
                stacks: bp.stackable ? Math.min(e.stacks + 1, maxStacks) : e.stacks,
                expiresAt: now + bp.defaultDurationMs,
              }
            : e,
        );
      }
      return [
        ...prev.filter((e) => e.expiresAt > now),
        {
          blueprintId: bp.id,
          expiresAt: now + bp.defaultDurationMs,
          appliedAt: now,
          stacks: 1,
          lastTickAt: now,
        },
      ];
    });
  }, []);

  const handleCameraSelect = useCallback((preset: string | null) => {
    setManualCamera(preset);
    setManualCameraTrigger((n) => n + 1);
  }, []);

  // Build manual camera descriptor — new object identity on each trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const manualCameraMovement = useMemo(
    () => manualCamera ? { preset: manualCamera as CameraPreset, intensity: 1 } : null,
    [manualCamera, manualCameraTrigger],
  );

  // Wrap attack callback so it includes evolved state
  const wrappedClickAttack = useCallback(
    (key: string) => onClickAttack?.(key, isEvolved),
    [onClickAttack, isEvolved],
  );

  // Stop dancing/evolving when an attack plays
  useEffect(() => {
    if (activeAttack) {
      if (isDancing) setIsDancing(false);
      if (isEvolving) setIsEvolving(false);
    }
  }, [activeAttack, isDancing, isEvolving]);

  // ── Merge external + local effects ──
  const allEffects = [...externalEffects, ...localEffects];
  const isCubed = allEffects.some((e) => e.blueprintId === 'cube' && e.expiresAt > Date.now());

  // ── Card shake & glow from attack ──
  let cardTransform: string | undefined;
  let cardShadow: string | undefined;

  if (activeAttack) {
    const config = definition.attackEffects[activeAttack];
    if (config) {
      const { transform } = computeCardShake(attackElapsed, config.cardShake);
      cardTransform = transform;
      cardShadow = computeGlowShadow(
        attackElapsed,
        config.cardShake.duration,
        config.cardGlow,
      );
    }
  }

  // Status effect border glow (when no attack animation)
  if (!cardShadow) {
    const now = Date.now();
    const borderColors = allEffects
      .filter((e) => e.expiresAt > now)
      .map((e) => getBlueprint(e.blueprintId).visual.cardBorderColor)
      .filter(Boolean) as string[];
    if (borderColors.length > 0) {
      cardShadow = borderColors
        .map((c, i) => `0 0 ${6 + i * 3}px ${c}`)
        .join(', ');
    }
  }

  const flipButton = (
    <button
      onClick={() => setFlipped((f) => !f)}
      title={flipped ? 'Show front' : 'Show back'}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: flipped ? 'rgba(255,215,0,0.35)' : 'rgba(255,215,0,0.15)',
        color: '#e8d44d',
        cursor: 'pointer',
        transition: 'background 0.15s',
        lineHeight: 1.6,
      }}
    >
      FLIP
    </button>
  );

  return (
    <CardThemeProvider theme={theme}>
      <div style={{ perspective: 1200 }}>
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease-in-out',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: flipped ? 'none' : 'auto',
            }}
          >
            <div style={{ position: 'relative' }}>
              {/* Mic toggle — overlaid in top-right corner */}
              <button
                onClick={() => setEditorMode((m) => !m)}
                title={editorMode ? 'Back to card' : 'Voice recordings'}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 10,
                  padding: '2px 6px',
                  fontSize: 9,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 4,
                  background: editorMode ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)',
                  color: editorMode ? '#f87171' : '#ccc',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                }}
              >
                REC
              </button>

              <CardShell frame={frame} fps={fps} boxShadow={cardShadow} transform={cardTransform}>
                <CardHeader
                  frame={frame}
                  fps={fps}
                  stage={cardData.stage}
                  name={cardData.name}
                  hp={hp}
                  type={cardData.type}
                />

                {editorMode && !flipped ? (
                  <AudioEditorPanel cardId={definition.id} />
                ) : (
                  <>
                    {maxHp != null && <HpBar current={hp} max={maxHp} />}

                    <StatusBadges effects={allEffects} />

                    <ArtWindow
                      frame={frame}
                      fps={fps}
                      activeAttack={activeAttack}
                      attackElapsed={attackElapsed}
                      interactive
                      cameraId={definition.cameraId}
                      artGlowDescriptor={activeAttack ? definition.attackEffects[activeAttack]?.artGlow : undefined}
                      cameraMovement={activeAttack ? definition.attackEffects[activeAttack]?.camera : undefined}
                      visualFilter={visualFilter}
                      manualCameraMovement={manualCameraMovement}
                    >
                      <ModelScene
                        definition={definition}
                        activeAttack={activeAttack}
                        hitReaction={hitReaction}
                        statusEffects={allEffects}
                        isCubed={isCubed}
                        isDancing={isDancing}
                        isEvolving={isEvolving}
                        isEvolved={isEvolved}
                        incomingParticles={incomingParticles}
                        teleportAttacker={teleportAttacker}
                        teleportElapsed={teleportElapsed}
                        side={side}
                        debug
                      />
                    </ArtWindow>

                    <AttacksSection
                      frame={frame}
                      fps={fps}
                      attacks={cardData.attacks}
                      attackKeys={attackKeys}
                      activeAttack={activeAttack}
                      onClickAttack={onClickAttack ? wrappedClickAttack : undefined}
                      disabled={attacksDisabled}
                      style={{ marginTop: 3 }}
                    />

                    <StatsBar
                      frame={frame}
                      fps={fps}
                      weakness={cardData.weakness}
                      resistance={cardData.resistance}
                      retreatCost={cardData.retreatCost}
                    />
                    <FlavorText frame={frame} fps={fps} text={cardData.flavorText} />
                  </>
                )}

                <CardFooter
                  illustrator={cardData.illustrator}
                  cardNumber={cardData.cardNumber}
                  leftAction={
                    editorMode ? null : (
                      <>
                        <DanceButton
                          danceSong={definition.danceSong}
                          isDancing={isDancing}
                          onToggle={setIsDancing}
                        />
                        <EvolveButton
                          canEvolve={!isEvolved}
                          isEvolving={isEvolving}
                          onEvolve={handleEvolve}
                        />
                        <StatusEffectButton onApply={handleApplyEffect} />
                        <CameraEffectButton onSelect={handleCameraSelect} />
                        <VisualFilterButton onSelect={setVisualFilter} />
                      </>
                    )
                  }
                  rightAction={editorMode ? null : flipButton}
                />
              </CardShell>
            </div>
          </div>

          {/* Back face */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardBack onFlip={() => setFlipped(false)} />
          </div>
        </div>
      </div>
    </CardThemeProvider>
  );
};
