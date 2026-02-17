import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

const HOLOGRAM_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Scanlines
  float scanline = sin(uv.y * resolution.y * 1.5) * 0.5 + 0.5;
  scanline = smoothstep(0.3, 0.7, scanline);

  // Flicker (quantized)
  float flicker = 0.95 + 0.05 * sin(uTime * qSinFreq(12.0));

  // Blue hologram color
  vec3 holo = vec3(0.15, 0.5, 1.0) * luma * scanline * flicker;

  // Slight horizontal jitter (quantized)
  float jitter = sin(uTime * qSinFreq(20.0) + uv.y * 100.0) * 0.001;
  vec3 shifted = texture2D(inputBuffer, uv + vec2(jitter, 0.0)).rgb;
  float shiftedLuma = dot(shifted, vec3(0.299, 0.587, 0.114));

  holo += vec3(0.05, 0.2, 0.4) * shiftedLuma * (1.0 - scanline) * flicker;

  outputColor = vec4(holo, 0.9);
}
`;

export class HologramEffect extends Effect {
  constructor() {
    super('HologramEffect', HOLOGRAM_FRAG, { uniforms: loopUniforms() });
  }
}
