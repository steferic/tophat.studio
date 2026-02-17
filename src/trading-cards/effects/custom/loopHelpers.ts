import { Uniform } from 'three';

export const LOOP_HELPERS_GLSL = /* glsl */ `
uniform float uTime;
uniform float uLoopDuration;

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

/** Standard uniforms for animated effects (uTime + uLoopDuration) */
export function loopUniforms(): Map<string, Uniform> {
  return new Map([
    ['uTime', new Uniform(0)],
    ['uLoopDuration', new Uniform(0)],
  ]);
}
