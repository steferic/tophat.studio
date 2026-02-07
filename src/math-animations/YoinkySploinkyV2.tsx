/**
 * Yoinky Sploinky V2 - Chaotic Bouncing Particles
 * Particles that bounce, stretch, and absolutely refuse to behave.
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Subtitles } from '../components/Subtitles';
import yoinkySploinkyV2Subtitles from '../../public/audio/voiceovers/yoinky-sploinky-v2-voiceover.json';

export interface YoinkySploinkyV2Props {
  startFrame?: number;
  particleCount?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  phase: number;
  elasticity: number;
}

// Seeded random for deterministic animation
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const YoinkySploinkyV2: React.FC<YoinkySploinkyV2Props> = ({
  startFrame = 0,
  particleCount = 12,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();

  const time = frame / fps;

  // Initialize particles
  const initialParticles = useMemo(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: seededRandom(i * 1.1) * width * 0.6 + width * 0.2,
        y: seededRandom(i * 2.2) * height * 0.6 + height * 0.2,
        vx: (seededRandom(i * 3.3) - 0.5) * 300,
        vy: (seededRandom(i * 4.4) - 0.5) * 300,
        radius: 20 + seededRandom(i * 5.5) * 30,
        hue: seededRandom(i * 6.6) * 360,
        phase: seededRandom(i * 7.7) * Math.PI * 2,
        elasticity: 0.7 + seededRandom(i * 8.8) * 0.25,
      });
    }
    return particles;
  }, [particleCount, width, height]);

  // Simulate particles
  const particles = useMemo(() => {
    const dt = 1 / 60;
    const gravity = 400;
    const damping = 0.99;
    const steps = frame;

    // Clone initial state
    const p = initialParticles.map(particle => ({ ...particle }));

    for (let step = 0; step < steps; step++) {
      for (let i = 0; i < p.length; i++) {
        const particle = p[i];

        // Apply gravity with some chaos
        particle.vy += gravity * dt;
        particle.vx += Math.sin(step * 0.05 + particle.phase) * 50 * dt;

        // Apply velocity
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        // Apply damping
        particle.vx *= damping;
        particle.vy *= damping;

        // Bounce off walls with "yoinky" effect
        if (particle.x - particle.radius < 0) {
          particle.x = particle.radius;
          particle.vx = -particle.vx * particle.elasticity;
          // Add random "sploinky"
          particle.vy += (seededRandom(step + i * 100) - 0.5) * 200;
        }
        if (particle.x + particle.radius > width) {
          particle.x = width - particle.radius;
          particle.vx = -particle.vx * particle.elasticity;
          particle.vy += (seededRandom(step + i * 101) - 0.5) * 200;
        }
        if (particle.y - particle.radius < 0) {
          particle.y = particle.radius;
          particle.vy = -particle.vy * particle.elasticity;
          particle.vx += (seededRandom(step + i * 102) - 0.5) * 200;
        }
        if (particle.y + particle.radius > height) {
          particle.y = height - particle.radius;
          particle.vy = -particle.vy * particle.elasticity;
          // Big "yoink" on ground bounce
          particle.vx += (seededRandom(step + i * 103) - 0.5) * 300;
        }

        // Particle-particle collisions (simplified)
        for (let j = i + 1; j < p.length; j++) {
          const other = p[j];
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = particle.radius + other.radius;

          if (dist < minDist && dist > 0) {
            // Push apart
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            particle.x -= nx * overlap * 0.5;
            particle.y -= ny * overlap * 0.5;
            other.x += nx * overlap * 0.5;
            other.y += ny * overlap * 0.5;

            // Exchange velocities with chaos
            const relVx = particle.vx - other.vx;
            const relVy = particle.vy - other.vy;
            const impulse = (relVx * nx + relVy * ny) * 0.8;

            particle.vx -= impulse * nx;
            particle.vy -= impulse * ny;
            other.vx += impulse * nx;
            other.vy += impulse * ny;

            // Add "sploinky" randomness
            const chaos = 100;
            particle.vx += (seededRandom(step * 0.1 + i) - 0.5) * chaos;
            particle.vy += (seededRandom(step * 0.2 + i) - 0.5) * chaos;
            other.vx += (seededRandom(step * 0.3 + j) - 0.5) * chaos;
            other.vy += (seededRandom(step * 0.4 + j) - 0.5) * chaos;
          }
        }
      }
    }

    return p;
  }, [frame, initialParticles, width, height]);

  // Calculate stretch based on velocity
  const getStretch = (vx: number, vy: number) => {
    const speed = Math.sqrt(vx * vx + vy * vy);
    const stretch = 1 + speed * 0.001;
    const angle = Math.atan2(vy, vx);
    return { stretch: Math.min(stretch, 1.8), angle };
  };

  // Title animation
  const titleOpacity = interpolate(frame, [0, 30, 60], [0, 0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleScale = interpolate(frame, [30, 60], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Wobble effect for title
  const titleWobble = Math.sin(time * 8) * 3;

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a0a2e' }}>
      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceovers/yoinky-sploinky-v2-voiceover.mp3')} />

      <svg width={width} height={height}>
        <defs>
          {/* Glow filter */}
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines between nearby particles */}
        {particles.map((p1, i) =>
          particles.slice(i + 1).map((p2, j) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 250;

            if (dist < maxDist) {
              const opacity = (1 - dist / maxDist) * 0.4;
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={`hsla(${(p1.hue + p2.hue) / 2}, 70%, 60%, ${opacity})`}
                  strokeWidth={2}
                />
              );
            }
            return null;
          })
        )}

        {/* Particles */}
        {particles.map((particle, i) => {
          const { stretch, angle } = getStretch(particle.vx, particle.vy);
          const squash = 1 / Math.sqrt(stretch);
          const wobble = Math.sin(time * 10 + particle.phase) * 0.1;

          return (
            <g key={i} filter="url(#particleGlow)">
              <ellipse
                cx={particle.x}
                cy={particle.y}
                rx={particle.radius * (stretch + wobble)}
                ry={particle.radius * (squash - wobble * 0.5)}
                fill={`hsl(${particle.hue}, 75%, 55%)`}
                transform={`rotate(${(angle * 180) / Math.PI}, ${particle.x}, ${particle.y})`}
              />
              {/* Inner highlight */}
              <ellipse
                cx={particle.x - particle.radius * 0.2}
                cy={particle.y - particle.radius * 0.2}
                rx={particle.radius * 0.3 * stretch}
                ry={particle.radius * 0.3 * squash}
                fill={`hsl(${particle.hue}, 80%, 80%)`}
                opacity={0.6}
                transform={`rotate(${(angle * 180) / Math.PI}, ${particle.x}, ${particle.y})`}
              />
            </g>
          );
        })}
      </svg>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `scale(${titleScale}) rotate(${titleWobble}deg)`,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#fff',
            margin: 0,
            fontFamily: 'system-ui',
            textShadow: '0 0 30px #ff00ff, 0 0 60px #00ffff',
            letterSpacing: '0.1em',
          }}
        >
          YOINKY SPLOINKY
        </h1>
        <p
          style={{
            fontSize: 28,
            color: '#c0a0ff',
            margin: '15px 0 0 0',
            fontFamily: 'system-ui',
            fontStyle: 'italic',
          }}
        >
          Discovered by Gerald (probably)
        </p>
      </div>

      {/* Subtitles */}
      <Subtitles
        segments={yoinkySploinkyV2Subtitles}
        fontSize={36}
        bottomOffset={100}
        maxWords={10}
      />
    </AbsoluteFill>
  );
};

export default YoinkySploinkyV2;
