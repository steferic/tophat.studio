import { Uniform } from 'three';
import { Effect } from 'postprocessing';

/**
 * Generalized Kuwahara filter — oil painting effect.
 *
 * Based on the Papari et al. extension of the classic Kuwahara filter
 * as described in "On Crafting Painterly Shaders" (Maxime Heckel).
 *
 * Uses 4 overlapping quadrants with Gaussian weighting. For each pixel,
 * computes mean + variance in each quadrant and picks the quadrant with
 * the lowest variance (most uniform color). This flattens color into
 * paint-stroke-like regions while preserving edges.
 *
 * Reference: Kyprianidis et al., NPAR 2009
 *
 * Params:
 *   radius    — brush size in pixels (larger = more painterly)
 *   sharpness — blend exponent (higher = harder color region edges)
 */

const KUWAHARA_FRAG = /* glsl */ `
uniform float radius;
uniform float sharpness;

#define MAX_KERNEL 10

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = 1.0 / resolution;
  int r = int(radius);

  // 4 overlapping quadrant accumulators
  vec3 mean0 = vec3(0.0), mean1 = vec3(0.0), mean2 = vec3(0.0), mean3 = vec3(0.0);
  vec3 sqm0  = vec3(0.0), sqm1  = vec3(0.0), sqm2  = vec3(0.0), sqm3  = vec3(0.0);
  float cnt0 = 0.0, cnt1 = 0.0, cnt2 = 0.0, cnt3 = 0.0;

  // Fixed-bound loop; runtime guard via continue
  for (int j = -MAX_KERNEL; j <= MAX_KERNEL; j++) {
    for (int i = -MAX_KERNEL; i <= MAX_KERNEL; i++) {
      if (abs(i) > r || abs(j) > r) continue;

      vec2 off = vec2(float(i), float(j));

      // Gaussian spatial weight (sigma = radius/2)
      float d2 = dot(off, off);
      float sigma = radius * 0.5;
      float gw = exp(-d2 / (2.0 * sigma * sigma));

      vec3 c = texture2D(inputBuffer, uv + off * px).rgb;
      vec3 cw = c * gw;
      vec3 csw = c * c * gw;

      // Accumulate into the quadrant(s) this pixel belongs to
      // Quadrants overlap at the axes (shared row/column)
      if (i <= 0 && j <= 0) { mean0 += cw; sqm0 += csw; cnt0 += gw; }
      if (i >= 0 && j <= 0) { mean1 += cw; sqm1 += csw; cnt1 += gw; }
      if (i <= 0 && j >= 0) { mean2 += cw; sqm2 += csw; cnt2 += gw; }
      if (i >= 0 && j >= 0) { mean3 += cw; sqm3 += csw; cnt3 += gw; }
    }
  }

  // Compute per-quadrant mean, variance, and weight
  vec3 result = vec3(0.0);
  float totalW = 0.0;

  // Quadrant 0
  if (cnt0 > 0.0) {
    vec3 m = mean0 / cnt0;
    float v = dot((sqm0 / cnt0) - m * m, vec3(0.299, 0.587, 0.114));
    float w = exp(-v * sharpness * 10.0);
    result += m * w;
    totalW += w;
  }
  // Quadrant 1
  if (cnt1 > 0.0) {
    vec3 m = mean1 / cnt1;
    float v = dot((sqm1 / cnt1) - m * m, vec3(0.299, 0.587, 0.114));
    float w = exp(-v * sharpness * 10.0);
    result += m * w;
    totalW += w;
  }
  // Quadrant 2
  if (cnt2 > 0.0) {
    vec3 m = mean2 / cnt2;
    float v = dot((sqm2 / cnt2) - m * m, vec3(0.299, 0.587, 0.114));
    float w = exp(-v * sharpness * 10.0);
    result += m * w;
    totalW += w;
  }
  // Quadrant 3
  if (cnt3 > 0.0) {
    vec3 m = mean3 / cnt3;
    float v = dot((sqm3 / cnt3) - m * m, vec3(0.299, 0.587, 0.114));
    float w = exp(-v * sharpness * 10.0);
    result += m * w;
    totalW += w;
  }

  outputColor = vec4(result / max(totalW, 0.001), inputColor.a);
}
`;

export class KuwaharaEffect extends Effect {
  constructor({
    radius = 8.0,
    sharpness = 8.0,
  }: { radius?: number; sharpness?: number } = {}) {
    super('KuwaharaEffect', KUWAHARA_FRAG, {
      uniforms: new Map([
        ['radius', new Uniform(radius)],
        ['sharpness', new Uniform(sharpness)],
      ]),
    });
  }
}
