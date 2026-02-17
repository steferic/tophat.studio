import { Effect } from 'postprocessing';
import { LOOP_HELPERS_GLSL, loopUniforms } from './loopHelpers';

const VHS_FRAG = /* glsl */ `
${LOOP_HELPERS_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Jitter (quantized frequency)
  float jitter = sin(uTime * qSinFreq(40.0) + uv.y * 300.0) * 0.002;
  vec2 distUV = uv + vec2(jitter, 0.0);

  // Color bleeding (vertical channel shift)
  float r = texture2D(inputBuffer, distUV + vec2(0.0,  0.004)).r;
  float g = texture2D(inputBuffer, distUV).g;
  float b = texture2D(inputBuffer, distUV + vec2(0.0, -0.004)).b;

  vec3 color = vec3(r, g, b);

  // Tracking band — thin horizontal noise band that scrolls (quantized)
  float bandPos = fract(uTime * qLinFreq(0.08));
  float bandDist = abs(fract(uv.y) - bandPos);
  float band = smoothstep(0.0, 0.03, bandDist);
  color = mix(color * 0.4 + vec3(0.15, 0.05, 0.05), color, band);

  // Desaturation
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 0.75);

  // Noise grain (quantized seed)
  float noise = fract(sin(dot(uv + fract(uTime * qLinFreq(1.0)), vec2(12.9898, 78.233))) * 43758.5453);
  color += (noise - 0.5) * 0.08;

  outputColor = vec4(color, 1.0);
}
`;

export class VHSEffect extends Effect {
  constructor() {
    super('VHSEffect', VHS_FRAG, { uniforms: loopUniforms() });
  }
}
