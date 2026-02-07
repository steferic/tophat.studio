/**
 * Three-Body Problem Visualization
 * Gravitational simulation of three masses with colored fading trails.
 * Uses the Chenciner–Montgomery figure-eight periodic orbit as initial
 * conditions, with a small perturbation so the system diverges into chaos.
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Subtitles } from '../components/Subtitles';
import threeBodySubtitles from '../../public/audio/voiceovers/three-body-voiceover.json';

export interface ThreeBodyProps {
  startFrame?: number;
  /** Number of past positions to draw in each trail */
  trailLength?: number;
  /** Perturbation applied to the figure-eight initial conditions */
  perturbation?: number;
  /** Gravitational constant (G) */
  gravitationalConstant?: number;
  /** Simulation speed multiplier (higher = faster physics, chaos appears sooner) */
  simulationSpeed?: number;
}

// ---------- types ----------

interface Vec2 {
  x: number;
  y: number;
}

interface Body {
  pos: Vec2;
  vel: Vec2;
  mass: number;
}

/** Flat state: [x0,y0,vx0,vy0, x1,y1,vx1,vy1, x2,y2,vx2,vy2] */
type State = number[];

/** One snapshot of screen-space positions for the three bodies */
interface FrameSnapshot {
  positions: Vec2[];
}

// ---------- physics ----------

const SOFTENING = 0.02; // prevents singularity at close approach

/**
 * Compute derivatives of the state vector under Newtonian gravity.
 * F = G * m_i * m_j / (r^2 + eps^2)
 */
const derivatives = (
  s: State,
  masses: number[],
  G: number,
): State => {
  const d: State = new Array(12).fill(0);

  // velocities → position derivatives
  for (let i = 0; i < 3; i++) {
    d[i * 4 + 0] = s[i * 4 + 2]; // dx = vx
    d[i * 4 + 1] = s[i * 4 + 3]; // dy = vy
  }

  // gravitational accelerations
  for (let i = 0; i < 3; i++) {
    let ax = 0;
    let ay = 0;
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      const dx = s[j * 4 + 0] - s[i * 4 + 0];
      const dy = s[j * 4 + 1] - s[i * 4 + 1];
      const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const r = Math.sqrt(r2);
      const f = G * masses[j] / (r2 * r); // magnitude / direction already in dx,dy
      ax += f * dx;
      ay += f * dy;
    }
    d[i * 4 + 2] = ax;
    d[i * 4 + 3] = ay;
  }

  return d;
};

/** Add two state vectors: a + b*scale */
const addScaled = (a: State, b: State, scale: number): State =>
  a.map((v, i) => v + b[i] * scale);

/**
 * Single RK4 integration step.
 */
const rk4Step = (
  s: State,
  dt: number,
  masses: number[],
  G: number,
): State => {
  const k1 = derivatives(s, masses, G);
  const k2 = derivatives(addScaled(s, k1, dt / 2), masses, G);
  const k3 = derivatives(addScaled(s, k2, dt / 2), masses, G);
  const k4 = derivatives(addScaled(s, k3, dt), masses, G);

  return s.map(
    (v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]),
  );
};

/**
 * Build initial conditions from the Chenciner–Montgomery figure-eight
 * solution (equal masses = 1, G = 1).
 *
 * Reference values from Chenciner & Montgomery (2000):
 *   body 0 starts at (-0.97000436, 0.24308753)  with velocity ~ (v3x, v3y)
 *   body 1 starts at ( 0.97000436,-0.24308753)  with velocity ~ (v3x, v3y)
 *   body 2 starts at ( 0, 0)                     with velocity ~ (-2*v3x, -2*v3y)
 * where v3 ≈ (-0.93240737, -0.86473146) / 2
 */
const figureEightBodies = (perturbation: number): Body[] => {
  const v3x = -0.93240737 / 2;
  const v3y = -0.86473146 / 2;

  return [
    {
      pos: { x: -0.97000436 + perturbation, y: 0.24308753 },
      vel: { x: v3x, y: v3y },
      mass: 1,
    },
    {
      pos: { x: 0.97000436, y: -0.24308753 },
      vel: { x: v3x, y: v3y },
      mass: 1,
    },
    {
      pos: { x: 0, y: 0 },
      vel: { x: -2 * v3x, y: -2 * v3y },
      mass: 1,
    },
  ];
};

const bodiesToState = (bodies: Body[]): State =>
  bodies.flatMap((b) => [b.pos.x, b.pos.y, b.vel.x, b.vel.y]);

/**
 * Run the full simulation, returning one FrameSnapshot per video frame.
 */
const simulateThreeBody = (
  numFrames: number,
  fps: number,
  perturbation: number,
  G: number,
  simulationSpeed: number = 1,
  stepsPerFrame: number = 20,
): FrameSnapshot[] => {
  const bodies = figureEightBodies(perturbation);
  const masses = bodies.map((b) => b.mass);
  let state = bodiesToState(bodies);
  const dt = (simulationSpeed / fps) / stepsPerFrame;

  const snapshots: FrameSnapshot[] = [];

  for (let f = 0; f < numFrames; f++) {
    // record current positions
    snapshots.push({
      positions: [
        { x: state[0], y: state[1] },
        { x: state[4], y: state[5] },
        { x: state[8], y: state[9] },
      ],
    });

    // integrate forward one video frame
    for (let s = 0; s < stepsPerFrame; s++) {
      state = rk4Step(state, dt, masses, G);
    }
  }

  return snapshots;
};

// ---------- visual constants ----------

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b']; // blue, red, amber
const BODY_RADIUS = 10;
const GLOW_RADIUS = 24;

// ---------- component ----------

export const ThreeBody: React.FC<ThreeBodyProps> = ({
  startFrame = 0,
  trailLength = 400,
  perturbation = 0.08,
  gravitationalConstant = 1,
  simulationSpeed = 3,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames, fps } = useVideoConfig();

  // Pre-compute full simulation
  const snapshots = useMemo(
    () => simulateThreeBody(durationInFrames, fps, perturbation, gravitationalConstant, simulationSpeed),
    [durationInFrames, fps, perturbation, gravitationalConstant, simulationSpeed],
  );

  const currentIdx = Math.max(0, Math.min(frame, snapshots.length - 1));

  // Map simulation coords → screen coords.
  // The figure-eight lives roughly in [-2, 2] on both axes.
  const scale = Math.min(width, height) * 0.22;
  const cx = width / 2;
  const cy = height / 2;

  const toScreen = (p: Vec2): Vec2 => ({
    x: cx + p.x * scale,
    y: cy + p.y * scale,
  });

  // Build trail paths (SVG polyline strings)
  const trailStart = Math.max(0, currentIdx - trailLength);

  const trailPaths = useMemo(() => {
    const paths: string[][] = [[], [], []];
    for (let f = trailStart; f <= currentIdx; f++) {
      const snap = snapshots[f];
      for (let b = 0; b < 3; b++) {
        const sp = toScreen(snap.positions[b]);
        paths[b].push(`${sp.x.toFixed(1)},${sp.y.toFixed(1)}`);
      }
    }
    return paths;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailStart, currentIdx, scale, cx, cy]);

  // Current screen positions
  const currentSnap = snapshots[currentIdx];
  const screenPositions = currentSnap.positions.map(toScreen);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <Audio src={staticFile('audio/voiceovers/three-body-voiceover.mp3')} />
      <svg width={width} height={height}>
        <defs>
          {/* Glow filters for each body */}
          {COLORS.map((color, i) => (
            <radialGradient key={`glow-${i}`} id={`bodyGlow${i}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          ))}

          {/* Trail gradient masks — fade from transparent to opaque */}
          {COLORS.map((color, i) => (
            <linearGradient
              key={`trailGrad-${i}`}
              id={`trailGrad${i}`}
              gradientUnits="userSpaceOnUse"
              x1={
                trailPaths[i].length > 0
                  ? trailPaths[i][0].split(',')[0]
                  : '0'
              }
              y1={
                trailPaths[i].length > 0
                  ? trailPaths[i][0].split(',')[1]
                  : '0'
              }
              x2={screenPositions[i].x.toFixed(1)}
              y2={screenPositions[i].y.toFixed(1)}
            >
              <stop offset="0%" stopColor={color} stopOpacity={0} />
              <stop offset="100%" stopColor={color} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* Trails */}
        {[0, 1, 2].map((b) =>
          trailPaths[b].length > 1 ? (
            <polyline
              key={`trail-${b}`}
              points={trailPaths[b].join(' ')}
              fill="none"
              stroke={`url(#trailGrad${b})`}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}

        {/* Bodies — glow + filled circle */}
        {screenPositions.map((pos, i) => (
          <g key={`body-${i}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={GLOW_RADIUS}
              fill={`url(#bodyGlow${i})`}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={BODY_RADIUS}
              fill={COLORS[i]}
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#f8fafc',
            margin: 0,
          }}
        >
          Three-Body Problem
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', margin: '10px 0 0 0' }}>
          Gravitational Chaos — Chenciner–Montgomery Figure-Eight
        </p>
      </div>

      {/* Equation subtitle */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 22,
            color: '#94a3b8',
            fontFamily: 'monospace',
            margin: 0,
          }}
        >
          F = G · m₁ · m₂ / r²
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          color: '#f8fafc',
          fontSize: 16,
        }}
      >
        {['Body 1', 'Body 2', 'Body 3'].map((label, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: COLORS[i],
              }}
            />
            <span>{label} (m = 1)</span>
          </div>
        ))}
      </div>

      {/* Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          color: '#94a3b8',
          fontSize: 14,
          fontFamily: 'monospace',
          textAlign: 'right',
        }}
      >
        <p style={{ margin: '4px 0' }}>G = {gravitationalConstant}</p>
        <p style={{ margin: '4px 0' }}>perturbation = {perturbation}</p>
        <p style={{ margin: '4px 0' }}>softening ε = {SOFTENING}</p>
      </div>

      {/* Subtitles */}
      <Subtitles
        segments={threeBodySubtitles}
        fontSize={36}
        bottomOffset={120}
      />
    </AbsoluteFill>
  );
};

export default ThreeBody;
