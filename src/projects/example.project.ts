/**
 * Example Project Manifest
 *
 * This demonstrates how to compose a video from mixed sources:
 * AI-generated images, AI-generated videos, existing compositions,
 * and raw video files — all sequenced with transitions and audio.
 *
 * Generate assets:  npx tsx scripts/generate.ts batch src/projects/example.project.ts
 * Preview:          Open Remotion Studio → "Studio" folder → "ExampleProject"
 */

import type { VideoProject } from '../types/project';

export const project: VideoProject = {
  title: 'Nebula Explainer',
  fps: 30,
  resolution: [1920, 1080],

  defaultTransition: {
    type: 'crossfade',
    duration: 0.5,
  },

  scenes: [
    // Scene 1: AI-generated video intro
    {
      id: 'nebula-intro',
      type: 'ai-video',
      prompt: 'Slow cinematic push through colorful nebula clouds in deep space, volumetric lighting, 4K',
      model: 'veo-2',
      duration: 5,
      // assetPath will be populated after running: npx tsx scripts/generate.ts batch
    },

    // Scene 2: AI-generated image with Ken Burns
    {
      id: 'star-formation',
      type: 'ai-image',
      prompt: 'Photorealistic close-up of star formation inside a nebula, glowing hydrogen gas, Hubble telescope style',
      model: 'dall-e-3',
      duration: 4,
      animation: 'zoom-in',
      size: '1792x1024',
      quality: 'hd',
    },

    // Scene 3: Existing math animation composition
    {
      id: 'lorenz-viz',
      type: 'composition',
      compositionId: 'LorenzAttractor',
      duration: 5,
      transition: {
        type: 'dissolve',
        duration: 0.8,
      },
    },

    // Scene 4: Another AI image with different Ken Burns
    {
      id: 'galaxy-wide',
      type: 'ai-image',
      prompt: 'Wide shot of spiral galaxy with visible nebulae, deep field photography, James Webb telescope style',
      model: 'gpt-image-1',
      duration: 4,
      animation: 'pan-right',
      size: '1536x1024',
      quality: 'high',
    },

    // Scene 5: Raw video file
    {
      id: 'footage-clip',
      type: 'video',
      src: 'videos/flower-abstract.mp4',
      duration: 3,
      volume: 0,
      transition: {
        type: 'wipe',
        duration: 0.5,
      },
    },

    // Scene 6: Static image with slow zoom out
    {
      id: 'closing-image',
      type: 'image',
      src: 'screenshots/linear.png',
      duration: 3,
      animation: 'zoom-out',
      transition: {
        type: 'fade',
        duration: 1,
      },
    },
  ],

  // Global audio layer — background music
  audioLayers: [
    {
      src: 'audio/music/ravel-string-quartet.mp3',
      volume: 0.15,
      loop: true,
    },
  ],
};

export default project;
