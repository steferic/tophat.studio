import { Effect } from 'postprocessing';

const EDGE_DETECT_FRAG = /* glsl */ `
float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = 1.0 / resolution;

  float tl = luminance(texture2D(inputBuffer, uv + vec2(-px.x,  px.y)).rgb);
  float t  = luminance(texture2D(inputBuffer, uv + vec2( 0.0,   px.y)).rgb);
  float tr = luminance(texture2D(inputBuffer, uv + vec2( px.x,  px.y)).rgb);
  float l  = luminance(texture2D(inputBuffer, uv + vec2(-px.x,  0.0 )).rgb);
  float r  = luminance(texture2D(inputBuffer, uv + vec2( px.x,  0.0 )).rgb);
  float bl = luminance(texture2D(inputBuffer, uv + vec2(-px.x, -px.y)).rgb);
  float b  = luminance(texture2D(inputBuffer, uv + vec2( 0.0,  -px.y)).rgb);
  float br = luminance(texture2D(inputBuffer, uv + vec2( px.x, -px.y)).rgb);

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  float edge = sqrt(gx*gx + gy*gy);

  outputColor = vec4(vec3(edge), 1.0);
}
`;

export class EdgeDetectEffect extends Effect {
  constructor() {
    super('EdgeDetectEffect', EDGE_DETECT_FRAG, { uniforms: new Map() });
  }
}
