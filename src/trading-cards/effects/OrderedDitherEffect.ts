import { Uniform } from 'three';
import { Effect } from 'postprocessing';

const FRAGMENT = /* glsl */ `
uniform float pixelSize;

// Bayer 4×4 threshold matrix (normalized 0‒1)
float bayer4(vec2 coord) {
  int x = int(mod(coord.x, 4.0));
  int y = int(mod(coord.y, 4.0));

  int index = x + y * 4;

  // Classic Bayer 4×4 matrix values / 16
  float m[16];
  m[0]  =  0.0 / 16.0;  m[1]  =  8.0 / 16.0;  m[2]  =  2.0 / 16.0;  m[3]  = 10.0 / 16.0;
  m[4]  = 12.0 / 16.0;  m[5]  =  4.0 / 16.0;  m[6]  = 14.0 / 16.0;  m[7]  =  6.0 / 16.0;
  m[8]  =  3.0 / 16.0;  m[9]  = 11.0 / 16.0;  m[10] =  1.0 / 16.0;  m[11] =  9.0 / 16.0;
  m[12] = 15.0 / 16.0;  m[13] =  7.0 / 16.0;  m[14] = 13.0 / 16.0;  m[15] =  5.0 / 16.0;

  for (int i = 0; i < 16; i++) {
    if (i == index) return m[i];
  }
  return 0.0;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Pixelate: snap UV to grid
  vec2 cellSize = vec2(pixelSize) / resolution;
  vec2 snappedUV = cellSize * floor(uv / cellSize);
  vec4 color = texture2D(inputBuffer, snappedUV);

  // Per-pixel Bayer threshold (use original pixel coords, not snapped)
  vec2 fragCoord = uv * resolution;
  float threshold = bayer4(fragCoord / pixelSize);

  // Dither each channel independently
  vec3 dithered = step(vec3(threshold), color.rgb);

  outputColor = vec4(dithered, color.a);
}
`;

export class OrderedDitherEffect extends Effect {
  constructor({ pixelSize = 3.0 }: { pixelSize?: number } = {}) {
    super('OrderedDitherEffect', FRAGMENT, {
      uniforms: new Map([['pixelSize', new Uniform(pixelSize)]]),
    });
  }
}
