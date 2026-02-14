import React, { useReducer, useCallback, useEffect } from 'react';
import { arenaReducer, createInitialState, effectPreventsAttack } from './reducer';
import { useArenaTimers } from './useArenaTimers';
import { useArenaAudio } from './useArenaAudio';
import { loadCardRecordings } from '../audio/recordingStore';
import { PENGO_ENTRY, ROSALIND_ENTRY } from './cardRegistry';
import { ArenaLayout } from './ArenaLayout';
import { BattleCard } from './BattleCard';
import { ArenaCenterHUD } from './ArenaCenterHUD';
import { FloatingDamage } from './FloatingDamage';
import { GameOverOverlay } from './GameOverOverlay';

export const Arena: React.FC = () => {
  const [state, dispatch] = useReducer(
    arenaReducer,
    { left: PENGO_ENTRY, right: ROSALIND_ENTRY },
    ({ left, right }) => createInitialState(left, right),
  );

  useEffect(() => {
    loadCardRecordings(PENGO_ENTRY.definition.id);
    loadCardRecordings(ROSALIND_ENTRY.definition.id);
  }, []);

  useArenaTimers(state, dispatch);
  useArenaAudio(state);

  const handleLeftAttack = useCallback(
    (attackIndex: number, isEvolved: boolean) => dispatch({ type: 'SELECT_ATTACK', attackIndex, isEvolved }),
    [],
  );

  const handleRightAttack = useCallback(
    (attackIndex: number, isEvolved: boolean) => dispatch({ type: 'SELECT_ATTACK', attackIndex, isEvolved }),
    [],
  );

  const handleRematch = useCallback(
    () => dispatch({ type: 'REMATCH' }),
    [],
  );

  const teleportElapsed = state.teleportAttacker
    ? state[state.teleportAttacker.side].animationElapsed
    : 0;

  return (
    <>
      <ArenaLayout>
        <BattleCard
          player={state.left}
          isActiveTurn={state.turn === 'left'}
          phase={state.phase}
          onSelectAttack={handleLeftAttack}
          side="left"
          teleportAttacker={state.teleportAttacker}
          teleportElapsed={teleportElapsed}
        />

        <ArenaCenterHUD
          phase={state.phase}
          turn={state.turn}
          turnNumber={state.turnNumber}
          leftName={state.left.entry.cardData.name}
          rightName={state.right.entry.cardData.name}
          isActiveCubed={
            state[state.turn].statusEffects.some(effectPreventsAttack)
          }
        />

        <BattleCard
          player={state.right}
          isActiveTurn={state.turn === 'right'}
          phase={state.phase}
          onSelectAttack={handleRightAttack}
          side="right"
          teleportAttacker={state.teleportAttacker}
          teleportElapsed={teleportElapsed}
        />
      </ArenaLayout>

      <FloatingDamage
        damage={state.lastDamage}
        target={state.lastDamageTarget}
        phase={state.phase}
      />

      <GameOverOverlay
        winner={state.phase === 'game-over' ? state.winner : null}
        leftName={state.left.entry.cardData.name}
        rightName={state.right.entry.cardData.name}
        onRematch={handleRematch}
      />
    </>
  );
};
