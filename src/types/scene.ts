/**
 * Scene JSON Schema - Portable scene data format
 * Used for interchange between Editor and Remotion Player
 */

// ============================================================================
// Basic Types
// ============================================================================

export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number]; // Quaternion
export type Color = string; // Hex color string

// ============================================================================
// Camera Types
// ============================================================================

export interface CameraKeyframe {
  /** Frame number (0-indexed) */
  frame: number;
  /** Camera position in world space */
  position: Vector3;
  /** Camera rotation as quaternion (x, y, z, w) for SLERP interpolation */
  rotation: Vector4;
  /** Optional FOV override at this keyframe */
  fov?: number;
}

export interface CameraPath {
  /** Type of camera animation */
  type: 'static' | 'path' | 'keyframe';
  /** Default field of view */
  fov: number;
  /** Near clipping plane */
  near?: number;
  /** Far clipping plane */
  far?: number;
  /** For static camera: initial position */
  position?: Vector3;
  /** For static camera: look-at target */
  lookAt?: Vector3;
  /** For keyframe-based camera: recorded keyframes */
  keyframes?: CameraKeyframe[];
}

// ============================================================================
// Lighting Types
// ============================================================================

export type LightType = 'ambient' | 'directional' | 'point' | 'spot';

export interface Light {
  id: string;
  type: LightType;
  color: Color;
  intensity: number;
  /** Position for point/spot lights */
  position?: Vector3;
  /** Target direction for directional/spot lights */
  target?: Vector3;
  /** For point/spot: distance attenuation */
  distance?: number;
  /** For spot: cone angle in radians */
  angle?: number;
  /** For spot: penumbra softness */
  penumbra?: number;
  /** Cast shadows */
  castShadow?: boolean;
}

// ============================================================================
// Motion System Types
// ============================================================================

export type PathType =
  | 'lorenz'
  | 'lissajous'
  | 'circular'
  | 'linear'
  | 'spline'
  | 'custom';

export type LoopMode = 'none' | 'loop' | 'pingpong';

export type ModifierType =
  | 'rotation'
  | 'wobble'
  | 'scalePulse'
  | 'lookAt';

export interface Modifier {
  type: ModifierType;
  params: Record<string, number | string | boolean>;
}

export interface MotionConfig {
  /** Type of mathematical path */
  pathType: PathType;
  /** Path-specific parameters */
  pathParams: Record<string, number>;
  /** Movement speed multiplier */
  speed: number;
  /** Progress offset (0-1) for syncing multiple objects */
  progressOffset: number;
  /** How to handle end of path */
  loop: LoopMode;
  /** Additional modifiers (rotation, wobble, etc.) */
  modifiers: Modifier[];
}

// ============================================================================
// Object Types
// ============================================================================

export type ObjectType = 'model' | 'primitive';
export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane';

export interface Transform {
  position: Vector3;
  rotation: Vector3; // Euler angles in radians
  scale: Vector3;
}

export interface SceneObject {
  id: string;
  name: string;
  type: ObjectType;

  /** For models: path to GLB/GLTF file */
  modelPath?: string;

  /** For primitives: type and properties */
  primitiveType?: PrimitiveType;
  primitiveProps?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    segments?: number;
    color?: Color;
    wireframe?: boolean;
  };

  /** Object transform */
  transform: Transform;

  /** Optional motion assignment */
  motion?: MotionConfig;

  /** Whether object receives shadows */
  receiveShadow?: boolean;
  /** Whether object casts shadows */
  castShadow?: boolean;

  /** Object visibility */
  visible?: boolean;
}

// ============================================================================
// Environment Types
// ============================================================================

export interface Environment {
  /** Background color */
  background: Color;
  /** Ambient light settings */
  ambientLight: {
    color: Color;
    intensity: number;
  };
  /** Optional fog settings */
  fog?: {
    color: Color;
    near: number;
    far: number;
  };
  /** Optional environment map for reflections */
  environmentMap?: string;
}

// ============================================================================
// Scene Metadata
// ============================================================================

export interface SceneMetadata {
  /** Scene display name */
  name: string;
  /** Scene description */
  description?: string;
  /** Total duration in frames */
  duration: number;
  /** Frames per second */
  fps: number;
  /** Resolution width */
  width?: number;
  /** Resolution height */
  height?: number;
  /** Author/creator */
  author?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last modified timestamp */
  modifiedAt?: string;
}

// ============================================================================
// Main Scene Interface
// ============================================================================

export interface Scene {
  /** Schema version for compatibility */
  version: '1.0';

  /** Scene metadata */
  metadata: SceneMetadata;

  /** Environment settings */
  environment: Environment;

  /** Camera configuration */
  camera: CameraPath;

  /** Scene lights */
  lights: Light[];

  /** Scene objects */
  objects: SceneObject[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a default empty scene
 */
export function createDefaultScene(name: string = 'Untitled Scene'): Scene {
  return {
    version: '1.0',
    metadata: {
      name,
      duration: 300, // 5 seconds at 60fps
      fps: 60,
      width: 1920,
      height: 1080,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    environment: {
      background: '#1a1a2e',
      ambientLight: {
        color: '#ffffff',
        intensity: 0.5,
      },
    },
    camera: {
      type: 'static',
      fov: 50,
      position: [0, 0, 10],
      lookAt: [0, 0, 0],
    },
    lights: [
      {
        id: 'main-light',
        type: 'directional',
        color: '#ffffff',
        intensity: 1,
        position: [10, 10, 10],
        target: [0, 0, 0],
      },
    ],
    objects: [],
  };
}

/**
 * Creates a scene object with defaults
 */
export function createSceneObject(
  id: string,
  name: string,
  type: ObjectType,
  overrides?: Partial<SceneObject>
): SceneObject {
  return {
    id,
    name,
    type,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    visible: true,
    ...overrides,
  };
}

/**
 * Validates a scene object
 */
export function validateScene(scene: unknown): scene is Scene {
  if (!scene || typeof scene !== 'object') return false;
  const s = scene as Scene;

  return (
    s.version === '1.0' &&
    typeof s.metadata?.name === 'string' &&
    typeof s.metadata?.duration === 'number' &&
    typeof s.metadata?.fps === 'number' &&
    typeof s.environment?.background === 'string' &&
    typeof s.camera?.type === 'string' &&
    Array.isArray(s.lights) &&
    Array.isArray(s.objects)
  );
}
