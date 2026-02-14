import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCard } from '../components';
import { playAttackSound, playVoiceLineOrCustom } from '../engines/synthEngine';
import { loadCardRecordings } from '../audio/recordingStore';
import { getCard } from '../arena/cardRegistry';

interface StandaloneCardProps {
  cardId: string;
}

/**
 * Standalone card wrapper — manages its own attack timing and sound.
 * All rendering is delegated to GameCard.
 */
export const StandaloneCard: React.FC<StandaloneCardProps> = ({ cardId }) => {
  const entry = getCard(cardId);
  const { definition } = entry;
  const { cardData, attackDurations } = definition;

  useEffect(() => { loadCardRecordings(cardId); }, [cardId]);

  const [activeAttack, setActiveAttack] = useState<string | null>(null);
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
    (attack: string, _isEvolved: boolean) => {
      if (isAnimating.current || !attack) return;
      isAnimating.current = true;
      attackStartTime.current = performance.now();
      setActiveAttack(attack);

      const effectConfig = definition.attackEffects[attack];
      if (effectConfig) {
        playAttackSound(effectConfig.audio);
        playVoiceLineOrCustom(cardId, effectConfig.voiceLine);
      }

      setTimeout(() => {
        setActiveAttack(null);
        isAnimating.current = false;
      }, attackDurations[attack]);
    },
    [definition, attackDurations],
  );

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
      <GameCard
        definition={definition}
        hp={cardData.hp}
        activeAttack={activeAttack}
        attackElapsed={attackElapsed}
        onClickAttack={triggerAttack}
      />
    </div>
  );
};
