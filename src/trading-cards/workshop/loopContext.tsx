import { createContext, useContext } from 'react';

/**
 * Loop-duration context — provides the active recording loop duration (in seconds)
 * to every component inside the R3F Canvas tree.
 *
 * When `null`, no recording is active and all helpers return the original value.
 */
const LoopContext = createContext<number | null>(null);

export const LoopProvider = LoopContext.Provider;

export function useLoopDuration(): number | null {
  return useContext(LoopContext);
}

const TAU = Math.PI * 2;

/**
 * Quantize a frequency so that `sin(t * qf(freq))` completes an exact integer
 * number of full cycles within `loopDuration` seconds.
 *
 * This guarantees `sin(0 * f) === sin(D * f)` at the loop boundary,
 * eliminating visual jumps in the GIF.
 *
 * Works for sin, cos, and angular-velocity patterns (`rotation.y = t * vel`).
 */
export function qf(freq: number, loopDuration: number | null): number {
  if (!loopDuration || loopDuration <= 0) return freq;
  const cycles = Math.max(1, Math.round(freq * loopDuration / TAU));
  return cycles * TAU / loopDuration;
}

// ── GLSL helpers (injected into shaders that need loop-aware frequencies) ──

/**
 * Uniform declaration + helper functions for loop-aware frequency quantization
 * in vertex/fragment shaders.
 *
 * Usage in GLSL:
 *   float f = qSinFreq(5.0);   // quantize for sin/cos
 *   float g = qLinFreq(15.0);   // quantize for fract/linear
 */
export const LOOP_QUANTIZE_UNIFORMS_GLSL = /* glsl */ `
uniform float uLoopDuration;
`;

export const LOOP_QUANTIZE_HELPERS_GLSL = /* glsl */ `
float qSinFreq(float freq) {
  if (uLoopDuration <= 0.0) return freq;
  float TAU = 6.283185307179586;
  float cycles = max(1.0, floor(freq * uLoopDuration / TAU + 0.5));
  return cycles * TAU / uLoopDuration;
}
float qLinFreq(float freq) {
  if (uLoopDuration <= 0.0) return freq;
  float cycles = max(1.0, floor(freq * uLoopDuration + 0.5));
  return cycles / uLoopDuration;
}
`;
