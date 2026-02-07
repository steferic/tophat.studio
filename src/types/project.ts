/**
 * Project Manifest Types
 *
 * A VideoProject describes an entire video as a sequence of scenes.
 * Each scene can be an AI-generated video/image, an existing Remotion
 * composition, or a raw video/image file. The manifest is the single
 * source of truth for generation, composition, and rendering.
 */

// ---------------------------------------------------------------------------
// Scene types
// ---------------------------------------------------------------------------

export type SceneType = 'ai-video' | 'ai-image' | 'composition' | 'video' | 'image';

export type AIModel =
  | 'dall-e-3'
  | 'gpt-image-1'
  | 'imagen-4'
  | 'veo-2'
  | 'sora';

export type TransitionType =
  | 'none'
  | 'crossfade'
  | 'fade'
  | 'slide'
  | 'wipe'
  | 'iris'
  | 'zoom'
  | 'dissolve';

export type KenBurnsPreset =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'zoom-in-pan-right'
  | 'zoom-out-pan-left';

// ---------------------------------------------------------------------------
// Scene definitions
// ---------------------------------------------------------------------------

interface SceneBase {
  /** Unique scene identifier */
  id: string;
  /** Duration in seconds */
  duration: number;
  /** Transition to apply when entering this scene */
  transition?: {
    type: TransitionType;
    duration: number; // seconds
  };
  /** Audio layers for this scene */
  audio?: SceneAudio;
}

export interface AIVideoScene extends SceneBase {
  type: 'ai-video';
  /** Generation prompt */
  prompt: string;
  /** AI model to use */
  model: AIModel;
  /** Path to generated asset (populated after generation) */
  assetPath?: string;
  /** Negative prompt */
  negativePrompt?: string;
  /** Aspect ratio override */
  aspectRatio?: string;
}

export interface AIImageScene extends SceneBase {
  type: 'ai-image';
  /** Generation prompt */
  prompt: string;
  /** AI model to use */
  model: AIModel;
  /** Path to generated asset (populated after generation) */
  assetPath?: string;
  /** Ken Burns animation to apply */
  animation?: KenBurnsPreset;
  /** Image size (e.g. "1792x1024") */
  size?: string;
  /** Quality setting */
  quality?: 'low' | 'medium' | 'high' | 'hd' | 'standard';
  /** Negative prompt */
  negativePrompt?: string;
}

export interface CompositionScene extends SceneBase {
  type: 'composition';
  /** Remotion composition ID to render */
  compositionId: string;
  /** Props to pass to the composition */
  props?: Record<string, unknown>;
}

export interface VideoScene extends SceneBase {
  type: 'video';
  /** Path to video file (relative to public/) */
  src: string;
  /** Trim range in seconds [start, end] */
  trim?: [number, number];
  /** Playback rate */
  playbackRate?: number;
  /** Volume (0-1) */
  volume?: number;
}

export interface ImageScene extends SceneBase {
  type: 'image';
  /** Path to image file (relative to public/) */
  src: string;
  /** Ken Burns animation to apply */
  animation?: KenBurnsPreset;
}

export type Scene = AIVideoScene | AIImageScene | CompositionScene | VideoScene | ImageScene;

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export interface SceneAudio {
  /** Voiceover text (will be generated via ElevenLabs) */
  voiceover?: string;
  /** Path to voiceover audio file */
  voiceoverPath?: string;
  /** Path to subtitle JSON */
  subtitlePath?: string;
  /** Background music path */
  musicPath?: string;
  /** Music volume (0-1) */
  musicVolume?: number;
}

export interface AudioLayer {
  /** Path to audio file (relative to public/) */
  src: string;
  /** Volume (0-1) */
  volume?: number;
  /** Start time in seconds (within the project timeline) */
  startAt?: number;
  /** Trim the audio source from this second */
  trimFrom?: number;
  /** Trim the audio source to this second */
  trimTo?: number;
  /** Loop the audio */
  loop?: boolean;
}

// ---------------------------------------------------------------------------
// Asset metadata (sidecar .meta.json)
// ---------------------------------------------------------------------------

export interface AssetMeta {
  /** Original prompt used to generate */
  prompt: string;
  /** Model used */
  model: AIModel;
  /** When it was generated */
  generatedAt: string;
  /** Generation parameters */
  params: Record<string, unknown>;
  /** Asset type */
  type: 'image' | 'video';
  /** Dimensions */
  width?: number;
  height?: number;
  /** Duration in seconds (for video) */
  duration?: number;
  /** File size in bytes */
  fileSize?: number;
}

// ---------------------------------------------------------------------------
// Project manifest
// ---------------------------------------------------------------------------

export interface VideoProject {
  /** Project title */
  title: string;
  /** Frames per second */
  fps: number;
  /** Resolution [width, height] */
  resolution: [number, number];
  /** Ordered list of scenes */
  scenes: Scene[];
  /** Global audio layers (music, ambient, etc.) */
  audioLayers?: AudioLayer[];
  /** Default transition between scenes */
  defaultTransition?: {
    type: TransitionType;
    duration: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate total project duration in seconds */
export function getProjectDuration(project: VideoProject): number {
  let total = 0;
  for (const scene of project.scenes) {
    total += scene.duration;
  }
  // Subtract transition overlaps
  for (let i = 1; i < project.scenes.length; i++) {
    const t = project.scenes[i].transition ?? project.defaultTransition;
    if (t && t.type !== 'none') {
      total -= t.duration;
    }
  }
  return total;
}

/** Calculate total project duration in frames */
export function getProjectDurationInFrames(project: VideoProject): number {
  return Math.ceil(getProjectDuration(project) * project.fps);
}

/** Get all scenes that need AI generation */
export function getScenesNeedingGeneration(project: VideoProject): (AIVideoScene | AIImageScene)[] {
  return project.scenes.filter(
    (s): s is AIVideoScene | AIImageScene =>
      (s.type === 'ai-video' || s.type === 'ai-image') && !s.assetPath
  );
}
