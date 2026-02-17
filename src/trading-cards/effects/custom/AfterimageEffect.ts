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
} from 'three';
import { Effect } from 'postprocessing';
import type { WebGLRenderer } from 'three';

// ── Passthrough: outputs the accumulated feedback texture ─────
const PASSTHROUGH_FRAG = /* glsl */ `
uniform sampler2D uFeedback;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = texture2D(uFeedback, uv);
}
`;

// ── Blend shader: three.js AfterimagePass algorithm ──────────
// Uses max() compositing — bright pixels persist longer than dark ones,
// creating an additive ghosting trail. Fundamentally different from
// TrailFeedbackEffect which uses mix() toward a background color.
const BLEND_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;
const BLEND_FRAG = /* glsl */ `
uniform sampler2D tOld;     // previous accumulated frame
uniform sampler2D tNew;     // current post-processed scene
uniform float uDamp;
varying vec2 vUv;

void main() {
  vec4 texelOld = texture2D(tOld, vUv);
  vec4 texelNew = texture2D(tNew, vUv);

  // Fade previous accumulation by damp factor
  texelOld *= uDamp;

  // max() compositing: bright pixels from either frame win
  gl_FragColor = max(texelNew, texelOld);
}
`;

/**
 * Afterimage effect — port of three.js AfterimagePass for the postprocessing pipeline.
 *
 * Uses ping-pong double-buffering with max() compositing:
 * each frame blends the faded previous accumulation with the current scene,
 * keeping the brighter of the two. This creates luminous ghosting trails
 * where bright objects leave persistent afterimages.
 *
 * `damp` controls persistence: 0 = no trail, 0.96 = long ghosty trails.
 */
export class AfterimageEffect extends Effect {
  private feedbackA: WebGLRenderTarget;
  private feedbackB: WebGLRenderTarget;
  private swapped = false;
  private blendScene: Scene;
  private blendCam: OrthographicCamera;
  private blendMat: ShaderMaterial;
  private initialized = false;

  constructor({ damp = 0.96 }: { damp?: number } = {}) {
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

    super('AfterimageEffect', PASSTHROUGH_FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uFeedback', new Uniform(feedbackA.texture)],
      ]),
    });

    this.feedbackA = feedbackA;
    this.feedbackB = feedbackB;

    this.blendMat = new ShaderMaterial({
      vertexShader: BLEND_VERT,
      fragmentShader: BLEND_FRAG,
      uniforms: {
        tOld: { value: null },
        tNew: { value: null },
        uDamp: { value: damp },
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

  setDamp(damp: number) {
    this.blendMat.uniforms.uDamp.value = damp;
  }

  /**
   * Called by EffectComposer each frame BEFORE mainImage runs.
   *
   * 1. Blend(readTarget=prevAccumulated, inputBuffer=currentScene) → writeTarget
   * 2. Point uFeedback at writeTarget
   * 3. mainImage outputs uFeedback (passthrough)
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

    // Seed on first frame
    if (!this.initialized) {
      this.seedFromInput(renderer, inputBuffer);
      this.initialized = true;
    }

    // Blend: max(current, faded_previous) → write target
    this.blendMat.uniforms.tOld.value = this.readTarget.texture;
    this.blendMat.uniforms.tNew.value = inputBuffer.texture;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.writeTarget);
    renderer.render(this.blendScene, this.blendCam);
    renderer.setRenderTarget(prev);

    // Point passthrough at the result
    this.uniforms.get('uFeedback')!.value = this.writeTarget.texture;

    // Swap for next frame
    this.swapped = !this.swapped;
  }

  private seedFromInput(renderer: WebGLRenderer, source: WebGLRenderTarget) {
    // Seed both targets with the current scene (no trail on first frame)
    const prevDamp = this.blendMat.uniforms.uDamp.value;
    this.blendMat.uniforms.uDamp.value = 0; // no persistence on seed
    this.blendMat.uniforms.tOld.value = source.texture;
    this.blendMat.uniforms.tNew.value = source.texture;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.feedbackA);
    renderer.render(this.blendScene, this.blendCam);
    renderer.setRenderTarget(this.feedbackB);
    renderer.render(this.blendScene, this.blendCam);
    renderer.setRenderTarget(prev);

    this.blendMat.uniforms.uDamp.value = prevDamp;
  }

  dispose(): void {
    this.feedbackA.dispose();
    this.feedbackB.dispose();
    this.blendMat.dispose();
    super.dispose();
  }
}
