import { Effect } from 'postprocessing';

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
