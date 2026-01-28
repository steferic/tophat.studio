/**
 * Path Registry
 *
 * Central registry for all available path types.
 * Allows dynamic path creation and discovery.
 */

import type { PathGenerator, PathConfig, PathFactory } from './types/path';
import { LorenzPath } from './paths/LorenzPath';
import { Lissajous3DPath } from './paths/Lissajous3DPath';
import { CircularPath } from './paths/CircularPath';
import { SplinePath } from './paths/SplinePath';
import { LinearPath } from './paths/LinearPath';

// ============================================================================
// Registry Entry Type
// ============================================================================

interface PathRegistryEntry {
  /** Path type identifier */
  type: string;
  /** Factory function to create path instances */
  factory: PathFactory;
  /** Get configuration/metadata */
  getConfig: () => PathConfig;
}

// ============================================================================
// Path Registry
// ============================================================================

class PathRegistryImpl {
  private paths: Map<string, PathRegistryEntry> = new Map();

  constructor() {
    // Register built-in paths
    this.registerBuiltInPaths();
  }

  /**
   * Register built-in path types
   */
  private registerBuiltInPaths(): void {
    // Lorenz Attractor
    this.register({
      type: 'lorenz',
      factory: (params) => new LorenzPath(params),
      getConfig: () => new LorenzPath().getConfig(),
    });

    // Lissajous 3D
    this.register({
      type: 'lissajous',
      factory: (params) => new Lissajous3DPath(params),
      getConfig: () => new Lissajous3DPath().getConfig(),
    });

    // Circular/Orbit
    this.register({
      type: 'circular',
      factory: (params) => new CircularPath(params),
      getConfig: () => new CircularPath().getConfig(),
    });

    // Spline
    this.register({
      type: 'spline',
      factory: (params) => new SplinePath(undefined, params),
      getConfig: () => new SplinePath().getConfig(),
    });

    // Linear
    this.register({
      type: 'linear',
      factory: (params) => new LinearPath(params),
      getConfig: () => new LinearPath().getConfig(),
    });
  }

  /**
   * Register a new path type
   */
  register(entry: PathRegistryEntry): void {
    this.paths.set(entry.type, entry);
  }

  /**
   * Unregister a path type
   */
  unregister(type: string): boolean {
    return this.paths.delete(type);
  }

  /**
   * Check if a path type is registered
   */
  has(type: string): boolean {
    return this.paths.has(type);
  }

  /**
   * Create a path instance by type
   */
  create(type: string, params?: Record<string, number>): PathGenerator | null {
    const entry = this.paths.get(type);
    if (!entry) {
      console.warn(`PathRegistry: Unknown path type "${type}"`);
      return null;
    }
    return entry.factory(params);
  }

  /**
   * Get configuration for a path type
   */
  getConfig(type: string): PathConfig | null {
    const entry = this.paths.get(type);
    if (!entry) {
      return null;
    }
    return entry.getConfig();
  }

  /**
   * Get all registered path types
   */
  getTypes(): string[] {
    return Array.from(this.paths.keys());
  }

  /**
   * Get all path configurations
   */
  getAllConfigs(): PathConfig[] {
    return Array.from(this.paths.values()).map((entry) => entry.getConfig());
  }

  /**
   * Get a path entry
   */
  get(type: string): PathRegistryEntry | undefined {
    return this.paths.get(type);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const PathRegistry = new PathRegistryImpl();

/**
 * Convenience function to create a path by type
 */
export function createPath(
  type: string,
  params?: Record<string, number>
): PathGenerator | null {
  return PathRegistry.create(type, params);
}

/**
 * Get available path types
 */
export function getPathTypes(): string[] {
  return PathRegistry.getTypes();
}

/**
 * Get all path configurations for UI display
 */
export function getPathConfigs(): PathConfig[] {
  return PathRegistry.getAllConfigs();
}

export default PathRegistry;
