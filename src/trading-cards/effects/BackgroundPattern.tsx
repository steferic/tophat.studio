import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BgPatternConfig } from '../workshop/backgroundPatternRegistry';
import { useLoopDuration, LOOP_QUANTIZE_UNIFORMS_GLSL, LOOP_QUANTIZE_HELPERS_GLSL } from '../workshop/loopContext';

// ── Pattern index map (must match GLSL switch) ──────────────

const PATTERN_INDEX: Record<string, number> = {
  'solid': 0,
  'linear-gradient': 1,
  'radial-gradient': 2,
  'conic-gradient': 3,
  'noise': 4,
  'grid': 5,
  'dots': 6,
  'concentric': 7,
  'spiral': 8,
  'starfield': 9,
  'voronoi': 10,
  'waves': 11,
  'kaleidoscope': 12,
  'diamond-plate': 13,
};

// ── Vertex Shader ───────────────────────────────────────────

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ── Fragment Shader ─────────────────────────────────────────

const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform int uPattern;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uSpeed;
uniform float uScale;

// Per-pattern uniforms
uniform float uAngle;
uniform float uCenterX;
uniform float uCenterY;
uniform float uOctaves;
uniform float uTurbulence;
uniform float uLineWidth;
uniform float uDotSize;
uniform float uRingWidth;
uniform float uArms;
uniform float uTwist;
uniform float uDensity;
uniform float uTwinkleSpeed;
uniform float uCellCount;
uniform float uLayers;
uniform float uAmplitude;
uniform float uSegments;
uniform float uBorderWidth;

${LOOP_QUANTIZE_UNIFORMS_GLSL}
${LOOP_QUANTIZE_HELPERS_GLSL}

#define PI 3.14159265359
#define TAU 6.28318530718

// ── Noise helpers ───────────────────────────────────────────

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
  a += dot(a, a + 34.45);
  return fract(vec2(a.x * a.y, a.y * a.z));
}

float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    val += amp * noise2d(p * freq);
    amp *= 0.5;
    freq *= 2.0;
  }
  return val;
}

// ── Pattern functions ───────────────────────────────────────

vec3 patternSolid() {
  return uColor1;
}

vec3 patternLinearGradient(vec2 uv) {
  float a = uAngle * PI / 180.0;
  float t = dot(uv - 0.5, vec2(cos(a), sin(a))) + 0.5;
  t = clamp(t, 0.0, 1.0);
  return mix(uColor1, uColor2, t);
}

vec3 patternRadialGradient(vec2 uv) {
  float d = distance(uv, vec2(uCenterX, uCenterY)) * 2.0;
  d = clamp(d, 0.0, 1.0);
  return mix(uColor1, uColor2, d);
}

vec3 patternConicGradient(vec2 uv, float t) {
  vec2 p = uv - 0.5;
  float angle = atan(p.y, p.x);
  float s = qSinFreq(uSpeed);
  float norm = fract((angle + PI) / TAU + t * s * 0.1);
  return mix(uColor1, uColor2, norm);
}

vec3 patternNoise(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv * uScale * 4.0 + t * s * 0.3;
  float turb = uTurbulence;
  float n = fbm(p + turb * fbm(p + t * s * 0.1, int(uOctaves)), int(uOctaves));
  return mix(uColor1, uColor2, n);
}

vec3 patternGrid(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv * uScale * 10.0 + t * s * 0.5;
  vec2 g = abs(fract(p) - 0.5);
  float line = 1.0 - smoothstep(0.0, uLineWidth, min(g.x, g.y));
  return mix(uColor1, uColor2, line);
}

vec3 patternDots(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv * uScale * 10.0 + t * s * 0.5;
  vec2 cell = fract(p) - 0.5;
  float d = length(cell);
  float dot = 1.0 - smoothstep(uDotSize - 0.02, uDotSize, d);
  return mix(uColor1, uColor2, dot);
}

vec3 patternConcentric(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = (uv - 0.5) * uScale * 10.0;
  float d = length(p) - t * s * 2.0;
  float ring = abs(fract(d * uRingWidth * 10.0) - 0.5) * 2.0;
  ring = smoothstep(0.3, 0.5, ring);
  return mix(uColor1, uColor2, ring);
}

vec3 patternSpiral(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv - 0.5;
  float angle = atan(p.y, p.x);
  float dist = length(p) * uScale * 4.0;
  float spiral = sin(angle * uArms + dist * uTwist - t * s * 3.0) * 0.5 + 0.5;
  return mix(uColor1, uColor2, spiral);
}

vec3 patternStarfield(vec2 uv, float t) {
  float s = qSinFreq(uTwinkleSpeed);
  vec3 col = uColor1;
  vec2 p = uv * uScale;
  float cellSize = 1.0 / sqrt(uDensity);
  vec2 cell = floor(p / cellSize);
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 neighbor = cell + vec2(float(dx), float(dy));
      vec2 starPos = (neighbor + hash22(neighbor)) * cellSize;
      float d = length(p - starPos);
      float brightness = hash21(neighbor * 7.13);
      float twinkle = sin(t * s * (2.0 + brightness * 4.0) + brightness * TAU) * 0.3 + 0.7;
      float star = smoothstep(cellSize * 0.3, 0.0, d) * brightness * twinkle;
      col += uColor2 * star;
    }
  }
  return col;
}

vec3 patternVoronoi(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv * uCellCount * uScale;
  float minDist = 10.0;
  float secondDist = 10.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = floor(p) + vec2(float(x), float(y));
      vec2 cellCenter = cell + hash22(cell);
      cellCenter += 0.3 * sin(t * s + hash22(cell) * TAU);
      float d = length(p - cellCenter);
      if (d < minDist) {
        secondDist = minDist;
        minDist = d;
      } else if (d < secondDist) {
        secondDist = d;
      }
    }
  }
  float edge = secondDist - minDist;
  edge = 1.0 - smoothstep(0.0, 0.15, edge);
  return mix(uColor1, uColor2, edge);
}

vec3 patternWaves(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec3 col = uColor1;
  for (float i = 0.0; i < 8.0; i++) {
    if (i >= uLayers) break;
    float phase = i * PI / uLayers;
    float freq = (i + 1.0) * 3.0 * uScale;
    float wave = sin(uv.x * freq + t * s * 2.0 + phase) * uAmplitude;
    float band = smoothstep(0.0, 0.02, abs(uv.y - 0.5 - wave + (i - uLayers * 0.5) * 0.08));
    col = mix(uColor2, col, band);
  }
  return col;
}

vec3 patternKaleidoscope(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv - 0.5;
  float angle = atan(p.y, p.x);
  float segAngle = TAU / uSegments;
  angle = mod(angle, segAngle);
  if (angle > segAngle * 0.5) angle = segAngle - angle;
  float dist = length(p) * uScale * 4.0;
  float pattern = sin(dist * 5.0 - t * s * 3.0) * cos(angle * 3.0 + t * s) * 0.5 + 0.5;
  float n = noise2d(vec2(dist, angle * 3.0) + t * s * 0.5);
  pattern = mix(pattern, n, 0.3);
  return mix(uColor1, uColor2, pattern);
}

vec3 patternDiamondPlate(vec2 uv, float t) {
  float s = qSinFreq(uSpeed);
  vec2 p = uv * uScale * 10.0 + t * s * 0.5;
  vec2 q = abs(fract(p) - 0.5);
  float diamond = (q.x + q.y);
  float border = smoothstep(0.5 - uBorderWidth, 0.5, diamond);
  return mix(uColor1, uColor2, border);
}

void main() {
  float t = uTime;
  vec3 col;

  if (uPattern == 0) col = patternSolid();
  else if (uPattern == 1) col = patternLinearGradient(vUv);
  else if (uPattern == 2) col = patternRadialGradient(vUv);
  else if (uPattern == 3) col = patternConicGradient(vUv, t);
  else if (uPattern == 4) col = patternNoise(vUv, t);
  else if (uPattern == 5) col = patternGrid(vUv, t);
  else if (uPattern == 6) col = patternDots(vUv, t);
  else if (uPattern == 7) col = patternConcentric(vUv, t);
  else if (uPattern == 8) col = patternSpiral(vUv, t);
  else if (uPattern == 9) col = patternStarfield(vUv, t);
  else if (uPattern == 10) col = patternVoronoi(vUv, t);
  else if (uPattern == 11) col = patternWaves(vUv, t);
  else if (uPattern == 12) col = patternKaleidoscope(vUv, t);
  else if (uPattern == 13) col = patternDiamondPlate(vUv, t);
  else col = uColor1;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ── Component ───────────────────────────────────────────────

export const BackgroundPattern: React.FC<{ config: BgPatternConfig }> = ({ config }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const loopDuration = useLoopDuration();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPattern: { value: 0 },
      uColor1: { value: new THREE.Color('#000000') },
      uColor2: { value: new THREE.Color('#1a1a2e') },
      uSpeed: { value: 0 },
      uScale: { value: 1 },
      uLoopDuration: { value: 0 },
      // Per-pattern
      uAngle: { value: 0 },
      uCenterX: { value: 0.5 },
      uCenterY: { value: 0.5 },
      uOctaves: { value: 4 },
      uTurbulence: { value: 0.5 },
      uLineWidth: { value: 0.03 },
      uDotSize: { value: 0.15 },
      uRingWidth: { value: 0.08 },
      uArms: { value: 4 },
      uTwist: { value: 3 },
      uDensity: { value: 200 },
      uTwinkleSpeed: { value: 2 },
      uCellCount: { value: 12 },
      uLayers: { value: 4 },
      uAmplitude: { value: 0.1 },
      uSegments: { value: 6 },
      uBorderWidth: { value: 0.04 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uLoopDuration.value = loopDuration ?? 0;
    mat.uniforms.uPattern.value = PATTERN_INDEX[config.pattern] ?? 0;

    const p = config.params;
    mat.uniforms.uColor1.value.set(p.color1 ?? '#000000');
    mat.uniforms.uColor2.value.set(p.color2 ?? '#1a1a2e');
    mat.uniforms.uSpeed.value = p.speed ?? 0;
    mat.uniforms.uScale.value = p.scale ?? 1;

    // Per-pattern
    mat.uniforms.uAngle.value = p.angle ?? 0;
    mat.uniforms.uCenterX.value = p.centerX ?? 0.5;
    mat.uniforms.uCenterY.value = p.centerY ?? 0.5;
    mat.uniforms.uOctaves.value = p.octaves ?? 4;
    mat.uniforms.uTurbulence.value = p.turbulence ?? 0.5;
    mat.uniforms.uLineWidth.value = p.lineWidth ?? 0.03;
    mat.uniforms.uDotSize.value = p.dotSize ?? 0.15;
    mat.uniforms.uRingWidth.value = p.ringWidth ?? 0.08;
    mat.uniforms.uArms.value = p.arms ?? 4;
    mat.uniforms.uTwist.value = p.twist ?? 3;
    mat.uniforms.uDensity.value = p.density ?? 200;
    mat.uniforms.uTwinkleSpeed.value = p.twinkleSpeed ?? 2;
    mat.uniforms.uCellCount.value = p.cellCount ?? 12;
    mat.uniforms.uLayers.value = p.layers ?? 4;
    mat.uniforms.uAmplitude.value = p.amplitude ?? 0.1;
    mat.uniforms.uSegments.value = p.segments ?? 6;
    mat.uniforms.uBorderWidth.value = p.borderWidth ?? 0.04;
  });

  return (
    <mesh renderOrder={-99999} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};
