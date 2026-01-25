/**
 * Direction constants for Manim coordinate system
 * Manim uses a mathematical coordinate system where:
 * - RIGHT is +x
 * - UP is +y
 * - OUT is +z (towards viewer)
 */

import type { Vector2D, Vector3D } from '../types';

// Primary directions (2D)
export const RIGHT: Vector2D = [1, 0];
export const LEFT: Vector2D = [-1, 0];
export const UP: Vector2D = [0, 1];
export const DOWN: Vector2D = [0, -1];
export const ORIGIN: Vector2D = [0, 0];

// Diagonal directions
export const UL: Vector2D = [-1, 1];  // Up-Left
export const UR: Vector2D = [1, 1];   // Up-Right
export const DL: Vector2D = [-1, -1]; // Down-Left
export const DR: Vector2D = [1, -1];  // Down-Right

// 3D directions
export const OUT: Vector3D = [0, 0, 1];  // Towards viewer
export const IN: Vector3D = [0, 0, -1];  // Away from viewer

export const RIGHT_3D: Vector3D = [1, 0, 0];
export const LEFT_3D: Vector3D = [-1, 0, 0];
export const UP_3D: Vector3D = [0, 1, 0];
export const DOWN_3D: Vector3D = [0, -1, 0];
export const ORIGIN_3D: Vector3D = [0, 0, 0];

// Math constants
export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const DEGREES = PI / 180;
