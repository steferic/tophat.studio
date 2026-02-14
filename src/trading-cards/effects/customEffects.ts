import { Uniform } from 'three';
import { Effect } from 'postprocessing';

// ── Night Vision ────────────────────────────────────────────

const NIGHT_VISION_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Noise
  float noise = fract(sin(dot(uv * time * 80.0, vec2(12.9898, 78.233))) * 43758.5453);
  luma += (noise - 0.5) * 0.15;

  // Vignette
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 2.0;
  luma *= clamp(vignette, 0.0, 1.0);

  outputColor = vec4(luma * 0.1, luma * 0.95, luma * 0.2, 1.0);
}
`;

export class NightVisionEffect extends Effect {
  constructor() {
    super('NightVisionEffect', NIGHT_VISION_FRAG, { uniforms: new Map() });
  }
}

// ── Thermal ─────────────────────────────────────────────────

const THERMAL_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  vec3 thermal;
  if (luma < 0.2) {
    thermal = mix(vec3(0.0, 0.0, 0.15), vec3(0.1, 0.0, 0.6), luma / 0.2);
  } else if (luma < 0.4) {
    thermal = mix(vec3(0.1, 0.0, 0.6), vec3(0.8, 0.0, 0.2), (luma - 0.2) / 0.2);
  } else if (luma < 0.6) {
    thermal = mix(vec3(0.8, 0.0, 0.2), vec3(1.0, 0.5, 0.0), (luma - 0.4) / 0.2);
  } else if (luma < 0.8) {
    thermal = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (luma - 0.6) / 0.2);
  } else {
    thermal = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (luma - 0.8) / 0.2);
  }

  outputColor = vec4(thermal, 1.0);
}
`;

export class ThermalEffect extends Effect {
  constructor() {
    super('ThermalEffect', THERMAL_FRAG, { uniforms: new Map() });
  }
}

// ── Posterize ───────────────────────────────────────────────

const POSTERIZE_FRAG = /* glsl */ `
uniform float levels;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  vec3 posterized = floor(color.rgb * levels + 0.5) / levels;
  outputColor = vec4(posterized, color.a);
}
`;

export class PosterizeEffect extends Effect {
  constructor({ levels = 5.0 }: { levels?: number } = {}) {
    super('PosterizeEffect', POSTERIZE_FRAG, {
      uniforms: new Map([['levels', new Uniform(levels)]]),
    });
  }
}

// ── CRT ─────────────────────────────────────────────────────

const CRT_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Barrel distortion
  vec2 centered = uv - 0.5;
  float dist = dot(centered, centered);
  vec2 distorted = uv + centered * dist * 0.2;

  // Out-of-bounds check
  if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
    outputColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Scanlines
  float scanline = sin(distorted.y * resolution.y * 3.14159) * 0.06;

  // Chromatic aberration
  float r = texture2D(inputBuffer, distorted + vec2( 0.003, 0.0)).r;
  float g = texture2D(inputBuffer, distorted).g;
  float b = texture2D(inputBuffer, distorted + vec2(-0.003, 0.0)).b;

  vec3 color = vec3(r, g, b) - scanline;

  // Vignette
  float vignette = 1.0 - dist * 2.5;
  color *= clamp(vignette, 0.0, 1.0);

  outputColor = vec4(color, 1.0);
}
`;

export class CRTEffect extends Effect {
  constructor() {
    super('CRTEffect', CRT_FRAG, { uniforms: new Map() });
  }
}

// ── VHS ─────────────────────────────────────────────────────

const VHS_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Jitter
  float jitter = sin(time * 40.0 + uv.y * 300.0) * 0.002;
  vec2 distUV = uv + vec2(jitter, 0.0);

  // Color bleeding (vertical channel shift)
  float r = texture2D(inputBuffer, distUV + vec2(0.0,  0.004)).r;
  float g = texture2D(inputBuffer, distUV).g;
  float b = texture2D(inputBuffer, distUV + vec2(0.0, -0.004)).b;

  vec3 color = vec3(r, g, b);

  // Tracking band — thin horizontal noise band that scrolls
  float bandPos = fract(time * 0.08);
  float bandDist = abs(fract(uv.y) - bandPos);
  float band = smoothstep(0.0, 0.03, bandDist);
  color = mix(color * 0.4 + vec3(0.15, 0.05, 0.05), color, band);

  // Desaturation
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 0.75);

  // Noise grain
  float noise = fract(sin(dot(uv + fract(time), vec2(12.9898, 78.233))) * 43758.5453);
  color += (noise - 0.5) * 0.08;

  outputColor = vec4(color, 1.0);
}
`;

export class VHSEffect extends Effect {
  constructor() {
    super('VHSEffect', VHS_FRAG, { uniforms: new Map() });
  }
}

// ── Invert ──────────────────────────────────────────────────

const INVERT_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  outputColor = vec4(1.0 - color.rgb, color.a);
}
`;

export class InvertEffect extends Effect {
  constructor() {
    super('InvertEffect', INVERT_FRAG, { uniforms: new Map() });
  }
}

// ── Edge Detect (Sobel) ─────────────────────────────────────

const EDGE_DETECT_FRAG = /* glsl */ `
float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = 1.0 / resolution;

  float tl = luminance(texture2D(inputBuffer, uv + vec2(-px.x,  px.y)).rgb);
  float t  = luminance(texture2D(inputBuffer, uv + vec2( 0.0,   px.y)).rgb);
  float tr = luminance(texture2D(inputBuffer, uv + vec2( px.x,  px.y)).rgb);
  float l  = luminance(texture2D(inputBuffer, uv + vec2(-px.x,  0.0 )).rgb);
  float r  = luminance(texture2D(inputBuffer, uv + vec2( px.x,  0.0 )).rgb);
  float bl = luminance(texture2D(inputBuffer, uv + vec2(-px.x, -px.y)).rgb);
  float b  = luminance(texture2D(inputBuffer, uv + vec2( 0.0,  -px.y)).rgb);
  float br = luminance(texture2D(inputBuffer, uv + vec2( px.x, -px.y)).rgb);

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  float edge = sqrt(gx*gx + gy*gy);

  outputColor = vec4(vec3(edge), 1.0);
}
`;

export class EdgeDetectEffect extends Effect {
  constructor() {
    super('EdgeDetectEffect', EDGE_DETECT_FRAG, { uniforms: new Map() });
  }
}

// ── Underwater ──────────────────────────────────────────────

const UNDERWATER_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 warp = uv;
  warp.x += sin(uv.y * 20.0 + time * 2.0) * 0.008;
  warp.y += cos(uv.x * 15.0 + time * 1.5) * 0.006;

  vec4 color = texture2D(inputBuffer, warp);

  // Teal tint
  color.r *= 0.6;
  color.g *= 0.85;
  color.b *= 1.1;

  // Slight darkening at edges (depth)
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 0.8;
  color.rgb *= vignette;

  outputColor = color;
}
`;

export class UnderwaterEffect extends Effect {
  constructor() {
    super('UnderwaterEffect', UNDERWATER_FRAG, { uniforms: new Map() });
  }
}

// ── Duotone ─────────────────────────────────────────────────

const DUOTONE_FRAG = /* glsl */ `
uniform vec3 colorA;
uniform vec3 colorB;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  vec3 duotone = mix(colorA, colorB, luma);
  outputColor = vec4(duotone, color.a);
}
`;

export class DuotoneEffect extends Effect {
  constructor({ colorA = [0.0, 0.8, 0.9], colorB = [0.9, 0.1, 0.6] }: { colorA?: number[]; colorB?: number[] } = {}) {
    super('DuotoneEffect', DUOTONE_FRAG, {
      uniforms: new Map([
        ['colorA', new Uniform(colorA)],
        ['colorB', new Uniform(colorB)],
      ]),
    });
  }
}

// ── Hologram ────────────────────────────────────────────────

const HOLOGRAM_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Scanlines
  float scanline = sin(uv.y * resolution.y * 1.5) * 0.5 + 0.5;
  scanline = smoothstep(0.3, 0.7, scanline);

  // Flicker
  float flicker = 0.95 + 0.05 * sin(time * 12.0);

  // Blue hologram color
  vec3 holo = vec3(0.15, 0.5, 1.0) * luma * scanline * flicker;

  // Slight horizontal jitter
  float jitter = sin(time * 20.0 + uv.y * 100.0) * 0.001;
  vec3 shifted = texture2D(inputBuffer, uv + vec2(jitter, 0.0)).rgb;
  float shiftedLuma = dot(shifted, vec3(0.299, 0.587, 0.114));

  holo += vec3(0.05, 0.2, 0.4) * shiftedLuma * (1.0 - scanline) * flicker;

  outputColor = vec4(holo, 0.9);
}
`;

export class HologramEffect extends Effect {
  constructor() {
    super('HologramEffect', HOLOGRAM_FRAG, { uniforms: new Map() });
  }
}

// ── Kaleidoscope ────────────────────────────────────────────

const KALEIDOSCOPE_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 centered = uv - 0.5;

  // Convert to polar
  float r = length(centered);
  float a = atan(centered.y, centered.x);

  // 6-fold symmetry
  float segments = 6.0;
  float segmentAngle = 3.14159265 * 2.0 / segments;
  a = mod(a, segmentAngle);
  a = abs(a - segmentAngle * 0.5);

  // Back to cartesian
  vec2 mirrored = vec2(cos(a), sin(a)) * r + 0.5;

  outputColor = texture2D(inputBuffer, mirrored);
}
`;

export class KaleidoscopeEffect extends Effect {
  constructor() {
    super('KaleidoscopeEffect', KALEIDOSCOPE_FRAG, { uniforms: new Map() });
  }
}

// ── Retro LCD (Game Boy) ────────────────────────────────────

const RETRO_LCD_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Pixelate to grid
  vec2 gridSize = vec2(4.0) / resolution;
  vec2 snapped = gridSize * floor(uv / gridSize);
  vec4 color = texture2D(inputBuffer, snapped);

  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // 4-shade Game Boy palette
  vec3 shade;
  if (luma < 0.25)      shade = vec3(0.06, 0.22, 0.06);  // darkest
  else if (luma < 0.5)  shade = vec3(0.19, 0.38, 0.19);
  else if (luma < 0.75) shade = vec3(0.55, 0.67, 0.06);
  else                   shade = vec3(0.61, 0.74, 0.06);  // lightest

  // Subtle pixel grid lines
  vec2 pixelPos = fract(uv / gridSize);
  float grid = smoothstep(0.0, 0.08, pixelPos.x) * smoothstep(0.0, 0.08, pixelPos.y);
  shade *= 0.7 + 0.3 * grid;

  outputColor = vec4(shade, 1.0);
}
`;

export class RetroLCDEffect extends Effect {
  constructor() {
    super('RetroLCDEffect', RETRO_LCD_FRAG, { uniforms: new Map() });
  }
}

// ── Emboss ──────────────────────────────────────────────────

const EMBOSS_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = 1.0 / resolution;

  vec4 tl = texture2D(inputBuffer, uv + vec2(-px.x,  px.y));
  vec4 br = texture2D(inputBuffer, uv + vec2( px.x, -px.y));
  vec4 center = texture2D(inputBuffer, uv);

  vec4 emboss = center + (center - tl) * 2.0 - (br - center) * 2.0;
  float gray = dot(emboss.rgb, vec3(0.299, 0.587, 0.114));

  outputColor = vec4(vec3(gray * 0.5 + 0.5), 1.0);
}
`;

export class EmbossEffect extends Effect {
  constructor() {
    super('EmbossEffect', EMBOSS_FRAG, { uniforms: new Map() });
  }
}

// ── Ripple ──────────────────────────────────────────────────

const RIPPLE_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 centered = uv - 0.5;
  float dist = length(centered);

  float wave = sin(dist * 40.0 - time * 4.0) * 0.01;
  wave *= smoothstep(0.5, 0.0, dist); // fade at edges

  vec2 displaced = uv + normalize(centered + 0.001) * wave;

  outputColor = texture2D(inputBuffer, displaced);
}
`;

export class RippleEffect extends Effect {
  constructor() {
    super('RippleEffect', RIPPLE_FRAG, { uniforms: new Map() });
  }
}
