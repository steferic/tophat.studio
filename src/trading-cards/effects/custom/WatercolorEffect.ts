import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

/**
 * Watercolor painting effect.
 *
 * Based on Luft & Deussen's real-time watercolor technique and
 * Bousseau et al.'s "Watercolor Inspired Non-Photorealistic Rendering."
 *
 * Pipeline (single-pass approximation):
 *  1. Paper texture distortion — wobble UVs with layered noise to simulate
 *     paint spreading on rough paper (Worley-like FBM noise)
 *  2. Color abstraction — small Kuwahara-style simplification to flatten
 *     colors while preserving edges (bilateral-inspired)
 *  3. Edge darkening — Sobel edge detection → darken edges to simulate
 *     pigment pooling at wet boundaries (Luft & Deussen)
 *  4. Pigment granulation — multiply with procedural paper noise so paint
 *     appears to sit in the valleys of textured paper
 *  5. Palette softening — desaturate + warm tint for that watercolor feel
 *
 * Params:
 *   wetness    — color simplification intensity (0 = crisp, 1 = very soft)
 *   edgeInk    — edge darkening / pigment pooling strength (0-1)
 *   paperGrain — paper texture distortion + granulation (0-1)
 */

const WATERCOLOR_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

uniform float wetness;
uniform float edgeInk;
uniform float paperGrain;

// --- Noise functions ---

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// 2D value noise with smooth interpolation
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM — layered noise for richer paper texture
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8); // rotate each octave
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// --- Sobel edge detection ---

float sobelEdge(vec2 uv, vec2 texel) {
  // 3x3 luminance samples
  float tl = dot(texture2D(inputBuffer, uv + vec2(-1.0, -1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float tc = dot(texture2D(inputBuffer, uv + vec2( 0.0, -1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float tr = dot(texture2D(inputBuffer, uv + vec2( 1.0, -1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float ml = dot(texture2D(inputBuffer, uv + vec2(-1.0,  0.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float mr = dot(texture2D(inputBuffer, uv + vec2( 1.0,  0.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float bl = dot(texture2D(inputBuffer, uv + vec2(-1.0,  1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float bc = dot(texture2D(inputBuffer, uv + vec2( 0.0,  1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));
  float br = dot(texture2D(inputBuffer, uv + vec2( 1.0,  1.0) * texel).rgb, vec3(0.299, 0.587, 0.114));

  float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float gy = -tl - 2.0*tc - tr + bl + 2.0*bc + br;

  return sqrt(gx*gx + gy*gy);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 texel = 1.0 / resolution;

  // 1. Paper texture distortion — wobble UVs
  float animOffset = uTime * qSinFreq(0.2);
  float distortAmount = paperGrain * 0.006;
  vec2 paperUV = uv * 35.0 + animOffset;
  vec2 distortion = vec2(
    fbm(paperUV) - 0.5,
    fbm(paperUV + 43.0) - 0.5
  ) * distortAmount;
  vec2 warpedUV = uv + distortion;

  // 2. Color abstraction — small bilateral/Kuwahara simplification
  //    Average nearby pixels, weighted by color similarity + spatial distance
  vec3 centerColor = texture2D(inputBuffer, warpedUV).rgb;
  vec3 colorAcc = vec3(0.0);
  float weightAcc = 0.0;

  float spatialSigma = 1.0 + wetness * 2.5; // spatial spread
  float rangeSigma = mix(0.08, 0.25, wetness); // color tolerance

  for (int x = -3; x <= 3; x++) {
    for (int y = -3; y <= 3; y++) {
      vec2 off = vec2(float(x), float(y));
      float spatialDist = length(off);
      if (spatialDist > 3.5) continue;

      vec2 sampleUV = warpedUV + off * texel * (1.0 + wetness * 0.5);
      vec3 samp = texture2D(inputBuffer, sampleUV).rgb;

      // Bilateral weights: spatial Gaussian × color similarity Gaussian
      float sw = exp(-(spatialDist * spatialDist) / (2.0 * spatialSigma * spatialSigma));
      float colorDist = length(samp - centerColor);
      float cw = exp(-(colorDist * colorDist) / (2.0 * rangeSigma * rangeSigma));

      float w = sw * cw;
      colorAcc += samp * w;
      weightAcc += w;
    }
  }
  vec3 simplified = colorAcc / max(weightAcc, 0.001);

  // 3. Edge darkening — pigment pools at wet boundaries
  float edge = sobelEdge(warpedUV, texel);
  float edgeDark = smoothstep(0.04, 0.3, edge);
  // Darken toward a warm brown (pigment pooling color)
  vec3 poolColor = mix(simplified, simplified * vec3(0.35, 0.28, 0.22), edgeDark * edgeInk);

  // 4. Pigment granulation — paint sits in paper valleys
  float grain = fbm(uv * 120.0);
  // Map to subtle brightness modulation
  float granulation = mix(1.0, 0.85 + grain * 0.3, paperGrain * 0.6);
  vec3 grained = poolColor * granulation;

  // 5. Palette softening — desaturate slightly + warm paper undertone
  float luma = dot(grained, vec3(0.299, 0.587, 0.114));
  vec3 desaturated = mix(vec3(luma), grained, 0.75 + wetness * 0.1);

  // Warm paper tint (off-white cream)
  vec3 paperTint = vec3(0.99, 0.97, 0.93);
  vec3 result = desaturated * mix(vec3(1.0), paperTint, 0.35);

  outputColor = vec4(result, inputColor.a);
}
`;

export class WatercolorEffect extends Effect {
  constructor({
    wetness = 0.5,
    edgeInk = 0.6,
    paperGrain = 0.5,
  }: { wetness?: number; edgeInk?: number; paperGrain?: number } = {}) {
    const uniforms = loopUniforms();
    uniforms.set('wetness', new Uniform(wetness));
    uniforms.set('edgeInk', new Uniform(edgeInk));
    uniforms.set('paperGrain', new Uniform(paperGrain));
    super('WatercolorEffect', WATERCOLOR_FRAG, { uniforms });
  }
}
