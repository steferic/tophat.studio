import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration, qf } from '../workshop/loopContext';
import { getShieldDefaults } from '../workshop/shieldRegistry';

// ── Point generation helpers ────────────────────────────────

/** Golden-ratio sphere distribution (ported from SpeepoModel) */
function generateSpherePoints(count: number, radius: number): Float32Array {
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rAtY = Math.sqrt(1 - y * y);
    const theta = (i * 2.399963229728653) % (Math.PI * 2);
    pts[i * 3] = Math.cos(theta) * rAtY * radius;
    pts[i * 3 + 1] = y * radius;
    pts[i * 3 + 2] = Math.sin(theta) * rAtY * radius;
  }
  return pts;
}

/** Deterministic pseudo-random (0-1) from seed */
function prand(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Cube surface: count/6 per face, deterministic pseudo-random u,v */
function generateCubePoints(count: number, radius: number): Float32Array {
  const pts = new Float32Array(count * 3);
  const perFace = Math.ceil(count / 6);
  // faces: +x,-x,+y,-y,+z,-z
  const axes: [number, number, number][] = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];
  let idx = 0;
  for (let f = 0; f < 6 && idx < count; f++) {
    const [ax, ay, az] = axes[f];
    for (let i = 0; i < perFace && idx < count; i++) {
      const u = (prand(f * 10000 + i * 3) - 0.5) * 2 * radius;
      const v = (prand(f * 10000 + i * 3 + 1) - 0.5) * 2 * radius;
      if (ax !== 0) { pts[idx * 3] = ax * radius; pts[idx * 3 + 1] = u; pts[idx * 3 + 2] = v; }
      else if (ay !== 0) { pts[idx * 3] = u; pts[idx * 3 + 1] = ay * radius; pts[idx * 3 + 2] = v; }
      else { pts[idx * 3] = u; pts[idx * 3 + 1] = v; pts[idx * 3 + 2] = az * radius; }
      idx++;
    }
  }
  return pts;
}

/** Sample points on faces of a Three.js geometry via area-weighted barycentric */
function generateGeometryPoints(count: number, radius: number, geo: THREE.BufferGeometry): Float32Array {
  const pts = new Float32Array(count * 3);
  const posArr = geo.getAttribute('position');
  const idxArr = geo.index;
  if (!posArr) return pts;

  // Collect triangle vertices
  const triangles: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [];
  const areas: number[] = [];
  const tmp = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();

  const triCount = idxArr ? idxArr.count / 3 : posArr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i0 = idxArr ? idxArr.getX(t * 3) : t * 3;
    const i1 = idxArr ? idxArr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idxArr ? idxArr.getX(t * 3 + 2) : t * 3 + 2;
    const a = new THREE.Vector3().fromBufferAttribute(posArr, i0);
    const b = new THREE.Vector3().fromBufferAttribute(posArr, i1);
    const c = new THREE.Vector3().fromBufferAttribute(posArr, i2);
    triangles.push([a, b, c]);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    areas.push(tmp.crossVectors(ab, ac).length() * 0.5);
  }

  // Build cumulative area for weighted sampling
  const totalArea = areas.reduce((s, a) => s + a, 0);
  const cumulative: number[] = [];
  let cum = 0;
  for (const a of areas) { cum += a / totalArea; cumulative.push(cum); }

  for (let i = 0; i < count; i++) {
    const r = prand(i * 7 + 13);
    let ti = 0;
    for (ti = 0; ti < cumulative.length - 1; ti++) {
      if (r <= cumulative[ti]) break;
    }
    const [va, vb, vc] = triangles[ti];
    // Barycentric
    let u = prand(i * 11 + 37);
    let v = prand(i * 17 + 53);
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    pts[i * 3] = (va.x * w + vb.x * u + vc.x * v) * radius;
    pts[i * 3 + 1] = (va.y * w + vb.y * u + vc.y * v) * radius;
    pts[i * 3 + 2] = (va.z * w + vb.z * u + vc.z * v) * radius;
  }

  return pts;
}

/** Octahedron: 8 triangular faces, barycentric sampling */
function generateOctahedronPoints(count: number, radius: number): Float32Array {
  const geo = new THREE.OctahedronGeometry(1);
  return generateGeometryPoints(count, radius, geo);
}

/** Icosahedron face extraction + barycentric */
function generateIcosahedronPoints(count: number, radius: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(1);
  return generateGeometryPoints(count, radius, geo);
}

/** Dodecahedron face extraction + barycentric */
function generateDodecahedronPoints(count: number, radius: number): Float32Array {
  const geo = new THREE.DodecahedronGeometry(1);
  return generateGeometryPoints(count, radius, geo);
}

/** Cylinder: area-weighted split (side surface + caps) */
function generateCylinderPoints(count: number, radius: number): Float32Array {
  const pts = new Float32Array(count * 3);
  const h = radius * 2;
  const sideArea = 2 * Math.PI * radius * h;
  const capArea = Math.PI * radius * radius;
  const totalArea = sideArea + 2 * capArea;
  const sidePts = Math.round(count * sideArea / totalArea);
  const capPts = Math.round(count * capArea / totalArea);

  let idx = 0;
  // Side surface
  for (let i = 0; i < sidePts && idx < count; i++) {
    const theta = prand(i * 5 + 1) * Math.PI * 2;
    const y = (prand(i * 5 + 2) - 0.5) * h;
    pts[idx * 3] = Math.cos(theta) * radius;
    pts[idx * 3 + 1] = y;
    pts[idx * 3 + 2] = Math.sin(theta) * radius;
    idx++;
  }
  // Top + bottom caps
  for (let cap = 0; cap < 2; cap++) {
    const ySign = cap === 0 ? 1 : -1;
    for (let i = 0; i < capPts && idx < count; i++) {
      const r = Math.sqrt(prand(cap * 10000 + i * 3)) * radius;
      const theta = prand(cap * 10000 + i * 3 + 1) * Math.PI * 2;
      pts[idx * 3] = Math.cos(theta) * r;
      pts[idx * 3 + 1] = ySign * radius;
      pts[idx * 3 + 2] = Math.sin(theta) * r;
      idx++;
    }
  }
  return pts;
}

/** Torus: parametric (theta, phi) sampling */
function generateTorusPoints(count: number, radius: number): Float32Array {
  const pts = new Float32Array(count * 3);
  const R = radius;         // major radius
  const r = radius * 0.35;  // tube radius
  for (let i = 0; i < count; i++) {
    const theta = prand(i * 7 + 1) * Math.PI * 2;
    const phi = prand(i * 7 + 2) * Math.PI * 2;
    pts[i * 3] = (R + r * Math.cos(phi)) * Math.cos(theta);
    pts[i * 3 + 1] = r * Math.sin(phi);
    pts[i * 3 + 2] = (R + r * Math.cos(phi)) * Math.sin(theta);
  }
  return pts;
}

/** Pyramid: ConeGeometry(r,h,4) face extraction + barycentric */
function generatePyramidPoints(count: number, radius: number): Float32Array {
  const geo = new THREE.ConeGeometry(radius, radius * 2, 4);
  return generateGeometryPoints(count, 1, geo);
}

// ── Shape → point generator map ─────────────────────────────

const POINT_GENERATORS: Record<string, (count: number, radius: number) => Float32Array> = {
  sphere: generateSpherePoints,
  cube: generateCubePoints,
  octahedron: generateOctahedronPoints,
  icosahedron: generateIcosahedronPoints,
  dodecahedron: generateDodecahedronPoints,
  cylinder: generateCylinderPoints,
  torus: generateTorusPoints,
  pyramid: generatePyramidPoints,
};

// ── Shape → Three.js geometry for planes mode ───────────────

function getPlaneGeometry(shieldId: string, radius: number): THREE.BufferGeometry {
  switch (shieldId) {
    case 'sphere': return new THREE.SphereGeometry(radius, 24, 24);
    case 'cube': return new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
    case 'octahedron': return new THREE.OctahedronGeometry(radius);
    case 'icosahedron': return new THREE.IcosahedronGeometry(radius);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(radius);
    case 'cylinder': return new THREE.CylinderGeometry(radius, radius, radius * 2, 16);
    case 'torus': return new THREE.TorusGeometry(radius, radius * 0.35, 16, 32);
    case 'pyramid': return new THREE.ConeGeometry(radius, radius * 2, 4);
    default: return new THREE.SphereGeometry(radius, 24, 24);
  }
}

// ── ShieldEffect Component ──────────────────────────────────

interface ShieldEffectProps {
  shieldId: string;
  shieldParams: Record<string, any>;
  /** The model's internal baseScale — shields must match this to be visible */
  modelScale: number;
}

export const ShieldEffect: React.FC<ShieldEffectProps> = ({ shieldId, shieldParams, modelScale }) => {
  const defaults = useMemo(() => getShieldDefaults(shieldId), [shieldId]);
  const p = { ...defaults, ...shieldParams };

  const renderMode: string = p.renderMode ?? 'particles';
  const color: string = p.color ?? '#fbbf24';
  const opacity: number = p.opacity ?? 0.7;
  const radius: number = p.radius ?? 0.55;
  const particleCount: number = p.particleCount ?? 4000;
  const particleSize: number = p.particleSize ?? 0.4;
  const rotationSpeed: number = p.rotationSpeed ?? 0.3;
  const pulseSpeed: number = p.pulseSpeed ?? 0;
  const pulseAmount: number = p.pulseAmount ?? 0.05;
  const wireframe: boolean = p.wireframe ?? false;

  const inner = renderMode === 'planes' ? (
    <PlanesShield
      shieldId={shieldId}
      color={color}
      opacity={opacity}
      radius={radius}
      rotationSpeed={rotationSpeed}
      pulseSpeed={pulseSpeed}
      pulseAmount={pulseAmount}
      wireframe={wireframe}
    />
  ) : (
    <ParticleShield
      shieldId={shieldId}
      color={color}
      opacity={opacity}
      radius={radius}
      particleCount={particleCount}
      particleSize={particleSize}
      rotationSpeed={rotationSpeed}
      pulseSpeed={pulseSpeed}
      pulseAmount={pulseAmount}
    />
  );

  // Wrap in model's baseScale so the shield matches the model's coordinate space
  return <group scale={modelScale}>{inner}</group>;
};

// ── Particle Mode ───────────────────────────────────────────

const ParticleShield: React.FC<{
  shieldId: string;
  color: string;
  opacity: number;
  radius: number;
  particleCount: number;
  particleSize: number;
  rotationSpeed: number;
  pulseSpeed: number;
  pulseAmount: number;
}> = ({ shieldId, color, opacity, radius, particleCount, particleSize, rotationSpeed, pulseSpeed, pulseAmount }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  const positions = useMemo(() => {
    const gen = POINT_GENERATORS[shieldId] ?? generateSpherePoints;
    return gen(particleCount, radius);
  }, [shieldId, particleCount, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Vertex colors: all same color
    const colors = new Float32Array(particleCount * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < particleCount; i++) {
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, particleCount, color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * qf(rotationSpeed, loopDuration);
    groupRef.current.rotation.x = Math.sin(t * qf(0.2, loopDuration)) * 0.1;
    if (pulseSpeed > 0) {
      const scale = 1 + Math.sin(t * qf(pulseSpeed, loopDuration)) * pulseAmount;
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={particleSize}
          vertexColors
          sizeAttenuation
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// ── Planes Mode ─────────────────────────────────────────────

const PlanesShield: React.FC<{
  shieldId: string;
  color: string;
  opacity: number;
  radius: number;
  rotationSpeed: number;
  pulseSpeed: number;
  pulseAmount: number;
  wireframe: boolean;
}> = ({ shieldId, color, opacity, radius, rotationSpeed, pulseSpeed, pulseAmount, wireframe }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const loopDuration = useLoopDuration();

  const geometry = useMemo(() => getPlaneGeometry(shieldId, radius), [shieldId, radius]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * qf(rotationSpeed, loopDuration);
    groupRef.current.rotation.x = Math.sin(t * qf(0.2, loopDuration)) * 0.1;
    if (pulseSpeed > 0) {
      const scale = 1 + Math.sin(t * qf(pulseSpeed, loopDuration)) * pulseAmount;
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
};
