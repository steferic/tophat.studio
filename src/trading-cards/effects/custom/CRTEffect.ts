import { Effect } from 'postprocessing';

const CRT_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Barrel distortion
  vec2 centered = uv - 0.5;
  float dist = dot(centered, centered);
  vec2 distorted = uv + centered * dist * 0.2;

  // Out-of-bounds check
  if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
    outputColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Scanlines
  float scanline = sin(distorted.y * resolution.y * 3.14159) * 0.06;

  // Chromatic aberration
  float r = texture2D(inputBuffer, distorted + vec2( 0.003, 0.0)).r;
  float g = texture2D(inputBuffer, distorted).g;
  float b = texture2D(inputBuffer, distorted + vec2(-0.003, 0.0)).b;

  vec3 color = vec3(r, g, b) - scanline;

  // Vignette
  float vignette = 1.0 - dist * 2.5;
  color *= clamp(vignette, 0.0, 1.0);

  outputColor = vec4(color, 1.0);
}
`;

export class CRTEffect extends Effect {
  constructor() {
    super('CRTEffect', CRT_FRAG, { uniforms: new Map() });
  }
}
