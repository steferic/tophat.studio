import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLoopDuration } from '../../workshop/loopContext';

// ── Midpoint displacement bolt generation ───────────────────

function generateBolt(
  start: THREE.Vector3,
  end: THREE.Vector3,
  chaos: number,
  subdivisions: number,
): THREE.Vector3[] {
  let points = [start.clone(), end.clone()];

  for (let level = 0; level < subdivisions; level++) {
    const newPoints: THREE.Vector3[] = [points[0]];
    const scale = chaos * (1 / (level + 1)) * start.distanceTo(end) * 0.3;

    for (let i = 0; i < points.length - 1; i++) {
      const mid = new THREE.Vector3()
        .addVectors(points[i], points[i + 1])
        .multiplyScalar(0.5);
      mid.x += (Math.random() - 0.5) * scale;
      mid.y += (Math.random() - 0.5) * scale;
      mid.z += (Math.random() - 0.5) * scale;
      newPoints.push(mid, points[i + 1]);
    }
    points = newPoints;
  }

  return points;
}

function randomPointOnSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  );
}

// ── Component ───────────────────────────────────────────────

interface LightningArcsProps {
  params: Record<string, any>;
}

export const LightningArcs: React.FC<LightningArcsProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const linesRef = useRef<THREE.Line[]>([]);
  const frameCounter = useRef(0);
  // Keep hook call for future loop-quantization support
  useLoopDuration();

  const color = params.color ?? '#aaddff';
  const arcCount = Math.round(params.arcCount ?? 3);
  const intensity = params.intensity ?? 1.0;
  const chaos = params.chaos ?? 0.5;
  const range = params.range ?? 2.0;

  // Material (shared across all arcs)
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Pre-create line objects
  const lines = useMemo(() => {
    const arr: THREE.Line[] = [];
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(192), 3),
      );
      const line = new THREE.Line(geo, material);
      line.frustumCulled = false;
      arr.push(line);
    }
    linesRef.current = arr;
    return arr;
  }, [material]);

  useFrame(() => {
    frameCounter.current++;

    // Update material
    material.color.set(color);
    material.opacity = intensity;

    // Regenerate bolts every 2-4 frames for flicker
    const flickerRate = Math.max(2, Math.round(4 - chaos * 2));
    if (frameCounter.current % flickerRate !== 0) return;

    const origin = new THREE.Vector3(0, 0, 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      line.visible = i < arcCount;
      if (i >= arcCount) continue;

      const endPt = randomPointOnSphere(range);
      const bolt = generateBolt(origin, endPt, chaos, 5);

      const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const maxPts = arr.length / 3;
      const count = Math.min(bolt.length, maxPts);

      for (let j = 0; j < count; j++) {
        arr[j * 3] = bolt[j].x;
        arr[j * 3 + 1] = bolt[j].y;
        arr[j * 3 + 2] = bolt[j].z;
      }
      // Zero out unused
      for (let j = count; j < maxPts; j++) {
        arr[j * 3] = arr[j * 3 + 1] = arr[j * 3 + 2] = 0;
      }

      posAttr.needsUpdate = true;
      line.geometry.setDrawRange(0, count);
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
};
