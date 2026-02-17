import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

const NIGHT_VISION_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = texture2D(inputBuffer, uv);
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Noise (quantized so seed loops)
  float noise = fract(sin(dot(uv * uTime * qLinFreq(80.0), vec2(12.9898, 78.233))) * 43758.5453);
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
    super('NightVisionEffect', NIGHT_VISION_FRAG, { uniforms: loopUniforms() });
  }
}
