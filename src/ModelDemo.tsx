import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas, ModelWithFallback } from './three';

/**
 * Orbiting Model - circles around a center point
 */
const OrbitingModel: React.FC<{
  src: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset?: number;
  scale?: number;
  yPosition?: number;
}> = ({ src, orbitRadius, orbitSpeed, orbitOffset = 0, scale = 1, yPosition = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const angle = orbitOffset + time * orbitSpeed * Math.PI * 2;
  const x = Math.cos(angle) * orbitRadius;
  const z = Math.sin(angle) * orbitRadius;

  return (
    <ModelWithFallback
      src={src}
      position={[x, yPosition, z]}
      scale={scale}
      autoRotate={[0, 0.1, 0]}
    />
  );
};

/**
 * Model Demo - Apple in center with Rock and Rose orbiting
 */
export const ModelDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#333',
          zIndex: 10,
        }}
      >
        Orbiting Models
      </div>

      <ThreeCanvas camera={{ position: [0, 3, 8], fov: 60 }} background="white">
        <ambientLight intensity={3} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-5, 5, -5]} intensity={1} />

        {/* Apple in the center */}
        <ModelWithFallback
          src={staticFile('models/apple.glb')}
          position={[0, 0, 0]}
          scale={1.5}
          autoRotate={[0, 0.05, 0]}
        />

        {/* Rose orbiting */}
        <OrbitingModel
          src={staticFile('models/rose.glb')}
          orbitRadius={4}
          orbitSpeed={0.15}
          orbitOffset={0}
          scale={10}
          yPosition={0.5}
        />

        {/* Rock orbiting (opposite side) */}
        <OrbitingModel
          src={staticFile('models/rock.glb')}
          orbitRadius={4}
          orbitSpeed={0.15}
          orbitOffset={Math.PI}
          scale={0.8}
          yPosition={0}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
