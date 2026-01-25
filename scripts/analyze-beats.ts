/**
 * Beat Analysis Script
 *
 * Usage:
 *   npx ts-node scripts/analyze-beats.ts <audio-file> [options]
 *
 * Examples:
 *   npx ts-node scripts/analyze-beats.ts public/audio/argyu-beat.mp3
 *   npx ts-node scripts/analyze-beats.ts public/audio/argyu-beat.mp3 --threshold 0.4
 *   npx ts-node scripts/analyze-beats.ts public/audio/argyu-beat.mp3 --fps 30
 */

import * as fs from 'fs';
import * as path from 'path';

// We need to run this in a browser-like environment for getAudioData
// So we'll use a simpler approach: output a component that logs beats

const args = process.argv.slice(2);
const audioFile = args[0];

if (!audioFile) {
  console.log(`
Beat Analysis Script
====================

Usage:
  npx ts-node scripts/analyze-beats.ts <audio-file> [--threshold N] [--fps N]

Options:
  --threshold  Sensitivity (0-1, higher = fewer beats). Default: 0.3
  --fps        Frames per second. Default: 60
  --min-interval  Minimum seconds between beats. Default: 0.1

Example:
  npx ts-node scripts/analyze-beats.ts public/audio/argyu-beat.mp3 --threshold 0.25
`);
  process.exit(1);
}

// Parse options
let threshold = 0.3;
let fps = 60;
let minInterval = 0.1;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i + 1]) {
    threshold = parseFloat(args[i + 1]);
    i++;
  } else if (args[i] === '--fps' && args[i + 1]) {
    fps = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--min-interval' && args[i + 1]) {
    minInterval = parseFloat(args[i + 1]);
    i++;
  }
}

// Generate a temporary component for analysis
const componentCode = `
import { useEffect } from 'react';
import { Composition, staticFile } from 'remotion';
import { detectBeats } from '../utils/beatDetection';

const BeatAnalyzer = () => {
  useEffect(() => {
    async function analyze() {
      const audioUrl = staticFile('${audioFile.replace('public/', '')}');
      const beatMap = await detectBeats(audioUrl, ${fps}, {
        threshold: ${threshold},
        minBeatInterval: ${minInterval},
      });

      console.log('\\n=== BEAT DETECTION RESULTS ===\\n');
      console.log('Total beats:', beatMap.beats.length);
      console.log('Estimated BPM:', beatMap.bpm || 'Unknown');
      console.log('\\nBeat frames array (copy this):');
      console.log(\`const BEATS = [\${beatMap.frames.join(', ')}];\`);
      console.log('\\nDetailed breakdown:');
      beatMap.beats.forEach((b, i) => {
        console.log(\`  Beat \${i + 1}: frame \${b.frame} (time: \${b.time.toFixed(2)}s, strength: \${b.strength.toFixed(3)})\`);
      });
      console.log('\\n==============================\\n');
    }
    analyze();
  }, []);

  return <div style={{ background: 'black', color: 'white', padding: 40 }}>
    <h1>Analyzing audio...</h1>
    <p>Check the console for beat detection results.</p>
  </div>;
};

export const BeatAnalyzerRoot = () => (
  <Composition
    id="BeatAnalyzer"
    component={BeatAnalyzer}
    durationInFrames={60}
    fps={60}
    width={800}
    height={600}
  />
);
`;

console.log(`
To analyze beats, you have two options:

OPTION 1: Use the Remotion preview
----------------------------------
Add this to your Root.tsx temporarily and open the BeatAnalyzer composition:

${componentCode}

OPTION 2: Quick analysis in browser console
--------------------------------------------
1. Run: npx remotion preview
2. Open browser DevTools console
3. Paste this code:

import('${path.resolve(audioFile)}').then(async () => {
  // Analysis will run when you import the beat detection module
});

For now, try running the preview and we'll analyze your track!
`);
