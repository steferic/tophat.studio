/**
 * Vector Components Visualization (3D)
 * Shows x and y components of a rotating vector on a 3D coordinate grid
 */

import React, { useMemo, Suspense } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Video } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Line, Text, useGLTF, Clone } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface VectorComponentsProps {
  startFrame?: number;
  /** Radius of the circle */
  radius?: number;
  /** Rotations per cycle */
  rotationsPerCycle?: number;
  /** Grid color */
  gridColor?: string;
  /** Main vector color */
  vectorColor?: string;
  /** X component color */
  xColor?: string;
  /** Y component color */
  yColor?: string;
}

// ISS Model component
const ISSModel: React.FC<{
  position: [number, number, number];
  rotation: number;
}> = ({ position, rotation }) => {
  const { scene } = useGLTF(staticFile('models/iss.glb'));

  return (
    <group
      position={position}
      rotation={[0, 0, rotation * 0.1]}
      scale={0.002}
    >
      <Clone object={scene} />
    </group>
  );
};

// Arrow component for 3D vectors
const Arrow: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  lineWidth?: number;
}> = ({ start, end, color, lineWidth = 3 }) => {
  const direction = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  );
  const length = direction.length();

  if (length < 0.01) return null;

  const arrowHeadLength = Math.min(0.2, length * 0.2);
  const arrowHeadWidth = 0.1;

  // Calculate arrow head position
  const normalized = direction.clone().normalize();
  const arrowBase = new THREE.Vector3(
    end[0] - normalized.x * arrowHeadLength,
    end[1] - normalized.y * arrowHeadLength,
    end[2] - normalized.z * arrowHeadLength
  );

  // Create perpendicular vectors for arrow head
  const up = new THREE.Vector3(0, 0, 1);
  const perp1 = new THREE.Vector3().crossVectors(normalized, up).normalize();
  if (perp1.length() < 0.01) {
    perp1.set(1, 0, 0);
  }

  const head1: [number, number, number] = [
    arrowBase.x + perp1.x * arrowHeadWidth,
    arrowBase.y + perp1.y * arrowHeadWidth,
    arrowBase.z + perp1.z * arrowHeadWidth,
  ];
  const head2: [number, number, number] = [
    arrowBase.x - perp1.x * arrowHeadWidth,
    arrowBase.y - perp1.y * arrowHeadWidth,
    arrowBase.z - perp1.z * arrowHeadWidth,
  ];

  return (
    <>
      <Line
        points={[start, [arrowBase.x, arrowBase.y, arrowBase.z]]}
        color={color}
        lineWidth={lineWidth}
      />
      <Line
        points={[head1, end, head2]}
        color={color}
        lineWidth={lineWidth}
      />
    </>
  );
};

// 3D Scene content
const Scene: React.FC<{
  frame: number;
  durationInFrames: number;
  radius: number;
  rotationsPerCycle: number;
  gridColor: string;
  vectorColor: string;
  xColor: string;
  yColor: string;
}> = ({
  frame,
  durationInFrames,
  radius,
  rotationsPerCycle,
  gridColor,
  vectorColor,
  xColor,
  yColor,
}) => {
  const gridExtent = 4;

  // Animation
  const progress = frame / durationInFrames;
  const vectorAngle = progress * Math.PI * 2 * rotationsPerCycle;

  // Vector components
  const x = radius * Math.cos(vectorAngle);
  const y = radius * Math.sin(vectorAngle);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: Array<{ points: [number, number, number][]; isAxis: boolean }> = [];

    for (let i = -gridExtent; i <= gridExtent; i++) {
      // Lines parallel to Y axis
      lines.push({
        points: [[i, -gridExtent, 0], [i, gridExtent, 0]],
        isAxis: i === 0,
      });
      // Lines parallel to X axis
      lines.push({
        points: [[-gridExtent, i, 0], [gridExtent, i, 0]],
        isAxis: i === 0,
      });
    }

    return lines;
  }, [gridExtent]);

  // Circle points
  const circlePoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push([radius * Math.cos(theta), radius * Math.sin(theta), 0]);
    }
    return points;
  }, [radius]);

  // Make camera look at origin
  const { camera } = useThree();
  camera.lookAt(0, 0, 0);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 10]} intensity={1} />
      <directionalLight position={[-5, -5, 10]} intensity={0.5} />

      {/* Grid */}
      {gridLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.isAxis ? '#475569' : gridColor}
          lineWidth={line.isAxis ? 2 : 1}
        />
      ))}

      {/* Circle path (dashed effect via segments) */}
      <Line
        points={circlePoints}
        color="#64748b"
        lineWidth={1}
        dashed
        dashSize={0.15}
        gapSize={0.1}
      />

      {/* X component vector (blue) */}
      <Arrow
        start={[0, 0, 0]}
        end={[x, 0, 0]}
        color={xColor}
        lineWidth={4}
      />

      {/* Y component vector (green) - from x tip */}
      <Arrow
        start={[x, 0, 0]}
        end={[x, y, 0]}
        color={yColor}
        lineWidth={4}
      />

      {/* Dashed projection lines */}
      <Line
        points={[[x, y, 0], [x, 0, 0]]}
        color={yColor}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.1}
        transparent
        opacity={0.5}
      />
      <Line
        points={[[x, y, 0], [0, y, 0]]}
        color={xColor}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.1}
        transparent
        opacity={0.5}
      />

      {/* Main vector (dark) */}
      <Arrow
        start={[0, 0, 0]}
        end={[x, y, 0]}
        color={vectorColor}
        lineWidth={3}
      />

      {/* ISS model at the point on circle */}
      <Suspense fallback={null}>
        <ISSModel position={[x, y, 0.5]} rotation={vectorAngle} />
      </Suspense>

      {/* Origin point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Axis labels */}
      <Text
        position={[gridExtent + 0.5, 0, 0]}
        fontSize={0.4}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        x
      </Text>
      <Text
        position={[0, gridExtent + 0.5, 0]}
        fontSize={0.4}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        y
      </Text>

      {/* Component value labels - positioned to face camera */}
      <Text
        position={[x / 2, -0.5, 0.1]}
        fontSize={0.3}
        color={xColor}
        anchorX="center"
        anchorY="middle"
      >
        {`x = ${x.toFixed(2)}`}
      </Text>
      <Text
        position={[x + (x >= 0 ? 0.8 : -0.8), y / 2, 0.1]}
        fontSize={0.3}
        color={yColor}
        anchorX="center"
        anchorY="middle"
      >
        {`y = ${y.toFixed(2)}`}
      </Text>
    </>
  );
};

export const VectorComponents: React.FC<VectorComponentsProps> = ({
  startFrame = 0,
  radius = 2,
  rotationsPerCycle = 2,
  gridColor = '#94a3b8',
  vectorColor = '#1e293b',
  xColor = '#3b82f6',
  yColor = '#22c55e',
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Vector components for overlay text
  const progress = frame / durationInFrames;
  const angle = progress * Math.PI * 2 * rotationsPerCycle;
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);

  // Camera orbit animation
  const cameraOrbitAngle = interpolate(frame, [0, durationInFrames], [0, Math.PI * 2]);
  const cameraRadius = 12;
  const cameraHeight = 6;
  const cameraX = Math.sin(cameraOrbitAngle) * cameraRadius;
  const cameraY = -Math.cos(cameraOrbitAngle) * cameraRadius;

  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{
          position: [cameraX, cameraY, cameraHeight],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
      >
        <Scene
          frame={frame}
          durationInFrames={durationInFrames}
          radius={radius}
          rotationsPerCycle={rotationsPerCycle}
          gridColor={gridColor}
          vectorColor={vectorColor}
          xColor={xColor}
          yColor={yColor}
        />
      </ThreeCanvas>

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 48,
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0,
          }}
        >
          Vector Components
        </h1>
      </div>

      {/* Equations overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 60,
          textAlign: 'right',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ color: xColor, fontSize: 20, marginBottom: 8 }}>
          x = r·cos(θ) = {radius}·cos(θ)
        </div>
        <div style={{ color: yColor, fontSize: 20, marginBottom: 8 }}>
          y = r·sin(θ) = {radius}·sin(θ)
        </div>
        <div style={{ color: '#64748b', fontSize: 16 }}>
          r = {radius}, θ = {((angle * 180 / Math.PI) % 360).toFixed(0)}°
        </div>
      </div>

      {/* Flower abstract video in top right */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          width: 180,
          height: 320,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Video
          src={staticFile('videos/flower-abstract.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loop
        />
      </div>

      {/* Bee video in top left */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          width: 180,
          height: 320,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <Video
          src={staticFile('videos/bee-portrait.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loop
        />
      </div>

      {/* Psychedelic video in bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          width: 300,
          height: 200,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <Video
          src={staticFile('videos/psychedelic-liquid.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loop
        />
      </div>
    </AbsoluteFill>
  );
};

export default VectorComponents;
