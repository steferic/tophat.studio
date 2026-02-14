# Instant Transmission — Design

## Overview

New 4th attack for Dr. Pengo: "Instant Transmission". Pengo vanishes from his own card's 3D scene and a full 3D clone materializes inside the opponent's card behind the defender, delivers a quick chop/slam, then fades out. Pengo reappears in his own card.

## Timeline (~2s total)

```
0.0s  ─── Pengo flash + shrink (own card)
0.6s  ─── Pengo gone (scale 0)
0.4s  ─── Clone starts materializing in opponent's card (behind defender)
1.2s  ─── Clone fully visible, chop strike
1.3s  ─── Hit reaction fires on defender
1.6s  ─── Clone fades out from opponent's card
1.6s  ─── Pengo reappears in own card (scale back up)
2.0s  ─── Attack complete
```

## Architecture

### New Arena State

Add `teleportAttacker` to `ArenaState`:

```ts
teleportAttacker: {
  modelPath: string;     // 'models/pengoo.glb'
  side: Side;            // which side is the attacker
} | null;
```

Set on `SELECT_ATTACK` when the chosen attack key is `instant-transmission`. Cleared on `ATTACK_ANIMATION_COMPLETE`.

### Data Flow

```
Arena (state.teleportAttacker)
  ├── BattleCard (attacker) → knows to play vanish via activeAttack='instant-transmission'
  └── BattleCard (defender) → receives teleportAttacker prop
        └── ModelScene → receives teleportAttacker prop
              └── TeleportClone component renders attacker's GLB behind defender
```

### New Component: TeleportClone

Lives in `effects/TeleportClone.tsx`. Renders inside the defender's `ModelScene`.

- Loads the attacker's GLB via `useGLTF(modelPath)`
- Positioned behind the defender (z offset, facing forward)
- Animation phases: materialize (scale 0→1, opacity 0→1) → chop motion → fade out
- Uses `useFrame` for all animation, same pattern as model components

### Modified Files

1. **`arena/types.ts`** — Add `teleportAttacker` to `ArenaState`, add `TeleportAttacker` type
2. **`arena/reducer.ts`** — Set/clear `teleportAttacker` in SELECT_ATTACK and ATTACK_ANIMATION_COMPLETE
3. **`arena/Arena.tsx`** — Pass `teleportAttacker` to both BattleCards
4. **`arena/BattleCard.tsx`** — Accept + pass `teleportAttacker` to ModelScene
5. **`effects/ModelScene.tsx`** — Accept `teleportAttacker`, render `TeleportClone` when active
6. **`effects/TeleportClone.tsx`** — New component: load GLB, animate materialize→chop→fade
7. **`effects/PengoModel.tsx`** — Add `instant-transmission` animation (vanish + reappear)
8. **`cards/definitions/pengo.ts`** — Add 4th attack definition with effects
9. **`arena/useArenaTimers.ts`** — Hit reaction delay for instant-transmission should be later (~1300ms) since the hit happens in the opponent's card

### Pengo Card Data Addition

```ts
{
  name: 'Instant Transmission',
  energyCost: ['water', 'colorless'],
  damage: 120,
  description: 'Teleport behind the opponent and strike from within their domain.',
}
```

Attack key: `'instant-transmission'`
Duration: `2000`ms
