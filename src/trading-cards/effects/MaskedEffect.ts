import { Uniform } from 'three';
import { Effect } from 'postprocessing';

// ── GLSL Fragment Shader ─────────────────────────────────────

const MASKED_FRAG = /* glsl */ `
// Loop-quantization helpers (shared with customEffects.ts)
uniform float uTime;
uniform float uLoopDuration;

float qLinFreq(float freq) {
  if (freq <= 0.0) return 0.0;
  if (uLoopDuration <= 0.0) return freq;
  float cycles = max(1.0, floor(freq * uLoopDuration + 0.5));
  return cycles / uLoopDuration;
}

// Mask globals
uniform int uPattern;
uniform float uCellSizeX;
uniform float uCellSizeY;
uniform float uAspect;
uniform float uSpeed;
uniform float uSoftness;
uniform float uInvert;

// Zone A params
uniform float uA_grayscale;
uniform float uA_sepia;
uniform float uA_invert;
uniform float uA_hueRotation;
uniform float uA_saturation;
uniform float uA_brightness;
uniform float uA_contrast;
uniform float uA_posterize;
uniform vec3  uA_tintColor;
uniform float uA_tintAmount;

// Zone B params
uniform float uB_grayscale;
uniform float uB_sepia;
uniform float uB_invert;
uniform float uB_hueRotation;
uniform float uB_saturation;
uniform float uB_brightness;
uniform float uB_contrast;
uniform float uB_posterize;
uniform vec3  uB_tintColor;
uniform float uB_tintAmount;

// ── Mask pattern computation ─────────────────────────────────

float computeMask(vec2 uv, vec2 cs, float time, float speed, float softness) {
  float offset = time * qLinFreq(speed);
  float raw = 0.0;

  // Pattern 0: Checkerboard
  if (uPattern == 0) {
    vec2 cell = floor((uv + offset) / cs);
    raw = mod(cell.x + cell.y, 2.0);
  }
  // Pattern 1: Vertical Stripes
  else if (uPattern == 1) {
    raw = mod(floor((uv.x + offset) / cs.x), 2.0);
  }
  // Pattern 2: Horizontal Stripes
  else if (uPattern == 2) {
    raw = mod(floor((uv.y + offset) / cs.y), 2.0);
  }
  // Pattern 3: Hexagonal
  else if (uPattern == 3) {
    float s = cs.x * 1.732; // sqrt(3)
    vec2 p = uv + offset;
    vec2 hex = vec2(p.x / s, (p.y - mod(floor(p.x / s), 2.0) * cs.y * 0.5) / cs.y);
    raw = mod(floor(hex.x) + floor(hex.y), 2.0);
  }
  // Pattern 4: Radial Sectors
  else if (uPattern == 4) {
    vec2 centered = uv - 0.5;
    float angle = atan(centered.y, centered.x) + 3.14159265;
    float sectors = max(2.0, floor(6.2831853 / cs.x));
    raw = mod(floor((angle + offset) / (6.2831853 / sectors)), 2.0);
  }
  // Pattern 5: Diamond
  else if (uPattern == 5) {
    vec2 p = (uv + offset) / cs;
    raw = mod(floor(p.x + p.y) + floor(p.x - p.y), 2.0);
  }
  // Pattern 6: Wave
  else if (uPattern == 6) {
    float wave = sin((uv.x + offset) / cs.x * 6.2831853) * cs.y * 2.0;
    raw = step(0.0, uv.y - 0.5 + wave);
  }
  // Pattern 7: Diagonal Stripes
  else if (uPattern == 7) {
    float avg = (cs.x + cs.y) * 0.5;
    raw = mod(floor((uv.x + uv.y + offset) / avg), 2.0);
  }

  // Apply softness
  if (softness > 0.0) {
    float frac_val;
    if (uPattern == 0) {
      vec2 frac_uv = fract((uv + offset) / cs);
      frac_val = min(min(frac_uv.x, 1.0 - frac_uv.x), min(frac_uv.y, 1.0 - frac_uv.y));
    } else if (uPattern == 1) {
      frac_val = abs(fract((uv.x + offset) / cs.x) - 0.5);
    } else if (uPattern == 2) {
      frac_val = abs(fract((uv.y + offset) / cs.y) - 0.5);
    } else {
      frac_val = 0.5;
    }
    float avgCs = (cs.x + cs.y) * 0.5;
    float edge = smoothstep(0.0, softness / avgCs, frac_val);
    raw = mix(1.0 - raw, raw, edge);
  }

  return clamp(raw, 0.0, 1.0);
}

// ── Per-zone color transforms ────────────────────────────────

vec3 applyHueRotation(vec3 color, float angle) {
  if (angle == 0.0) return color;
  float c = cos(angle);
  float s = sin(angle);
  mat3 rot = mat3(
    0.299 + 0.701*c + 0.168*s, 0.587 - 0.587*c + 0.330*s, 0.114 - 0.114*c - 0.497*s,
    0.299 - 0.299*c - 0.328*s, 0.587 + 0.413*c + 0.035*s, 0.114 - 0.114*c + 0.292*s,
    0.299 - 0.300*c + 1.250*s, 0.587 - 0.588*c - 1.050*s, 0.114 + 0.886*c - 0.203*s
  );
  return rot * color;
}

vec3 applyZoneEffects(
  vec3 color,
  float grayscale, float sepia, float invertAmt,
  float hueRot, float sat, float bright, float contrast,
  float posterize, vec3 tintCol, float tintAmt
) {
  // Brightness
  color *= bright;

  // Contrast (around 0.5 midpoint)
  color = (color - 0.5) * contrast + 0.5;

  // Hue rotation
  color = applyHueRotation(color, hueRot);

  // Luma (computed once, reused by saturation/grayscale/sepia)
  float luma = dot(color, vec3(0.299, 0.587, 0.114));

  // Saturation
  color = mix(vec3(luma), color, sat);

  // Grayscale
  if (grayscale > 0.0) {
    color = mix(color, vec3(luma), grayscale);
  }

  // Sepia
  if (sepia > 0.0) {
    vec3 sepiaColor = vec3(luma * 1.2, luma * 1.0, luma * 0.8);
    color = mix(color, sepiaColor, sepia);
  }

  // Invert
  if (invertAmt > 0.0) {
    color = mix(color, 1.0 - color, invertAmt);
  }

  // Posterize
  if (posterize > 1.0) {
    color = floor(color * posterize + 0.5) / posterize;
  }

  // Tint
  if (tintAmt > 0.0) {
    color = mix(color, color * tintCol, tintAmt);
  }

  return clamp(color, 0.0, 1.0);
}

// ── Main ─────────────────────────────────────────────────────

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 texColor = texture2D(inputBuffer, uv);
  vec3 color = texColor.rgb;

  // Aspect-correct UV so equal cell sizes produce visual squares
  vec2 auv = vec2(uv.x * uAspect, uv.y);
  float mask = computeMask(auv, vec2(uCellSizeX, uCellSizeY), uTime, uSpeed, uSoftness);

  // Invert zones if requested
  if (uInvert > 0.5) mask = 1.0 - mask;

  vec3 colorA = applyZoneEffects(
    color,
    uA_grayscale, uA_sepia, uA_invert,
    uA_hueRotation, uA_saturation, uA_brightness, uA_contrast,
    uA_posterize, uA_tintColor, uA_tintAmount
  );

  vec3 colorB = applyZoneEffects(
    color,
    uB_grayscale, uB_sepia, uB_invert,
    uB_hueRotation, uB_saturation, uB_brightness, uB_contrast,
    uB_posterize, uB_tintColor, uB_tintAmount
  );

  vec3 result = mix(colorA, colorB, mask);
  outputColor = vec4(result, texColor.a);
}
`;

// ── Effect Class ─────────────────────────────────────────────

function buildUniforms(): Map<string, Uniform> {
  const m = new Map<string, Uniform>();
  const entries: [string, any][] = [
    // Loop
    ['uTime', new Uniform(0)],
    ['uLoopDuration', new Uniform(0)],
    // Mask globals
    ['uPattern', new Uniform(0)],
    ['uCellSizeX', new Uniform(0.1)],
    ['uCellSizeY', new Uniform(0.1)],
    ['uAspect', new Uniform(1)],
    ['uSpeed', new Uniform(0)],
    ['uSoftness', new Uniform(0)],
    ['uInvert', new Uniform(0)],
    // Zone A
    ['uA_grayscale', new Uniform(0)],
    ['uA_sepia', new Uniform(0)],
    ['uA_invert', new Uniform(0)],
    ['uA_hueRotation', new Uniform(0)],
    ['uA_saturation', new Uniform(1)],
    ['uA_brightness', new Uniform(1)],
    ['uA_contrast', new Uniform(1)],
    ['uA_posterize', new Uniform(0)],
    ['uA_tintColor', new Uniform([1, 1, 1])],
    ['uA_tintAmount', new Uniform(0)],
    // Zone B
    ['uB_grayscale', new Uniform(0)],
    ['uB_sepia', new Uniform(0)],
    ['uB_invert', new Uniform(0)],
    ['uB_hueRotation', new Uniform(0)],
    ['uB_saturation', new Uniform(1)],
    ['uB_brightness', new Uniform(1)],
    ['uB_contrast', new Uniform(1)],
    ['uB_posterize', new Uniform(0)],
    ['uB_tintColor', new Uniform([1, 1, 1])],
    ['uB_tintAmount', new Uniform(0)],
  ];
  for (const [k, v] of entries) m.set(k, v);
  return m;
}

export class MaskedEffect extends Effect {
  constructor() {
    super('MaskedEffect', MASKED_FRAG, { uniforms: buildUniforms() });
  }
}
