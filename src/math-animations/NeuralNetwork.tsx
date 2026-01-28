/**
 * Neural Network Visualization
 * 3Blue1Brown-style neural network with precise forward propagation
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export interface NeuralNetworkProps {
  startFrame?: number;
  /** Network architecture - array of layer sizes */
  layers?: number[];
  /** Primary accent color */
  accentColor?: string;
  /** Show activation values inside neurons */
  showValues?: boolean;
}

interface Neuron {
  x: number;
  y: number;
  layer: number;
  index: number;
}

interface Connection {
  fromNeuron: Neuron;
  toNeuron: Neuron;
  weight: number;
}

// Deterministic random
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Sigmoid
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  startFrame = 0,
  layers = [3, 4, 4, 2],
  accentColor = '#fbbf24',
  showValues = false,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames } = useVideoConfig();

  const numLayers = layers.length;
  const neuronRadius = 28;
  const layerGap = width / (numLayers + 1);

  // Generate neurons
  const neurons = useMemo(() => {
    const result: Neuron[] = [];
    layers.forEach((size, layerIdx) => {
      const x = layerGap * (layerIdx + 1);
      const totalHeight = (size - 1) * 90;
      const startY = (height - totalHeight) / 2;

      for (let i = 0; i < size; i++) {
        result.push({
          x,
          y: startY + i * 90,
          layer: layerIdx,
          index: i,
        });
      }
    });
    return result;
  }, [layers, layerGap, height]);

  // Generate connections with weights
  const connections = useMemo(() => {
    const result: Connection[] = [];
    let seed = 42;

    for (let l = 0; l < numLayers - 1; l++) {
      const fromNeurons = neurons.filter((n) => n.layer === l);
      const toNeurons = neurons.filter((n) => n.layer === l + 1);

      fromNeurons.forEach((from) => {
        toNeurons.forEach((to) => {
          result.push({
            fromNeuron: from,
            toNeuron: to,
            weight: seededRandom(seed++) * 2 - 1,
          });
        });
      });
    }
    return result;
  }, [neurons, numLayers]);

  // Animation: cycle through forward passes
  const framesPerLayer = 45; // Time spent on each layer transition
  const pauseFrames = 20; // Pause between cycles
  const cycleFrames = framesPerLayer * numLayers + pauseFrames;
  const cycleFrame = frame % cycleFrames;
  const cycleNumber = Math.floor(frame / cycleFrames);

  // Input activations for this cycle
  const inputActivations = useMemo(() => {
    return Array.from({ length: layers[0] }, (_, i) =>
      seededRandom(cycleNumber * 100 + i * 7 + 1)
    );
  }, [cycleNumber, layers]);

  // Compute all activations via forward prop
  const allActivations = useMemo(() => {
    const activations: number[][] = [];

    // Input layer
    activations[0] = inputActivations;

    // Forward propagate
    for (let l = 1; l < numLayers; l++) {
      const layerActivations: number[] = [];
      const layerSize = layers[l];
      const prevSize = layers[l - 1];

      for (let j = 0; j < layerSize; j++) {
        let sum = 0;
        for (let i = 0; i < prevSize; i++) {
          const connIdx = connections.findIndex(
            (c) => c.fromNeuron.layer === l - 1 && c.fromNeuron.index === i &&
                   c.toNeuron.layer === l && c.toNeuron.index === j
          );
          if (connIdx >= 0) {
            sum += activations[l - 1][i] * connections[connIdx].weight;
          }
        }
        layerActivations.push(sigmoid(sum * 3)); // Scale for more varied activations
      }
      activations[l] = layerActivations;
    }

    return activations;
  }, [inputActivations, connections, layers, numLayers]);

  // Current layer being "activated" in animation
  const activeLayer = Math.min(
    Math.floor(cycleFrame / framesPerLayer),
    numLayers - 1
  );

  // Progress within current layer transition (0 to 1)
  const layerProgress = Math.min(
    (cycleFrame - activeLayer * framesPerLayer) / framesPerLayer,
    1
  );

  // Smooth eased progress
  const easedProgress = Easing.out(Easing.cubic)(layerProgress);

  // Get neuron visual activation
  const getNeuronActivation = (neuron: Neuron): number => {
    const baseActivation = allActivations[neuron.layer]?.[neuron.index] ?? 0;

    if (neuron.layer < activeLayer) {
      return baseActivation; // Already activated
    } else if (neuron.layer === activeLayer) {
      return baseActivation * easedProgress; // Currently activating
    } else {
      return 0; // Not yet activated
    }
  };

  // Get connection visual state
  const getConnectionState = (conn: Connection): { opacity: number; pulse: number } => {
    const fromLayer = conn.fromNeuron.layer;
    const toLayer = conn.toNeuron.layer;

    // Connection activates when going FROM fromLayer TO toLayer
    if (activeLayer === toLayer && fromLayer === toLayer - 1) {
      // This connection is currently active
      const fromActivation = allActivations[fromLayer]?.[conn.fromNeuron.index] ?? 0;
      return {
        opacity: 0.3 + fromActivation * 0.5,
        pulse: easedProgress,
      };
    } else if (toLayer < activeLayer) {
      // Already passed
      const fromActivation = allActivations[fromLayer]?.[conn.fromNeuron.index] ?? 0;
      return {
        opacity: 0.15 + fromActivation * 0.2,
        pulse: 0,
      };
    } else {
      // Not yet
      return { opacity: 0.08, pulse: 0 };
    }
  };

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <svg width={width} height={height}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strong-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map((conn, i) => {
          const { opacity, pulse } = getConnectionState(conn);
          const isPositive = conn.weight > 0;

          // Pulse position along connection
          const pulseX = conn.fromNeuron.x + (conn.toNeuron.x - conn.fromNeuron.x) * pulse;
          const pulseY = conn.fromNeuron.y + (conn.toNeuron.y - conn.fromNeuron.y) * pulse;

          return (
            <g key={i}>
              <line
                x1={conn.fromNeuron.x}
                y1={conn.fromNeuron.y}
                x2={conn.toNeuron.x}
                y2={conn.toNeuron.y}
                stroke={isPositive ? '#3b82f6' : '#ef4444'}
                strokeWidth={1 + Math.abs(conn.weight) * 1.5}
                opacity={opacity}
              />
              {pulse > 0.05 && pulse < 0.95 && (
                <circle
                  cx={pulseX}
                  cy={pulseY}
                  r={4}
                  fill={isPositive ? '#60a5fa' : '#f87171'}
                  filter="url(#glow)"
                />
              )}
            </g>
          );
        })}

        {/* Neurons */}
        {neurons.map((neuron, i) => {
          const activation = getNeuronActivation(neuron);
          const isActive = activation > 0.1;

          // Interpolate from dark gray to accent color based on activation
          const r = Math.round(30 + activation * (251 - 30));
          const g = Math.round(41 + activation * (191 - 41));
          const b = Math.round(59 + activation * (36 - 59));
          const fillColor = `rgb(${r}, ${g}, ${b})`;

          return (
            <g key={i}>
              {/* Outer ring */}
              <circle
                cx={neuron.x}
                cy={neuron.y}
                r={neuronRadius + 2}
                fill="none"
                stroke="#334155"
                strokeWidth={2}
              />
              {/* Neuron fill */}
              <circle
                cx={neuron.x}
                cy={neuron.y}
                r={neuronRadius}
                fill={fillColor}
                filter={isActive ? 'url(#strong-glow)' : 'url(#glow)'}
              />
              {/* Activation value */}
              {showValues && (
                <text
                  x={neuron.x}
                  y={neuron.y + 5}
                  textAnchor="middle"
                  fill={activation > 0.5 ? '#0a0a1a' : '#94a3b8'}
                  fontSize={14}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {activation.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {/* Layer labels */}
        {layers.map((_, idx) => {
          const x = layerGap * (idx + 1);
          let label = '';
          if (idx === 0) label = 'Input';
          else if (idx === numLayers - 1) label = 'Output';
          else label = `Hidden ${idx}`;

          return (
            <text
              key={idx}
              x={x}
              y={height - 40}
              textAnchor="middle"
              fill="#64748b"
              fontSize={16}
              fontFamily="system-ui"
            >
              {label}
            </text>
          );
        })}

        {/* Title */}
        <text
          x={width / 2}
          y={50}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={48}
          fontFamily="system-ui"
          fontWeight="bold"
          opacity={titleOpacity}
        >
          Neural Network
        </text>
        <text
          x={width / 2}
          y={85}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={20}
          fontFamily="system-ui"
          opacity={titleOpacity}
        >
          Forward Propagation
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export default NeuralNetwork;
