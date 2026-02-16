import {
  Uniform,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  HalfFloatType,
  Color,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Scene,
  OrthographicCamera,
} from 'three';
import { Effect } from 'postprocessing';
import type { WebGLRenderer } from 'three';

// ── Passthrough shader for the Effect pipeline ──────────────
// The actual accumulation happens in update() via a manual render pass.
// mainImage simply outputs the accumulated feedback texture.
const PASSTHROUGH_FRAG = /* glsl */ `
uniform sampler2D uFeedback;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = texture2D(uFeedback, uv);
}
`;

// ── Blend shader for the manual render pass in update() ─────
// Reads the previous accumulated feedback + the current scene input,
// fades feedback toward bgColor, then composites the current scene on top.
const BLEND_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;
const BLEND_FRAG = /* glsl */ `
uniform sampler2D tPrev;     // previous accumulated frame
uniform sampler2D tCurrent;  // current post-processed scene
uniform float uDecay;
uniform vec3 uBgColor;
varying vec2 vUv;

void main() {
  vec3 prev = texture2D(tPrev, vUv).rgb;
  vec3 current = texture2D(tCurrent, vUv).rgb;

  // Fade previous accumulated frame toward background color
  vec3 faded = mix(prev, uBgColor, uDecay);

  // Composite: where current scene differs from bg, show current scene;
  // where it matches bg, keep faded trails.
  float diff = length(current - uBgColor);
  float mask = smoothstep(0.0, 0.08, diff);
  vec3 result = mix(faded, current, mask);

  gl_FragColor = vec4(result, 1.0);
}
`;

/**
 * Post-processing trail/feedback effect.
 *
 * All accumulation happens in update() via a manual blend render pass:
 *   blend(feedbackPrev, currentScene) → feedbackNext
 * The mainImage shader simply outputs the accumulated feedback texture.
 *
 * Must be the LAST effect in the EffectComposer chain.
 */
export class TrailFeedbackEffect extends Effect {
  private feedbackA: WebGLRenderTarget;
  private feedbackB: WebGLRenderTarget;
  private swapped = false;
  private blendScene: Scene;
  private blendCam: OrthographicCamera;
  private blendMat: ShaderMaterial;
  private initialized = false;

  constructor({
    decay = 0.08,
    bgColor = '#000000',
  }: { decay?: number; bgColor?: string } = {}) {
    const feedbackA = new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: HalfFloatType,
    });
    const feedbackB = new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: HalfFloatType,
    });

    super('TrailFeedbackEffect', PASSTHROUGH_FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uFeedback', new Uniform(feedbackA.texture)],
      ]),
    });

    this.feedbackA = feedbackA;
    this.feedbackB = feedbackB;

    // Blend scene: renders the fade+composite into the write feedback target
    const c = new Color(bgColor);
    this.blendMat = new ShaderMaterial({
      vertexShader: BLEND_VERT,
      fragmentShader: BLEND_FRAG,
      uniforms: {
        tPrev: { value: null },
        tCurrent: { value: null },
        uDecay: { value: decay },
        uBgColor: { value: [c.r, c.g, c.b] },
      },
    });
    this.blendScene = new Scene();
    this.blendScene.add(new Mesh(new PlaneGeometry(2, 2), this.blendMat));
    this.blendCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  get readTarget(): WebGLRenderTarget {
    return this.swapped ? this.feedbackB : this.feedbackA;
  }
  get writeTarget(): WebGLRenderTarget {
    return this.swapped ? this.feedbackA : this.feedbackB;
  }

  setDecay(decay: number) {
    this.blendMat.uniforms.uDecay.value = decay;
  }

  setBgColor(hex: string) {
    const c = new Color(hex);
    this.blendMat.uniforms.uBgColor.value = [c.r, c.g, c.b];
  }

  /**
   * Called by EffectComposer each frame BEFORE the mainImage shader runs.
   *
   * 1. Blend(readTarget=prevAccumulated, inputBuffer=currentScene) → writeTarget
   * 2. Point uFeedback at writeTarget (accumulated result)
   * 3. mainImage shader just outputs uFeedback (passthrough)
   * 4. Swap read/write for next frame
   */
  update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget): void {
    const { width, height } = inputBuffer;

    // Resize feedback targets to match
    if (this.feedbackA.width !== width || this.feedbackA.height !== height) {
      this.feedbackA.setSize(width, height);
      this.feedbackB.setSize(width, height);
      this.initialized = false;
    }

    // On first frame, seed both feedback targets with current scene (no trails yet)
    if (!this.initialized) {
      this.seedFromInput(renderer, inputBuffer);
      this.initialized = true;
    }

    // Blend: mix faded previous feedback with current scene → write target
    this.blendMat.uniforms.tPrev.value = this.readTarget.texture;
    this.blendMat.uniforms.tCurrent.value = inputBuffer.texture;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.writeTarget);
    renderer.render(this.blendScene, this.blendCam);
    renderer.setRenderTarget(prev);

    // Point the passthrough shader at the freshly blended result
    this.uniforms.get('uFeedback')!.value = this.writeTarget.texture;

    // Swap for next frame
    this.swapped = !this.swapped;
  }

  /** Seed feedback targets with the current scene (no trail accumulation) */
  private seedFromInput(renderer: WebGLRenderer, source: WebGLRenderTarget) {
    // Use a simple copy: tPrev = tCurrent = source, decay = 1.0 (full replace)
    const prevDecay = this.blendMat.uniforms.uDecay.value;
    this.blendMat.uniforms.uDecay.value = 1.0;
    this.blendMat.uniforms.tPrev.value = source.texture;
    this.blendMat.uniforms.tCurrent.value = source.texture;

    const prev = renderer.getRenderTarget();

    renderer.setRenderTarget(this.feedbackA);
    renderer.render(this.blendScene, this.blendCam);
    renderer.setRenderTarget(this.feedbackB);
    renderer.render(this.blendScene, this.blendCam);

    renderer.setRenderTarget(prev);
    this.blendMat.uniforms.uDecay.value = prevDecay;
  }

  dispose(): void {
    this.feedbackA.dispose();
    this.feedbackB.dispose();
    this.blendMat.dispose();
    super.dispose();
  }
}
