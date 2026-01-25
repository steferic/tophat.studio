import { getAudioData } from '@remotion/media-utils';

export interface BeatDetectionOptions {
  // Minimum time between beats in seconds (default: 0.1s = 100ms)
  minBeatInterval?: number;
  // Sensitivity threshold (0-1, higher = fewer beats detected, default: 0.3)
  threshold?: number;
  // Number of frames to look ahead/behind for peak detection (default: 3)
  peakWindow?: number;
  // Only detect beats within this time range [start, end] in seconds
  timeRange?: [number, number];
}

export interface Beat {
  frame: number;
  time: number;
  strength: number;
}

export interface BeatMap {
  beats: Beat[];
  frames: number[];
  times: number[];
  bpm: number | null;
  // Helper to get the nearest beat frame to a target frame
  nearestBeat: (targetFrame: number) => number;
  // Helper to get beats within a frame range
  beatsInRange: (startFrame: number, endFrame: number) => Beat[];
  // Helper to snap scene boundaries to beats
  snapToBeats: (sceneDurations: number[]) => number[];
}

/**
 * Analyzes audio and detects transients/beats
 * Returns frame numbers where strong hits occur
 */
export async function detectBeats(
  audioUrl: string,
  fps: number,
  options: BeatDetectionOptions = {}
): Promise<BeatMap> {
  const {
    minBeatInterval = 0.1,
    threshold = 0.3,
    peakWindow = 3,
    timeRange,
  } = options;

  // Fetch audio data
  const audioData = await getAudioData(audioUrl);
  const { channelWaveforms, sampleRate, durationInSeconds } = audioData;

  // Mix down to mono by averaging channels
  const mono = new Float32Array(channelWaveforms[0].length);
  for (let i = 0; i < mono.length; i++) {
    let sum = 0;
    for (const channel of channelWaveforms) {
      sum += Math.abs(channel[i]);
    }
    mono[i] = sum / channelWaveforms.length;
  }

  // Calculate samples per frame
  const samplesPerFrame = Math.floor(sampleRate / fps);
  const totalFrames = Math.ceil(durationInSeconds * fps);

  // Calculate energy for each frame
  const frameEnergies: number[] = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    const startSample = frame * samplesPerFrame;
    const endSample = Math.min(startSample + samplesPerFrame, mono.length);

    let energy = 0;
    for (let i = startSample; i < endSample; i++) {
      energy += mono[i] * mono[i];
    }
    frameEnergies.push(Math.sqrt(energy / (endSample - startSample)));
  }

  // Normalize energies
  const maxEnergy = Math.max(...frameEnergies);
  const normalizedEnergies = frameEnergies.map((e) => e / maxEnergy);

  // Calculate onset strength (difference in energy)
  const onsetStrength: number[] = [0];
  for (let i = 1; i < normalizedEnergies.length; i++) {
    const diff = normalizedEnergies[i] - normalizedEnergies[i - 1];
    onsetStrength.push(Math.max(0, diff)); // Only positive changes (attacks)
  }

  // Normalize onset strength
  const maxOnset = Math.max(...onsetStrength);
  const normalizedOnset = onsetStrength.map((o) => (maxOnset > 0 ? o / maxOnset : 0));

  // Peak picking with threshold
  const minFramesBetweenBeats = Math.ceil(minBeatInterval * fps);
  const beats: Beat[] = [];

  for (let i = peakWindow; i < normalizedOnset.length - peakWindow; i++) {
    const time = i / fps;

    // Skip if outside time range
    if (timeRange && (time < timeRange[0] || time > timeRange[1])) {
      continue;
    }

    // Check if this is a local maximum
    let isPeak = true;
    for (let j = -peakWindow; j <= peakWindow; j++) {
      if (j !== 0 && normalizedOnset[i] <= normalizedOnset[i + j]) {
        isPeak = false;
        break;
      }
    }

    // Check threshold
    if (isPeak && normalizedOnset[i] >= threshold) {
      // Check minimum interval from last beat
      if (beats.length === 0 || i - beats[beats.length - 1].frame >= minFramesBetweenBeats) {
        beats.push({
          frame: i,
          time,
          strength: normalizedOnset[i],
        });
      }
    }
  }

  // Estimate BPM from beat intervals
  let bpm: number | null = null;
  if (beats.length >= 4) {
    const intervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i - 1].time);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    bpm = Math.round(60 / avgInterval);
  }

  const frames = beats.map((b) => b.frame);
  const times = beats.map((b) => b.time);

  return {
    beats,
    frames,
    times,
    bpm,
    nearestBeat: (targetFrame: number) => {
      if (frames.length === 0) return targetFrame;
      let nearest = frames[0];
      let minDist = Math.abs(targetFrame - nearest);
      for (const frame of frames) {
        const dist = Math.abs(targetFrame - frame);
        if (dist < minDist) {
          minDist = dist;
          nearest = frame;
        }
      }
      return nearest;
    },
    beatsInRange: (startFrame: number, endFrame: number) => {
      return beats.filter((b) => b.frame >= startFrame && b.frame <= endFrame);
    },
    snapToBeats: (sceneDurations: number[]) => {
      // Given desired scene durations, snap start frames to nearest beats
      const snappedStarts: number[] = [0];
      let currentFrame = 0;

      for (let i = 0; i < sceneDurations.length - 1; i++) {
        currentFrame += sceneDurations[i];
        const nearestBeatFrame = frames.reduce((nearest, frame) => {
          return Math.abs(frame - currentFrame) < Math.abs(nearest - currentFrame)
            ? frame
            : nearest;
        }, currentFrame);
        snappedStarts.push(nearestBeatFrame);
        currentFrame = nearestBeatFrame;
      }

      return snappedStarts;
    },
  };
}

/**
 * Pre-analyze audio and log beat frames to console
 * Useful for debugging and manual inspection
 */
export async function logBeats(
  audioUrl: string,
  fps: number,
  options?: BeatDetectionOptions
): Promise<void> {
  const beatMap = await detectBeats(audioUrl, fps, options);

  console.log('=== Beat Detection Results ===');
  console.log(`Total beats detected: ${beatMap.beats.length}`);
  console.log(`Estimated BPM: ${beatMap.bpm || 'Unknown'}`);
  console.log('\nBeat frames:');
  console.log(beatMap.frames.join(', '));
  console.log('\nBeat times (seconds):');
  console.log(beatMap.times.map((t) => t.toFixed(2)).join(', '));
  console.log('\nDetailed beats:');
  beatMap.beats.forEach((beat, i) => {
    console.log(
      `  ${i + 1}. Frame ${beat.frame} (${beat.time.toFixed(2)}s) - strength: ${beat.strength.toFixed(3)}`
    );
  });
}

/**
 * Generate scene timing config from beats
 * Takes target scene durations and snaps them to beat boundaries
 */
export function generateBeatSyncedScenes(
  beatMap: BeatMap,
  scenes: { name: string; targetDuration: number }[]
): { name: string; from: number; duration: number }[] {
  const result: { name: string; from: number; duration: number }[] = [];
  let currentFrame = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const targetEnd = currentFrame + scene.targetDuration;

    // Find the nearest beat to our target end frame
    let nearestBeat = targetEnd;
    if (beatMap.frames.length > 0) {
      nearestBeat = beatMap.frames.reduce((nearest, frame) => {
        // Only consider beats after current position
        if (frame <= currentFrame) return nearest;
        return Math.abs(frame - targetEnd) < Math.abs(nearest - targetEnd)
          ? frame
          : nearest;
      }, beatMap.frames.find((f) => f > currentFrame) || targetEnd);
    }

    const duration = nearestBeat - currentFrame;

    result.push({
      name: scene.name,
      from: currentFrame,
      duration: Math.max(duration, 1), // Ensure at least 1 frame
    });

    currentFrame = nearestBeat;
  }

  return result;
}
