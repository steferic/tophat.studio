/**
 * Quick Sort Visualization
 * Animated visualization of the quick sort algorithm with sound
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, Sequence } from 'remotion';

/**
 * Generate a sine wave tone as a base64 WAV data URL
 * Uses full Hann window envelope for completely click-free playback
 */
const generateTone = (frequency: number, duration: number = 0.12, volume: number = 0.12): string => {
  const sampleRate = 44100;
  // Add silence padding at end to prevent any cutoff artifacts
  const toneSamples = Math.floor(sampleRate * duration);
  const silencePadding = Math.floor(sampleRate * 0.05); // 50ms silence at end
  const numSamples = toneSamples + silencePadding;
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < toneSamples; i++) {
    const t = i / sampleRate;

    // Full Hann window - smooth bell curve, guaranteed zero at edges
    const envelope = 0.5 * (1 - Math.cos(2 * Math.PI * i / toneSamples));

    // Sine wave
    samples[i] = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
  }

  // Silence padding is already zero-initialized

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
};

export interface QuickSortProps {
  startFrame?: number;
  barCount?: number;
  seed?: number;
  barColor?: string;
  pivotColor?: string;
  compareColor?: string;
  swapColor?: string;
  sortedColor?: string;
  partitionColor?: string;
  soundEnabled?: boolean;
  minFrequency?: number;
  maxFrequency?: number;
}

interface SortStep {
  array: number[];
  pivot: number | null; // Index of current pivot
  comparing: number | null; // Index being compared to pivot
  swapping: [number, number] | null; // Indices being swapped
  partitionStart: number; // Current partition start
  partitionEnd: number; // Current partition end
  sortedIndices: Set<number>; // Indices that are in final position
}

interface AudioEvent {
  frame: number;
  value: number;
  isSwap: boolean;
  isSweep?: boolean;
}

const generateShuffledArray = (count: number, seed: number): number[] => {
  const arr = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = count - 1; i > 0; i--) {
    const seedVal = Math.sin(seed + i * 12.9898) * 43758.5453;
    const j = Math.floor((seedVal - Math.floor(seedVal)) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Generate all steps of quick sort using Lomuto partition scheme
 */
const generateQuickSortSteps = (initialArray: number[]): SortStep[] => {
  const steps: SortStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;
  const sortedIndices = new Set<number>();

  // Initial state
  steps.push({
    array: [...arr],
    pivot: null,
    comparing: null,
    swapping: null,
    partitionStart: 0,
    partitionEnd: n - 1,
    sortedIndices: new Set(sortedIndices),
  });

  const quickSort = (low: number, high: number) => {
    if (low < high) {
      const pivotIdx = partition(low, high);

      // Mark pivot as sorted
      sortedIndices.add(pivotIdx);
      steps.push({
        array: [...arr],
        pivot: pivotIdx,
        comparing: null,
        swapping: null,
        partitionStart: low,
        partitionEnd: high,
        sortedIndices: new Set(sortedIndices),
      });

      // Recursively sort left and right partitions
      quickSort(low, pivotIdx - 1);
      quickSort(pivotIdx + 1, high);
    } else if (low === high) {
      // Single element is sorted
      sortedIndices.add(low);
      steps.push({
        array: [...arr],
        pivot: null,
        comparing: null,
        swapping: null,
        partitionStart: low,
        partitionEnd: high,
        sortedIndices: new Set(sortedIndices),
      });
    }
  };

  const partition = (low: number, high: number): number => {
    const pivotValue = arr[high]; // Using last element as pivot
    const pivotIdx = high;

    // Show pivot selection
    steps.push({
      array: [...arr],
      pivot: pivotIdx,
      comparing: null,
      swapping: null,
      partitionStart: low,
      partitionEnd: high,
      sortedIndices: new Set(sortedIndices),
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      // Comparing step
      steps.push({
        array: [...arr],
        pivot: pivotIdx,
        comparing: j,
        swapping: null,
        partitionStart: low,
        partitionEnd: high,
        sortedIndices: new Set(sortedIndices),
      });

      if (arr[j] <= pivotValue) {
        i++;
        if (i !== j) {
          // Show swap
          steps.push({
            array: [...arr],
            pivot: pivotIdx,
            comparing: null,
            swapping: [i, j],
            partitionStart: low,
            partitionEnd: high,
            sortedIndices: new Set(sortedIndices),
          });

          // Perform swap
          [arr[i], arr[j]] = [arr[j], arr[i]];

          // Show result
          steps.push({
            array: [...arr],
            pivot: pivotIdx,
            comparing: null,
            swapping: null,
            partitionStart: low,
            partitionEnd: high,
            sortedIndices: new Set(sortedIndices),
          });
        }
      }
    }

    // Place pivot in correct position
    if (i + 1 !== high) {
      steps.push({
        array: [...arr],
        pivot: pivotIdx,
        comparing: null,
        swapping: [i + 1, high],
        partitionStart: low,
        partitionEnd: high,
        sortedIndices: new Set(sortedIndices),
      });

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

      steps.push({
        array: [...arr],
        pivot: i + 1,
        comparing: null,
        swapping: null,
        partitionStart: low,
        partitionEnd: high,
        sortedIndices: new Set(sortedIndices),
      });
    }

    return i + 1;
  };

  quickSort(0, n - 1);

  // Final sorted state
  for (let i = 0; i < n; i++) {
    sortedIndices.add(i);
  }
  steps.push({
    array: [...arr],
    pivot: null,
    comparing: null,
    swapping: null,
    partitionStart: 0,
    partitionEnd: n - 1,
    sortedIndices: new Set(sortedIndices),
  });

  return steps;
};

export const QuickSort: React.FC<QuickSortProps> = ({
  startFrame = 0,
  barCount = 30,
  seed = 42,
  barColor = '#3b82f6',
  pivotColor = '#a855f7',
  compareColor = '#fbbf24',
  swapColor = '#ef4444',
  sortedColor = '#22c55e',
  partitionColor = '#6366f1',
  soundEnabled = true,
  minFrequency = 200,
  maxFrequency = 800,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames, fps } = useVideoConfig();

  const initialArray = useMemo(() => generateShuffledArray(barCount, seed), [barCount, seed]);
  const steps = useMemo(() => generateQuickSortSteps(initialArray), [initialArray]);

  const sortingStartFrame = 30;
  const sweepDuration = barCount * 3;
  const sortingEndFrame = durationInFrames - startFrame - sweepDuration - 30;
  const sortingDuration = sortingEndFrame - sortingStartFrame;
  const sweepStartFrame = sortingEndFrame;
  const sweepEndFrame = sweepStartFrame + sweepDuration;

  const getFrameForStep = (stepIdx: number): number => {
    if (stepIdx <= 0) return sortingStartFrame;
    if (stepIdx >= steps.length - 1) return sortingEndFrame;
    return sortingStartFrame + Math.floor((stepIdx / steps.length) * sortingDuration);
  };

  const stepIndex = useMemo(() => {
    if (frame < sortingStartFrame) return 0;
    if (frame >= sortingEndFrame) return steps.length - 1;
    const progress = (frame - sortingStartFrame) / sortingDuration;
    return Math.min(Math.floor(progress * steps.length), steps.length - 1);
  }, [frame, sortingStartFrame, sortingEndFrame, sortingDuration, steps.length]);

  const currentStep = steps[stepIndex];

  const sweepIndex = useMemo(() => {
    if (frame < sweepStartFrame) return -1;
    if (frame >= sweepEndFrame) return barCount;
    const sweepProgress = (frame - sweepStartFrame) / sweepDuration;
    return Math.floor(sweepProgress * barCount);
  }, [frame, sweepStartFrame, sweepEndFrame, sweepDuration, barCount]);

  const audioEvents = useMemo(() => {
    const events: AudioEvent[] = [];
    const minFrameGap = Math.ceil(fps * 0.15); // At least 150ms between sounds (no overlap)
    let lastEventFrame = -minFrameGap;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const eventFrame = getFrameForStep(i);

      if (eventFrame - lastEventFrame < minFrameGap) continue;

      if (step.comparing !== null) {
        events.push({
          frame: eventFrame,
          value: step.array[step.comparing],
          isSwap: false,
        });
        lastEventFrame = eventFrame;
      } else if (step.swapping) {
        events.push({
          frame: eventFrame,
          value: step.array[step.swapping[0]],
          isSwap: true,
        });
        lastEventFrame = eventFrame;
      }
    }

    // Victory sweep
    const framesPerBar = Math.floor(sweepDuration / barCount);
    for (let i = 0; i < barCount; i++) {
      const eventFrame = sweepStartFrame + i * framesPerBar;
      events.push({
        frame: eventFrame,
        value: i + 1,
        isSwap: false,
        isSweep: true,
      });
    }

    return events;
  }, [steps, fps, sweepStartFrame, sweepDuration, barCount]);

  const tones = useMemo(() => {
    const toneMap: Record<number, string> = {};
    for (let i = 1; i <= barCount; i++) {
      const frequency = minFrequency + ((i - 1) / (barCount - 1)) * (maxFrequency - minFrequency);
      toneMap[i] = generateTone(frequency, 0.12, 0.12);
    }
    return toneMap;
  }, [barCount, minFrequency, maxFrequency]);

  const padding = 100;
  const barAreaWidth = width - padding * 2;
  const barAreaHeight = height - 250;
  const barWidth = (barAreaWidth / barCount) * 0.8;
  const barGap = (barAreaWidth / barCount) * 0.2;
  const maxBarHeight = barAreaHeight;

  const getBarColor = (index: number): string => {
    // Victory sweep
    if (sweepIndex >= 0 && sweepIndex < barCount) {
      if (index < sweepIndex) return sortedColor;
      if (index === sweepIndex) return compareColor;
      return barColor;
    }
    if (sweepIndex >= barCount) return sortedColor;

    // During sorting
    if (currentStep.sortedIndices.has(index)) return sortedColor;
    if (currentStep.pivot === index) return pivotColor;
    if (currentStep.swapping && (index === currentStep.swapping[0] || index === currentStep.swapping[1])) {
      return swapColor;
    }
    if (currentStep.comparing === index) return compareColor;

    // Show partition boundaries with subtle color
    if (index >= currentStep.partitionStart && index <= currentStep.partitionEnd && currentStep.pivot !== null) {
      return partitionColor;
    }

    return barColor;
  };

  const stats = useMemo(() => {
    let comparisons = 0;
    let swaps = 0;
    for (let i = 0; i <= stepIndex; i++) {
      if (steps[i].comparing !== null) comparisons++;
      if (steps[i].swapping) swaps++;
    }
    return { comparisons, swaps: Math.floor(swaps / 2) };
  }, [stepIndex, steps]);

  const progress = stepIndex / (steps.length - 1);

  const deduplicatedAudioEvents = useMemo(() => {
    const seen = new Set<string>();
    return audioEvents.filter((event) => {
      const key = `${event.frame}-${event.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [audioEvents]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {soundEnabled && deduplicatedAudioEvents.map((event, index) => (
        <Sequence key={`tone-${index}`} from={event.frame} durationInFrames={Math.ceil(fps * 0.2)}>
          <Audio src={tones[event.value]} volume={1} />
        </Sequence>
      ))}

      {/* Title */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
          Quick Sort
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', margin: '10px 0 0 0' }}>
          O(n log n) Average Time Complexity
        </p>
      </div>

      {/* Bars */}
      <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        {currentStep.array.map((value, index) => {
          const barHeight = (value / barCount) * maxBarHeight;
          const x = padding + index * (barWidth + barGap);
          const y = height - 120 - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={getBarColor(index)}
                rx={2}
              />
              {barCount <= 20 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={12}
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Victory Sweep Indicator */}
      {sweepIndex >= 0 && sweepIndex < barCount && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: sortedColor,
            margin: 0,
            textShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
          }}>
            ✓ Sorted!
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 60,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 'bold', color: compareColor, margin: 0 }}>
            {stats.comparisons}
          </p>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '5px 0 0 0' }}>
            Comparisons
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 'bold', color: swapColor, margin: 0 }}>
            {stats.swaps}
          </p>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '5px 0 0 0' }}>
            Swaps
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 'bold', color: sweepIndex >= 0 ? sortedColor : '#f8fafc', margin: 0 }}>
            {sweepIndex >= 0 ? '100%' : `${(progress * 100).toFixed(0)}%`}
          </p>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '5px 0 0 0' }}>
            Progress
          </p>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: 120,
        right: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: barColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Unsorted</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: pivotColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Pivot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: partitionColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Partition</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: compareColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Comparing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: swapColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Swapping</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, backgroundColor: sortedColor, borderRadius: 2 }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Sorted</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default QuickSort;
