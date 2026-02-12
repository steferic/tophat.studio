import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Seamless infinite Mandelbrot zoom — single-shader dual-layer blend.
//
// Based on the technique from OneShader's "Infinite Mandelbrot Zoom":
//   - Two Mandelbrot computations per pixel at different zoom levels
//   - Layer 2 is the zoomed-OUT version offset by the full cycle zoom (mzoom)
//   - Rotation per cycle = 4π − 4.04; layer 2 gets +4.04 offset
//   - At cycle end: layer 2 rotation = 4π ≡ 0, matching layer 1's start
//   - Blend weight crossfades so the modulo wrap is invisible
const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float time;
  uniform float aspectRatio;

  const float PI = 3.14159265358979;
  const vec2 CENTER = vec2(-0.13791936640142570, -0.88460568100304538);
  const float MZOOM = 1e5;

  vec2 vpow2(vec2 v) {
    return vec2(v.x * v.x - v.y * v.y, 2.0 * v.x * v.y);
  }

  vec2 rotate(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  float iterate(vec2 c) {
    vec2 z = vec2(0.0);
    int i = 0;
    for (int n = 0; n < 512; n++) {
      if (dot(z, z) > 67108864.0) break; // 8192^2
      z = vpow2(z) + c;
      i++;
    }
    if (i >= 512) return 512.0;
    return float(i) + 1.0 - log(log(length(z))) / log(2.0);
  }

  vec3 colorize(float it) {
    if (it >= 512.0) return vec3(0.0);
    return vec3(
      0.5 + 0.5 * sin(it / 32.0),
      0.5 + 0.5 * sin(it / 48.0),
      0.5 + 0.5 * sin(it / 64.0)
    );
  }

  void main() {
    // Map UV to centered screen coords with aspect ratio
    vec2 q = (vUv - 0.5) * vec2(aspectRatio, 1.0) * 2.0;

    float ztime = log(MZOOM) / log(2.0);
    float zoom = pow(2.0, mod(time, ztime));
    float zphase = mod(time / ztime, 1.0);
    float r = (4.0 * PI - 4.04) * zphase;

    // Layer 1: current zoom level
    vec2 c1 = rotate(q / zoom, r) + CENTER;
    // Layer 2: offset by full cycle zoom — at cycle end this equals layer 1 at cycle start
    vec2 c2 = rotate(q * MZOOM / zoom, r + 4.04) + CENTER;

    float it1 = iterate(c1);
    float it2 = iterate(c2);

    float w = pow(zphase, 0.9);

    vec3 col = colorize(it1) * (1.0 - w) * clamp(1.0 - 0.2 * it2, 0.0, 1.0);
    col += colorize(it2) * w;

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  zooming: boolean;
}

export const MandelbrotEffect: React.FC<Props> = ({ zooming }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const { viewport } = useThree();
  const aspect = viewport.width / viewport.height;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          aspectRatio: { value: aspect },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.aspectRatio.value = aspect;

    if (zooming) {
      timeRef.current += delta * 0.8;
    }

    matRef.current.uniforms.time.value = timeRef.current;
  });

  const planeWidth = 2 * aspect;

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[planeWidth, 2]} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
};
