import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { playAttackSound, playVoiceLineFromDescriptor } from '../engines/synthEngine';
import { getCard } from '../arena/cardRegistry';
import { CardThemeProvider } from '../styles/CardThemeContext';
import { resolveTheme } from '../styles/resolveTheme';

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

  const theme = resolveTheme(definition);
  const { frame, fps } = useAnimationFrame();
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [cardEffect, setCardEffect] = useState<string | null>(null);
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);
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

  const handleEvolve = useCallback(() => {
    if (isEvolving || isEvolved) return;
    setIsDancing(false);
    setIsEvolving(true);
    setTimeout(() => {
      setIsEvolving(false);
      setIsEvolved(true);
    }, 2500);
  }, [isEvolving, isEvolved]);

  const triggerAttack = useCallback(
    (attack: string) => {
      if (isAnimating.current || !attack) return;
      // Stop dancing and evolving when an attack is triggered
      setIsDancing(false);
      setIsEvolving(false);
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
  let cardShadow: string | undefined;

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
      <CardThemeProvider theme={theme}>
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
            cameraMovement={activeAttack ? definition.attackEffects[activeAttack]?.camera : undefined}
          >
            <ModelScene definition={definition} activeAttack={activeAttack} isDancing={isDancing} isEvolving={isEvolving} isEvolved={isEvolved} debug />
          </ArtWindow>

          <AttacksSection
            frame={frame}
            fps={fps}
            attacks={cardData.attacks}
            attackKeys={attackKeys}
            activeAttack={activeAttack}
            onClickAttack={triggerAttack}
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
    </div>
  );
};
