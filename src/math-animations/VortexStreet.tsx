/**
 * Kármán Vortex Street
 * Classic fluid dynamics phenomenon - alternating vortices shed behind an obstacle
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export interface VortexStreetProps {
  startFrame?: number;
}

interface Vortex {
  x: number;
  y: number;
  rotation: number;
  clockwise: boolean;
  opacity: number;
  scale: number;
}

export const VortexStreet: React.FC<VortexStreetProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();
  const time = frame / fps;

  const centerY = height / 2;
  const obstacleX = 200;
  const obstacleRadius = 40;

  // Flow parameters
  const flowSpeed = 120; // pixels per second
  const sheddingFrequency = 1.2; // vortices per second
  const vortexSpacing = flowSpeed / sheddingFrequency;
  const verticalOffset = 50; // alternating offset

  // Generate vortices based on time
  const vortices = useMemo(() => {
    const result: Vortex[] = [];
    const numVortices = 12;

    for (let i = 0; i < numVortices; i++) {
      const birthTime = i / sheddingFrequency;
      const age = time - birthTime;

      if (age < 0) continue;

      const x = obstacleX + obstacleRadius + age * flowSpeed;
      const isUpper = i % 2 === 0;
      const y = centerY + (isUpper ? -verticalOffset : verticalOffset);

      // Vortices drift slightly toward center over time
      const drift = isUpper ? age * 5 : -age * 5;

      // Fade out as they move off screen
      const opacity = interpolate(x, [width * 0.7, width], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

      // Scale grows slightly then shrinks
      const scale = interpolate(age, [0, 0.5, 3], [0.3, 1, 0.8], {
        extrapolateRight: 'clamp',
      });

      result.push({
        x,
        y: y + drift,
        rotation: age * (isUpper ? 360 : -360),
        clockwise: !isUpper,
        opacity,
        scale,
      });
    }

    return result.filter(v => v.x < width + 100 && v.opacity > 0);
  }, [time, width, centerY, sheddingFrequency, flowSpeed, obstacleRadius]);

  // Streamlines (background flow indicators)
  const streamlines = useMemo(() => {
    const lines: { y: number; offset: number }[] = [];
    const numLines = 15;

    for (let i = 0; i < numLines; i++) {
      const y = (height / (numLines + 1)) * (i + 1);
      lines.push({ y, offset: (i * 50) % 200 });
    }

    return lines;
  }, [height]);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      <svg width={width} height={height}>
        <defs>
          {/* Vortex gradient */}
          <radialGradient id="vortex-cw" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#1d4ed8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vortex-ccw" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#dc2626" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Streamlines */}
        {streamlines.map((line, i) => {
          const dashOffset = -time * flowSpeed + line.offset;
          return (
            <line
              key={i}
              x1={0}
              y1={line.y}
              x2={width}
              y2={line.y}
              stroke="#334155"
              strokeWidth={1}
              strokeDasharray="20,30"
              strokeDashoffset={dashOffset}
              opacity={0.5}
            />
          );
        })}

        {/* Obstacle (cylinder) */}
        <circle
          cx={obstacleX}
          cy={centerY}
          r={obstacleRadius}
          fill="#475569"
          stroke="#64748b"
          strokeWidth={2}
        />

        {/* Vortices */}
        {vortices.map((vortex, i) => (
          <g
            key={i}
            transform={`translate(${vortex.x}, ${vortex.y}) rotate(${vortex.rotation}) scale(${vortex.scale})`}
            opacity={vortex.opacity}
          >
            {/* Spiral arms */}
            <path
              d="M 0,0 Q 30,-10 25,-30 Q 20,-50 0,-45 Q -20,-40 -25,-20 Q -30,0 -20,20 Q -10,40 10,35 Q 30,30 35,10 Q 40,-10 30,-25"
              fill="none"
              stroke={vortex.clockwise ? '#3b82f6' : '#ef4444'}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle
              r={40}
              fill={vortex.clockwise ? 'url(#vortex-cw)' : 'url(#vortex-ccw)'}
            />
          </g>
        ))}

        {/* Flow direction arrow */}
        <g transform={`translate(${width - 150}, 80)`}>
          <line x1={0} y1={0} x2={80} y2={0} stroke="#64748b" strokeWidth={2} />
          <polygon points="80,0 65,-8 65,8" fill="#64748b" />
          <text x={40} y={25} textAnchor="middle" fill="#94a3b8" fontSize={14}>
            Flow
          </text>
        </g>

        {/* Title */}
        <text
          x={width / 2}
          y={80}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Kármán Vortex Street
        </text>

        {/* Info */}
        <text
          x={width / 2}
          y={height - 60}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={20}
          fontFamily="monospace"
        >
          Alternating vortices shed behind a cylinder · Re ≈ 100-300
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default VortexStreet;
