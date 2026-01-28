/**
 * Mandelbrot Set Zoom Animation
 * GPU-accelerated using WebGL shaders for smooth 60fps rendering
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

export interface MandelbrotZoomProps {
  startFrame?: number;
  /** Center point to zoom into (real part) */
  targetX?: number;
  /** Center point to zoom into (imaginary part) */
  targetY?: number;
  /** Maximum iterations for escape calculation */
  maxIterations?: number;
  /** Color palette: 'classic', 'fire', 'ocean', 'blues', 'monochrome', 'warm', 'cream' */
  colorPalette?: 'classic' | 'fire' | 'ocean' | 'blues' | 'monochrome' | 'warm' | 'cream';
}

// Vertex shader - just pass through coordinates
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - calculates Mandelbrot on GPU
const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 center;
  uniform float scale;
  uniform float aspectRatio;
  uniform int maxIterations;
  uniform int colorPalette;

  vec3 getColor(float t, int palette) {
    if (palette == 1) {
      // Fire: black -> red -> yellow -> white
      if (t < 0.33) {
        return vec3(t / 0.33, 0.0, 0.0);
      } else if (t < 0.66) {
        return vec3(1.0, (t - 0.33) / 0.33, 0.0);
      } else {
        return vec3(1.0, 1.0, (t - 0.66) / 0.34);
      }
    } else if (palette == 2) {
      // Ocean: dark blue -> cyan -> white
      if (t < 0.5) {
        float s = t / 0.5;
        return vec3(0.0, 0.4 * s, 0.6 + 0.4 * s);
      } else {
        float s = (t - 0.5) / 0.5;
        return vec3(s, 0.4 + 0.6 * s, 1.0);
      }
    } else if (palette == 3) {
      // Blues: black -> deep blue -> light blue -> white
      if (t < 0.5) {
        float s = t / 0.5;
        return vec3(0.0, 0.2 * s, 0.8 * s);
      } else {
        float s = (t - 0.5) / 0.5;
        return vec3(s, 0.2 + 0.8 * s, 0.8 + 0.2 * s);
      }
    } else if (palette == 4) {
      // Monochrome
      return vec3(t, t, t);
    } else if (palette == 5) {
      // Warm: cream -> peach -> coral -> gold (light palette)
      if (t < 0.33) {
        float s = t / 0.33;
        return vec3(1.0, 0.98 - 0.1 * s, 0.94 - 0.2 * s);
      } else if (t < 0.66) {
        float s = (t - 0.33) / 0.33;
        return vec3(1.0, 0.88 - 0.2 * s, 0.74 - 0.2 * s);
      } else {
        float s = (t - 0.66) / 0.34;
        return vec3(0.95 - 0.15 * s, 0.68 - 0.05 * s, 0.54 + 0.1 * s);
      }
    } else if (palette == 6) {
      // Cream: very light - off-white -> soft gold -> warm beige (lightest palette)
      if (t < 0.5) {
        float s = t / 0.5;
        return vec3(1.0, 0.995 - 0.05 * s, 0.97 - 0.1 * s);
      } else {
        float s = (t - 0.5) / 0.5;
        return vec3(0.98 - 0.08 * s, 0.945 - 0.1 * s, 0.87 - 0.15 * s);
      }
    } else {
      // Classic: black -> purple -> blue -> cyan -> white
      if (t < 0.25) {
        float s = t / 0.25;
        return vec3(0.3 * s, 0.0, 0.5 * s);
      } else if (t < 0.5) {
        float s = (t - 0.25) / 0.25;
        return vec3(0.3 - 0.3 * s, 0.0, 0.5 + 0.5 * s);
      } else if (t < 0.75) {
        float s = (t - 0.5) / 0.25;
        return vec3(0.0, 0.8 * s, 1.0);
      } else {
        float s = (t - 0.75) / 0.25;
        return vec3(s, 0.8 + 0.2 * s, 1.0);
      }
    }
  }

  void main() {
    // Map UV to complex plane
    vec2 c = center + (vUv - 0.5) * vec2(scale * aspectRatio, scale);

    vec2 z = vec2(0.0);
    int iterations = 0;

    for (int i = 0; i < 1000; i++) {
      if (i >= maxIterations) break;
      if (dot(z, z) > 4.0) break;

      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      iterations++;
    }

    if (iterations >= maxIterations) {
      // Inside the set - use light color for light palettes
      if (colorPalette == 5 || colorPalette == 6) {
        gl_FragColor = vec4(1.0, 0.99, 0.96, 1.0); // Warm off-white
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    } else {
      // Smooth coloring
      float smoothed = float(iterations) + 1.0 - log(log(dot(z, z)) / 2.0) / log(2.0);
      float t = smoothed / float(maxIterations);
      t = clamp(t, 0.0, 1.0);

      vec3 color = getColor(t, colorPalette);
      gl_FragColor = vec4(color, 1.0);
    }
  }
`;

const paletteToInt: Record<string, number> = {
  classic: 0,
  fire: 1,
  ocean: 2,
  blues: 3,
  monochrome: 4,
  warm: 5,
  cream: 6,
};

export const MandelbrotPlane: React.FC<{
  center: [number, number];
  scale: number;
  maxIterations: number;
  colorPalette: string;
  aspectRatio: number;
}> = ({ center, scale, maxIterations, colorPalette, aspectRatio }) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        center: { value: new THREE.Vector2(center[0], center[1]) },
        scale: { value: scale },
        aspectRatio: { value: aspectRatio },
        maxIterations: { value: maxIterations },
        colorPalette: { value: paletteToInt[colorPalette] || 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // Update uniforms when props change
  material.uniforms.center.value.set(center[0], center[1]);
  material.uniforms.scale.value = scale;
  material.uniforms.maxIterations.value = maxIterations;
  material.uniforms.colorPalette.value = paletteToInt[colorPalette] || 0;
  material.uniforms.aspectRatio.value = aspectRatio;

  // With camera at z=1 and fov=90, visible height = 2, so plane height = 2
  // Width needs to account for aspect ratio
  const planeHeight = 2;
  const planeWidth = planeHeight * aspectRatio;

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export const MandelbrotZoom: React.FC<MandelbrotZoomProps> = ({
  startFrame = 0,
  targetX = -0.743643887037151,
  targetY = 0.131825904205330,
  maxIterations = 200,
  colorPalette = 'classic',
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames } = useVideoConfig();

  const aspectRatio = width / height;

  // Zoom calculation - exponential zoom
  const zoomProgress = interpolate(frame, [0, durationInFrames - 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Start with view of full set, zoom in exponentially
  const initialScale = 3.5;
  const finalScale = 0.00001;
  const currentScale = initialScale * Math.pow(finalScale / initialScale, zoomProgress);

  // Interpolate center from (-0.5, 0) to target
  const centerX = interpolate(zoomProgress, [0, 0.3], [-0.5, targetX], {
    extrapolateRight: 'clamp',
  });
  const centerY = interpolate(zoomProgress, [0, 0.3], [0, targetY], {
    extrapolateRight: 'clamp',
  });

  // Increase iterations as we zoom deeper
  const dynamicIterations = Math.floor(maxIterations + zoomProgress * 500);

  const zoomLevel = initialScale / currentScale;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 1], fov: 90 }}
      >
        <MandelbrotPlane
          center={[centerX, centerY]}
          scale={currentScale}
          maxIterations={dynamicIterations}
          colorPalette={colorPalette}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>

      {/* Title */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: '#fff',
          margin: 0,
          textShadow: '0 0 20px rgba(0,0,0,0.8)',
        }}>
          Mandelbrot Set
        </h1>
      </div>

      {/* Zoom info */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 16,
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
      }}>
        <p style={{ margin: '5px 0' }}>Zoom: {zoomLevel.toExponential(2)}x</p>
        <p style={{ margin: '5px 0' }}>Center: ({centerX.toFixed(10)}, {centerY.toFixed(10)})</p>
        <p style={{ margin: '5px 0' }}>Iterations: {dynamicIterations}</p>
      </div>

      {/* Formula */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 20,
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
      }}>
        z → z² + c
      </div>
    </AbsoluteFill>
  );
};

export default MandelbrotZoom;
