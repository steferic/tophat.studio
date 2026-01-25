/**
 * Bubble Sort Visualization
 * Animated visualization of the bubble sort algorithm with sound
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

  // Convert to 16-bit PCM
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write samples
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
};

export interface BubbleSortProps {
  startFrame?: number;
  /** Number of bars to sort */
  barCount?: number;
  /** Random seed for consistent shuffling */
  seed?: number;
  /** Primary color for bars */
  barColor?: string;
  /** Color for bars being compared */
  compareColor?: string;
  /** Color for bars being swapped */
  swapColor?: string;
  /** Color for sorted bars */
  sortedColor?: string;
  /** Enable sound effects */
  soundEnabled?: boolean;
  /** Base frequency for lowest bar (Hz) */
  minFrequency?: number;
  /** Max frequency for highest bar (Hz) */
  maxFrequency?: number;
}

interface SortStep {
  array: number[];
  comparing: [number, number] | null;
  swapping: boolean;
  sortedFrom: number; // Index from which array is sorted (from end)
}

interface AudioEvent {
  frame: number;
  value: number; // Bar value (determines pitch)
  isSwap: boolean;
  isSweep?: boolean; // Part of the victory sweep at the end
}

/**
 * Generate a shuffled array using a seed for consistency
 */
const generateShuffledArray = (count: number, seed: number): number[] => {
  // Create array [1, 2, 3, ..., count]
  const arr = Array.from({ length: count }, (_, i) => i + 1);

  // Fisher-Yates shuffle with seeded random
  for (let i = count - 1; i > 0; i--) {
    const seedVal = Math.sin(seed + i * 12.9898) * 43758.5453;
    const j = Math.floor((seedVal - Math.floor(seedVal)) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

/**
 * Generate all steps of bubble sort
 */
const generateBubbleSortSteps = (initialArray: number[]): SortStep[] => {
  const steps: SortStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;

  // Initial state
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: false,
    sortedFrom: n,
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      // Comparing step
      steps.push({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: false,
        sortedFrom: n - i,
      });

      if (arr[j] > arr[j + 1]) {
        // Swap needed - show swap state
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: true,
          sortedFrom: n - i,
        });

        // Perform swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

        // Show result after swap
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: false,
          sortedFrom: n - i,
        });
      }
    }
  }

  // Final sorted state
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: false,
    sortedFrom: 0,
  });

  return steps;
};

export const BubbleSort: React.FC<BubbleSortProps> = ({
  startFrame = 0,
  barCount = 30,
  seed = 42,
  barColor = '#3b82f6',
  compareColor = '#fbbf24',
  swapColor = '#ef4444',
  sortedColor = '#22c55e',
  soundEnabled = true,
  minFrequency = 200,
  maxFrequency = 800,
}) => {
  const globalFrame = useCurrentFrame();
  const frame = globalFrame - startFrame;
  const { width, height, durationInFrames, fps } = useVideoConfig();

  // Generate initial shuffled array
  const initialArray = useMemo(() => generateShuffledArray(barCount, seed), [barCount, seed]);

  // Generate all sorting steps
  const steps = useMemo(() => generateBubbleSortSteps(initialArray), [initialArray]);

  // Calculate which step we're on based on frame
  // Reserve first 30 frames for showing initial state, last frames for sweep + final state
  const sortingStartFrame = 30;
  const sweepDuration = barCount * 3; // 3 frames per bar for the sweep
  const sortingEndFrame = durationInFrames - startFrame - sweepDuration - 30;
  const sortingDuration = sortingEndFrame - sortingStartFrame;
  const sweepStartFrame = sortingEndFrame;
  const sweepEndFrame = sweepStartFrame + sweepDuration;

  // Calculate frame for each step
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

  // Calculate sweep highlight index (which bar is highlighted during victory sweep)
  const sweepIndex = useMemo(() => {
    if (frame < sweepStartFrame) return -1;
    if (frame >= sweepEndFrame) return barCount; // All done
    const sweepProgress = (frame - sweepStartFrame) / sweepDuration;
    return Math.floor(sweepProgress * barCount);
  }, [frame, sweepStartFrame, sweepEndFrame, sweepDuration, barCount]);

  // Generate audio events for each comparison/swap
  // Limit to one sound at a time with minimum gap between sounds
  const audioEvents = useMemo(() => {
    const events: AudioEvent[] = [];
    const minFrameGap = Math.ceil(fps * 0.15); // At least 150ms between sounds (no overlap)
    let lastEventFrame = -minFrameGap;

    // Sorting phase sounds
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.comparing) {
        const eventFrame = getFrameForStep(i);

        // Skip if too close to previous sound
        if (eventFrame - lastEventFrame < minFrameGap) continue;

        const [idx1, idx2] = step.comparing;
        // Play the bar that's being "looked at" (the left one in comparison)
        events.push({
          frame: eventFrame,
          value: step.array[idx1],
          isSwap: step.swapping,
        });

        lastEventFrame = eventFrame;
      }
    }

    // Victory sweep sounds - play each bar's tone from left to right
    // The sorted array has values 1, 2, 3, ... barCount (ascending)
    const framesPerBar = Math.floor(sweepDuration / barCount);
    for (let i = 0; i < barCount; i++) {
      const eventFrame = sweepStartFrame + i * framesPerBar;
      events.push({
        frame: eventFrame,
        value: i + 1, // Sorted array goes 1, 2, 3, ... barCount
        isSwap: false,
        isSweep: true,
      });
    }

    return events;
  }, [steps, sortingStartFrame, sortingDuration, fps, sweepStartFrame, sweepDuration, barCount]);

  // Generate tones for all unique bar values
  const tones = useMemo(() => {
    const toneMap: Record<number, string> = {};
    for (let i = 1; i <= barCount; i++) {
      const frequency = minFrequency + ((i - 1) / (barCount - 1)) * (maxFrequency - minFrequency);
      toneMap[i] = generateTone(frequency, 0.12, 0.12);
    }
    return toneMap;
  }, [barCount, minFrequency, maxFrequency]);

  // Layout calculations
  const padding = 100;
  const barAreaWidth = width - padding * 2;
  const barAreaHeight = height - 250;
  const barWidth = (barAreaWidth / barCount) * 0.8;
  const barGap = (barAreaWidth / barCount) * 0.2;
  const maxBarHeight = barAreaHeight;

  // Get bar color based on state
  const getBarColor = (index: number): string => {
    // During victory sweep
    if (sweepIndex >= 0 && sweepIndex < barCount) {
      if (index < sweepIndex) {
        return sortedColor; // Already swept - green
      } else if (index === sweepIndex) {
        return compareColor; // Currently being swept - yellow highlight
      } else {
        return barColor; // Not yet swept
      }
    }

    // After sweep is complete
    if (sweepIndex >= barCount) {
      return sortedColor;
    }

    // During sorting
    if (currentStep.sortedFrom <= index) {
      return sortedColor;
    }
    if (currentStep.comparing && (index === currentStep.comparing[0] || index === currentStep.comparing[1])) {
      return currentStep.swapping ? swapColor : compareColor;
    }
    return barColor;
  };

  // Calculate comparisons and swaps count
  const stats = useMemo(() => {
    let comparisons = 0;
    let swaps = 0;
    for (let i = 0; i <= stepIndex; i++) {
      if (steps[i].comparing && !steps[i].swapping) {
        comparisons++;
      }
      if (steps[i].swapping) {
        swaps++;
      }
    }
    return { comparisons: Math.floor(comparisons / 2), swaps };
  }, [stepIndex, steps]);

  const progress = stepIndex / (steps.length - 1);

  // Deduplicate audio events that are on the same frame (to avoid overlapping identical sounds)
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
      {/* Audio tones for comparisons/swaps */}
      {soundEnabled && deduplicatedAudioEvents.map((event, index) => (
        <Sequence key={`tone-${index}`} from={event.frame} durationInFrames={Math.ceil(fps * 0.2)}>
          <Audio
            src={tones[event.value]}
            volume={1}
          />
        </Sequence>
      ))}

      {/* Title */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
          Bubble Sort
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', margin: '10px 0 0 0' }}>
          O(n²) Time Complexity
        </p>
      </div>

      {/* Bars */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
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
              {/* Optional: show value on bar if bars are wide enough */}
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

export default BubbleSort;
