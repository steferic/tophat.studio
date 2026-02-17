import { Effect } from 'postprocessing';

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
