/**
 * Hook for transforming Manim coordinates to screen pixels
 */

import { useMemo } from 'react';
import { useVideoConfig } from 'remotion';
import { FRAME_WIDTH, FRAME_HEIGHT } from '../constants';
import type { Point2D, Vector2D } from '../types';

export interface CoordinateTransform {
  /** Convert Manim coords to pixel coords */
  toPixel: (point: Point2D | Vector2D) => Point2D;
  /** Convert pixel coords to Manim coords */
  fromPixel: (point: Point2D) => Point2D;
  /** Convert Manim distance to pixel distance */
  toPixelDistance: (distance: number) => number;
  /** Convert pixel distance to Manim distance */
  fromPixelDistance: (pixels: number) => number;
  /** Pixels per Manim unit */
  scale: number;
  /** Canvas center in pixels */
  center: Point2D;
  /** Video dimensions */
  width: number;
  height: number;
}

export function useCoordinates(): CoordinateTransform {
  const { width, height } = useVideoConfig();

  return useMemo(() => {
    // Calculate scale to fit Manim's coordinate system
    // Manim uses -FRAME_WIDTH/2 to FRAME_WIDTH/2 for x
    // and -FRAME_HEIGHT/2 to FRAME_HEIGHT/2 for y
    const scaleX = width / FRAME_WIDTH;
    const scaleY = height / FRAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const centerX = width / 2;
    const centerY = height / 2;

    const toPixel = (point: Point2D | Vector2D): Point2D => {
      const x = Array.isArray(point) ? point[0] : point.x;
      const y = Array.isArray(point) ? point[1] : point.y;

      return {
        x: centerX + x * scale,
        // Y is flipped because SVG Y goes down, Manim Y goes up
        y: centerY - y * scale,
      };
    };

    const fromPixel = (point: Point2D): Point2D => {
      return {
        x: (point.x - centerX) / scale,
        y: (centerY - point.y) / scale,
      };
    };

    const toPixelDistance = (distance: number): number => {
      return distance * scale;
    };

    const fromPixelDistance = (pixels: number): number => {
      return pixels / scale;
    };

    return {
      toPixel,
      fromPixel,
      toPixelDistance,
      fromPixelDistance,
      scale,
      center: { x: centerX, y: centerY },
      width,
      height,
    };
  }, [width, height]);
}

/**
 * Create a coordinate transform for a specific video size
 * (useful outside React components)
 */
export function createCoordinateTransform(
  width: number,
  height: number
): CoordinateTransform {
  const scaleX = width / FRAME_WIDTH;
  const scaleY = height / FRAME_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  const centerX = width / 2;
  const centerY = height / 2;

  const toPixel = (point: Point2D | Vector2D): Point2D => {
    const x = Array.isArray(point) ? point[0] : point.x;
    const y = Array.isArray(point) ? point[1] : point.y;

    return {
      x: centerX + x * scale,
      y: centerY - y * scale,
    };
  };

  const fromPixel = (point: Point2D): Point2D => {
    return {
      x: (point.x - centerX) / scale,
      y: (centerY - point.y) / scale,
    };
  };

  const toPixelDistance = (distance: number): number => {
    return distance * scale;
  };

  const fromPixelDistance = (pixels: number): number => {
    return pixels / scale;
  };

  return {
    toPixel,
    fromPixel,
    toPixelDistance,
    fromPixelDistance,
    scale,
    center: { x: centerX, y: centerY },
    width,
    height,
  };
}
