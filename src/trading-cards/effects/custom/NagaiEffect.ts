import { Uniform } from 'three';
import { Effect } from 'postprocessing';

/**
 * Hiroshi Nagai / retro-pop illustration effect.
 *
 * Emulates the look of Nagai's iconic city-pop album cover paintings:
 * bold flat colors, hyper-saturated warm palette (pool blues, sunset
 * oranges, palm greens), strong geometric edge outlines, and a dreamy
 * quality from smooth posterization.
 *
 * Technique:
 *  1. HSV color manipulation — boost saturation, shift hues toward
 *     Nagai's signature warm palette
 *  2. Smooth posterization — quantize via smooth staircase function
 *     (avoids harsh banding of floor-based posterize)
 *  3. Sobel edge outlines — warm dark brown outlines (not black)
 *  4. Vignette — subtle frame-like darkening
 *
 * Params:
 *   levels   — posterization steps (fewer = more graphic, 3-16)
 *   warmth   — palette shift toward Nagai sunset tones (0-1)
 *   edgeBold — outline strength and darkness (0-1)
 *   satBoost — saturation multiplier (1 = normal, up to 2.5)
 */

const NAGAI_FRAG = /* glsl */ `
uniform float levels;
uniform float warmth;
uniform float edgeBold;
uniform float satBoost;

// --- HSV conversion (standard Hue-Saturation-Value) ---

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// --- Smooth posterization ---
// Staircase function with smooth transitions (avoids harsh banding)
float smoothPosterize(float x, float n) {
  float stepped = floor(x * n + 0.5) / n;
  // Smooth interpolation toward the step
  float frac = fract(x * n + 0.5);
  float blend = smoothstep(0.0, 0.15, frac) * smoothstep(1.0, 0.85, frac);
  return mix(stepped, x, blend * 0.3);
}

// --- Sobel edge detection ---

float sobelEdge(vec2 uv, vec2 texel) {
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
  vec3 color = texture2D(inputBuffer, uv).rgb;

  // 1. Warm palette shift in HSV space
  vec3 hsv = rgb2hsv(color);

  // Nagai's palette: cerulean pool blue, sunset orange/pink, warm palm green
  // Shift hues toward these anchor points based on their current region
  float h = hsv.x; // 0-1 hue

  // Blues (0.5-0.72) → cerulean/teal (0.53)
  float blueWeight = smoothstep(0.5, 0.55, h) * smoothstep(0.72, 0.67, h);
  h = mix(h, 0.53, blueWeight * warmth * 0.5);

  // Reds/oranges (0.0-0.12, 0.88-1.0) → warm sunset orange (0.06)
  float redWeight = 1.0 - smoothstep(0.0, 0.15, h) * smoothstep(1.0, 0.85, h);
  // Handle hue wrapping
  float warmRed = smoothstep(0.88, 0.92, h) + (1.0 - smoothstep(0.0, 0.12, h));
  h = mix(h, 0.06, warmRed * warmth * 0.35);

  // Greens (0.2-0.45) → warm yellow-green (0.22)
  float greenWeight = smoothstep(0.2, 0.25, h) * smoothstep(0.45, 0.4, h);
  h = mix(h, 0.22, greenWeight * warmth * 0.4);

  hsv.x = h;

  // Saturation boost
  hsv.y = min(hsv.y * satBoost, 1.0);

  // Warm up shadows slightly (lift shadow brightness)
  hsv.z = mix(hsv.z, pow(hsv.z, 0.92), warmth * 0.25);

  color = hsv2rgb(hsv);

  // 2. Smooth posterization
  color.r = smoothPosterize(color.r, levels);
  color.g = smoothPosterize(color.g, levels);
  color.b = smoothPosterize(color.b, levels);

  // 3. Bold edge outlines
  float edge = sobelEdge(uv, texel);
  float edgeStrength = smoothstep(0.06, 0.2, edge) * edgeBold;
  // Warm dark brown outline (not pure black — feels more painterly)
  vec3 outlineColor = vec3(0.12, 0.08, 0.06);
  color = mix(color, outlineColor, edgeStrength);

  // 4. Subtle vignette — painted/framed feel
  vec2 vc = uv - 0.5;
  float vignette = 1.0 - dot(vc, vc) * 0.4;
  color *= mix(1.0, vignette, 0.25);

  outputColor = vec4(color, inputColor.a);
}
`;

export class NagaiEffect extends Effect {
  constructor({
    levels = 8.0,
    warmth = 0.6,
    edgeBold = 0.7,
    satBoost = 1.4,
  }: { levels?: number; warmth?: number; edgeBold?: number; satBoost?: number } = {}) {
    super('NagaiEffect', NAGAI_FRAG, {
      uniforms: new Map([
        ['levels', new Uniform(levels)],
        ['warmth', new Uniform(warmth)],
        ['edgeBold', new Uniform(edgeBold)],
        ['satBoost', new Uniform(satBoost)],
      ]),
    });
  }
}
