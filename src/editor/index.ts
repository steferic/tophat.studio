/**
 * Editor Module - Public API
 */

export { EditorApp } from './EditorApp';
export { EditorCanvas } from './components/EditorCanvas';
export { ObjectHierarchy } from './components/ObjectHierarchy';
export { PropertiesPanel } from './components/PropertiesPanel';
export {
  useEditorStore,
  useSelectedObject,
  useSelectedLight,
  useSceneObjects,
  useSceneLights,
  useCanUndo,
  useCanRedo,
} from './state/editorStore';
export type { EditorState, EditorActions, ToolMode, ViewMode } from './state/editorStore';
