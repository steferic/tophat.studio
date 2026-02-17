import { Effect } from 'postprocessing';

const KALEIDOSCOPE_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 centered = uv - 0.5;

  // Convert to polar
  float r = length(centered);
  float a = atan(centered.y, centered.x);

  // 6-fold symmetry
  float segments = 6.0;
  float segmentAngle = 3.14159265 * 2.0 / segments;
  a = mod(a, segmentAngle);
  a = abs(a - segmentAngle * 0.5);

  // Back to cartesian
  vec2 mirrored = vec2(cos(a), sin(a)) * r + 0.5;

  outputColor = texture2D(inputBuffer, mirrored);
}
`;

export class KaleidoscopeEffect extends Effect {
  constructor() {
    super('KaleidoscopeEffect', KALEIDOSCOPE_FRAG, { uniforms: new Map() });
  }
}
