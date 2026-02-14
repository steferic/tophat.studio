# Instant Transmission Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 4th attack to Dr. Pengo where he teleports into the opponent's card, strikes from behind, then returns.

**Architecture:** Arena state gains a `teleportAttacker` field set during `instant-transmission`. The attacker's PengoModel plays a vanish animation. The defender's ModelScene renders a `TeleportClone` component that loads the attacker's GLB, materializes behind the defender, delivers a chop, then fades out.

**Tech Stack:** React, Three.js, @react-three/fiber, @react-three/drei

---

### Task 1: Add teleport state to arena types

**Files:**
- Modify: `src/trading-cards/arena/types.ts:78-89` (ArenaState interface)

**Step 1: Add TeleportAttacker type and extend ArenaState**

In `types.ts`, add above `ArenaState`:

```ts
export interface TeleportAttacker {
  modelPath: string;
  side: Side;
}
```

Add to `ArenaState`:

```ts
export interface ArenaState {
  phase: BattlePhase;
  turn: Side;
  left: PlayerState;
  right: PlayerState;
  lastDamage: DamageEvent | null;
  lastDamageTarget: Side | null;
  turnNumber: number;
  winner: Side | null;
  teleportAttacker: TeleportAttacker | null;
}
```

**Step 2: Build to verify no type errors**

Run: `npx vite build --config vite.config.cards.ts`
Expected: Build succeeds (reducer already spreads state, `teleportAttacker` needs init)

This will fail because `createInitialState` doesn't set the new field. Fix in Task 2.

---

### Task 2: Update reducer to handle teleport state

**Files:**
- Modify: `src/trading-cards/arena/reducer.ts`

**Step 1: Add `teleportAttacker: null` to `createInitialState`**

In `createInitialState`, add to the return object:

```ts
teleportAttacker: null,
```

**Step 2: Set `teleportAttacker` in `SELECT_ATTACK` case**

After computing `lastDamage`, before the return statement, add detection:

```ts
const isTeleport = attackKey === 'instant-transmission';
const teleportAttacker = isTeleport
  ? { modelPath: attacker.entry.definition.model.modelPath, side: state.turn }
  : null;
```

Add `teleportAttacker` to the returned state object.

**Step 3: Clear `teleportAttacker` in `ATTACK_ANIMATION_COMPLETE` case**

Add `teleportAttacker: null` to both return paths (skipHitAnimation and normal).

**Step 4: Clear `teleportAttacker` in `REMATCH` case**

Already handled since `createInitialState` returns `teleportAttacker: null`.

**Step 5: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 3: Pass teleportAttacker through Arena → BattleCard → ModelScene

**Files:**
- Modify: `src/trading-cards/arena/Arena.tsx`
- Modify: `src/trading-cards/arena/BattleCard.tsx:20-24` (BattleCardProps)
- Modify: `src/trading-cards/effects/ModelScene.tsx:79-90` (ModelSceneProps)

**Step 1: Update BattleCardProps**

Add to the interface:

```ts
teleportAttacker?: { modelPath: string; side: 'left' | 'right' } | null;
```

Destructure it in the component. Pass to `ModelScene`:

```tsx
<ModelScene
  ...existing props...
  teleportAttacker={teleportAttacker}
/>
```

**Step 2: Update ModelSceneProps**

Add to the interface:

```ts
teleportAttacker?: { modelPath: string; side: 'left' | 'right' } | null;
```

Destructure with default `null`.

**Step 3: Update Arena.tsx**

Pass `state.teleportAttacker` to both BattleCards:

```tsx
<BattleCard
  ...existing props...
  teleportAttacker={state.teleportAttacker}
/>
```

**Step 4: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 4: Create TeleportClone component

**Files:**
- Create: `src/trading-cards/effects/TeleportClone.tsx`

**Step 1: Write the component**

```tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';

interface TeleportCloneProps {
  modelPath: string;
  /** Seconds elapsed since the attack started */
  attackElapsed: number;
}

/**
 * Renders a clone of the attacker's model inside the defender's scene.
 * Materializes behind the defender, delivers a chop, then fades out.
 *
 * Timeline (relative to attack start):
 *   0.0–0.4s  invisible (attacker vanishing in own card)
 *   0.4–0.9s  materialize behind defender (scale 0→1, opacity 0→1)
 *   0.9–1.3s  chop strike (lunge forward + slam down)
 *   1.3–1.8s  fade out (opacity 1→0, scale 1→0)
 */
export const TeleportClone: React.FC<TeleportCloneProps> = ({ modelPath, attackElapsed }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(modelPath);
  const { centerOffset } = useModelBounds(scene);

  const cloneScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const origMat = mesh.material as THREE.MeshStandardMaterial;
        if (origMat.isMeshStandardMaterial) {
          const mat = origMat.clone();
          mat.transparent = true;
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = attackElapsed;

    // Before materialization — invisible
    if (t < 0.4) {
      groupRef.current.scale.setScalar(0);
      return;
    }

    // Materialize (0.4–0.9s)
    if (t < 0.9) {
      const p = (t - 0.4) / 0.5;
      const ease = p * p * (3 - 2 * p); // smoothstep
      groupRef.current.scale.setScalar(14 * ease);
      groupRef.current.position.set(0, 0, -3); // behind defender
      groupRef.current.rotation.y = Math.PI; // facing forward
      // Fade in
      cloneScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.opacity = ease;
        }
      });
      return;
    }

    // Chop strike (0.9–1.3s)
    if (t < 1.3) {
      const p = (t - 0.9) / 0.4;
      groupRef.current.scale.setScalar(14);
      // Lunge forward (toward defender) then slam down
      const lunge = Math.sin(p * Math.PI) * 2;
      groupRef.current.position.set(0, -p * 1.5, -3 + lunge);
      groupRef.current.rotation.y = Math.PI;
      groupRef.current.rotation.x = -p * 0.6; // chop tilt
      // Full opacity
      cloneScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 1;
        }
      });
      return;
    }

    // Fade out (1.3–1.8s)
    if (t < 1.8) {
      const p = (t - 1.3) / 0.5;
      const ease = 1 - p;
      groupRef.current.scale.setScalar(14 * ease);
      groupRef.current.position.set(0, -1.5 * ease, -3);
      cloneScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = ease;
        }
      });
      return;
    }

    // After fade — invisible
    groupRef.current.scale.setScalar(0);
  });

  return (
    <group ref={groupRef} scale={0}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={cloneScene} />
      </group>
    </group>
  );
};
```

**Step 2: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS (component exists but isn't rendered yet)

---

### Task 5: Render TeleportClone in ModelScene

**Files:**
- Modify: `src/trading-cards/effects/ModelScene.tsx`

**Step 1: Import TeleportClone**

```ts
import { TeleportClone } from './TeleportClone';
```

**Step 2: Render when teleportAttacker is active on the defender's side**

The defender's ModelScene receives `teleportAttacker`. The defender is the card that is NOT `teleportAttacker.side`. Since each BattleCard passes its own player state, the defender's ModelScene needs to know if IT is the target.

We need to also pass the player's side so ModelScene can determine if it's the defender. Add `side?: 'left' | 'right'` to ModelSceneProps. Pass from BattleCard.

But simpler: the `teleportAttacker` prop is only relevant to the defender. So we can derive it: if `teleportAttacker` is set AND `teleportAttacker.side` does NOT match this card's side, render the clone. We need the card's side.

Add to `BattleCardProps` and `ModelSceneProps`: `side?: 'left' | 'right'`. Pass from Arena.

In ModelScene's render, before `<HoloLight />`:

```tsx
{teleportAttacker && side && teleportAttacker.side !== side && (
  <TeleportClone
    modelPath={teleportAttacker.modelPath}
    attackElapsed={/* need elapsed from arena */}
  />
)}
```

**The elapsed problem:** The defender's ModelScene needs the attacker's animation elapsed time. The attacker's `animationElapsed` is on `state[state.turn].animationElapsed`. We can pass this through as a prop: `teleportElapsed?: number`.

In Arena.tsx, compute and pass:

```ts
const teleportElapsed = state.teleportAttacker
  ? state[state.teleportAttacker.side].animationElapsed
  : 0;
```

Pass `teleportElapsed` through BattleCard → ModelScene → TeleportClone.

**Step 3: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 6: Add instant-transmission animation to PengoModel

**Files:**
- Modify: `src/trading-cards/effects/PengoModel.tsx:166-175` (after inferno attack block)

**Step 1: Add the vanish + reappear animation**

After the `inferno` else-if block, add:

```ts
} else if (activeAttack === 'instant-transmission') {
  // Vanish phase (0–0.6s): flash white, shrink to nothing
  if (elapsed < 0.6) {
    const p = elapsed / 0.6;
    const flash = Math.sin(p * Math.PI * 4) * (1 - p) * 2;
    groupRef.current.scale.setScalar(targetScale * (1 - p));
    groupRef.current.position.y = flash;
    groupRef.current.rotation.y = elapsed * 15;
  }
  // Gone phase (0.6–1.6s): invisible, attacking in opponent's card
  else if (elapsed < 1.6) {
    groupRef.current.scale.setScalar(0);
  }
  // Reappear phase (1.6–2.0s): materialize back
  else {
    const p = Math.min((elapsed - 1.6) / 0.4, 1);
    const ease = p * p * (3 - 2 * p);
    groupRef.current.scale.setScalar(targetScale * ease);
    groupRef.current.position.y = (1 - ease) * 1;
    groupRef.current.rotation.y = (1 - ease) * 3;
  }
}
```

**Step 2: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 7: Add instant-transmission to pengo card definition

**Files:**
- Modify: `src/trading-cards/cards/definitions/pengo.ts`

**Step 1: Add 4th attack to cardData.attacks array**

```ts
{
  name: 'Instant Transmission',
  energyCost: ['water', 'colorless'],
  damage: 120,
  description: 'Teleport behind the opponent and strike from within their domain.',
},
```

**Step 2: Add to attackKeys**

```ts
attackKeys: ['ice-slide', 'glacier-crush', 'inferno', 'instant-transmission'],
```

**Step 3: Add to attackDurations**

```ts
'instant-transmission': 2000,
```

**Step 4: Add to attackEffects**

```ts
'instant-transmission': {
  cardShake: { pattern: 'pulse', duration: 2.0, intensity: 0.6 },
  cardGlow: {
    color: [100, 200, 255],
    radius: 40,
    maxOpacity: 0.5,
    fadeProfile: 'hold-then-fade',
    layers: [
      { color: [255, 255, 255], radius: 20, maxOpacity: 0.7 },
    ],
  },
  artGlow: {
    color: [100, 200, 255],
    radius: 50,
    maxOpacity: 0.6,
    fadeIn: 0.1,
    holdDuration: 0.5,
    fadeOut: 1.0,
  },
  audio: { type: 'synth', synthPreset: 'ice-slide' },
},
```

**Step 5: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 8: Adjust hit reaction timing for instant-transmission

**Files:**
- Modify: `src/trading-cards/arena/useArenaTimers.ts`

**Step 1: Use later hit delay for teleport attacks**

The default `HIT_REACTION_DELAY` is 1000ms. For instant-transmission, the chop lands at ~1200ms. Change the hit delay calculation:

In the `animating-attack` phase block, where `hitDelay` is computed:

```ts
const hitDelay = attackKey === 'instant-transmission'
  ? 1200
  : Math.min(HIT_REACTION_DELAY, duration - 300);
```

**Step 2: Build to verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 9: Wire side prop through Arena → BattleCard → ModelScene

**Files:**
- Modify: `src/trading-cards/arena/Arena.tsx`
- Modify: `src/trading-cards/arena/BattleCard.tsx`
- Modify: `src/trading-cards/effects/ModelScene.tsx`

**Step 1: Add `side` and `teleportElapsed` to BattleCardProps**

```ts
interface BattleCardProps {
  player: PlayerState;
  isActiveTurn: boolean;
  phase: BattlePhase;
  onSelectAttack: (attackIndex: number) => void;
  teleportAttacker?: { modelPath: string; side: 'left' | 'right' } | null;
  teleportElapsed?: number;
  side?: 'left' | 'right';
}
```

Pass `side`, `teleportAttacker`, and `teleportElapsed` to ModelScene.

**Step 2: Add to ModelSceneProps**

```ts
teleportAttacker?: { modelPath: string; side: 'left' | 'right' } | null;
teleportElapsed?: number;
side?: 'left' | 'right';
```

**Step 3: In Arena.tsx, pass all three**

```tsx
const teleportElapsed = state.teleportAttacker
  ? state[state.teleportAttacker.side].animationElapsed
  : 0;

<BattleCard
  player={state.left}
  ...
  side="left"
  teleportAttacker={state.teleportAttacker}
  teleportElapsed={teleportElapsed}
/>
<BattleCard
  player={state.right}
  ...
  side="right"
  teleportAttacker={state.teleportAttacker}
  teleportElapsed={teleportElapsed}
/>
```

**Step 4: In ModelScene, render TeleportClone conditionally**

```tsx
{teleportAttacker && side && teleportAttacker.side !== side && (
  <TeleportClone
    modelPath={teleportAttacker.modelPath}
    attackElapsed={teleportElapsed ?? 0}
  />
)}
```

**Step 5: Build and verify**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS

---

### Task 10: Final build verification

**Step 1: Clean build**

Run: `npx vite build --config vite.config.cards.ts`
Expected: PASS, no TS errors

**Step 2: Manual verification checklist**

- [ ] Open arena, play as Pengo
- [ ] Select "Instant Transmission" (4th attack)
- [ ] Pengo flashes and vanishes from his card (~0.6s)
- [ ] Pengo clone appears behind opponent in their card (~0.4–0.9s)
- [ ] Clone delivers chop strike (~0.9–1.3s)
- [ ] Opponent's hit reaction fires (~1.2s)
- [ ] Clone fades out (~1.3–1.8s)
- [ ] Pengo reappears in his own card (~1.6–2.0s)
- [ ] Other 3 attacks still work normally
- [ ] Opponent's attacks still work normally
