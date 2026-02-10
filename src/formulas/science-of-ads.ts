/**
 * Science-Backed Ad Formulas
 *
 * Grounded in research from:
 * - Kahneman's Peak-End Rule (memory shaped by emotional peak + ending)
 * - Binet & Field / IPA Databank (emotional ads 2x as profitable, 700+ brands, 30 years)
 * - Nielsen Catalina Solutions (49% of sales lift = creative quality)
 * - Ehrenberg-Bass Institute (distinctive brand assets, mental availability)
 * - Google ABCD Framework (30% short-term sales lift, validated by Kantar)
 * - Quesenberry / Johns Hopkins (5-act dramatic structure predicts Super Bowl ratings)
 * - Wistia CTA data (mid-roll 16.95% vs end-card 10.98%)
 * - Meta/TikTok platform research (87% decide in 3s, 80-85% watch muted)
 * - Escalating edit rhythm research (4-5s → 2-3s → 1-1.5s → sub-second → held)
 * - Color psychology (desaturated problem → warm vibrant solution)
 * - Audio tempo research (108+ BPM for urgency/arousal)
 *
 * Universal 5-phase arc: INTERRUPT → TENSION → TURN → PROOF → RESOLVE
 *
 * Timing ratios per phase (from ad structure research):
 *   Interrupt: ~13% of runtime (hook, pattern break, brand flash)
 *   Tension:   ~20% (problem, stakes, emotional investment)
 *   Turn:      ~17% (the reveal — brand at emotional peak = 2x recall)
 *   Proof:     ~30% (escalating evidence, fastest cuts)
 *   Resolve:   ~20% (peak energy ending + CTA, no wind-down)
 */

import type { VideoFormula } from '../types/project';

// ---------------------------------------------------------------------------
// 15-Second Spot
// ---------------------------------------------------------------------------
// Research: 15s ads deliver 75-85% of 30s recall at half the cost.
// 8-12 shots total, ~1.5s average shot length.
// Every frame must justify its existence.

export const scienceAd15s: VideoFormula = {
  id: 'science-ad-15s',
  name: 'Science-Backed Ad (15s)',
  description:
    'Research-optimized 15-second spot. 75-85% of a 30s ad\'s recall at half the cost. 5-phase arc compressed to its essentials — hook in under 2s, brand at the emotional peak, end at max energy.',
  author: 'Remotion Studio',
  tags: ['commercial', '15s', 'research-backed', 'conversion', 'all-platforms'],
  targetDuration: 15,
  fps: 30,
  resolution: [1920, 1080],
  defaultTransition: { type: 'zoom', duration: 0.15 },
  segments: [
    // Phase 1: INTERRUPT (2s / 13%)
    // Research: 400ms brain imprint, 87% decide in 3s. Must break feed pattern.
    // Von Restorff effect — distinctiveness relative to surrounding content.
    {
      label: 'Pattern Interrupt',
      purpose: 'hook',
      duration: 2,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 60, shotDuration: 1 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'neon',
        energy: 10,
        textOverlayHint: 'BOLD CLAIM',
        audioMood: 'intense',
        sfxIntensity: 9,
      },
      promptHint:
        'The single most arresting visual — faces with direct eye contact, unexpected movement, or a cold open into the peak moment. Must break the scroll in under 400ms.',
    },
    // Phase 2: TENSION (3s / 20%)
    // Research: Emotional ads 2x profitable. Desaturated cool tones = problem state.
    {
      label: 'The Stakes',
      purpose: 'setup',
      duration: 3,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 30, shotDuration: 2 },
        transition: 'wipe',
        transitionDuration: 0.15,
        colorMood: 'cool',
        energy: 7,
        kenBurns: 'zoom-in',
        audioMood: 'suspense',
        sfxIntensity: 6,
      },
      promptHint:
        'Show the pain point or frustration fast — the "before" state. Cool, slightly desaturated. The viewer must feel what\'s wrong.',
    },
    // Phase 3: TURN (3s / 20%)
    // Research: Peak-End Rule — brand at emotional peak = 2x correct recall.
    // Color shift: cool → warm. This is the most important structural moment.
    {
      label: 'The Reveal',
      purpose: 're-engage',
      duration: 3,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 40, shotDuration: 1.5 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'vibrant',
        energy: 9,
        textOverlayHint: 'BRAND NAME',
        audioMood: 'triumphant',
        sfxIntensity: 8,
      },
      promptHint:
        'The pivot — product/solution reveal with brand visible. Color warms. This IS the emotional peak. Kahneman\'s peak-end rule: this moment dominates memory.',
    },
    // Phase 4: PROOF (4s / 27%)
    // Research: Escalating rhythm — shots compress from 2s to sub-second.
    // Multiple scenes +40.6% impressions over single scene.
    {
      label: 'Rapid Proof',
      purpose: 'progression',
      duration: 4,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 45, shotDuration: 1.3 },
        transition: 'slide',
        transitionDuration: 0.1,
        colorMood: 'warm',
        energy: 8,
        audioMood: 'building',
        sfxIntensity: 7,
      },
      promptHint:
        'Show it working — results, reactions, transformations. 2-3 quick proof points. Cuts accelerate. Warm tones, rising saturation.',
    },
    // Phase 5: RESOLVE (3s / 20%)
    // Research: Peak-end rule — ending disproportionately shapes memory.
    // End at max energy. 80-85% watch muted → text overlay is load-bearing.
    {
      label: 'CTA + End',
      purpose: 'end',
      duration: 3,
      defaultSceneType: 'ai-image',
      style: {
        pacing: { cutsPerMin: 15, shotDuration: 3 },
        transition: 'fade',
        transitionDuration: 0.2,
        colorMood: 'vibrant',
        energy: 9,
        textOverlayHint: 'ACT NOW',
        kenBurns: 'zoom-in',
        audioMood: 'intense',
        sfxIntensity: 8,
      },
      promptHint:
        'One held "breathing" shot after rapid cuts — logo, URL, or single action. High contrast text for sound-off viewing. End at peak energy, no wind-down.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 30-Second Spot
// ---------------------------------------------------------------------------
// Research: 30s ads drive 24% higher conversions than 15s (MNTN, 1800+ ads).
// 25-30 shots total, ~1.2s average shot length.
// Enough time for a real emotional arc.

export const scienceAd30s: VideoFormula = {
  id: 'science-ad-30s',
  name: 'Science-Backed Ad (30s)',
  description:
    'Research-optimized 30-second spot. The sweet spot — 24% higher conversions than 15s with full emotional arc. Brand at the peak moment (2x recall), escalating rhythm, text overlays for 85% sound-off viewers.',
  author: 'Remotion Studio',
  tags: ['commercial', '30s', 'research-backed', 'conversion', 'all-platforms'],
  targetDuration: 30,
  fps: 30,
  resolution: [1920, 1080],
  defaultTransition: { type: 'crossfade', duration: 0.2 },
  segments: [
    // Phase 1: INTERRUPT (3s / 10%)
    {
      label: 'Pattern Interrupt',
      purpose: 'hook',
      duration: 3,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 40, shotDuration: 1.5 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'neon',
        energy: 10,
        textOverlayHint: 'BOLD CLAIM',
        audioMood: 'intense',
        sfxIntensity: 9,
      },
      promptHint:
        'Cold open into the most compelling moment. 2 shots minimum in first 3s (Google ABCD). Faces, direct eye contact, or impossible visual. Must survive the 87% kill zone.',
    },
    // Brand beat (1s) — Ehrenberg-Bass: distinctive assets from first frame.
    {
      label: 'Brand Flash',
      purpose: 'hook',
      duration: 1,
      defaultSceneType: 'ai-image',
      style: {
        pacing: { cutsPerMin: 60, shotDuration: 1 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'vibrant',
        energy: 8,
        textOverlayHint: 'BRAND',
        kenBurns: 'zoom-in',
        audioMood: 'intense',
        sfxIntensity: 7,
      },
      promptHint:
        'Quick brand flash — logo/product integrated naturally. Ehrenberg-Bass: even skippers must encode the brand. Not a logo card — the brand in context.',
    },
    // Phase 2: TENSION (6s / 20%)
    {
      label: 'The Problem',
      purpose: 'setup',
      duration: 6,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 15, shotDuration: 4 },
        transition: 'crossfade',
        transitionDuration: 0.3,
        colorMood: 'cool',
        energy: 6,
        kenBurns: 'zoom-in',
        audioMood: 'suspense',
        sfxIntensity: 4,
      },
      promptHint:
        'Show the frustration, the gap, the "before" state. Cool desaturated tones. Measured pacing — let the problem breathe. The viewer must feel it emotionally, not just understand it rationally.',
    },
    // Phase 3: TURN (5s / 17%)
    {
      label: 'The Reveal',
      purpose: 're-engage',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 30, shotDuration: 2 },
        transition: 'zoom',
        transitionDuration: 0.15,
        colorMood: 'vibrant',
        energy: 9,
        textOverlayHint: 'INTRODUCING',
        audioMood: 'triumphant',
        sfxIntensity: 9,
      },
      promptHint:
        'THE pivot moment — color warms, saturation jumps, energy spikes. Product/solution reveal with brand prominent. Peak-End Rule: this IS the emotional peak. 2x recall when brand is here.',
    },
    // Phase 4: PROOF (9s / 30%)
    // Split into escalating sub-phases for rhythm acceleration.
    {
      label: 'Proof — Features',
      purpose: 'progression',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 24, shotDuration: 2.5 },
        transition: 'slide',
        transitionDuration: 0.2,
        colorMood: 'warm',
        energy: 7,
        audioMood: 'building',
        sfxIntensity: 6,
      },
      promptHint:
        'Show the product in action — 2-3 key benefits demonstrated visually. Warm tones, moderate pace. Each shot earns its place. Multiple scenes = +40.6% impressions.',
    },
    {
      label: 'Proof — Impact',
      purpose: 'climax',
      duration: 4,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 40, shotDuration: 1.5 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'neon',
        energy: 9,
        textOverlayHint: 'THE RESULT',
        audioMood: 'intense',
        sfxIntensity: 9,
      },
      promptHint:
        'The payoff — results, reactions, transformations at accelerating pace. Cuts compress to 1-1.5s. Audio hits 108+ BPM. This is the second emotional spike (multiple peaks = higher recall).',
    },
    // Phase 5: RESOLVE (6s / 20%)
    {
      label: 'CTA + Close',
      purpose: 'end',
      duration: 6,
      defaultSceneType: 'ai-image',
      style: {
        pacing: { cutsPerMin: 10, shotDuration: 6 },
        transition: 'fade',
        transitionDuration: 0.3,
        colorMood: 'vibrant',
        energy: 9,
        textOverlayHint: 'GET STARTED',
        kenBurns: 'zoom-in',
        audioMood: 'triumphant',
        sfxIntensity: 7,
      },
      promptHint:
        'One held shot after the rapid proof barrage. Logo, CTA, and one specific action. High-contrast text sized for mobile (85% sound-off). End at peak energy — Peak-End Rule says this ending shapes the entire memory of the ad.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 60-Second Spot
// ---------------------------------------------------------------------------
// Research: Quesenberry's 5-act structure predicts Super Bowl ad ratings.
// 40-50 shots total, ~1.3s ASL. Full dramatic arc with emotional depth.
// Longer ads drive more conversions (MNTN).

export const scienceAd60s: VideoFormula = {
  id: 'science-ad-60s',
  name: 'Science-Backed Ad (60s)',
  description:
    'Research-optimized 60-second spot. Full 5-act dramatic structure (predicts Super Bowl ratings — Quesenberry/JHU). Enough time for real emotional investment. Longer ads drive more conversions than shorter ones.',
  author: 'Remotion Studio',
  tags: ['commercial', '60s', 'research-backed', 'brand', 'storytelling'],
  targetDuration: 60,
  fps: 30,
  resolution: [1920, 1080],
  defaultTransition: { type: 'crossfade', duration: 0.3 },
  segments: [
    // ACT 1: EXPOSITION — Interrupt + World Setup (8s / 13%)
    {
      label: 'Cold Open',
      purpose: 'hook',
      duration: 3,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 40, shotDuration: 1.5 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'neon',
        energy: 10,
        textOverlayHint: 'WHAT IF...',
        audioMood: 'intense',
        sfxIntensity: 9,
      },
      promptHint:
        'Drop into the most compelling moment — a curiosity gap or impossible visual. 2+ shots in first 3s. The brain decides in 400ms; you have one chance.',
    },
    {
      label: 'World Setup',
      purpose: 'setup',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 12, shotDuration: 5 },
        transition: 'crossfade',
        transitionDuration: 0.4,
        colorMood: 'cool',
        energy: 5,
        kenBurns: 'pan-right',
        audioMood: 'calm',
        sfxIntensity: 3,
      },
      promptHint:
        'Establish the world, the character, the status quo. Measured pacing. Cool tones signal "before" state. Brand can appear naturally in the environment.',
    },
    // ACT 2: RISING ACTION — Problem + Agitation (12s / 20%)
    {
      label: 'The Problem',
      purpose: 'setup',
      duration: 7,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 12, shotDuration: 5 },
        transition: 'crossfade',
        transitionDuration: 0.4,
        colorMood: 'cool',
        energy: 6,
        kenBurns: 'zoom-in',
        audioMood: 'suspense',
        sfxIntensity: 4,
      },
      promptHint:
        'The inciting incident — what goes wrong, what\'s missing, what the frustration is. Emotional, not rational. Binet & Field: emotional framing is 2x as profitable.',
    },
    {
      label: 'Agitation',
      purpose: 'progression',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 18, shotDuration: 3.3 },
        transition: 'wipe',
        transitionDuration: 0.3,
        colorMood: 'danger-red',
        energy: 7,
        audioMood: 'suspense',
        sfxIntensity: 6,
      },
      promptHint:
        'Make it worse — show the consequences of inaction, the compounding frustration. Pacing begins to tighten. Warmer danger tones. Tension builds.',
    },
    // ACT 3: CLIMAX — The Turn (10s / 17%)
    {
      label: 'The Turn',
      purpose: 're-engage',
      duration: 4,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 30, shotDuration: 2 },
        transition: 'zoom',
        transitionDuration: 0.15,
        colorMood: 'vibrant',
        energy: 10,
        textOverlayHint: 'MEET [BRAND]',
        audioMood: 'triumphant',
        sfxIntensity: 10,
      },
      promptHint:
        'THE moment — everything changes. Color shifts warm, saturation peaks. Product reveal with brand front and center. Peak-End Rule: brand at emotional peak = 2x correct recall.',
    },
    {
      label: 'Transformation',
      purpose: 'climax',
      duration: 6,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 24, shotDuration: 2.5 },
        transition: 'slide',
        transitionDuration: 0.2,
        colorMood: 'vibrant',
        energy: 9,
        audioMood: 'triumphant',
        sfxIntensity: 8,
      },
      promptHint:
        'Show the "after" — the problem dissolving, the world transforming. This is the emotional release. The audience feels what the solution makes possible.',
    },
    // ACT 4: FALLING ACTION — Proof Stack (18s / 30%)
    {
      label: 'Proof — In Action',
      purpose: 'progression',
      duration: 8,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 20, shotDuration: 3 },
        transition: 'crossfade',
        transitionDuration: 0.25,
        colorMood: 'warm',
        energy: 7,
        audioMood: 'building',
        sfxIntensity: 6,
      },
      promptHint:
        'Product demonstration — show key features working in real contexts. Multiple scenes (+40.6% impressions). Warm tones, building rhythm.',
    },
    {
      label: 'Proof — Social',
      purpose: 'progression',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 30, shotDuration: 2 },
        transition: 'slide',
        transitionDuration: 0.15,
        colorMood: 'warm',
        energy: 8,
        audioMood: 'building',
        sfxIntensity: 7,
      },
      promptHint:
        'Social proof — reactions, testimonials, or results. Cuts accelerating toward climax rhythm. 7/10 top Super Bowl ads work without celebrities; authentic people > famous faces.',
    },
    {
      label: 'Proof — Peak',
      purpose: 'climax',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 45, shotDuration: 1.3 },
        transition: 'zoom',
        transitionDuration: 0.1,
        colorMood: 'neon',
        energy: 10,
        textOverlayHint: 'INCREDIBLE',
        audioMood: 'chaotic',
        sfxIntensity: 10,
      },
      promptHint:
        'Fastest cuts — sub-second rapid fire proof montage. The second emotional spike (multiple peaks = higher recall). 108+ BPM audio. Maximum sensory intensity.',
    },
    // ACT 5: DENOUEMENT — Resolution + CTA (12s / 20%)
    {
      label: 'Emotional Resolution',
      purpose: 'middle',
      duration: 5,
      defaultSceneType: 'ai-video',
      style: {
        pacing: { cutsPerMin: 10, shotDuration: 5 },
        transition: 'crossfade',
        transitionDuration: 0.5,
        colorMood: 'warm',
        energy: 7,
        audioMood: 'calm',
        sfxIntensity: 3,
      },
      promptHint:
        'Brief breathing moment after the proof barrage — one beautiful held shot. The aspirational "after" state. Warm, saturated, peaceful. Contrast with the cool "before" makes this feel earned.',
    },
    {
      label: 'CTA + Close',
      purpose: 'end',
      duration: 7,
      defaultSceneType: 'ai-image',
      style: {
        pacing: { cutsPerMin: 8, shotDuration: 7 },
        transition: 'fade',
        transitionDuration: 0.4,
        colorMood: 'vibrant',
        energy: 8,
        textOverlayHint: 'START TODAY',
        kenBurns: 'zoom-in',
        audioMood: 'triumphant',
        sfxIntensity: 6,
      },
      promptHint:
        'Logo, CTA, one specific action. High-contrast text for sound-off (85% muted). Sonic logo if available (96% brand recognition in 3 exposures). Peak-End Rule: this ending defines the memory.',
    },
  ],
};
