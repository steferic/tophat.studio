import { Uniform } from 'three';
import { Effect } from 'postprocessing';

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
