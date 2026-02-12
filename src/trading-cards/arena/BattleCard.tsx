import React, { useState, useRef, useEffect } from 'react';
import {
  CardShell,
  CardHeader,
  ArtWindow,
  AttackRow,
  AttackDivider,
  StatsBar,
  FlavorText,
  CardFooter,
} from '../components';
import { ModelScene } from '../effects';
import { holoAngle, attacksShimmer, defaultCardShadow } from '../styles/holo';
import { computeCardShake } from '../engines/cardShakeEngine';
import { computeGlowShadow } from '../engines/glowEngine';
import type { PlayerState, BattlePhase } from './types';

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
  const { entry, currentHp, maxHp, activeAttack, hitReaction, animationElapsed, statusEffects } = player;
  const { cardData, attackKeys } = entry;
  const { definition } = entry;

  const isCubed = statusEffects.some((e) => e.type === 'cube' && e.expiresAt > Date.now());
  const canSelect = isActiveTurn && phase === 'selecting' && !statusEffects.some((e) => e.preventsAttack && e.expiresAt > Date.now());

  // Use engines for card effects
  let cardTransform: string | undefined;
  let cardShadow = defaultCardShadow;

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

  const attacksAngle = holoAngle(frame, fps, 0.83);

  return (
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
      >
        <ModelScene
          definition={definition}
          activeAttack={activeAttack}
          hitReaction={hitReaction}
          isCubed={isCubed}
          debug
        />
      </ArtWindow>

      {/* Attacks section */}
      <div
        style={{
          background: 'rgba(245,242,230,0.7)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 3,
          padding: '4px 8px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 0,
          position: 'relative',
          overflow: 'hidden',
          marginTop: 3,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-80%',
            background: attacksShimmer(attacksAngle),
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {cardData.attacks.map((atk, i) => (
          <React.Fragment key={i}>
            {i > 0 && <AttackDivider />}
            <div
              onClick={() => canSelect && onSelectAttack(i)}
              style={{ cursor: canSelect ? 'pointer' : 'default' }}
            >
              <AttackRow
                attack={atk}
                isActive={activeAttack === attackKeys[i]}
                disabled={!canSelect}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      <StatsBar
        frame={frame}
        fps={fps}
        weakness={cardData.weakness}
        resistance={cardData.resistance}
        retreatCost={cardData.retreatCost}
      />
      <FlavorText frame={frame} fps={fps} text={cardData.flavorText} />
      <CardFooter illustrator={cardData.illustrator} cardNumber={cardData.cardNumber} />
    </CardShell>
  );
};
