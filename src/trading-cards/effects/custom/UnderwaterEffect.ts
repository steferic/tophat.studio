import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

const UNDERWATER_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 warp = uv;
  warp.x += sin(uv.y * 20.0 + uTime * qSinFreq(2.0)) * 0.008;
  warp.y += cos(uv.x * 15.0 + uTime * qSinFreq(1.5)) * 0.006;

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
    super('UnderwaterEffect', UNDERWATER_FRAG, { uniforms: loopUniforms() });
  }
}
