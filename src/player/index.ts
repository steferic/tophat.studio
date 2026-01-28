/**
 * Scene Player - Public API
 */

export { ScenePlayer, SceneComposition } from './ScenePlayer';
export type { ScenePlayerProps, SceneCompositionProps } from './ScenePlayer';

export { MotionObject3D } from './MotionObject3D';
export type { MotionObject3DProps } from './MotionObject3D';

export {
  CameraPathPlayer,
  CameraLookAt,
  StaticCamera,
  OrbitCamera,
  useCameraPathPlayer,
} from './CameraPathPlayer';
export type {
  CameraPathPlayerProps,
  CameraLookAtProps,
  StaticCameraProps,
  OrbitCameraProps,
} from './CameraPathPlayer';

export {
  interpolateCameraPath,
  slerp,
  normalizeQuat,
  eulerToQuat,
  quatToEuler,
  simplifyPath,
  resampleKeyframes,
  smoothKeyframes,
} from './PathInterpolator';
export type { CameraState } from './PathInterpolator';
