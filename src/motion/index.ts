/**
 * Motion System - Public API
 *
 * Pluggable mathematical motion system for 3D objects.
 */

// Types
export * from './types';

// Paths
export * from './paths';

// Core
export { PathRegistry, createPath, getPathTypes, getPathConfigs } from './PathRegistry';
export { MotionController, createMotionController } from './MotionController';
