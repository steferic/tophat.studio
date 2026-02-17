import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

const RIPPLE_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 centered = uv - 0.5;
  float dist = length(centered);

  float wave = sin(dist * 40.0 - uTime * qSinFreq(4.0)) * 0.01;
  wave *= smoothstep(0.5, 0.0, dist); // fade at edges

  vec2 displaced = uv + normalize(centered + 0.001) * wave;

  outputColor = texture2D(inputBuffer, displaced);
}
`;

export class RippleEffect extends Effect {
  constructor() {
    super('RippleEffect', RIPPLE_FRAG, { uniforms: loopUniforms() });
  }
}
