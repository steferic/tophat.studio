import React, { useReducer, useCallback } from 'react';
import { arenaReducer, createInitialState } from './reducer';
import { useArenaTimers } from './useArenaTimers';
import { useArenaAudio } from './useArenaAudio';
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

  useArenaTimers(state, dispatch);
  useArenaAudio(state);

  const handleLeftAttack = useCallback(
    (attackIndex: number) => dispatch({ type: 'SELECT_ATTACK', attackIndex }),
    [],
  );

  const handleRightAttack = useCallback(
    (attackIndex: number) => dispatch({ type: 'SELECT_ATTACK', attackIndex }),
    [],
  );

  const handleRematch = useCallback(
    () => dispatch({ type: 'REMATCH' }),
    [],
  );

  return (
    <>
      <ArenaLayout>
        <BattleCard
          player={state.left}
          isActiveTurn={state.turn === 'left'}
          phase={state.phase}
          onSelectAttack={handleLeftAttack}
        />

        <ArenaCenterHUD
          phase={state.phase}
          turn={state.turn}
          turnNumber={state.turnNumber}
          leftName={state.left.entry.cardData.name}
          rightName={state.right.entry.cardData.name}
          isActiveCubed={
            state[state.turn].statusEffects.some(
              (e) => e.preventsAttack && e.expiresAt > Date.now()
            )
          }
        />

        <BattleCard
          player={state.right}
          isActiveTurn={state.turn === 'right'}
          phase={state.phase}
          onSelectAttack={handleRightAttack}
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
