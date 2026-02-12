import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { playAttackSound, playVoiceLineFromDescriptor } from '../engines/synthEngine';
import { getCard } from '../arena/cardRegistry';

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

interface StandaloneCardProps {
  cardId: string;
}

export const StandaloneCard: React.FC<StandaloneCardProps> = ({ cardId }) => {
  const entry = getCard(cardId);
  const { definition } = entry;
  const { cardData, attackKeys, attackDurations } = definition;

  const { frame, fps } = useAnimationFrame();
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [cardEffect, setCardEffect] = useState<string | null>(null);
  const isAnimating = useRef(false);
  const attackStartTime = useRef(0);
  const [attackElapsed, setAttackElapsed] = useState(0);

  useEffect(() => {
    if (!activeAttack) {
      setAttackElapsed(0);
      return;
    }
    let id: number;
    const tick = () => {
      setAttackElapsed((performance.now() - attackStartTime.current) / 1000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [activeAttack]);

  const triggerAttack = useCallback(
    (attack: string) => {
      if (isAnimating.current || !attack) return;
      isAnimating.current = true;
      attackStartTime.current = performance.now();
      setActiveAttack(attack);
      setCardEffect(attack);

      // Play sound and voice line from descriptor
      const effectConfig = definition.attackEffects[attack];
      if (effectConfig) {
        playAttackSound(effectConfig.audio);
        playVoiceLineFromDescriptor(effectConfig.voiceLine);
      }

      setTimeout(() => {
        setActiveAttack(null);
        setCardEffect(null);
        isAnimating.current = false;
      }, attackDurations[attack]);
    },
    [definition, attackDurations],
  );

  // Card-level effects from engines
  let cardTransform: string | undefined;
  let cardShadow = defaultCardShadow;

  if (cardEffect) {
    const config = definition.attackEffects[cardEffect];
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

  const attacksAngle = holoAngle(frame, fps, 0.83);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
      }}
    >
      <CardShell frame={frame} fps={fps} boxShadow={cardShadow} transform={cardTransform}>
        <CardHeader
          frame={frame}
          fps={fps}
          stage={cardData.stage}
          name={cardData.name}
          hp={cardData.hp}
          type={cardData.type}
        />

        <ArtWindow
          frame={frame}
          fps={fps}
          activeAttack={activeAttack}
          attackElapsed={attackElapsed}
          interactive
          cameraId={definition.cameraId}
          artGlowDescriptor={activeAttack ? definition.attackEffects[activeAttack]?.artGlow : undefined}
        >
          <ModelScene definition={definition} activeAttack={activeAttack} debug />
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
                onClick={() => triggerAttack(attackKeys[i])}
                style={{ cursor: 'pointer' }}
              >
                <AttackRow
                  attack={atk}
                  isActive={activeAttack === attackKeys[i]}
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
    </div>
  );
};
