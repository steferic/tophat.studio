import React, { useState, useEffect, useRef } from 'react';
import { SortSoundEngine } from './SortSoundEngine';

// --- Sorting algorithms ---

const shuffle = (count: number, seed: number): number[] => {
  const arr = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = count - 1; i > 0; i--) {
    const v = Math.sin(seed + i * 12.9898) * 43758.5453;
    const j = Math.floor((v - Math.floor(v)) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface Step {
  array: number[];
  highlighted: number[];
  color: 'compare' | 'swap' | 'sorted' | 'pivot';
  soundValue: number | null;
}

function bubbleSortSteps(initial: number[]): Step[] {
  const steps: Step[] = [];
  const arr = [...initial];
  const n = arr.length;

  steps.push({ array: [...arr], highlighted: [], color: 'compare', soundValue: null });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ array: [...arr], highlighted: [j, j + 1], color: 'compare', soundValue: arr[j] });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push({ array: [...arr], highlighted: [j, j + 1], color: 'swap', soundValue: arr[j + 1] });
      }
    }
  }

  for (let i = 0; i < n; i++) {
    steps.push({ array: [...arr], highlighted: [i], color: 'sorted', soundValue: arr[i] });
  }

  return steps;
}

function quickSortSteps(initial: number[]): Step[] {
  const steps: Step[] = [];
  const arr = [...initial];
  const n = arr.length;
  const sorted = new Set<number>();

  steps.push({ array: [...arr], highlighted: [], color: 'compare', soundValue: null });

  const qs = (lo: number, hi: number) => {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo);
      return;
    }
    const pivotVal = arr[hi];
    steps.push({ array: [...arr], highlighted: [hi], color: 'pivot', soundValue: arr[hi] });

    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      steps.push({ array: [...arr], highlighted: [j, hi], color: 'compare', soundValue: arr[j] });
      if (arr[j] <= pivotVal) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({ array: [...arr], highlighted: [i, j], color: 'swap', soundValue: arr[i] });
        }
      }
    }
    if (i + 1 !== hi) {
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    }
    sorted.add(i + 1);
    steps.push({ array: [...arr], highlighted: [i + 1], color: 'sorted', soundValue: arr[i + 1] });

    qs(lo, i);
    qs(i + 2, hi);
  };

  qs(0, n - 1);

  for (let i = 0; i < n; i++) {
    steps.push({ array: [...arr], highlighted: [i], color: 'sorted', soundValue: arr[i] });
  }

  return steps;
}

// --- Colors ---
const COLORS = {
  bar: '#3b82f6',
  compare: '#fbbf24',
  swap: '#ef4444',
  sorted: '#22c55e',
  pivot: '#a855f7',
  bg: '#0f172a',
};

// --- Component ---

export type SortAlgorithm = 'bubble' | 'quick';

interface Props {
  algorithm: SortAlgorithm | null;
  barCount?: number;
  seed?: number;
}

export const SortingVisualizer: React.FC<Props> = ({ algorithm, barCount = 20, seed = 42 }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevAlgo = useRef<SortAlgorithm | null>(null);
  const soundRef = useRef<SortSoundEngine | null>(null);

  // Lazily create the sound engine (once per barCount)
  useEffect(() => {
    soundRef.current = new SortSoundEngine(barCount);
    return () => soundRef.current?.stop();
  }, [barCount]);

  // Start animation when algorithm changes
  useEffect(() => {
    if (!algorithm || algorithm === prevAlgo.current) return;
    prevAlgo.current = algorithm;

    if (timerRef.current) clearInterval(timerRef.current);

    const initial = shuffle(barCount, seed + (algorithm === 'quick' ? 7 : 0));
    const newSteps = algorithm === 'bubble' ? bubbleSortSteps(initial) : quickSortSteps(initial);
    setSteps(newSteps);
    setStepIdx(0);
    setRunning(true);
  }, [algorithm, barCount, seed]);

  // Step through animation — visual updates only.
  // Sound is handled by the SortSoundEngine on its own fixed timer.
  useEffect(() => {
    if (!running || steps.length === 0) return;

    const speed = Math.max(8, Math.floor(6000 / steps.length));
    let idx = 0;

    // Start the sound engine
    soundRef.current?.start();

    timerRef.current = setInterval(() => {
      idx++;
      if (idx >= steps.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        soundRef.current?.stop();
        setRunning(false);
        setStepIdx(steps.length - 1);
        return;
      }
      setStepIdx(idx);
      // Feed the current value to the sound engine — it decides when to actually play
      soundRef.current?.setValue(steps[idx].soundValue);
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.stop();
    };
  }, [running, steps]);

  // Reset when algorithm is cleared
  useEffect(() => {
    if (!algorithm) {
      prevAlgo.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.stop();
      setSteps([]);
      setStepIdx(0);
      setRunning(false);
    }
  }, [algorithm]);

  const current = steps[stepIdx];

  if (!current) {
    const idle = shuffle(barCount, seed);
    return (
      <div style={{ width: '100%', height: '100%', background: COLORS.bg, display: 'flex', alignItems: 'flex-end', padding: '4px 2px', boxSizing: 'border-box', gap: 1 }}>
        {idle.map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${(v / barCount) * 100}%`, background: COLORS.bar, borderRadius: '1px 1px 0 0' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: COLORS.bg, display: 'flex', alignItems: 'flex-end', padding: '4px 2px', boxSizing: 'border-box', gap: 1 }}>
      {current.array.map((v, i) => {
        let color = COLORS.bar;
        if (current.highlighted.includes(i)) {
          if (current.color === 'compare') color = COLORS.compare;
          else if (current.color === 'swap') color = COLORS.swap;
          else if (current.color === 'sorted') color = COLORS.sorted;
          else if (current.color === 'pivot') color = COLORS.pivot;
        }
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${(v / barCount) * 100}%`,
              background: color,
              borderRadius: '1px 1px 0 0',
              transition: 'height 30ms, background 30ms',
            }}
          />
        );
      })}
    </div>
  );
};
