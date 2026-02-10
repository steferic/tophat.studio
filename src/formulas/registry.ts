import type { VideoFormula, VideoProject, Scene, AIImageScene, AIVideoScene } from '../types/project';
import { mrbeastFormula } from './mrbeast';
import { viralCommercialFormula } from './viral-commercial';
import { scienceAd15s, scienceAd30s, scienceAd60s } from './science-of-ads';

const builtInFormulas: VideoFormula[] = [
  mrbeastFormula,
  viralCommercialFormula,
  scienceAd15s,
  scienceAd30s,
  scienceAd60s,
];
const customFormulas: VideoFormula[] = [];

export function getAllFormulas(): VideoFormula[] {
  return [...builtInFormulas, ...customFormulas];
}

export function getFormulaById(id: string): VideoFormula | undefined {
  return getAllFormulas().find((f) => f.id === id);
}

export function addCustomFormula(formula: VideoFormula): void {
  if (getAllFormulas().some((f) => f.id === formula.id)) {
    throw new Error(`Formula with id "${formula.id}" already exists`);
  }
  customFormulas.push(formula);
}

export function removeCustomFormula(id: string): boolean {
  const idx = customFormulas.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  customFormulas.splice(idx, 1);
  return true;
}

let idCounter = 0;
function generateId(): string {
  return `scene_${Date.now()}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function formulaToProject(formula: VideoFormula): VideoProject {
  const scenes: Scene[] = formula.segments.map((segment, i) => {
    const base = {
      id: generateId(),
      duration: segment.duration,
      transition: {
        type: segment.style.transition,
        duration: segment.style.transitionDuration,
      },
      formulaMeta: {
        formulaId: formula.id,
        segmentIndex: i,
        segmentLabel: segment.label,
        purpose: segment.purpose,
        style: segment.style,
        promptHint: segment.promptHint,
      },
    };

    if (segment.defaultSceneType === 'ai-video') {
      return {
        ...base,
        type: 'ai-video' as const,
        prompt: segment.promptHint ?? segment.label,
        model: 'veo-2' as const,
      } satisfies AIVideoScene;
    }

    return {
      ...base,
      type: 'ai-image' as const,
      prompt: segment.promptHint ?? segment.label,
      model: 'gpt-image-1' as const,
      animation: segment.style.kenBurns,
      size: '1536x1024',
      quality: 'high' as const,
    } satisfies AIImageScene;
  });

  return {
    title: `${formula.name} Project`,
    fps: formula.fps,
    resolution: formula.resolution,
    scenes,
    audioLayers: [],
    defaultTransition: formula.defaultTransition,
  };
}
