import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelBounds } from './useModelBounds';
import { useLoopDuration, qf } from '../workshop/loopContext';

import type { ModelComponentProps } from '../arena/descriptorTypes';

const BASE_SCALE = 14;
const SHIELD_PARTICLES = 4000;
const SPHERE_RADIUS = 0.55;
const CUBE_HALF = 0.45;

/**
 * Generate matched sphere and cube surface points.
 * Each sphere point maps to its radially projected cube position
 * so the morph follows clean straight-line paths.
 */
const generateShieldPoints = (count: number, radius: number, cubeHalf: number) => {
  const spherePoints = new Float32Array(count * 3);
  const cubePoints = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Golden-ratio sphere distribution
    const y = 1 - (i / (count - 1)) * 2; // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = ((i * 2.399963229728653) % (Math.PI * 2)); // golden angle

    const sx = Math.cos(theta) * radiusAtY * radius;
    const sy = y * radius;
    const sz = Math.sin(theta) * radiusAtY * radius;

    spherePoints[i * 3] = sx;
    spherePoints[i * 3 + 1] = sy;
    spherePoints[i * 3 + 2] = sz;

    // Project sphere point onto cube surface
    const ax = Math.abs(sx), ay = Math.abs(sy), az = Math.abs(sz);
    const maxComp = Math.max(ax, ay, az);
    if (maxComp > 0) {
      const scale = cubeHalf / maxComp;
      cubePoints[i * 3] = sx * scale;
      cubePoints[i * 3 + 1] = sy * scale;
      cubePoints[i * 3 + 2] = sz * scale;
    }
  }

  return { spherePoints, cubePoints };
};

/** Sphere↔Cube shield rendered as a point cloud around the penguin */
const EnergyShield: React.FC<{
  morphRef: React.MutableRefObject<number>; // 0 = sphere, 1 = cube
}> = ({ morphRef }) => {
  const shieldGroupRef = useRef<THREE.Group>(null!);

  const { spherePoints, cubePoints } = useMemo(
    () => generateShieldPoints(SHIELD_PARTICLES, SPHERE_RADIUS, CUBE_HALF),
    [],
  );

  const randomOffsets = useMemo(() => {
    const offsets = new Float32Array(SHIELD_PARTICLES * 3);
    for (let i = 0; i < SHIELD_PARTICLES; i++) {
      const s1 = Math.sin(i * 12.9898 + 1) * 43758.5453;
      const s2 = Math.sin(i * 78.233 + 2) * 43758.5453;
      const s3 = Math.sin(i * 45.164 + 3) * 43758.5453;
      offsets[i * 3] = (s1 - Math.floor(s1)) - 0.5;
      offsets[i * 3 + 1] = (s2 - Math.floor(s2)) - 0.5;
      offsets[i * 3 + 2] = (s3 - Math.floor(s3)) - 0.5;
    }
    return offsets;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SHIELD_PARTICLES * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SHIELD_PARTICLES * 3), 3));
    return geo;
  }, []);

  const goldColor = useMemo(() => new THREE.Color('#fbbf24'), []);
  const electricBlue = useMemo(() => new THREE.Color('#38bdf8'), []);
  const loopDuration = useLoopDuration();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const morph = morphRef.current; // 0 = sphere, 1 = cube
    const chaos = Math.sin(morph * Math.PI) * 0.08; // subtle wobble during transition

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = geometry.attributes.color as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    // Smoothstep the morph for nicer easing
    const m = morph * morph * (3 - 2 * morph);

    for (let i = 0; i < SHIELD_PARTICLES; i++) {
      const i3 = i * 3;

      // Lerp between sphere and cube positions
      pos[i3] = THREE.MathUtils.lerp(spherePoints[i3], cubePoints[i3], m) + randomOffsets[i3] * chaos;
      pos[i3 + 1] = THREE.MathUtils.lerp(spherePoints[i3 + 1], cubePoints[i3 + 1], m) + randomOffsets[i3 + 1] * chaos;
      pos[i3 + 2] = THREE.MathUtils.lerp(spherePoints[i3 + 2], cubePoints[i3 + 2], m) + randomOffsets[i3 + 2] * chaos;

      // Color: gold sphere → electric blue cube
      col[i3] = THREE.MathUtils.lerp(goldColor.r, electricBlue.r, m);
      col[i3 + 1] = THREE.MathUtils.lerp(goldColor.g, electricBlue.g, m);
      col[i3 + 2] = THREE.MathUtils.lerp(goldColor.b, electricBlue.b, m);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Slow idle rotation
    if (shieldGroupRef.current) {
      shieldGroupRef.current.rotation.y = t * qf(0.3, loopDuration);
      shieldGroupRef.current.rotation.x = Math.sin(t * qf(0.2, loopDuration)) * 0.1;
    }
  });

  return (
    <group ref={shieldGroupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.4}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

const BOLT_COUNT = 6;
const BOLT_SEGMENTS = 12;

/** Generate a jagged lightning bolt path from sky to ground in world space */
const generateBoltPath = (
  originX: number,
  originZ: number,
  startY: number,
  endY: number,
  jagX: number,
  jagZ: number,
  seed: number,
): Float32Array => {
  const points = new Float32Array((BOLT_SEGMENTS + 1) * 3);
  let x = originX, z = originZ;
  for (let i = 0; i <= BOLT_SEGMENTS; i++) {
    const t = i / BOLT_SEGMENTS;
    if (i > 0 && i < BOLT_SEGMENTS) {
      const s = Math.sin(seed + i * 73.156) * 43758.5453;
      const r = Math.sin(seed + i * 29.834) * 43758.5453;
      x += ((s - Math.floor(s)) - 0.5) * jagX;
      z += ((r - Math.floor(r)) - 0.5) * jagZ;
    }
    points[i * 3] = x;
    points[i * 3 + 1] = THREE.MathUtils.lerp(startY, endY, t);
    points[i * 3 + 2] = z;
  }
  return points;
};

const LAYERS_PER_BOLT = 3; // core + 2 glow layers for thickness

/** Large lightning bolts striking from sky to ground (world space).
 *  Each bolt is rendered as 3 overlapping lines with slight offsets for thickness. */
const LightningBolts: React.FC<{
  visibleRef: React.MutableRefObject<boolean>;
}> = ({ visibleRef }) => {
  const groupRef = useRef<THREE.Group>(null!);

  // Pre-compute random per-layer offsets for thickness
  const layerOffsets = useMemo(() => {
    // layer 0 = center (no offset), layers 1-2 = random offsets
    return Array.from({ length: BOLT_COUNT * LAYERS_PER_BOLT }, (_, idx) => {
      const layer = idx % LAYERS_PER_BOLT;
      if (layer === 0) return { x: 0, z: 0 };
      const s1 = Math.sin(idx * 91.37) * 43758.5453;
      const s2 = Math.sin(idx * 47.63) * 43758.5453;
      return {
        x: ((s1 - Math.floor(s1)) - 0.5) * 0.8,
        z: ((s2 - Math.floor(s2)) - 0.5) * 0.8,
      };
    });
  }, []);

  const boltLines = useMemo(() => {
    const coreMat = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.95,
    });
    const glowMat = new THREE.LineBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.7,
    });
    const lines: THREE.Line[] = [];
    for (let i = 0; i < BOLT_COUNT * LAYERS_PER_BOLT; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array((BOLT_SEGMENTS + 1) * 3), 3),
      );
      const layer = i % LAYERS_PER_BOLT;
      lines.push(new THREE.Line(geo, layer === 0 ? coreMat : glowMat));
    }
    return lines;
  }, []);

  const frameCount = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;
    const visible = visibleRef.current;
    groupRef.current.visible = visible;
    if (!visible) return;

    frameCount.current++;

    if (frameCount.current % 2 === 0) {
      for (let b = 0; b < BOLT_COUNT; b++) {
        const seed = frameCount.current * 17 + b * 137;
        const angle = (b / BOLT_COUNT) * Math.PI * 2 + (frameCount.current * 0.05);
        const radius = 8 + Math.sin(seed * 0.01) * 4;
        const originX = Math.cos(angle) * radius;
        const originZ = Math.sin(angle) * radius;

        const path = generateBoltPath(originX, originZ, 30, -4, 6, 6, seed);

        // Write same path to all 3 layers with offsets
        for (let layer = 0; layer < LAYERS_PER_BOLT; layer++) {
          const idx = b * LAYERS_PER_BOLT + layer;
          const off = layerOffsets[idx];
          const posAttr = boltLines[idx].geometry.attributes.position as THREE.BufferAttribute;
          const arr = posAttr.array as Float32Array;

          for (let i = 0; i <= BOLT_SEGMENTS; i++) {
            arr[i * 3] = path[i * 3] + off.x;
            arr[i * 3 + 1] = path[i * 3 + 1];
            arr[i * 3 + 2] = path[i * 3 + 2] + off.z;
          }
          posAttr.needsUpdate = true;
        }
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {boltLines.map((ln, i) => (
        <primitive key={i} object={ln} />
      ))}
    </group>
  );
};

/** Clone the penguin scene with bright yellow/golden material overrides */
function goldenClone(original: THREE.Object3D): THREE.Object3D {
  const clone = original.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const origMat = mesh.material as THREE.MeshStandardMaterial;
      if (origMat.isMeshStandardMaterial) {
        const mat = origMat.clone();
        mat.color.setRGB(1.0, 0.85, 0.2);
        mat.emissive.setRGB(0.3, 0.22, 0.0);
        mat.emissiveIntensity = 0.5;
        mat.metalness = Math.min(1, mat.metalness + 0.3);
        mat.roughness = Math.max(0, mat.roughness - 0.2);
        mesh.material = mat;
      }
    }
  });
  return clone;
}

export const SpeepoModel: React.FC<ModelComponentProps> = ({ activeAttack, hitReaction, isCubed, isDancing, isEvolving, isEvolved, debug, animatedGroupRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  if (animatedGroupRef) animatedGroupRef.current = groupRef.current;
  const { scene } = useGLTF('models/pengoo.glb');
  const { scene: rockScene } = useGLTF('models/rock.glb');
  const attackStart = useRef(0);
  const hitStart = useRef(0);
  const evolveStart = useRef(0);
  const shieldMorph = useRef(0); // 0 = sphere, 1 = cube
  const lightningVisible = useRef(false);
  const prevAttack = useRef<string | null>(null);

  const targetScale = isEvolved ? BASE_SCALE * 1.5 : BASE_SCALE;

  const { centerOffset, boxSize } = useModelBounds(scene);
  const loopDuration = useLoopDuration();
  const goldenScene = useMemo(() => goldenClone(scene), [scene]);
  const rockClone = useMemo(() => rockScene.clone(true), [rockScene]);
  const rockWireframe = useRef(false);

  // Collect rock materials once so we can toggle wireframe
  const rockMaterials = useMemo(() => {
    const mats: THREE.Material[] = [];
    rockClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) mats.push(...mat);
        else mats.push(mat);
      }
    });
    return mats;
  }, [rockClone]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Toggle rock wireframe when thunder-nap starts
    if (activeAttack === 'thunder-nap' && prevAttack.current !== 'thunder-nap') {
      rockWireframe.current = !rockWireframe.current;
    }
    prevAttack.current = activeAttack;

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
        groupRef.current.scale.setScalar(targetScale - intensity * 0.8);
      } else if (hitReaction === 'hit-heavy') {
        const phase = Math.min(elapsed / 0.66, 1);
        if (phase < 0.3) {
          const knock = phase / 0.3;
          groupRef.current.position.x = -knock * 4;
          groupRef.current.position.y = -knock * 2;
          groupRef.current.rotation.z = knock * 0.5;
          groupRef.current.rotation.x = -knock * 0.4;
          groupRef.current.scale.setScalar(targetScale - knock * 2);
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
      lightningVisible.current = false;
      // Ease shield back to sphere
      shieldMorph.current += (0 - shieldMorph.current) * 0.05;

      // Evolving animation (2.5s electric transformation)
      if (isEvolving) {
        if (evolveStart.current === 0) evolveStart.current = t;
        const elapsed = t - evolveStart.current;

        if (elapsed < 0.8) {
          // Phase 1: Electric jitter, sparking up
          const p = elapsed / 0.8;
          const jitter = Math.sin(elapsed * 80) * (0.3 + p * 2);
          groupRef.current.position.x = jitter;
          groupRef.current.position.y = p * 1.5;
          groupRef.current.rotation.z = Math.sin(elapsed * 50) * 0.2 * p;
          groupRef.current.rotation.y = elapsed * 8;
          const s = BASE_SCALE + Math.sin(elapsed * 30) * 1.5 * p;
          groupRef.current.scale.setScalar(s);
        } else if (elapsed < 1.8) {
          // Phase 2: Fast surge, scale ramps to evolved size
          const p = (elapsed - 0.8) / 1.0;
          const ease = p * p * (3 - 2 * p);
          groupRef.current.rotation.y = (elapsed - 0.8) * 16;
          groupRef.current.position.y = 1.5 + Math.sin(elapsed * 10) * 0.4;
          groupRef.current.position.x = Math.sin(elapsed * 40) * (1 - ease) * 1.2;
          const s = BASE_SCALE + ease * (BASE_SCALE * 1.5 - BASE_SCALE);
          groupRef.current.scale.setScalar(s);
        } else {
          // Phase 3: Electric settle with sparky bounce
          const p = (elapsed - 1.8) / 0.7;
          const spark = Math.sin(p * Math.PI * 3) * Math.max(0, 1 - p) * 1.2;
          groupRef.current.rotation.y *= 0.9;
          groupRef.current.position.y = (1.5 * (1 - p)) + spark * 0.2;
          groupRef.current.position.x = spark * 0.5;
          groupRef.current.rotation.z *= 0.9;
          const s = BASE_SCALE * 1.5 + spark;
          groupRef.current.scale.setScalar(s);
        }
        return;
      }
      evolveStart.current = 0;

      if (isCubed) {
        groupRef.current.rotation.x += 0.06;
        groupRef.current.rotation.y += 0.09;
        groupRef.current.rotation.z += 0.04;
        groupRef.current.position.x = Math.sin(t * qf(3, loopDuration)) * 1.2;
        groupRef.current.position.y = Math.sin(t * qf(2.3, loopDuration)) * 0.8;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        return;
      }

      // Dance: electric jitter with rapid hops and sparky shakes
      if (isDancing) {
        const hop = Math.abs(Math.sin(t * qf(8, loopDuration))) * 1.8;
        groupRef.current.position.y = hop;
        groupRef.current.position.x = Math.sin(t * qf(6, loopDuration)) * 2;
        groupRef.current.rotation.y = t * qf(6, loopDuration);
        groupRef.current.rotation.z = Math.sin(t * qf(12, loopDuration)) * 0.25;
        groupRef.current.rotation.x = Math.cos(t * qf(8, loopDuration)) * 0.15;
        const s = targetScale + Math.sin(t * qf(16, loopDuration)) * 0.8;
        groupRef.current.scale.setScalar(s);
        return;
      }

      // Cheerful bouncy idle
      groupRef.current.rotation.x *= 0.9;
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.position.x *= 0.9;
      groupRef.current.rotation.y = Math.sin(t * qf(0.8, loopDuration)) * 0.2;
      groupRef.current.position.y = Math.abs(Math.sin(t * qf(2.5, loopDuration))) * 0.6;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      return;
    }

    // ── Attacks ─────────────────────────────────────────────
    if (attackStart.current === 0) attackStart.current = t;
    const elapsed = t - attackStart.current;

    if (activeAttack === 'thunder-nap') {
      shieldMorph.current += (0 - shieldMorph.current) * 0.05;
      const dur = 1.5;
      const phase = elapsed / dur;
      if (phase < 0.4) {
        const tilt = phase / 0.4;
        groupRef.current.rotation.z = tilt * 0.4;
        groupRef.current.position.y = -tilt * 0.5;
        groupRef.current.scale.setScalar(targetScale - tilt * 0.5);
      } else if (phase < 0.6) {
        const snap = (phase - 0.4) / 0.2;
        groupRef.current.rotation.z = 0.4 * (1 - snap * 2);
        groupRef.current.position.y = -0.5 + snap * 2;
        groupRef.current.scale.setScalar(targetScale + snap * 1.5);
      } else {
        const settle = (phase - 0.6) / 0.4;
        const buzz = Math.sin(elapsed * 40) * Math.max(0, 1 - settle) * 0.3;
        groupRef.current.position.x = buzz;
        groupRef.current.position.y = 1.5 * (1 - settle);
        groupRef.current.rotation.z = buzz * 0.2;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      }
    } else if (activeAttack === 'lightning-dash') {
      lightningVisible.current = true;
      shieldMorph.current += (0 - shieldMorph.current) * 0.05;
      const dur = 0.8;
      const phase = elapsed / dur;
      if (phase < 0.15) {
        const crouch = phase / 0.15;
        groupRef.current.scale.setScalar(targetScale * (1 - crouch * 0.15));
        groupRef.current.position.y = -crouch * 1;
        groupRef.current.rotation.x = crouch * 0.3;
      } else if (phase < 0.6) {
        const dash = (phase - 0.15) / 0.45;
        const zigzag = Math.sin(dash * Math.PI * 4) * 3 * (1 - dash);
        groupRef.current.position.x = zigzag;
        groupRef.current.position.y = dash * 2;
        groupRef.current.rotation.y = elapsed * 20;
        groupRef.current.scale.setScalar(targetScale * 0.85 + dash * targetScale * 0.3);
      } else {
        const land = (phase - 0.6) / 0.4;
        const bounce = Math.sin(land * Math.PI) * (1 - land);
        groupRef.current.position.x *= 1 - land * 0.3;
        groupRef.current.position.y = 2 * (1 - land) + bounce * 0.5;
        groupRef.current.rotation.y *= 0.9;
        groupRef.current.rotation.x *= 0.9;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      }
    } else if (activeAttack === 'volt-surge') {
      const dur = 2.0;
      const phase = elapsed / dur;

      if (phase < 0.35) {
        const charge = phase / 0.35;
        shieldMorph.current += (charge - shieldMorph.current) * 0.12;
        groupRef.current.scale.setScalar(targetScale + charge * 3);
        groupRef.current.position.y = charge * 2;
        groupRef.current.rotation.y = elapsed * 4;
        groupRef.current.position.x = Math.sin(elapsed * 50) * charge * 0.8;
      } else if (phase < 0.55) {
        shieldMorph.current += (1 - shieldMorph.current) * 0.2;
        groupRef.current.scale.setScalar(targetScale + 3 + Math.sin(elapsed * 20) * 1.5);
        groupRef.current.position.y = 2 + Math.sin(elapsed * 15) * 0.5;
        groupRef.current.position.x = Math.sin(elapsed * 60) * 1.5;
        groupRef.current.rotation.y = elapsed * 8;
        groupRef.current.rotation.z = Math.sin(elapsed * 35) * 0.3;
      } else if (phase < 0.75) {
        const discharge = (phase - 0.55) / 0.2;
        shieldMorph.current += ((1 - discharge) - shieldMorph.current) * 0.1;
        groupRef.current.scale.setScalar(targetScale + 3 * (1 - discharge) + discharge * 5);
        groupRef.current.position.y = 2 * (1 - discharge * 1.5);
        groupRef.current.position.x = Math.sin(elapsed * 30) * (1 - discharge) * 2;
        groupRef.current.rotation.y += 0.2 * (1 - discharge);
      } else {
        shieldMorph.current += (0 - shieldMorph.current) * 0.08;
        const settle = (phase - 0.75) / 0.25;
        const tremor = Math.sin(elapsed * 25) * Math.max(0, 1 - settle) * 0.4;
        groupRef.current.position.x = tremor;
        groupRef.current.position.y *= 1 - settle * 0.2;
        groupRef.current.rotation.y *= 0.95;
        groupRef.current.rotation.z *= 0.9;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      }
    }

    // Apply rock wireframe toggle
    for (const mat of rockMaterials) {
      (mat as THREE.MeshStandardMaterial).wireframe = rockWireframe.current;
    }
  });

  return (
    <>
      <group ref={groupRef} scale={targetScale}>
        <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
          <primitive object={goldenScene} />
        </group>
        {/* Energy shield — always visible, morphs sphere↔cube */}
        <EnergyShield morphRef={shieldMorph} />
        {/* Warm golden point light */}
        <pointLight color="#fbbf24" intensity={Math.PI * 2} decay={0} position={[0, 0.3, 0.3]} />
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
      {/* Rock environment platform */}
      <group position={[0, -4, -1]} scale={40}>
        <primitive object={rockClone} />
      </group>
      {/* Lightning bolts — world space, visible during lightning-dash */}
      <LightningBolts visibleRef={lightningVisible} />
    </>
  );
};
