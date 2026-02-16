import React, { useMemo, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useLoopDuration } from '../workshop/loopContext';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
  Glitch,
  DotScreen,
  Sepia,
  Pixelation,
  HueSaturation,
  ColorAverage,
  Scanline,
  ASCII,
  BrightnessContrast,
  ColorDepth,
  Depth,
  DepthOfField,
  Grid,
  N8AO,
  Ramp,
  TiltShift,
  TiltShift2,
  ToneMapping,
  WaterEffect,
} from '@react-three/postprocessing';
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing';
import { Vector2 } from 'three';
import { OrderedDitherEffect } from './OrderedDitherEffect';
import {
  NightVisionEffect,
  ThermalEffect,
  PosterizeEffect,
  CRTEffect,
  VHSEffect,
  InvertEffect,
  EdgeDetectEffect,
  UnderwaterEffect,
  DuotoneEffect,
  HologramEffect,
  KaleidoscopeEffect,
  RetroLCDEffect,
  EmbossEffect,
  RippleEffect,
} from './customEffects';
import { MaskedEffect } from './MaskedEffect';
import { TrailFeedbackEffect } from './TrailFeedbackEffect';
import type { MaskConfig } from '../workshop/maskRegistry';

// ── Helpers ─────────────────────────────────────────────────

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

const GLITCH_MODE_MAP: Record<string, GlitchMode> = {
  SPORADIC: GlitchMode.SPORADIC,
  CONSTANT_MILD: GlitchMode.CONSTANT_MILD,
  CONSTANT_WILD: GlitchMode.CONSTANT_WILD,
};

// ── Custom effect factory map ───────────────────────────────

type SimpleEffectFactory = new () => any;

const SIMPLE_CUSTOM_EFFECTS: Record<string, SimpleEffectFactory> = {
  'night-vision': NightVisionEffect,
  thermal: ThermalEffect,
  crt: CRTEffect,
  vhs: VHSEffect,
  invert: InvertEffect,
  'edge-detect': EdgeDetectEffect,
  underwater: UnderwaterEffect,
  hologram: HologramEffect,
  kaleidoscope: KaleidoscopeEffect,
  'retro-lcd': RetroLCDEffect,
  emboss: EmbossEffect,
  ripple: RippleEffect,
};

// ── Library effect renderer (returns JSX without EffectComposer) ──

function renderLibraryEffect(filter: string, p: Record<string, any>): React.ReactNode | null {
  switch (filter) {
    case 'bloom':
      return (
        <Bloom
          key={filter}
          intensity={p.intensity ?? 2.0}
          luminanceThreshold={p.luminanceThreshold ?? 0.15}
          luminanceSmoothing={p.luminanceSmoothing ?? 0.9}
        />
      );

    case 'chromatic-aberration':
      return (
        <ChromaticAberration
          key={filter}
          offset={new Vector2(p.offsetX ?? 0.006, p.offsetY ?? 0.006)}
          radialModulation={p.radialModulation ?? false}
          modulationOffset={0.0}
          blendFunction={BlendFunction.NORMAL}
        />
      );

    case 'noise':
      return (
        <Noise key={filter} premultiply={p.premultiply ?? true} blendFunction={BlendFunction.SOFT_LIGHT} />
      );

    case 'vignette':
      return (
        <Vignette key={filter} darkness={p.darkness ?? 0.7} offset={p.offset ?? 0.3} />
      );

    case 'glitch':
      return (
        <Glitch
          key={filter}
          delay={new Vector2(1.5, 3.5)}
          duration={new Vector2(0.3, 1.0)}
          strength={new Vector2(0.2, 0.6)}
          mode={GLITCH_MODE_MAP[p.mode as string] ?? GlitchMode.SPORADIC}
        />
      );

    case 'dot-screen':
      return (
        <DotScreen
          key={filter}
          angle={p.angle ?? Math.PI * 0.25}
          scale={p.scale ?? 1.2}
          blendFunction={BlendFunction.NORMAL}
        />
      );

    case 'sepia':
      return (
        <Sepia key={filter} intensity={p.intensity ?? 0.85} blendFunction={BlendFunction.NORMAL} />
      );

    case 'grayscale':
      return <ColorAverage key={filter} blendFunction={BlendFunction.NORMAL} />;

    case 'hue-shift':
      return (
        <HueSaturation
          key={filter}
          hue={p.hue ?? Math.PI}
          saturation={p.saturation ?? 0.15}
          blendFunction={BlendFunction.NORMAL}
        />
      );

    case 'pixelation':
      return <Pixelation key={filter} granularity={p.granularity ?? 6} />;

    case 'scanline':
      return (
        <Scanline key={filter} density={p.density ?? 1.8} blendFunction={BlendFunction.OVERLAY} />
      );

    case 'ascii':
      return (
        <ASCII
          key={filter}
          fontSize={p.fontSize ?? 64}
          cellSize={p.cellSize ?? 16}
          color={p.color ?? '#00ff00'}
          invert={p.invert ?? false}
        />
      );

    case 'brightness-contrast':
      return (
        <BrightnessContrast key={filter} brightness={p.brightness ?? 0} contrast={p.contrast ?? 0} />
      );

    case 'color-depth':
      return <ColorDepth key={filter} bits={p.bits ?? 8} />;

    case 'depth':
      return <Depth key={filter} inverted={p.inverted ?? false} />;

    case 'depth-of-field':
      return (
        <DepthOfField
          key={filter}
          focusDistance={p.focusDistance ?? 0.02}
          focalLength={p.focalLength ?? 0.5}
          bokehScale={p.bokehScale ?? 3}
        />
      );

    case 'grid':
      return <Grid key={filter} scale={p.scale ?? 1} lineWidth={p.lineWidth ?? 0.5} />;

    case 'n8ao':
      return (
        <N8AO
          key={filter}
          aoRadius={p.aoRadius ?? 5}
          distanceFalloff={p.distanceFalloff ?? 1}
          intensity={p.intensity ?? 5}
          quality={(p.quality as any) ?? 'medium'}
        />
      );

    case 'ramp':
      return (
        <Ramp
          key={filter}
          rampType={p.rampType ?? 0}
          rampBias={p.rampBias ?? 0.5}
          rampGain={p.rampGain ?? 0.5}
          rampMask={p.rampMask ?? false}
          rampInvert={p.rampInvert ?? false}
        />
      );

    case 'tilt-shift':
      return (
        <TiltShift
          key={filter}
          offset={p.offset ?? 0}
          rotation={p.rotation ?? 0}
          focusArea={p.focusArea ?? 0.4}
          feather={p.feather ?? 0.3}
        />
      );

    case 'tilt-shift-2':
      return (
        <TiltShift2
          key={filter}
          blur={p.blur ?? 0.5}
          taper={p.taper ?? 0.5}
          samples={p.samples ?? 6}
        />
      );

    case 'tone-mapping':
      return (
        <ToneMapping key={filter} mode={(p.mode ?? ToneMappingMode.ACES_FILMIC) as ToneMappingMode} />
      );

    case 'water':
      return <WaterEffect key={filter} factor={p.factor ?? 0.5} />;

    default:
      return null;
  }
}

// ── Custom effects hook — manages a Map<string, Effect> ─────

function useCustomEffects(
  filters: string[],
  allParams: Record<string, Record<string, any>>,
): Map<string, any> {
  // Build a stable key from the custom filter IDs + their params so we recreate when params change
  const customFilters = filters.filter(
    (f) => SIMPLE_CUSTOM_EFFECTS[f] || f === 'dither' || f === 'posterize' || f === 'duotone',
  );

  // Serialize param-dependent values for deps
  const paramKey = customFilters
    .map((f) => {
      const p = allParams[f];
      return p ? `${f}:${JSON.stringify(p)}` : f;
    })
    .join('|');

  return useMemo(() => {
    const map = new Map<string, any>();
    for (const id of customFilters) {
      const p = allParams[id] ?? {};

      // Parameterized custom effects
      if (id === 'dither') {
        map.set(id, new OrderedDitherEffect({ pixelSize: p.pixelSize ?? 3.0 }));
        continue;
      }
      if (id === 'posterize') {
        map.set(id, new PosterizeEffect({ levels: p.levels ?? 5.0 }));
        continue;
      }
      if (id === 'duotone') {
        map.set(
          id,
          new DuotoneEffect({
            colorA: hexToRgb01(p.colorA ?? '#00cce6'),
            colorB: hexToRgb01(p.colorB ?? '#e61a99'),
          }),
        );
        continue;
      }

      // Simple (no-param) custom effects
      const Factory = SIMPLE_CUSTOM_EFFECTS[id];
      if (Factory) {
        map.set(id, new Factory());
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);
}

// ── Multi-filter VisualEffectPass ───────────────────────────

interface VisualEffectPassProps {
  filters: string[];
  allParams: Record<string, Record<string, any>>;
  maskConfig?: MaskConfig;
  trailEffect?: boolean;
  trailDecay?: number;
  bgColor?: string;
}

// ── Pattern ID → int mapping ─────────────────────────────────

const MASK_PATTERN_INDEX: Record<string, number> = {
  checkerboard: 0,
  'vertical-stripes': 1,
  'horizontal-stripes': 2,
  hexagonal: 3,
  'radial-sectors': 4,
  diamond: 5,
  wave: 6,
  'diagonal-stripes': 7,
};

export const VisualEffectPass: React.FC<VisualEffectPassProps> = ({
  filters, allParams, maskConfig, trailEffect = false, trailDecay = 0.08, bgColor = '#000000',
}) => {
  const customEffects = useCustomEffects(filters, allParams);
  const loopDuration = useLoopDuration();
  const gl = useThree((s) => s.gl);

  // Create MaskedEffect instance (stable unless toggled)
  const maskedEffect = useMemo(
    () => (maskConfig?.enabled ? new MaskedEffect() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maskConfig?.enabled],
  );

  // Create TrailFeedbackEffect instance (stable unless toggled)
  const trailFeedback = useMemo(
    () => (trailEffect ? new TrailFeedbackEffect({ decay: trailDecay, bgColor }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trailEffect],
  );

  // Keep a ref to the latest maskConfig so useFrame always sees current values
  const maskConfigRef = useRef(maskConfig);
  maskConfigRef.current = maskConfig;

  // Restore autoClear when EffectComposer unmounts (it sets autoClear=false)
  useEffect(() => {
    return () => { gl.autoClear = true; };
  }, [gl]);

  // Pump uTime + uLoopDuration into animated custom effects each frame
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ld = loopDuration ?? 0;
    customEffects.forEach((effect) => {
      const uTime = effect.uniforms?.get('uTime');
      const uLoop = effect.uniforms?.get('uLoopDuration');
      if (uTime) uTime.value = t;
      if (uLoop) uLoop.value = ld;
    });

    // Pump MaskedEffect uniforms
    if (maskedEffect) {
      const mc = maskConfigRef.current;
      if (!mc) return;
      const u = maskedEffect.uniforms;
      u.get('uTime')!.value = t;
      u.get('uLoopDuration')!.value = ld;
      u.get('uPattern')!.value = MASK_PATTERN_INDEX[mc.pattern] ?? 0;
      u.get('uCellSize')!.value = mc.cellSize;
      u.get('uSpeed')!.value = mc.speed;
      u.get('uSoftness')!.value = mc.softness;
      u.get('uInvert')!.value = mc.invertZones ? 1 : 0;

      // Zone A
      const a = mc.zoneA;
      u.get('uA_grayscale')!.value = a.grayscale;
      u.get('uA_sepia')!.value = a.sepia;
      u.get('uA_invert')!.value = a.invert;
      u.get('uA_hueRotation')!.value = a.hueRotation;
      u.get('uA_saturation')!.value = a.saturation;
      u.get('uA_brightness')!.value = a.brightness;
      u.get('uA_contrast')!.value = a.contrast;
      u.get('uA_posterize')!.value = a.posterize;
      u.get('uA_tintColor')!.value = hexToRgb01(a.tintColor);
      u.get('uA_tintAmount')!.value = a.tintAmount;

      // Zone B
      const b = mc.zoneB;
      u.get('uB_grayscale')!.value = b.grayscale;
      u.get('uB_sepia')!.value = b.sepia;
      u.get('uB_invert')!.value = b.invert;
      u.get('uB_hueRotation')!.value = b.hueRotation;
      u.get('uB_saturation')!.value = b.saturation;
      u.get('uB_brightness')!.value = b.brightness;
      u.get('uB_contrast')!.value = b.contrast;
      u.get('uB_posterize')!.value = b.posterize;
      u.get('uB_tintColor')!.value = hexToRgb01(b.tintColor);
      u.get('uB_tintAmount')!.value = b.tintAmount;
    }

    // Update trail feedback params each frame
    if (trailFeedback) {
      trailFeedback.setDecay(trailDecay);
      trailFeedback.setBgColor(bgColor);
    }
  });

  const elements: React.ReactNode[] = [];
  for (const id of filters) {
    const p = allParams[id] ?? {};

    // Try library effect first
    const el = renderLibraryEffect(id, p);
    if (el) {
      elements.push(el);
      continue;
    }

    // Custom effect
    const custom = customEffects.get(id);
    if (custom) {
      elements.push(<primitive key={id} object={custom} />);
    }
  }

  // Append masked effect after all global effects
  if (maskedEffect) {
    elements.push(<primitive key="masked-effect" object={maskedEffect} />);
  }

  // Append trail feedback as the very last effect (accumulates all previous effects)
  if (trailFeedback) {
    elements.push(<primitive key="trail-feedback" object={trailFeedback} />);
  }

  if (elements.length === 0) return null;

  return <EffectComposer>{elements as React.JSX.Element[]}</EffectComposer>;
};
