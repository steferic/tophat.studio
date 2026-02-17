import { Effect } from 'postprocessing';

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
