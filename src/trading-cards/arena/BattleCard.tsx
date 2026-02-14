import React, { useCallback } from 'react';
import { GameCard } from '../components';
import type { PlayerState, BattlePhase, TeleportAttacker } from './types';
import { effectPreventsAttack } from './reducer';

interface BattleCardProps {
  player: PlayerState;
  isActiveTurn: boolean;
  phase: BattlePhase;
  onSelectAttack: (attackIndex: number, isEvolved: boolean) => void;
  teleportAttacker?: TeleportAttacker | null;
  teleportElapsed?: number;
  side?: 'left' | 'right';
}

/**
 * Arena battle card wrapper — extracts state from PlayerState and
 * gates attack selection by turn/phase. All rendering is GameCard.
 */
export const BattleCard: React.FC<BattleCardProps> = ({
  player,
  isActiveTurn,
  phase,
  onSelectAttack,
  teleportAttacker = null,
  teleportElapsed = 0,
  side,
}) => {
  const { entry, currentHp, maxHp, activeAttack, hitReaction, animationElapsed, statusEffects, incomingParticles } = player;
  const { definition, attackKeys } = entry;

  const canSelect = isActiveTurn && phase === 'selecting' && !statusEffects.some(effectPreventsAttack);

  const handleClickAttack = useCallback(
    (key: string, isEvolved: boolean) => {
      const idx = attackKeys.indexOf(key);
      if (idx >= 0) onSelectAttack(idx, isEvolved);
    },
    [attackKeys, onSelectAttack],
  );

  return (
    <GameCard
      definition={definition}
      hp={currentHp}
      maxHp={maxHp}
      activeAttack={activeAttack}
      attackElapsed={animationElapsed}
      hitReaction={hitReaction}
      onClickAttack={canSelect ? handleClickAttack : undefined}
      attacksDisabled={!canSelect}
      statusEffects={statusEffects}
      incomingParticles={incomingParticles}
      teleportAttacker={teleportAttacker}
      teleportElapsed={teleportElapsed}
      side={side}
    />
  );
};
