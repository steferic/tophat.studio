#!/usr/bin/env node
/**
 * Beat Detection Script using FFmpeg
 * Analyzes audio and outputs beat frame numbers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const FPS = 60;
const THRESHOLD = 0.25; // Sensitivity (lower = more beats)
const MIN_BEAT_INTERVAL = 0.12; // Minimum seconds between beats
const PEAK_WINDOW = 3; // Frames to look around for peak detection

const audioFile = process.argv[2] || 'public/audio/argyu-beat.mp3';
const maxDuration = parseFloat(process.argv[3]) || 20; // Only analyze first N seconds

console.log(`\nAnalyzing: ${audioFile}`);
console.log(`FPS: ${FPS}, Threshold: ${THRESHOLD}, Max duration: ${maxDuration}s\n`);

// Use ffmpeg to extract audio levels
// The volumedetect filter gives us RMS levels per frame
const tempFile = '/tmp/audio_levels.txt';

try {
  // Get audio samples as raw amplitude data using ffmpeg
  // We'll use the astats filter to get per-frame RMS levels
  const cmd = `ffmpeg -i "${audioFile}" -t ${maxDuration} -af "asetnsamples=n=${Math.floor(44100/FPS)}:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=${tempFile}" -f null - 2>/dev/null`;

  execSync(cmd, { stdio: 'pipe' });

  // Read the levels file
  const levelsData = fs.readFileSync(tempFile, 'utf8');
  const lines = levelsData.trim().split('\n');

  // Parse RMS levels (in dB)
  const frameLevels = [];
  let frameNum = 0;

  for (const line of lines) {
    if (line.includes('lavfi.astats.Overall.RMS_level')) {
      const match = line.match(/RMS_level=(-?[\d.]+)/);
      if (match) {
        const dbLevel = parseFloat(match[1]);
        // Convert dB to linear (0-1 range)
        // dB levels are typically -inf to 0, we'll normalize
        const linear = dbLevel === -Infinity ? 0 : Math.pow(10, dbLevel / 20);
        frameLevels.push({ frame: frameNum, level: linear });
        frameNum++;
      }
    }
  }

  console.log(`Analyzed ${frameLevels.length} frames\n`);

  // Normalize levels
  const maxLevel = Math.max(...frameLevels.map(f => f.level));
  frameLevels.forEach(f => f.level = f.level / maxLevel);

  // Calculate onset strength (positive energy changes)
  const onsetStrength = [0];
  for (let i = 1; i < frameLevels.length; i++) {
    const diff = frameLevels[i].level - frameLevels[i - 1].level;
    onsetStrength.push(Math.max(0, diff));
  }

  // Normalize onset strength
  const maxOnset = Math.max(...onsetStrength);
  const normalizedOnset = onsetStrength.map(o => maxOnset > 0 ? o / maxOnset : 0);

  // Peak picking
  const minFramesBetweenBeats = Math.ceil(MIN_BEAT_INTERVAL * FPS);
  const beats = [];

  for (let i = PEAK_WINDOW; i < normalizedOnset.length - PEAK_WINDOW; i++) {
    // Check if local maximum
    let isPeak = true;
    for (let j = -PEAK_WINDOW; j <= PEAK_WINDOW; j++) {
      if (j !== 0 && normalizedOnset[i] <= normalizedOnset[i + j]) {
        isPeak = false;
        break;
      }
    }

    // Check threshold and minimum interval
    if (isPeak && normalizedOnset[i] >= THRESHOLD) {
      if (beats.length === 0 || i - beats[beats.length - 1].frame >= minFramesBetweenBeats) {
        beats.push({
          frame: i,
          time: (i / FPS).toFixed(2),
          strength: (normalizedOnset[i] * 100).toFixed(0)
        });
      }
    }
  }

  // Output results
  console.log('='.repeat(50));
  console.log('BEAT DETECTION RESULTS');
  console.log('='.repeat(50));
  console.log(`\nTotal beats detected: ${beats.length}`);

  // Estimate BPM
  if (beats.length >= 4) {
    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(parseFloat(beats[i].time) - parseFloat(beats[i-1].time));
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    console.log(`Estimated BPM: ${Math.round(60 / avgInterval)}`);
  }

  console.log('\n// Copy this array for your video:');
  console.log(`const BEATS = [${beats.map(b => b.frame).join(', ')}];`);

  console.log('\n// Detailed breakdown:');
  beats.forEach((b, i) => {
    console.log(`//   Beat ${String(i + 1).padStart(2)}: frame ${String(b.frame).padStart(4)} | ${b.time}s | strength ${b.strength}%`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Cleanup
  fs.unlinkSync(tempFile);

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
