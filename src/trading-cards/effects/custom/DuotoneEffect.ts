import { Uniform } from 'three';
import { Effect } from 'postprocessing';

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
