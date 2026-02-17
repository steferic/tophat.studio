import { Effect } from 'postprocessing';

const RETRO_LCD_FRAG = /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Pixelate to grid
  vec2 gridSize = vec2(4.0) / resolution;
  vec2 snapped = gridSize * floor(uv / gridSize);
  vec4 color = texture2D(inputBuffer, snapped);

  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // 4-shade Game Boy palette
  vec3 shade;
  if (luma < 0.25)      shade = vec3(0.06, 0.22, 0.06);  // darkest
  else if (luma < 0.5)  shade = vec3(0.19, 0.38, 0.19);
  else if (luma < 0.75) shade = vec3(0.55, 0.67, 0.06);
  else                   shade = vec3(0.61, 0.74, 0.06);  // lightest

  // Subtle pixel grid lines
  vec2 pixelPos = fract(uv / gridSize);
  float grid = smoothstep(0.0, 0.08, pixelPos.x) * smoothstep(0.0, 0.08, pixelPos.y);
  shade *= 0.7 + 0.3 * grid;

  outputColor = vec4(shade, 1.0);
}
`;

export class RetroLCDEffect extends Effect {
  constructor() {
    super('RetroLCDEffect', RETRO_LCD_FRAG, { uniforms: new Map() });
  }
}
