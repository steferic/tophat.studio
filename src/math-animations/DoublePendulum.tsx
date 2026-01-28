/**
 * Double Pendulum Chaos Visualization
 * Demonstrates sensitive dependence on initial conditions
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface DoublePendulumProps {
  startFrame?: number;
  /** Length of first pendulum arm */
  length1?: number;
  /** Length of second pendulum arm */
  length2?: number;
  /** Mass of first pendulum bob */
  mass1?: number;
  /** Mass of second pendulum bob */
  mass2?: number;
  /** Initial angle of first pendulum (degrees) */
  initialAngle1?: number;
  /** Initial angle of second pendulum (degrees) */
  initialAngle2?: number;
  /** Gravity constant */
  gravity?: number;
  /** Show trail of second pendulum */
  showTrail?: boolean;
  /** Trail length (number of points) */
  trailLength?: number;
  /** Color of first pendulum */
  color1?: string;
  /** Color of second pendulum */
  color2?: string;
  /** Show multiple pendulums with slightly different initial conditions */
  showChaosComparison?: boolean;
}

interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number; // Angular velocity of first pendulum
  omega2: number; // Angular velocity of second pendulum
}

/**
 * Calculate angular accelerations using Lagrangian mechanics
 * These are the exact equations of motion for a double pendulum
 */
const calculateAccelerations = (
  state: PendulumState,
  L1: number,
  L2: number,
  m1: number,
  m2: number,
  g: number
): { alpha1: number; alpha2: number } => {
  const { theta1, theta2, omega1, omega2 } = state;
  const deltaTheta = theta1 - theta2;

  const denominator1 = L1 * (2 * m1 + m2 - m2 * Math.cos(2 * deltaTheta));
  const denominator2 = L2 * (2 * m1 + m2 - m2 * Math.cos(2 * deltaTheta));

  const alpha1 = (
    -g * (2 * m1 + m2) * Math.sin(theta1) -
    m2 * g * Math.sin(theta1 - 2 * theta2) -
    2 * Math.sin(deltaTheta) * m2 * (
      omega2 * omega2 * L2 +
      omega1 * omega1 * L1 * Math.cos(deltaTheta)
    )
  ) / denominator1;

  const alpha2 = (
    2 * Math.sin(deltaTheta) * (
      omega1 * omega1 * L1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(theta1) +
      omega2 * omega2 * L2 * m2 * Math.cos(deltaTheta)
    )
  ) / denominator2;

  return { alpha1, alpha2 };
};

/**
 * Runge-Kutta 4th order integration step
 */
const rk4Step = (
  state: PendulumState,
  dt: number,
  L1: number,
  L2: number,
  m1: number,
  m2: number,
  g: number
): PendulumState => {
  const getDerivatives = (s: PendulumState) => {
    const { alpha1, alpha2 } = calculateAccelerations(s, L1, L2, m1, m2, g);
    return {
      dTheta1: s.omega1,
      dTheta2: s.omega2,
      dOmega1: alpha1,
      dOmega2: alpha2,
    };
  };

  const k1 = getDerivatives(state);

  const k2State: PendulumState = {
    theta1: state.theta1 + k1.dTheta1 * dt / 2,
    theta2: state.theta2 + k1.dTheta2 * dt / 2,
    omega1: state.omega1 + k1.dOmega1 * dt / 2,
    omega2: state.omega2 + k1.dOmega2 * dt / 2,
  };
  const k2 = getDerivatives(k2State);

  const k3State: PendulumState = {
    theta1: state.theta1 + k2.dTheta1 * dt / 2,
    theta2: state.theta2 + k2.dTheta2 * dt / 2,
    omega1: state.omega1 + k2.dOmega1 * dt / 2,
    omega2: state.omega2 + k2.dOmega2 * dt / 2,
  };
  const k3 = getDerivatives(k3State);

  const k4State: PendulumState = {
    theta1: state.theta1 + k3.dTheta1 * dt,
    theta2: state.theta2 + k3.dTheta2 * dt,
    omega1: state.omega1 + k3.dOmega1 * dt,
    omega2: state.omega2 + k3.dOmega2 * dt,
  };
  const k4 = getDerivatives(k4State);

  return {
    theta1: state.theta1 + (k1.dTheta1 + 2 * k2.dTheta1 + 2 * k3.dTheta1 + k4.dTheta1) * dt / 6,
    theta2: state.theta2 + (k1.dTheta2 + 2 * k2.dTheta2 + 2 * k3.dTheta2 + k4.dTheta2) * dt / 6,
    omega1: state.omega1 + (k1.dOmega1 + 2 * k2.dOmega1 + 2 * k3.dOmega1 + k4.dOmega1) * dt / 6,
    omega2: state.omega2 + (k1.dOmega2 + 2 * k2.dOmega2 + 2 * k3.dOmega2 + k4.dOmega2) * dt / 6,
  };
};

/**
 * Simulate the double pendulum for all frames
 */
const simulatePendulum = (
  initialState: PendulumState,
  numFrames: number,
  fps: number,
  L1: number,
  L2: number,
  m1: number,
  m2: number,
  g: number,
  stepsPerFrame: number = 10
): PendulumState[] => {
  const states: PendulumState[] = [initialState];
  let state = { ...initialState };
  const dt = 1 / fps / stepsPerFrame;

  for (let f = 1; f < numFrames; f++) {
    // Multiple integration steps per frame for accuracy
    for (let s = 0; s < stepsPerFrame; s++) {
      state = rk4Step(state, dt, L1, L2, m1, m2, g);
    }
    states.push({ ...state });
  }

  return states;
};

export const DoublePendulum: React.FC<DoublePendulumProps> = ({
  startFrame = 0,
  length1 = 200,
  length2 = 200,
  mass1 = 20,
  mass2 = 20,
  initialAngle1 = 120,
  initialAngle2 = 120,
  gravity = 9.81,
  showTrail = true,
  trailLength = 500,
  color1 = '#3b82f6',
  color2 = '#ef4444',
  showChaosComparison = true,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames, fps } = useVideoConfig();

  const pivotX = width / 2;
  const pivotY = height * 0.35;

  // Scale for physics (convert pixels to meters-ish)
  const physicsScale = 0.01;
  const L1 = length1 * physicsScale;
  const L2 = length2 * physicsScale;

  // Initial state
  const initialState: PendulumState = {
    theta1: (initialAngle1 * Math.PI) / 180,
    theta2: (initialAngle2 * Math.PI) / 180,
    omega1: 0,
    omega2: 0,
  };

  // Slightly different initial state for chaos comparison
  const initialState2: PendulumState = {
    theta1: ((initialAngle1 + 0.1) * Math.PI) / 180, // Just 0.1 degree difference!
    theta2: (initialAngle2 * Math.PI) / 180,
    omega1: 0,
    omega2: 0,
  };

  // Simulate both pendulums
  const states1 = useMemo(
    () => simulatePendulum(initialState, durationInFrames, fps, L1, L2, mass1, mass2, gravity),
    [durationInFrames, fps, L1, L2, mass1, mass2, gravity, initialAngle1, initialAngle2]
  );

  const states2 = useMemo(
    () => showChaosComparison
      ? simulatePendulum(initialState2, durationInFrames, fps, L1, L2, mass1, mass2, gravity)
      : [],
    [showChaosComparison, durationInFrames, fps, L1, L2, mass1, mass2, gravity, initialAngle1, initialAngle2]
  );

  const currentState1 = states1[Math.min(frame, states1.length - 1)];
  const currentState2 = showChaosComparison ? states2[Math.min(frame, states2.length - 1)] : null;

  // Calculate positions
  const getPositions = (state: PendulumState) => {
    const x1 = pivotX + length1 * Math.sin(state.theta1);
    const y1 = pivotY + length1 * Math.cos(state.theta1);
    const x2 = x1 + length2 * Math.sin(state.theta2);
    const y2 = y1 + length2 * Math.cos(state.theta2);
    return { x1, y1, x2, y2 };
  };

  const pos1 = getPositions(currentState1);
  const pos2 = currentState2 ? getPositions(currentState2) : null;

  // Generate trail points
  const getTrailPoints = (states: PendulumState[], currentFrame: number) => {
    const points: { x: number; y: number }[] = [];
    const startIdx = Math.max(0, currentFrame - trailLength);
    for (let i = startIdx; i <= currentFrame && i < states.length; i++) {
      const pos = getPositions(states[i]);
      points.push({ x: pos.x2, y: pos.y2 });
    }
    return points;
  };

  const trail1 = showTrail ? getTrailPoints(states1, frame) : [];
  const trail2 = showTrail && showChaosComparison ? getTrailPoints(states2, frame) : [];

  // Trail opacity fade
  const trailOpacity = (index: number, total: number) => {
    return 0.1 + 0.9 * (index / total);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <svg width={width} height={height}>
        {/* Trail for pendulum 1 */}
        {showTrail && trail1.length > 1 && (
          <g>
            {trail1.slice(1).map((point, i) => (
              <line
                key={`trail1-${i}`}
                x1={trail1[i].x}
                y1={trail1[i].y}
                x2={point.x}
                y2={point.y}
                stroke={color2}
                strokeWidth={2}
                opacity={trailOpacity(i, trail1.length)}
              />
            ))}
          </g>
        )}

        {/* Trail for pendulum 2 (chaos comparison) */}
        {showTrail && showChaosComparison && trail2.length > 1 && (
          <g>
            {trail2.slice(1).map((point, i) => (
              <line
                key={`trail2-${i}`}
                x1={trail2[i].x}
                y1={trail2[i].y}
                x2={point.x}
                y2={point.y}
                stroke="#22c55e"
                strokeWidth={2}
                opacity={trailOpacity(i, trail2.length)}
              />
            ))}
          </g>
        )}

        {/* Pendulum 2 (chaos comparison) - drawn first so it's behind */}
        {showChaosComparison && pos2 && (
          <g opacity={0.7}>
            {/* Arm 1 */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={pos2.x1}
              y2={pos2.y1}
              stroke="#22c55e"
              strokeWidth={4}
            />
            {/* Arm 2 */}
            <line
              x1={pos2.x1}
              y1={pos2.y1}
              x2={pos2.x2}
              y2={pos2.y2}
              stroke="#22c55e"
              strokeWidth={4}
            />
            {/* Bob 1 */}
            <circle cx={pos2.x1} cy={pos2.y1} r={mass1 / 2} fill="#22c55e" />
            {/* Bob 2 */}
            <circle cx={pos2.x2} cy={pos2.y2} r={mass2 / 2} fill="#22c55e" />
          </g>
        )}

        {/* Main pendulum */}
        <g>
          {/* Pivot */}
          <circle cx={pivotX} cy={pivotY} r={8} fill="#64748b" />

          {/* Arm 1 */}
          <line
            x1={pivotX}
            y1={pivotY}
            x2={pos1.x1}
            y2={pos1.y1}
            stroke={color1}
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Arm 2 */}
          <line
            x1={pos1.x1}
            y1={pos1.y1}
            x2={pos1.x2}
            y2={pos1.y2}
            stroke={color2}
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Bob 1 */}
          <circle
            cx={pos1.x1}
            cy={pos1.y1}
            r={mass1 / 2}
            fill={color1}
            stroke="#fff"
            strokeWidth={2}
          />

          {/* Bob 2 */}
          <circle
            cx={pos1.x2}
            cy={pos1.y2}
            r={mass2 / 2}
            fill={color2}
            stroke="#fff"
            strokeWidth={2}
          />
        </g>
      </svg>

      {/* Title */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
          Double Pendulum
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', margin: '10px 0 0 0' }}>
          Chaos Theory — Sensitive Dependence on Initial Conditions
        </p>
      </div>

      {/* Legend */}
      {showChaosComparison && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          color: '#f8fafc',
          fontSize: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 20, height: 4, backgroundColor: color2, borderRadius: 2 }} />
            <span>θ₁ = {initialAngle1}°</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 4, backgroundColor: '#22c55e', borderRadius: 2 }} />
            <span>θ₁ = {initialAngle1 + 0.1}° (0.1° difference)</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        color: '#94a3b8',
        fontSize: 14,
        fontFamily: 'monospace',
        textAlign: 'right',
      }}>
        <p style={{ margin: '4px 0' }}>L₁ = {length1}px, L₂ = {length2}px</p>
        <p style={{ margin: '4px 0' }}>m₁ = {mass1}, m₂ = {mass2}</p>
        <p style={{ margin: '4px 0' }}>g = {gravity} m/s²</p>
      </div>
    </AbsoluteFill>
  );
};

export default DoublePendulum;
