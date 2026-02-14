import React, { useMemo } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, Glitch, DotScreen, Sepia, Pixelation, HueSaturation, ColorAverage, Scanline } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { Vector2 } from 'three';
import { OrderedDitherEffect } from './OrderedDitherEffect';
import { NightVisionEffect, ThermalEffect, PosterizeEffect, CRTEffect, VHSEffect, InvertEffect, EdgeDetectEffect, UnderwaterEffect, DuotoneEffect, HologramEffect, KaleidoscopeEffect, RetroLCDEffect, EmbossEffect, RippleEffect } from './customEffects';

function useCustomEffect<T>(Factory: new () => T): T {
  return useMemo(() => new Factory(), [Factory]);
}

function useCustomEffectWithArgs<T>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// ── Individual pass components ──────────────────────────────

const DitherFilterPass: React.FC = () => {
  const effect = useCustomEffectWithArgs(() => new OrderedDitherEffect({ pixelSize: 3.0 }), []);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const PixelationPass: React.FC = () => (
  <EffectComposer><Pixelation granularity={6} /></EffectComposer>
);

const ChromaticAberrationPass: React.FC = () => (
  <EffectComposer>
    <ChromaticAberration
      offset={new Vector2(0.006, 0.006)}
      radialModulation={false}
      modulationOffset={0.0}
      blendFunction={BlendFunction.NORMAL}
    />
  </EffectComposer>
);

const ScanlinePass: React.FC = () => (
  <EffectComposer><Scanline density={1.8} blendFunction={BlendFunction.OVERLAY} /></EffectComposer>
);

const NoisePass: React.FC = () => (
  <EffectComposer><Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} /></EffectComposer>
);

const VignettePass: React.FC = () => (
  <EffectComposer><Vignette darkness={0.7} offset={0.3} /></EffectComposer>
);

const BloomPass: React.FC = () => (
  <EffectComposer><Bloom intensity={2.0} luminanceThreshold={0.15} luminanceSmoothing={0.9} /></EffectComposer>
);

const GlitchPass: React.FC = () => (
  <EffectComposer>
    <Glitch
      delay={new Vector2(1.5, 3.5)}
      duration={new Vector2(0.3, 1.0)}
      strength={new Vector2(0.2, 0.6)}
      mode={GlitchMode.SPORADIC}
    />
  </EffectComposer>
);

const DotScreenPass: React.FC = () => (
  <EffectComposer><DotScreen angle={Math.PI * 0.25} scale={1.2} blendFunction={BlendFunction.NORMAL} /></EffectComposer>
);

const SepiaPass: React.FC = () => (
  <EffectComposer><Sepia intensity={0.85} blendFunction={BlendFunction.NORMAL} /></EffectComposer>
);

const GrayscalePass: React.FC = () => (
  <EffectComposer><ColorAverage blendFunction={BlendFunction.NORMAL} /></EffectComposer>
);

const HueShiftPass: React.FC = () => (
  <EffectComposer><HueSaturation hue={Math.PI} saturation={0.15} blendFunction={BlendFunction.NORMAL} /></EffectComposer>
);

const NightVisionPass: React.FC = () => {
  const effect = useCustomEffect(NightVisionEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const ThermalPass: React.FC = () => {
  const effect = useCustomEffect(ThermalEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const PosterizePass: React.FC = () => {
  const effect = useCustomEffectWithArgs(() => new PosterizeEffect({ levels: 5.0 }), []);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const CRTPass: React.FC = () => {
  const effect = useCustomEffect(CRTEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const VHSPass: React.FC = () => {
  const effect = useCustomEffect(VHSEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const InvertPass: React.FC = () => {
  const effect = useCustomEffect(InvertEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const EdgeDetectPass: React.FC = () => {
  const effect = useCustomEffect(EdgeDetectEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const UnderwaterPass: React.FC = () => {
  const effect = useCustomEffect(UnderwaterEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const DuotonePass: React.FC = () => {
  const effect = useCustomEffectWithArgs(() => new DuotoneEffect(), []);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const HologramPass: React.FC = () => {
  const effect = useCustomEffect(HologramEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const KaleidoscopePass: React.FC = () => {
  const effect = useCustomEffect(KaleidoscopeEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const RetroLCDPass: React.FC = () => {
  const effect = useCustomEffect(RetroLCDEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const EmbossPass: React.FC = () => {
  const effect = useCustomEffect(EmbossEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

const RipplePass: React.FC = () => {
  const effect = useCustomEffect(RippleEffect);
  return <EffectComposer><primitive object={effect} /></EffectComposer>;
};

// ── Lookup ──────────────────────────────────────────────────

const PASS_MAP: Record<string, React.FC> = {
  'dither': DitherFilterPass,
  'pixelation': PixelationPass,
  'chromatic-aberration': ChromaticAberrationPass,
  'scanline': ScanlinePass,
  'noise': NoisePass,
  'vignette': VignettePass,
  'bloom': BloomPass,
  'glitch': GlitchPass,
  'dot-screen': DotScreenPass,
  'sepia': SepiaPass,
  'grayscale': GrayscalePass,
  'hue-shift': HueShiftPass,
  'night-vision': NightVisionPass,
  'thermal': ThermalPass,
  'posterize': PosterizePass,
  'crt': CRTPass,
  'vhs': VHSPass,
  'invert': InvertPass,
  'edge-detect': EdgeDetectPass,
  'underwater': UnderwaterPass,
  'duotone': DuotonePass,
  'hologram': HologramPass,
  'kaleidoscope': KaleidoscopePass,
  'retro-lcd': RetroLCDPass,
  'emboss': EmbossPass,
  'ripple': RipplePass,
};

interface VisualEffectPassProps {
  filter: string;
}

export const VisualEffectPass: React.FC<VisualEffectPassProps> = ({ filter }) => {
  const Pass = PASS_MAP[filter];
  if (!Pass) return null;
  return <Pass />;
};
