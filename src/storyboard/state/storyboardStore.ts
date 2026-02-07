/**
 * Storyboard Store
 *
 * Zustand store managing the storyboard UI state: the active project,
 * selected scene, asset library, and UI controls. Uses Immer for
 * immutable state mutations (same pattern as editorStore).
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type {
  VideoProject,
  Scene,
  AIVideoScene,
  AIImageScene,
  CompositionScene,
  VideoScene,
  ImageScene,
  AudioLayer,
  TransitionType,
  AIModel,
  AssetMeta,
} from '../../types/project';
import { getProjectDuration, getProjectDurationInFrames } from '../../types/project';

// ---------------------------------------------------------------------------
// Asset types
// ---------------------------------------------------------------------------

export interface AssetEntry {
  filename: string;
  path: string; // relative to public/
  type: 'image' | 'video';
  meta?: AssetMeta;
  thumbnailUrl?: string;
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface StoryboardState {
  // Project
  project: VideoProject;
  isDirty: boolean;
  projectPath: string | null;

  // Selection
  selectedSceneId: string | null;

  // Asset library
  assets: AssetEntry[];
  assetFilter: 'all' | 'image' | 'video';
  assetSearch: string;

  // UI
  panels: {
    assetLibrary: boolean;
    sceneEditor: boolean;
    timeline: boolean;
  };
  isGenerating: boolean;
  generatingSceneId: string | null;

  // Computed
  totalDuration: number;
  totalFrames: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface StoryboardActions {
  // Project
  setProject: (project: VideoProject) => void;
  setProjectPath: (path: string | null) => void;
  newProject: (title?: string) => void;
  updateProjectMeta: (updates: Partial<Pick<VideoProject, 'title' | 'fps' | 'resolution'>>) => void;

  // Scenes
  addScene: (scene: Scene, afterId?: string) => void;
  removeScene: (id: string) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  moveScene: (id: string, direction: 'up' | 'down') => void;
  reorderScenes: (orderedIds: string[]) => void;
  selectScene: (id: string | null) => void;
  duplicateScene: (id: string) => void;

  // Quick scene creators
  addAIImageScene: (prompt: string, model?: AIModel) => void;
  addAIVideoScene: (prompt: string, model?: AIModel) => void;
  addVideoScene: (src: string) => void;
  addImageScene: (src: string) => void;
  addCompositionScene: (compositionId: string) => void;

  // Scene transitions
  setSceneTransition: (id: string, type: TransitionType, duration?: number) => void;
  setDefaultTransition: (type: TransitionType, duration: number) => void;

  // Audio
  addAudioLayer: (layer: AudioLayer) => void;
  removeAudioLayer: (index: number) => void;
  updateAudioLayer: (index: number, updates: Partial<AudioLayer>) => void;

  // Asset library
  setAssets: (assets: AssetEntry[]) => void;
  refreshAssets: () => Promise<void>;
  setAssetFilter: (filter: 'all' | 'image' | 'video') => void;
  setAssetSearch: (search: string) => void;

  // Generation
  setGenerating: (isGenerating: boolean, sceneId?: string | null) => void;
  markSceneGenerated: (sceneId: string, assetPath: string) => void;

  // UI
  togglePanel: (panel: keyof StoryboardState['panels']) => void;

  // Serialization
  exportProjectJSON: () => string;
  importProjectJSON: (json: string) => void;

  // Helpers
  getSelectedScene: () => Scene | null;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function createDefaultProject(title = 'Untitled Project'): VideoProject {
  return {
    title,
    fps: 30,
    resolution: [1920, 1080],
    scenes: [],
    audioLayers: [],
    defaultTransition: {
      type: 'crossfade',
      duration: 0.5,
    },
  };
}

function generateId(): string {
  return `scene_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStoryboardStore = create<StoryboardState & StoryboardActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      project: createDefaultProject(),
      isDirty: false,
      projectPath: null,
      selectedSceneId: null,
      assets: [],
      assetFilter: 'all',
      assetSearch: '',
      panels: {
        assetLibrary: true,
        sceneEditor: true,
        timeline: true,
      },
      isGenerating: false,
      generatingSceneId: null,
      totalDuration: 0,
      totalFrames: 0,

      // --- Project ---

      setProject: (project) =>
        set((s) => {
          s.project = project;
          s.isDirty = false;
          s.selectedSceneId = null;
          s.totalDuration = getProjectDuration(project);
          s.totalFrames = getProjectDurationInFrames(project);
        }),

      setProjectPath: (path) =>
        set((s) => {
          s.projectPath = path;
        }),

      newProject: (title) =>
        set((s) => {
          s.project = createDefaultProject(title);
          s.isDirty = false;
          s.projectPath = null;
          s.selectedSceneId = null;
          s.totalDuration = 0;
          s.totalFrames = 0;
        }),

      updateProjectMeta: (updates) =>
        set((s) => {
          if (updates.title !== undefined) s.project.title = updates.title;
          if (updates.fps !== undefined) s.project.fps = updates.fps;
          if (updates.resolution !== undefined) s.project.resolution = updates.resolution;
          s.isDirty = true;
          s.totalDuration = getProjectDuration(s.project);
          s.totalFrames = getProjectDurationInFrames(s.project);
        }),

      // --- Scenes ---

      addScene: (scene, afterId) =>
        set((s) => {
          if (afterId) {
            const idx = s.project.scenes.findIndex((sc) => sc.id === afterId);
            if (idx !== -1) {
              s.project.scenes.splice(idx + 1, 0, scene);
            } else {
              s.project.scenes.push(scene);
            }
          } else {
            s.project.scenes.push(scene);
          }
          s.isDirty = true;
          s.selectedSceneId = scene.id;
          s.totalDuration = getProjectDuration(s.project);
          s.totalFrames = getProjectDurationInFrames(s.project);
        }),

      removeScene: (id) =>
        set((s) => {
          s.project.scenes = s.project.scenes.filter((sc) => sc.id !== id);
          if (s.selectedSceneId === id) s.selectedSceneId = null;
          s.isDirty = true;
          s.totalDuration = getProjectDuration(s.project);
          s.totalFrames = getProjectDurationInFrames(s.project);
        }),

      updateScene: (id, updates) =>
        set((s) => {
          const scene = s.project.scenes.find((sc) => sc.id === id);
          if (scene) {
            Object.assign(scene, updates);
            s.isDirty = true;
            s.totalDuration = getProjectDuration(s.project);
            s.totalFrames = getProjectDurationInFrames(s.project);
          }
        }),

      moveScene: (id, direction) =>
        set((s) => {
          const idx = s.project.scenes.findIndex((sc) => sc.id === id);
          if (idx === -1) return;
          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= s.project.scenes.length) return;
          const temp = s.project.scenes[idx];
          s.project.scenes[idx] = s.project.scenes[newIdx];
          s.project.scenes[newIdx] = temp;
          s.isDirty = true;
        }),

      reorderScenes: (orderedIds) =>
        set((s) => {
          const sceneMap = new Map(s.project.scenes.map((sc) => [sc.id, sc]));
          const reordered: Scene[] = [];
          for (const id of orderedIds) {
            const scene = sceneMap.get(id);
            if (scene) reordered.push(scene);
          }
          // Add any scenes not in orderedIds at the end
          for (const scene of s.project.scenes) {
            if (!orderedIds.includes(scene.id)) reordered.push(scene);
          }
          s.project.scenes = reordered;
          s.isDirty = true;
        }),

      selectScene: (id) =>
        set((s) => {
          s.selectedSceneId = id;
        }),

      duplicateScene: (id) =>
        set((s) => {
          const scene = s.project.scenes.find((sc) => sc.id === id);
          if (!scene) return;
          const newScene = {
            ...JSON.parse(JSON.stringify(scene)),
            id: generateId(),
          };
          const idx = s.project.scenes.findIndex((sc) => sc.id === id);
          s.project.scenes.splice(idx + 1, 0, newScene);
          s.selectedSceneId = newScene.id;
          s.isDirty = true;
          s.totalDuration = getProjectDuration(s.project);
          s.totalFrames = getProjectDurationInFrames(s.project);
        }),

      // --- Quick scene creators ---

      addAIImageScene: (prompt, model = 'dall-e-3') => {
        const scene: AIImageScene = {
          id: generateId(),
          type: 'ai-image',
          prompt,
          model,
          duration: 4,
          animation: 'zoom-in',
          size: model === 'gpt-image-1' ? '1536x1024' : '1792x1024',
          quality: model === 'gpt-image-1' ? 'high' : 'hd',
        };
        get().addScene(scene);
      },

      addAIVideoScene: (prompt, model = 'veo-2') => {
        const scene: AIVideoScene = {
          id: generateId(),
          type: 'ai-video',
          prompt,
          model,
          duration: 5,
        };
        get().addScene(scene);
      },

      addVideoScene: (src) => {
        const scene: VideoScene = {
          id: generateId(),
          type: 'video',
          src,
          duration: 5,
        };
        get().addScene(scene);
      },

      addImageScene: (src) => {
        const scene: ImageScene = {
          id: generateId(),
          type: 'image',
          src,
          duration: 4,
          animation: 'zoom-in',
        };
        get().addScene(scene);
      },

      addCompositionScene: (compositionId) => {
        const scene: CompositionScene = {
          id: generateId(),
          type: 'composition',
          compositionId,
          duration: 5,
        };
        get().addScene(scene);
      },

      // --- Transitions ---

      setSceneTransition: (id, type, duration) =>
        set((s) => {
          const scene = s.project.scenes.find((sc) => sc.id === id);
          if (scene) {
            scene.transition = { type, duration: duration ?? 0.5 };
            s.isDirty = true;
            s.totalDuration = getProjectDuration(s.project);
            s.totalFrames = getProjectDurationInFrames(s.project);
          }
        }),

      setDefaultTransition: (type, duration) =>
        set((s) => {
          s.project.defaultTransition = { type, duration };
          s.isDirty = true;
          s.totalDuration = getProjectDuration(s.project);
          s.totalFrames = getProjectDurationInFrames(s.project);
        }),

      // --- Audio ---

      addAudioLayer: (layer) =>
        set((s) => {
          if (!s.project.audioLayers) s.project.audioLayers = [];
          s.project.audioLayers.push(layer);
          s.isDirty = true;
        }),

      removeAudioLayer: (index) =>
        set((s) => {
          s.project.audioLayers?.splice(index, 1);
          s.isDirty = true;
        }),

      updateAudioLayer: (index, updates) =>
        set((s) => {
          if (s.project.audioLayers?.[index]) {
            Object.assign(s.project.audioLayers[index], updates);
            s.isDirty = true;
          }
        }),

      // --- Assets ---

      setAssets: (assets) =>
        set((s) => {
          s.assets = assets;
        }),

      refreshAssets: async () => {
        // In the browser, we fetch an API endpoint or scan via a dev server route
        // For now, this is a stub that can be wired up later
        try {
          const res = await fetch('/api/assets');
          if (res.ok) {
            const data = await res.json();
            set((s) => {
              s.assets = data;
            });
          }
        } catch {
          // Asset API not available — this is fine during initial dev
        }
      },

      setAssetFilter: (filter) =>
        set((s) => {
          s.assetFilter = filter;
        }),

      setAssetSearch: (search) =>
        set((s) => {
          s.assetSearch = search;
        }),

      // --- Generation ---

      setGenerating: (isGenerating, sceneId = null) =>
        set((s) => {
          s.isGenerating = isGenerating;
          s.generatingSceneId = sceneId ?? null;
        }),

      markSceneGenerated: (sceneId, assetPath) =>
        set((s) => {
          const scene = s.project.scenes.find((sc) => sc.id === sceneId);
          if (scene && (scene.type === 'ai-image' || scene.type === 'ai-video')) {
            (scene as AIImageScene | AIVideoScene).assetPath = assetPath;
            s.isDirty = true;
          }
        }),

      // --- UI ---

      togglePanel: (panel) =>
        set((s) => {
          s.panels[panel] = !s.panels[panel];
        }),

      // --- Serialization ---

      exportProjectJSON: () => {
        return JSON.stringify(get().project, null, 2);
      },

      importProjectJSON: (json) => {
        try {
          const project = JSON.parse(json) as VideoProject;
          get().setProject(project);
        } catch (e) {
          console.error('Failed to parse project JSON:', e);
        }
      },

      // --- Helpers ---

      getSelectedScene: () => {
        const { project, selectedSceneId } = get();
        if (!selectedSceneId) return null;
        return project.scenes.find((s) => s.id === selectedSceneId) ?? null;
      },
    })),
    { name: 'storyboard-store' }
  )
);

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export const useSelectedScene = () =>
  useStoryboardStore((s) =>
    s.selectedSceneId ? s.project.scenes.find((sc) => sc.id === s.selectedSceneId) ?? null : null
  );

export const useProjectScenes = () => useStoryboardStore((s) => s.project.scenes);

export const useFilteredAssets = () =>
  useStoryboardStore((s) => {
    let filtered = s.assets;
    if (s.assetFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === s.assetFilter);
    }
    if (s.assetSearch) {
      const q = s.assetSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.filename.toLowerCase().includes(q) ||
          a.meta?.prompt?.toLowerCase().includes(q)
      );
    }
    return filtered;
  });
