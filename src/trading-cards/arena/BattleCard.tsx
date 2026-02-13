import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from '../components';
import { ModelScene } from '../effects';
import { computeCardShake } from '../engines/cardShakeEngine';
import { computeGlowShadow } from '../engines/glowEngine';
import type { PlayerState, BattlePhase } from './types';
import { CardThemeProvider } from '../styles/CardThemeContext';
import { resolveTheme } from '../styles/resolveTheme';

interface BattleCardProps {
  player: PlayerState;
  isActiveTurn: boolean;
  phase: BattlePhase;
  onSelectAttack: (attackIndex: number) => void;
}

function useAnimationFrame() {
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

/** HP bar that lerps smoothly toward target HP */
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

export const BattleCard: React.FC<BattleCardProps> = ({
  player,
  isActiveTurn,
  phase,
  onSelectAttack,
}) => {
  const { frame, fps } = useAnimationFrame();
  const { entry, currentHp, maxHp, activeAttack, hitReaction, animationElapsed, statusEffects, incomingParticles } = player;
  const { cardData, attackKeys } = entry;
  const { definition } = entry;
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);

  const handleEvolve = useCallback(() => {
    if (isEvolving || isEvolved) return;
    setIsDancing(false);
    setIsEvolving(true);
    setTimeout(() => {
      setIsEvolving(false);
      setIsEvolved(true);
    }, 2500);
  }, [isEvolving, isEvolved]);

  const theme = resolveTheme(definition);
  const isCubed = statusEffects.some((e) => e.type === 'cube' && e.expiresAt > Date.now());
  const canSelect = isActiveTurn && phase === 'selecting' && !statusEffects.some((e) => e.preventsAttack && e.expiresAt > Date.now());

  // Stop dancing/evolving when an attack plays
  useEffect(() => {
    if (activeAttack) {
      if (isDancing) setIsDancing(false);
      if (isEvolving) setIsEvolving(false);
    }
  }, [activeAttack, isDancing, isEvolving]);

  // Use engines for card effects
  let cardTransform: string | undefined;
  let cardShadow: string | undefined;

  if (activeAttack) {
    const config = definition.attackEffects[activeAttack];
    if (config) {
      const { transform } = computeCardShake(animationElapsed, config.cardShake);
      cardTransform = transform;
      cardShadow = computeGlowShadow(
        animationElapsed,
        config.cardShake.duration,
        config.cardGlow,
      );
    }
  }

  return (
    <CardThemeProvider theme={theme}>
      <CardShell frame={frame} fps={fps} boxShadow={cardShadow} transform={cardTransform}>
        <CardHeader
          frame={frame}
          fps={fps}
          stage={cardData.stage}
          name={cardData.name}
          hp={currentHp}
          type={cardData.type}
        />

        <HpBar current={currentHp} max={maxHp} />

        <ArtWindow
          frame={frame}
          fps={fps}
          activeAttack={activeAttack}
          attackElapsed={animationElapsed}
          interactive
          cameraId={entry.cameraId}
          artGlowDescriptor={activeAttack ? definition.attackEffects[activeAttack]?.artGlow : undefined}
          cameraMovement={activeAttack ? definition.attackEffects[activeAttack]?.camera : undefined}
        >
          <ModelScene
            definition={definition}
            activeAttack={activeAttack}
            hitReaction={hitReaction}
            isCubed={isCubed}
            isDancing={isDancing}
            isEvolving={isEvolving}
            isEvolved={isEvolved}
            incomingParticles={incomingParticles}
            debug
          />
        </ArtWindow>

        <AttacksSection
          frame={frame}
          fps={fps}
          attacks={cardData.attacks}
          attackKeys={attackKeys}
          activeAttack={activeAttack}
          onClickAttack={canSelect ? (key) => {
            const idx = attackKeys.indexOf(key);
            if (idx >= 0) onSelectAttack(idx);
          } : undefined}
          disabled={!canSelect}
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
        <CardFooter
          illustrator={cardData.illustrator}
          cardNumber={cardData.cardNumber}
          leftAction={
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
            </>
          }
        />
      </CardShell>
    </CardThemeProvider>
  );
};
