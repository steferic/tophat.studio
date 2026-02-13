import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';

import type { ModelComponentProps } from '../arena/descriptorTypes';

const MULTIPLY_CLONE_COUNT = 6;
const BASE_SCALE = 14;
const CLONE_SCALE = BASE_SCALE * 0.65;
const ORBIT_RADIUS = 6;

/** Clone a GLTF scene and apply Evil Pengo dark material overrides */
function darkenClone(original: THREE.Object3D): THREE.Object3D {
  const clone = original.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const origMat = mesh.material as THREE.MeshStandardMaterial;
      if (origMat.isMeshStandardMaterial) {
        const mat = origMat.clone();
        mat.color.multiplyScalar(0.25);
        mat.emissive.setRGB(0.12, 0.0, 0.18);
        mat.emissiveIntensity = 0.6;
        mat.roughness = Math.min(1, mat.roughness + 0.3);
        mesh.material = mat;
      }
    }
  });
  return clone;
}

const TROPHY_ORBIT_RADIUS = 3.5;
const TROPHY_SCALE = 0.25;

export const EvilPengoModel: React.FC<ModelComponentProps> = ({ activeAttack, hitReaction, isCubed, isDancing, isEvolving: _isEvolving, isEvolved: _isEvolved, debug, animatedGroupRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  if (animatedGroupRef) animatedGroupRef.current = groupRef.current;
  const cloneGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const appleRef = useRef<THREE.Group>(null!);
  const fishRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('models/pengoo.glb');
  const { scene: appleScene } = useGLTF('models/apple.glb');
  const { scene: fishScene } = useGLTF('models/filet-o-fish.glb');
  const attackStart = useRef(0);
  const hitStart = useRef(0);
  const multiplyActivated = useRef(false);

  const { centerOffset, boxSize } = useModelBounds(scene);

  const darkScene = useMemo(() => darkenClone(scene), [scene]);
  const darkApple = useMemo(() => darkenClone(appleScene), [appleScene]);
  const darkFish = useMemo(() => darkenClone(fishScene), [fishScene]);
  const multiplyClones = useMemo(
    () => Array.from({ length: MULTIPLY_CLONE_COUNT }, () => darkenClone(scene)),
    [scene],
  );

  // Track when multiply is first used (persists across renders)
  if (activeAttack === 'multiply' && !multiplyActivated.current) {
    multiplyActivated.current = true;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // ── Update multiply clones ──────────────────────────────
    cloneGroupRefs.current.forEach((ref, i) => {
      if (!ref) return;
      if (!multiplyActivated.current) {
        ref.visible = false;
        return;
      }
      ref.visible = true;
      const baseAngle = (i / MULTIPLY_CLONE_COUNT) * Math.PI * 2;

      if (activeAttack === 'multiply' && attackStart.current > 0) {
        const elapsed = t - attackStart.current;
        const phase = Math.min(elapsed / 2.0, 1);

        if (phase < 0.4) {
          // Emerge from center, scale up from zero
          const emerge = phase / 0.4;
          const radius = emerge * 3;
          ref.position.set(
            Math.cos(baseAngle + elapsed * 4) * radius,
            Math.sin(elapsed * 8 + i) * emerge * 0.5,
            Math.sin(baseAngle + elapsed * 4) * radius,
          );
          ref.scale.setScalar(CLONE_SCALE * emerge);
          ref.rotation.y = baseAngle + elapsed * 5;
        } else if (phase < 0.75) {
          // Expand outward to orbit radius
          const expand = (phase - 0.4) / 0.35;
          const radius = 3 + expand * (ORBIT_RADIUS - 3);
          ref.position.set(
            Math.cos(baseAngle + t * 2) * radius,
            Math.sin(t * 3 + i * 0.9) * 0.4,
            Math.sin(baseAngle + t * 2) * radius,
          );
          ref.scale.setScalar(CLONE_SCALE * (0.8 + expand * 0.2));
          ref.rotation.y = baseAngle + t * 2;
        } else {
          // Settle into steady orbit
          ref.position.set(
            Math.cos(baseAngle + t * 1.2) * ORBIT_RADIUS,
            Math.sin(t * 1.8 + i * 0.7) * 0.3,
            Math.sin(baseAngle + t * 1.2) * ORBIT_RADIUS,
          );
          ref.scale.lerp(new THREE.Vector3(CLONE_SCALE, CLONE_SCALE, CLONE_SCALE), 0.1);
          ref.rotation.y = baseAngle + t * 1.2;
        }
      } else {
        // Idle orbit after multiply was used
        ref.position.set(
          Math.cos(baseAngle + t * 0.8) * ORBIT_RADIUS,
          Math.sin(t * 1.5 + i * 0.7) * 0.4,
          Math.sin(baseAngle + t * 0.8) * ORBIT_RADIUS,
        );
        ref.scale.lerp(new THREE.Vector3(CLONE_SCALE, CLONE_SCALE, CLONE_SCALE), 0.05);
        ref.rotation.y = baseAngle + t * 0.8;
      }
    });

    // ── Floating trophies (apple + filet-o-fish) ──────────
    if (appleRef.current) {
      const a = t * 0.6;
      appleRef.current.position.set(
        Math.cos(a) * TROPHY_ORBIT_RADIUS,
        0.4 + Math.sin(t * 1.8) * 0.2,
        Math.sin(a) * TROPHY_ORBIT_RADIUS,
      );
      appleRef.current.rotation.y = t * 1.2;
      appleRef.current.rotation.x = Math.sin(t * 0.9) * 0.15;
    }
    if (fishRef.current) {
      const a = t * 0.6 + Math.PI;
      fishRef.current.position.set(
        Math.cos(a) * TROPHY_ORBIT_RADIUS,
        0.4 + Math.sin(t * 1.8 + 1.5) * 0.2,
        Math.sin(a) * TROPHY_ORBIT_RADIUS,
      );
      fishRef.current.rotation.y = t * 1.0 + Math.PI;
      fishRef.current.rotation.z = Math.sin(t * 0.7) * 0.1;
    }

    // ── Hit reaction ────────────────────────────────────────
    if (hitReaction && !activeAttack) {
      if (hitStart.current === 0) hitStart.current = t;
      const elapsed = t - hitStart.current;

      if (hitReaction === 'hit-light') {
        const intensity = Math.max(0, 1 - elapsed * 2.5);
        const flinch = Math.sin(elapsed * 30) * intensity;
        groupRef.current.position.x = flinch * 1.5;
        groupRef.current.position.y = -Math.abs(flinch) * 0.5;
        groupRef.current.rotation.z = flinch * 0.15;
        groupRef.current.rotation.x = -0.2 * intensity;
        const s = BASE_SCALE - intensity * 0.8;
        groupRef.current.scale.setScalar(s);
      } else if (hitReaction === 'hit-heavy') {
        const phase = Math.min(elapsed / 0.66, 1);
        if (phase < 0.3) {
          const knock = phase / 0.3;
          groupRef.current.position.x = -knock * 4;
          groupRef.current.position.y = -knock * 2;
          groupRef.current.rotation.z = knock * 0.5;
          groupRef.current.rotation.x = -knock * 0.4;
          groupRef.current.scale.setScalar(BASE_SCALE - knock * 2);
        } else if (phase < 0.6) {
          const tumble = (phase - 0.3) / 0.3;
          groupRef.current.position.x = -4 + tumble * 2;
          groupRef.current.position.y = -2 + Math.sin(tumble * Math.PI) * 1.5;
          groupRef.current.rotation.z = 0.5 - tumble * 0.3;
          groupRef.current.rotation.x = -0.4 + tumble * 0.2;
          groupRef.current.scale.setScalar(12 + tumble * 1);
        } else {
          const recover = (phase - 0.6) / 0.4;
          groupRef.current.position.x = -2 * (1 - recover);
          groupRef.current.position.y = (-2 + 1.5) * (1 - recover);
          groupRef.current.rotation.z = 0.2 * (1 - recover);
          groupRef.current.rotation.x = -0.2 * (1 - recover);
          groupRef.current.scale.setScalar(13 + recover);
        }
      }
      return;
    }

    if (!hitReaction) hitStart.current = 0;

    // ── Idle ────────────────────────────────────────────────
    if (!activeAttack) {
      attackStart.current = 0;

      if (isCubed) {
        groupRef.current.rotation.x += 0.06;
        groupRef.current.rotation.y += 0.09;
        groupRef.current.rotation.z += 0.04;
        groupRef.current.position.x = Math.sin(t * 3) * 1.2;
        groupRef.current.position.y = Math.sin(t * 2.3) * 0.8;
        groupRef.current.scale.lerp(new THREE.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE), 0.1);
        return;
      }

      // Dance: menacing headbang with lurching side steps
      if (isDancing) {
        const lurch = Math.sin(t * 3) * 2;
        groupRef.current.position.x = lurch;
        groupRef.current.position.y = Math.abs(Math.sin(t * 6)) * 1.5;
        groupRef.current.rotation.y = Math.sin(t * 3) * 0.5;
        groupRef.current.rotation.x = Math.sin(t * 6) * 0.35;
        groupRef.current.rotation.z = Math.cos(t * 3) * 0.2;
        groupRef.current.scale.setScalar(BASE_SCALE + Math.sin(t * 6) * 1);
        return;
      }

      // Sinister hover
      groupRef.current.rotation.x *= 0.9;
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.position.x *= 0.9;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.4;
      groupRef.current.scale.lerp(new THREE.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE), 0.1);
      return;
    }

    // ── Attacks ─────────────────────────────────────────────
    if (attackStart.current === 0) attackStart.current = t;
    const elapsed = t - attackStart.current;

    if (activeAttack === 'shadow-slide') {
      const phase = elapsed / 1.0;
      if (phase < 0.3) {
        const enter = phase / 0.3;
        groupRef.current.scale.setScalar(BASE_SCALE * (1 - enter * 0.4));
        groupRef.current.position.x = -enter * 6;
        groupRef.current.rotation.y = enter * Math.PI;
      } else if (phase < 0.6) {
        const cross = (phase - 0.3) / 0.3;
        groupRef.current.scale.setScalar(BASE_SCALE * (0.6 + cross * 0.4));
        groupRef.current.position.x = 6 - cross * 6;
        groupRef.current.rotation.y = Math.PI + cross * Math.PI;
      } else {
        const settle = Math.min((phase - 0.6) / 0.4, 1);
        groupRef.current.position.x *= 1 - settle * 0.15;
        groupRef.current.rotation.y *= 1 - settle * 0.1;
        groupRef.current.scale.lerp(new THREE.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE), 0.15);
      }
    } else if (activeAttack === 'soul-drain') {
      const pulse = Math.sin(elapsed * 6) * 0.5 + 0.5;
      const intensity = Math.max(0, 1 - elapsed * 0.4);
      groupRef.current.scale.setScalar(BASE_SCALE + pulse * 3 * intensity);
      groupRef.current.position.y = elapsed * 2 * intensity;
      groupRef.current.rotation.y = elapsed * 2;
      groupRef.current.rotation.x = Math.sin(elapsed * 4) * 0.2 * intensity;
    } else if (activeAttack === 'void-collapse') {
      const dur = 2.0;
      const phase = elapsed / dur;
      if (phase < 0.4) {
        const collapse = phase / 0.4;
        groupRef.current.rotation.y = elapsed * 20 * collapse;
        groupRef.current.rotation.x = elapsed * 8 * collapse;
        groupRef.current.scale.setScalar(BASE_SCALE * (1 - collapse * 0.6));
        groupRef.current.position.y = collapse * 3;
      } else if (phase < 0.5) {
        groupRef.current.scale.setScalar(BASE_SCALE * 0.4);
        groupRef.current.rotation.y += 0.3;
        groupRef.current.position.y = 3;
      } else if (phase < 0.7) {
        const explode = (phase - 0.5) / 0.2;
        groupRef.current.scale.setScalar(BASE_SCALE * (0.4 + explode * 1.2));
        groupRef.current.rotation.y += 0.2 * (1 - explode);
        groupRef.current.position.y = 3 - explode * 2;
        groupRef.current.position.x = Math.sin(elapsed * 30) * 2 * (1 - explode);
      } else {
        const settle = (phase - 0.7) / 0.3;
        const tremor = Math.sin(elapsed * 25) * Math.max(0, 1 - settle) * 0.5;
        groupRef.current.position.x = tremor;
        groupRef.current.position.y = 1 * (1 - settle);
        groupRef.current.rotation.y *= 0.95;
        groupRef.current.rotation.x *= 0.95;
        groupRef.current.scale.lerp(new THREE.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE), 0.12);
      }
    } else if (activeAttack === 'multiply') {
      // Menacing power-up: rise, pulse with energy as clones emerge
      const dur = 2.0;
      const phase = elapsed / dur;
      if (phase < 0.3) {
        // Rise up and pulse
        const rise = phase / 0.3;
        groupRef.current.position.y = rise * 3;
        groupRef.current.scale.setScalar(BASE_SCALE + Math.sin(elapsed * 12) * rise * 1.5);
        groupRef.current.rotation.y = elapsed * 2;
      } else if (phase < 0.7) {
        // Hover at peak, spinning with energy pulses
        groupRef.current.position.y = 3 + Math.sin(elapsed * 4) * 0.3;
        groupRef.current.scale.setScalar(BASE_SCALE + Math.sin(elapsed * 8) * 1.2);
        groupRef.current.rotation.y = elapsed * 3;
      } else {
        // Descend and settle
        const descend = (phase - 0.7) / 0.3;
        groupRef.current.position.y = 3 * (1 - descend);
        groupRef.current.scale.lerp(new THREE.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE), 0.12);
        groupRef.current.rotation.y *= 0.95;
      }
    }
  });

  return (
    <>
      <group ref={groupRef} scale={BASE_SCALE}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={darkScene} />
        </group>
        {/* Eerie ambient purple point light on the model */}
        <pointLight color="#6b21a8" intensity={Math.PI * 2} decay={0} position={[0, 0.3, 0.3]} />
        {debug && (
          <>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z)]} />
              <lineBasicMaterial color="#ff3333" transparent opacity={0.35} />
            </lineSegments>
            <axesHelper args={[boxSize.x * 0.3]} />
          </>
        )}
      </group>
      {/* Floating trophies — apple and filet-o-fish orbit the model */}
      <group ref={appleRef} scale={TROPHY_SCALE}>
        <primitive object={darkApple} />
        <pointLight color="#6b21a8" intensity={Math.PI * 0.5} decay={0} distance={3} />
      </group>
      <group ref={fishRef} scale={TROPHY_SCALE * 100}>
        <primitive object={darkFish} />
        <pointLight color="#6b21a8" intensity={Math.PI * 0.5} decay={0} distance={3} />
      </group>
      {/* Multiply clones — orbit around main model when activated */}
      {multiplyClones.map((clone, i) => (
        <group
          key={i}
          ref={(el) => {
            cloneGroupRefs.current[i] = el;
          }}
          visible={false}
        >
          <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
            <primitive object={clone} />
          </group>
          <pointLight color="#6b21a8" intensity={Math.PI} decay={0} position={[0, 0.3, 0.3]} />
        </group>
      ))}
    </>
  );
};
