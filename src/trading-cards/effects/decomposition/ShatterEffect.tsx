import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { extractTriangles } from './extractGeometry';

const MAX_TRIS = 3000;

const vertexShader = /* glsl */ `
  attribute vec3 aCentroid;
  attribute vec3 aFaceNormal;
  attribute float aRandom;
  attribute vec3 aColor;

  uniform float uProgress;
  uniform float uExplosionRadius;
  uniform float uGravity;
  uniform float uTumbleSpeed;

  varying vec3 vColor;
  varying float vProgress;

  // Rotate around an arbitrary axis
  mat3 rotateAxis(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
  }

  void main() {
    vColor = aColor;
    vProgress = uProgress;

    // Direction: outward from centroid + face normal bias
    vec3 dir = normalize(aCentroid + aFaceNormal * 0.5);

    // Displacement
    float speed = 0.5 + aRandom * 0.5;
    vec3 offset = dir * uProgress * uExplosionRadius * speed;

    // Gravity
    offset.y -= uProgress * uProgress * uGravity * (0.5 + aRandom * 0.5);

    // Tumble rotation around face normal
    float tumbleAngle = uProgress * uTumbleSpeed * (0.5 + aRandom);
    vec3 tumbleAxis = length(aFaceNormal) > 0.01 ? normalize(aFaceNormal) : vec3(0.0, 1.0, 0.0);
    mat3 rot = rotateAxis(tumbleAxis, tumbleAngle);

    // Offset position relative to centroid, rotate, then translate
    vec3 localPos = position - aCentroid;
    vec3 rotatedPos = rot * localPos;
    vec3 finalPos = rotatedPos + aCentroid + offset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vProgress;

  void main() {
    float alpha = 1.0 - smoothstep(0.6, 1.0, vProgress);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface ShatterEffectProps {
  scene: THREE.Object3D;
  progress: number;
  modelScale: number;
  centerOffset: THREE.Vector3;
}

export const ShatterEffect: React.FC<ShatterEffectProps> = ({ scene, progress, modelScale, centerOffset }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const extracted = extractTriangles(scene);
    let { positions, centroids, normals, colors, count } = extracted;

    // Decimate if too many triangles
    let stride = 1;
    if (count > MAX_TRIS) {
      stride = Math.ceil(count / MAX_TRIS);
      count = Math.floor(count / stride);
    }

    const geo = new THREE.BufferGeometry();

    // Build per-vertex attributes from per-face data
    const posArr = new Float32Array(count * 9);
    const centroidArr = new Float32Array(count * 9); // same centroid for all 3 verts
    const normalArr = new Float32Array(count * 9);
    const colorArr = new Float32Array(count * 9);
    const randomArr = new Float32Array(count * 3); // per-vertex but same per face

    for (let i = 0; i < count; i++) {
      const srcIdx = i * stride;
      const pSrc = srcIdx * 9;
      const cSrc = srcIdx * 3;
      const pDst = i * 9;
      const cDst = i * 3;

      // Copy 9 position floats
      for (let j = 0; j < 9; j++) posArr[pDst + j] = positions[pSrc + j];

      // Broadcast centroid to all 3 vertices
      const cx = centroids[cSrc], cy = centroids[cSrc + 1], cz = centroids[cSrc + 2];
      centroidArr[pDst]     = cx; centroidArr[pDst + 1] = cy; centroidArr[pDst + 2] = cz;
      centroidArr[pDst + 3] = cx; centroidArr[pDst + 4] = cy; centroidArr[pDst + 5] = cz;
      centroidArr[pDst + 6] = cx; centroidArr[pDst + 7] = cy; centroidArr[pDst + 8] = cz;

      // Broadcast normal to all 3 vertices
      const nx = normals[cSrc], ny = normals[cSrc + 1], nz = normals[cSrc + 2];
      normalArr[pDst]     = nx; normalArr[pDst + 1] = ny; normalArr[pDst + 2] = nz;
      normalArr[pDst + 3] = nx; normalArr[pDst + 4] = ny; normalArr[pDst + 5] = nz;
      normalArr[pDst + 6] = nx; normalArr[pDst + 7] = ny; normalArr[pDst + 8] = nz;

      // Broadcast color to all 3 vertices
      const cr = colors[cSrc], cg = colors[cSrc + 1], cb = colors[cSrc + 2];
      colorArr[pDst]     = cr; colorArr[pDst + 1] = cg; colorArr[pDst + 2] = cb;
      colorArr[pDst + 3] = cr; colorArr[pDst + 4] = cg; colorArr[pDst + 5] = cb;
      colorArr[pDst + 6] = cr; colorArr[pDst + 7] = cg; colorArr[pDst + 8] = cb;

      // Same random per face
      const rnd = Math.random();
      randomArr[cDst] = rnd; randomArr[cDst + 1] = rnd; randomArr[cDst + 2] = rnd;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('aCentroid', new THREE.BufferAttribute(centroidArr, 3));
    geo.setAttribute('aFaceNormal', new THREE.BufferAttribute(normalArr, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colorArr, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randomArr, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uExplosionRadius: { value: 15 },
        uGravity: { value: 8 },
        uTumbleSpeed: { value: 6 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [scene]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uProgress.value = progress;
  });

  return (
    <group scale={modelScale}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <mesh ref={meshRef} geometry={geometry} material={material} />
      </group>
    </group>
  );
};
