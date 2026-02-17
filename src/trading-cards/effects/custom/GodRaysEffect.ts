import {
  Uniform,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  HalfFloatType,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Scene,
  OrthographicCamera,
  Color,
  Vector2,
} from 'three';
import { Effect } from 'postprocessing';
import type { WebGLRenderer } from 'three';

// ── Shared fullscreen vertex shader ──────────────────────────
const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// ── 1. Threshold extraction — isolate bright areas ───────────
const THRESHOLD_FRAG = /* glsl */ `
uniform sampler2D tInput;
uniform float uThreshold;
varying vec2 vUv;

void main() {
  vec4 col = texture2D(tInput, vUv);
  float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  float mask = smoothstep(uThreshold, uThreshold + 0.15, luma);
  gl_FragColor = vec4(col.rgb * mask, 1.0);
}
`;

// ── 2. Radial blur — multi-pass from sun position ────────────
// Ported from three.js GodRaysGenerateShader: 6 taps per pass,
// applied 3× with decreasing step sizes for efficient large-radius blur.
const GODRAYS_GENERATE_FRAG = /* glsl */ `
#define TAPS_PER_PASS 6.0

uniform sampler2D tInput;
uniform vec2 uSunPos;
uniform float uStepSize;
varying vec2 vUv;

void main() {
  vec2 delta = uSunPos - vUv;
  float dist = length(delta);
  vec2 stepv = uStepSize * delta / dist;
  float iters = dist / uStepSize;

  vec2 uv = vUv;
  float col = 0.0;

  // Unrolled 6-tap sampling toward sun — matches three.js GodRaysGenerateShader
  if (0.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;
  uv += stepv;
  if (1.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;
  uv += stepv;
  if (2.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;
  uv += stepv;
  if (3.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;
  uv += stepv;
  if (4.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;
  uv += stepv;
  if (5.0 <= iters && uv.y < 1.0 && uv.y > 0.0) col += texture2D(tInput, uv).r;

  gl_FragColor = vec4(vec3(col / TAPS_PER_PASS), 1.0);
}
`;

// ── 3. Composite — mainImage adds rays to scene ─────────────
const COMPOSITE_FRAG = /* glsl */ `
uniform sampler2D uGodRays;
uniform float uIntensity;
uniform vec3 uColor;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float rays = texture2D(uGodRays, uv).r;
  outputColor = inputColor + vec4(uColor * rays * uIntensity, 0.0);
}
`;

const TAPS_PER_PASS = 6.0;

/**
 * God Rays post-processing effect — ported from three.js GodRaysShader.
 *
 * Uses multi-pass radial blur (3 passes × 6 taps = effective 216-sample coverage)
 * from a configurable screen-space sun position. Bright areas are extracted via
 * luminance thresholding, then blurred radially toward the light source and
 * composited additively onto the scene.
 */
export class GodRaysEffect extends Effect {
  // Quarter-res ping-pong targets for the radial blur passes
  private rtA: WebGLRenderTarget;
  private rtB: WebGLRenderTarget;
  // Full-res target for threshold extraction
  private rtThreshold: WebGLRenderTarget;

  private fsScene: Scene;
  private fsCam: OrthographicCamera;
  private fsQuad: Mesh;

  private thresholdMat: ShaderMaterial;
  private blurMat: ShaderMaterial;

  private _sunPos = new Vector2(0.5, 0.8);
  private _threshold = 0.5;
  private _density = 1.0;

  constructor({
    color = '#ffffaa',
    sunX = 0.5,
    sunY = 0.8,
    intensity = 0.75,
    density = 1.0,
    threshold = 0.5,
  }: {
    color?: string;
    sunX?: number;
    sunY?: number;
    intensity?: number;
    density?: number;
    threshold?: number;
  } = {}) {
    const c = new Color(color);

    super('GodRaysEffect', COMPOSITE_FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uGodRays', new Uniform(null)],
        ['uIntensity', new Uniform(intensity)],
        ['uColor', new Uniform(c)],
      ]),
    });

    this._sunPos.set(sunX, sunY);
    this._threshold = threshold;
    this._density = density;

    // Quarter-res render targets for blur passes
    const rtOpts = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: HalfFloatType,
    };
    this.rtA = new WebGLRenderTarget(1, 1, rtOpts);
    this.rtB = new WebGLRenderTarget(1, 1, rtOpts);
    this.rtThreshold = new WebGLRenderTarget(1, 1, rtOpts);

    // Threshold material
    this.thresholdMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: THRESHOLD_FRAG,
      uniforms: {
        tInput: { value: null },
        uThreshold: { value: threshold },
      },
    });

    // Radial blur material
    this.blurMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: GODRAYS_GENERATE_FRAG,
      uniforms: {
        tInput: { value: null },
        uSunPos: { value: this._sunPos },
        uStepSize: { value: 1.0 },
      },
    });

    // Fullscreen quad scene
    this.fsScene = new Scene();
    this.fsCam = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
    this.fsCam.position.z = 1;
    this.fsQuad = new Mesh(new PlaneGeometry(1, 1), this.thresholdMat);
    this.fsScene.add(this.fsQuad);
  }

  setSunPos(x: number, y: number) { this._sunPos.set(x, y); }
  setThreshold(v: number) { this._threshold = v; }
  setDensity(v: number) { this._density = v; }

  setIntensity(v: number) {
    this.uniforms.get('uIntensity')!.value = v;
  }

  setColor(hex: string) {
    (this.uniforms.get('uColor')!.value as Color).set(hex);
  }

  /**
   * Multi-pass radial blur pipeline, called each frame by EffectComposer.
   *
   * 1. Threshold extract → rtThreshold (full res)
   * 2. Radial blur pass 1 (large step) → rtB (quarter res)
   * 3. Radial blur pass 2 (medium step) → rtA (quarter res)
   * 4. Radial blur pass 3 (small step) → rtB (quarter res)
   * 5. Point uGodRays at rtB
   */
  update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget): void {
    const { width, height } = inputBuffer;
    const qw = Math.max(1, Math.floor(width * 0.25));
    const qh = Math.max(1, Math.floor(height * 0.25));

    // Resize targets if needed
    if (this.rtThreshold.width !== width || this.rtThreshold.height !== height) {
      this.rtThreshold.setSize(width, height);
    }
    if (this.rtA.width !== qw || this.rtA.height !== qh) {
      this.rtA.setSize(qw, qh);
      this.rtB.setSize(qw, qh);
    }

    const prev = renderer.getRenderTarget();

    // ── Pass 0: Threshold extraction (full res) ──────────────
    this.thresholdMat.uniforms.tInput.value = inputBuffer.texture;
    this.thresholdMat.uniforms.uThreshold.value = this._threshold;
    this.fsQuad.material = this.thresholdMat;

    renderer.setRenderTarget(this.rtThreshold);
    renderer.render(this.fsScene, this.fsCam);

    // ── Passes 1-3: Multi-pass radial blur (quarter res) ─────
    // Step sizes decrease by powers of TAPS_PER_PASS, matching three.js:
    //   pass 1: filterLen * taps^-1  (large step, coarse)
    //   pass 2: filterLen * taps^-2  (medium step)
    //   pass 3: filterLen * taps^-3  (fine step)
    const filterLen = this._density;
    this.fsQuad.material = this.blurMat;

    // Pass 1: rtThreshold → rtB
    this.blurMat.uniforms.tInput.value = this.rtThreshold.texture;
    this.blurMat.uniforms.uStepSize.value = filterLen * Math.pow(TAPS_PER_PASS, -1);
    renderer.setRenderTarget(this.rtB);
    renderer.render(this.fsScene, this.fsCam);

    // Pass 2: rtB → rtA
    this.blurMat.uniforms.tInput.value = this.rtB.texture;
    this.blurMat.uniforms.uStepSize.value = filterLen * Math.pow(TAPS_PER_PASS, -2);
    renderer.setRenderTarget(this.rtA);
    renderer.render(this.fsScene, this.fsCam);

    // Pass 3: rtA → rtB
    this.blurMat.uniforms.tInput.value = this.rtA.texture;
    this.blurMat.uniforms.uStepSize.value = filterLen * Math.pow(TAPS_PER_PASS, -3);
    renderer.setRenderTarget(this.rtB);
    renderer.render(this.fsScene, this.fsCam);

    renderer.setRenderTarget(prev);

    // Point composite shader at the final blurred result
    this.uniforms.get('uGodRays')!.value = this.rtB.texture;
  }

  dispose(): void {
    this.rtA.dispose();
    this.rtB.dispose();
    this.rtThreshold.dispose();
    this.thresholdMat.dispose();
    this.blurMat.dispose();
    super.dispose();
  }
}
