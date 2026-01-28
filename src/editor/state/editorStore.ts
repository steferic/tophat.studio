/**
 * Editor State Management
 *
 * Zustand store for the 3D scene editor.
 * Manages scene state, selection, camera, and recording.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

import type {
  Scene,
  SceneObject,
  Light,
  CameraKeyframe,
  Transform,
  MotionConfig,
  Vector3,
} from '../../types/scene';
import { createDefaultScene, createSceneObject } from '../../types/scene';
import type { CameraMode, RecordedPath } from '../../three/camera/types';

// ============================================================================
// Types
// ============================================================================

export type ToolMode = 'select' | 'translate' | 'rotate' | 'scale';
export type ViewMode = 'perspective' | 'top' | 'front' | 'side';

export interface EditorHistory {
  past: Scene[];
  future: Scene[];
}

export interface EditorState {
  // Scene data
  scene: Scene;

  // Selection
  selectedObjectId: string | null;
  selectedLightId: string | null;

  // Camera
  cameraMode: CameraMode;
  isRecording: boolean;
  recordedPath: RecordedPath | null;

  // Tools
  toolMode: ToolMode;
  viewMode: ViewMode;
  showGrid: boolean;
  showAxes: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // UI state
  isPanelOpen: {
    hierarchy: boolean;
    properties: boolean;
    paths: boolean;
    assets: boolean;
  };

  // History for undo/redo
  history: EditorHistory;

  // Playback
  isPlaying: boolean;
  currentFrame: number;
}

export interface EditorActions {
  // Scene
  setScene: (scene: Scene) => void;
  resetScene: () => void;
  loadSceneFromJSON: (json: string) => void;
  exportSceneToJSON: () => string;

  // Objects
  addObject: (object: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  updateObjectTransform: (id: string, transform: Partial<Transform>) => void;
  setObjectMotion: (id: string, motion: MotionConfig | null) => void;
  duplicateObject: (id: string) => void;

  // Lights
  addLight: (light: Light) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, updates: Partial<Light>) => void;

  // Selection
  selectObject: (id: string | null) => void;
  selectLight: (id: string | null) => void;
  clearSelection: () => void;

  // Camera
  setCameraMode: (mode: CameraMode) => void;
  setRecording: (isRecording: boolean) => void;
  setRecordedPath: (path: RecordedPath | null) => void;
  applyCameraPath: () => void;

  // Tools
  setToolMode: (mode: ToolMode) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;

  // UI
  togglePanel: (panel: keyof EditorState['isPanelOpen']) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentFrame: (frame: number) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: EditorState = {
  scene: createDefaultScene('Untitled Scene'),

  selectedObjectId: null,
  selectedLightId: null,

  cameraMode: 'orbit',
  isRecording: false,
  recordedPath: null,

  toolMode: 'select',
  viewMode: 'perspective',
  showGrid: true,
  showAxes: true,
  snapToGrid: false,
  gridSize: 1,

  isPanelOpen: {
    hierarchy: true,
    properties: true,
    paths: false,
    assets: false,
  },

  history: {
    past: [],
    future: [],
  },

  isPlaying: false,
  currentFrame: 0,
};

// ============================================================================
// Store
// ============================================================================

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ======================================================================
      // Scene
      // ======================================================================

      setScene: (scene) =>
        set((state) => {
          state.scene = scene;
        }),

      resetScene: () =>
        set((state) => {
          state.pushHistory();
          state.scene = createDefaultScene('Untitled Scene');
          state.selectedObjectId = null;
          state.selectedLightId = null;
        }),

      loadSceneFromJSON: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.version === '1.0') {
            set((state) => {
              state.pushHistory();
              state.scene = parsed;
            });
          }
        } catch (e) {
          console.error('Failed to parse scene JSON:', e);
        }
      },

      exportSceneToJSON: () => {
        const { scene } = get();
        return JSON.stringify(scene, null, 2);
      },

      // ======================================================================
      // Objects
      // ======================================================================

      addObject: (object) =>
        set((state) => {
          state.pushHistory();
          state.scene.objects.push(object);
        }),

      removeObject: (id) =>
        set((state) => {
          state.pushHistory();
          const index = state.scene.objects.findIndex((o) => o.id === id);
          if (index !== -1) {
            state.scene.objects.splice(index, 1);
          }
          if (state.selectedObjectId === id) {
            state.selectedObjectId = null;
          }
        }),

      updateObject: (id, updates) =>
        set((state) => {
          const object = state.scene.objects.find((o) => o.id === id);
          if (object) {
            Object.assign(object, updates);
          }
        }),

      updateObjectTransform: (id, transform) =>
        set((state) => {
          const object = state.scene.objects.find((o) => o.id === id);
          if (object) {
            object.transform = { ...object.transform, ...transform };
          }
        }),

      setObjectMotion: (id, motion) =>
        set((state) => {
          const object = state.scene.objects.find((o) => o.id === id);
          if (object) {
            object.motion = motion || undefined;
          }
        }),

      duplicateObject: (id) =>
        set((state) => {
          state.pushHistory();
          const object = state.scene.objects.find((o) => o.id === id);
          if (object) {
            const newObject: SceneObject = {
              ...JSON.parse(JSON.stringify(object)),
              id: `${object.id}-copy-${Date.now()}`,
              name: `${object.name} (Copy)`,
              transform: {
                ...object.transform,
                position: [
                  object.transform.position[0] + 1,
                  object.transform.position[1],
                  object.transform.position[2],
                ],
              },
            };
            state.scene.objects.push(newObject);
            state.selectedObjectId = newObject.id;
          }
        }),

      // ======================================================================
      // Lights
      // ======================================================================

      addLight: (light) =>
        set((state) => {
          state.pushHistory();
          state.scene.lights.push(light);
        }),

      removeLight: (id) =>
        set((state) => {
          state.pushHistory();
          const index = state.scene.lights.findIndex((l) => l.id === id);
          if (index !== -1) {
            state.scene.lights.splice(index, 1);
          }
          if (state.selectedLightId === id) {
            state.selectedLightId = null;
          }
        }),

      updateLight: (id, updates) =>
        set((state) => {
          const light = state.scene.lights.find((l) => l.id === id);
          if (light) {
            Object.assign(light, updates);
          }
        }),

      // ======================================================================
      // Selection
      // ======================================================================

      selectObject: (id) =>
        set((state) => {
          state.selectedObjectId = id;
          state.selectedLightId = null;
        }),

      selectLight: (id) =>
        set((state) => {
          state.selectedLightId = id;
          state.selectedObjectId = null;
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedObjectId = null;
          state.selectedLightId = null;
        }),

      // ======================================================================
      // Camera
      // ======================================================================

      setCameraMode: (mode) =>
        set((state) => {
          state.cameraMode = mode;
        }),

      setRecording: (isRecording) =>
        set((state) => {
          state.isRecording = isRecording;
        }),

      setRecordedPath: (path) =>
        set((state) => {
          state.recordedPath = path;
        }),

      applyCameraPath: () =>
        set((state) => {
          if (state.recordedPath) {
            state.scene.camera = {
              type: 'keyframe',
              fov: state.scene.camera.fov,
              keyframes: state.recordedPath.keyframes,
            };
          }
        }),

      // ======================================================================
      // Tools
      // ======================================================================

      setToolMode: (mode) =>
        set((state) => {
          state.toolMode = mode;
        }),

      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode;
        }),

      toggleGrid: () =>
        set((state) => {
          state.showGrid = !state.showGrid;
        }),

      toggleAxes: () =>
        set((state) => {
          state.showAxes = !state.showAxes;
        }),

      toggleSnap: () =>
        set((state) => {
          state.snapToGrid = !state.snapToGrid;
        }),

      setGridSize: (size) =>
        set((state) => {
          state.gridSize = size;
        }),

      // ======================================================================
      // UI
      // ======================================================================

      togglePanel: (panel) =>
        set((state) => {
          state.isPanelOpen[panel] = !state.isPanelOpen[panel];
        }),

      // ======================================================================
      // History
      // ======================================================================

      pushHistory: () =>
        set((state) => {
          // Store deep copy of current scene
          state.history.past.push(JSON.parse(JSON.stringify(state.scene)));
          state.history.future = [];

          // Limit history size
          if (state.history.past.length > 50) {
            state.history.past.shift();
          }
        }),

      undo: () =>
        set((state) => {
          if (state.history.past.length > 0) {
            // Save current to future
            state.history.future.push(JSON.parse(JSON.stringify(state.scene)));

            // Restore from past
            const previous = state.history.past.pop()!;
            state.scene = previous;
          }
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length > 0) {
            // Save current to past
            state.history.past.push(JSON.parse(JSON.stringify(state.scene)));

            // Restore from future
            const next = state.history.future.pop()!;
            state.scene = next;
          }
        }),

      // ======================================================================
      // Playback
      // ======================================================================

      play: () =>
        set((state) => {
          state.isPlaying = true;
        }),

      pause: () =>
        set((state) => {
          state.isPlaying = false;
        }),

      stop: () =>
        set((state) => {
          state.isPlaying = false;
          state.currentFrame = 0;
        }),

      setCurrentFrame: (frame) =>
        set((state) => {
          state.currentFrame = Math.max(0, Math.min(frame, state.scene.metadata.duration));
        }),
    })),
    { name: 'editor-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useSelectedObject = () =>
  useEditorStore((state) => {
    if (!state.selectedObjectId) return null;
    return state.scene.objects.find((o) => o.id === state.selectedObjectId) || null;
  });

export const useSelectedLight = () =>
  useEditorStore((state) => {
    if (!state.selectedLightId) return null;
    return state.scene.lights.find((l) => l.id === state.selectedLightId) || null;
  });

export const useSceneObjects = () =>
  useEditorStore((state) => state.scene.objects);

export const useSceneLights = () =>
  useEditorStore((state) => state.scene.lights);

export const useCanUndo = () =>
  useEditorStore((state) => state.history.past.length > 0);

export const useCanRedo = () =>
  useEditorStore((state) => state.history.future.length > 0);

export default useEditorStore;
