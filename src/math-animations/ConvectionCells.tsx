/**
 * Rayleigh-Bénard Convection Cells
 * Heat-driven convection patterns in a fluid layer
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface ConvectionCellsProps {
  startFrame?: number;
}

interface ConvectionParticle {
  id: number;
  cellIndex: number;
  angle: number;
  radius: number;
  temperature: number;
}

export const ConvectionCells: React.FC<ConvectionCellsProps> = ({ startFrame = 0 }) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, fps } = useVideoConfig();
  const time = frame / fps;

  const numCells = 6;
  const cellWidth = (width - 100) / numCells;
  const cellHeight = height - 300;
  const topY = 150;

  // Generate particles for each convection cell
  const particles = useMemo(() => {
    const result: ConvectionParticle[] = [];
    const particlesPerCell = 20;

    for (let cell = 0; cell < numCells; cell++) {
      const cellCenterX = 50 + cellWidth * (cell + 0.5);
      const cellCenterY = topY + cellHeight / 2;
      const isClockwise = cell % 2 === 0;

      for (let p = 0; p < particlesPerCell; p++) {
        // Distribute particles around the cell
        const baseAngle = (p / particlesPerCell) * Math.PI * 2;
        const radiusVariation = 0.6 + (p % 3) * 0.15;

        result.push({
          id: cell * particlesPerCell + p,
          cellIndex: cell,
          angle: baseAngle,
          radius: radiusVariation,
          temperature: 0,
        });
      }
    }

    return result;
  }, [numCells, cellWidth, cellHeight, topY]);

  // Animate particles
  const animatedParticles = useMemo(() => {
    return particles.map((p) => {
      const cellCenterX = 50 + cellWidth * (p.cellIndex + 0.5);
      const cellCenterY = topY + cellHeight / 2;
      const isClockwise = p.cellIndex % 2 === 0;

      // Angular velocity
      const angularSpeed = 0.5 * (isClockwise ? 1 : -1);
      const currentAngle = p.angle + time * angularSpeed;

      // Elliptical path (wider than tall)
      const radiusX = (cellWidth / 2 - 20) * p.radius;
      const radiusY = (cellHeight / 2 - 30) * p.radius;

      const x = cellCenterX + Math.cos(currentAngle) * radiusX;
      const y = cellCenterY + Math.sin(currentAngle) * radiusY;

      // Temperature based on vertical position (hot at bottom, cold at top)
      const normalizedY = (y - topY) / cellHeight;
      const temperature = normalizedY;

      return { ...p, x, y, temperature, currentAngle };
    });
  }, [particles, time, cellWidth, cellHeight, topY]);

  // Cell boundaries and flow arrows
  const cellVisuals = useMemo(() => {
    const visuals: { centerX: number; centerY: number; isClockwise: boolean }[] = [];

    for (let i = 0; i < numCells; i++) {
      visuals.push({
        centerX: 50 + cellWidth * (i + 0.5),
        centerY: topY + cellHeight / 2,
        isClockwise: i % 2 === 0,
      });
    }

    return visuals;
  }, [numCells, cellWidth, cellHeight, topY]);

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const cellOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' });

  // Temperature color function
  const tempToColor = (temp: number): string => {
    // Blue (cold) at top, red (hot) at bottom
    const r = Math.floor(temp * 255);
    const b = Math.floor((1 - temp) * 255);
    const g = Math.floor(Math.min(temp, 1 - temp) * 2 * 100);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      <svg width={width} height={height}>
        <defs>
          {/* Hot plate gradient */}
          <linearGradient id="hot-plate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          {/* Cold plate gradient */}
          <linearGradient id="cold-plate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Cold plate (top) */}
        <rect
          x={50}
          y={topY - 30}
          width={width - 100}
          height={25}
          fill="url(#cold-plate)"
          rx={4}
          opacity={cellOpacity}
        />
        <text x={width / 2} y={topY - 40} textAnchor="middle" fill="#60a5fa" fontSize={16}>
          Cold Surface
        </text>

        {/* Hot plate (bottom) */}
        <rect
          x={50}
          y={topY + cellHeight + 5}
          width={width - 100}
          height={25}
          fill="url(#hot-plate)"
          rx={4}
          opacity={cellOpacity}
        />
        <text x={width / 2} y={topY + cellHeight + 55} textAnchor="middle" fill="#f87171" fontSize={16}>
          Hot Surface
        </text>

        {/* Cell boundaries */}
        <rect
          x={50}
          y={topY}
          width={width - 100}
          height={cellHeight}
          fill="none"
          stroke="#475569"
          strokeWidth={2}
          opacity={cellOpacity}
        />

        {/* Vertical cell dividers (dashed) */}
        {cellVisuals.slice(1).map((_, i) => (
          <line
            key={i}
            x1={50 + cellWidth * (i + 1)}
            y1={topY}
            x2={50 + cellWidth * (i + 1)}
            y2={topY + cellHeight}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="5,5"
            opacity={cellOpacity * 0.5}
          />
        ))}

        {/* Flow direction indicators */}
        {cellVisuals.map((cell, i) => {
          const arrowRadius = Math.min(cellWidth, cellHeight) * 0.25;
          const numArrows = 4;

          return (
            <g key={i} opacity={cellOpacity * 0.4}>
              {Array.from({ length: numArrows }).map((_, a) => {
                const angle = (a / numArrows) * Math.PI * 2 + time * 0.5 * (cell.isClockwise ? 1 : -1);
                const x = cell.centerX + Math.cos(angle) * arrowRadius * 1.5;
                const y = cell.centerY + Math.sin(angle) * arrowRadius * 0.8;
                const tangentAngle = angle + Math.PI / 2 * (cell.isClockwise ? 1 : -1);

                return (
                  <g key={a} transform={`translate(${x}, ${y}) rotate(${(tangentAngle * 180) / Math.PI})`}>
                    <polygon points="0,-4 8,0 0,4" fill="#64748b" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Particles */}
        {animatedParticles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={tempToColor(p.temperature)}
            opacity={0.8}
          />
        ))}

        {/* Title */}
        <text
          x={width / 2}
          y={60}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Rayleigh-Bénard Convection
        </text>

        {/* Info */}
        <text
          x={width / 2}
          y={height - 40}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={20}
          fontFamily="monospace"
        >
          Heat-driven convection cells · Hot fluid rises, cold fluid sinks
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default ConvectionCells;
