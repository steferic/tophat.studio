import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, random, interpolate } from 'remotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  delay: number;
}

interface ParticleFieldProps {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  style?: React.CSSProperties;
  seed?: number;
  fadeIn?: boolean;
  fadeInDuration?: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 50,
  color = '#ffffff',
  minSize = 2,
  maxSize = 6,
  speed = 1,
  style = {},
  seed = 1,
  fadeIn = true,
  fadeInDuration = 30,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: random(`x-${seed}-${i}`) * width,
      y: random(`y-${seed}-${i}`) * height,
      size: minSize + random(`size-${seed}-${i}`) * (maxSize - minSize),
      speedX: (random(`speedX-${seed}-${i}`) - 0.5) * speed * 2,
      speedY: (random(`speedY-${seed}-${i}`) - 0.5) * speed * 2,
      opacity: 0.3 + random(`opacity-${seed}-${i}`) * 0.7,
      delay: random(`delay-${seed}-${i}`) * 20,
    }));
  }, [count, width, height, minSize, maxSize, speed, seed]);

  const globalOpacity = fadeIn
    ? interpolate(frame, [0, fadeInDuration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        opacity: globalOpacity,
      }}
    >
      {particles.map((particle) => {
        const particleFrame = Math.max(0, frame - particle.delay);
        const x = (particle.x + particleFrame * particle.speedX) % width;
        const y = (particle.y + particleFrame * particle.speedY) % height;

        const pulse = Math.sin(particleFrame * 0.1 + particle.id) * 0.3 + 0.7;

        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: x < 0 ? x + width : x,
              top: y < 0 ? y + height : y,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: particle.opacity * pulse,
            }}
          />
        );
      })}
    </div>
  );
};
