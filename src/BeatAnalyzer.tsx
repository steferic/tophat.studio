import React, { useEffect, useState } from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { detectBeats, BeatMap } from './utils/beatDetection';

interface BeatAnalyzerProps {
  audioPath: string; // Path relative to public folder, e.g., 'audio/argyu-beat.mp3'
  fps?: number;
  threshold?: number;
  minBeatInterval?: number;
}

/**
 * Beat Analyzer Component
 *
 * Add this as a composition to analyze any audio file and get beat timings.
 * Results are logged to console and displayed on screen.
 *
 * Usage in Root.tsx:
 * ```tsx
 * <Composition
 *   id="BeatAnalyzer"
 *   component={() => <BeatAnalyzer audioPath="audio/your-track.mp3" />}
 *   durationInFrames={60}
 *   fps={60}
 *   width={1920}
 *   height={1080}
 * />
 * ```
 */
export const BeatAnalyzer: React.FC<BeatAnalyzerProps> = ({
  audioPath,
  fps = 60,
  threshold = 0.3,
  minBeatInterval = 0.1,
}) => {
  const [beatMap, setBeatMap] = useState<BeatMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyze() {
      try {
        setLoading(true);
        const audioUrl = staticFile(audioPath);
        const result = await detectBeats(audioUrl, fps, {
          threshold,
          minBeatInterval,
        });
        setBeatMap(result);

        // Log to console for easy copying
        console.log('\n========================================');
        console.log('BEAT DETECTION RESULTS');
        console.log('========================================\n');
        console.log(`Audio: ${audioPath}`);
        console.log(`FPS: ${fps}`);
        console.log(`Threshold: ${threshold}`);
        console.log(`Total beats: ${result.beats.length}`);
        console.log(`Estimated BPM: ${result.bpm || 'Unknown'}\n`);

        console.log('// Copy this array to use in your video:');
        console.log(`const BEATS = [${result.frames.join(', ')}];\n`);

        console.log('// Detailed breakdown:');
        result.beats.forEach((b, i) => {
          console.log(
            `// Beat ${i + 1}: frame ${b.frame} | time ${b.time.toFixed(2)}s | strength ${(b.strength * 100).toFixed(0)}%`
          );
        });
        console.log('\n========================================\n');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    analyze();
  }, [audioPath, fps, threshold, minBeatInterval]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        padding: 60,
        overflow: 'auto',
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 20, color: '#FF7050' }}>
        Beat Analyzer
      </h1>

      <div style={{ fontSize: 20, opacity: 0.7, marginBottom: 40 }}>
        {audioPath} | {fps} FPS | threshold: {threshold}
      </div>

      {loading && (
        <div style={{ fontSize: 32 }}>Analyzing audio...</div>
      )}

      {error && (
        <div style={{ color: '#ff4444', fontSize: 24 }}>Error: {error}</div>
      )}

      {beatMap && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 30,
              marginBottom: 50,
            }}
          >
            <div
              style={{
                background: '#1a1a1a',
                padding: 30,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                {beatMap.beats.length}
              </div>
              <div style={{ opacity: 0.6 }}>Beats Detected</div>
            </div>
            <div
              style={{
                background: '#1a1a1a',
                padding: 30,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                {beatMap.bpm || '?'}
              </div>
              <div style={{ opacity: 0.6 }}>Estimated BPM</div>
            </div>
            <div
              style={{
                background: '#1a1a1a',
                padding: 30,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                {(beatMap.times[beatMap.times.length - 1] || 0).toFixed(1)}s
              </div>
              <div style={{ opacity: 0.6 }}>Last Beat</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 15, color: '#FF7050' }}>
              Beat Frames (check console for copyable array)
            </div>
            <div
              style={{
                background: '#1a1a1a',
                padding: 20,
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 16,
                wordBreak: 'break-all',
              }}
            >
              [{beatMap.frames.join(', ')}]
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <div style={{ fontSize: 24, marginBottom: 15, color: '#FF7050' }}>
              Beat Timeline
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {beatMap.beats.slice(0, 50).map((beat, i) => (
                <div
                  key={i}
                  style={{
                    background: `rgba(255, 112, 80, ${0.3 + beat.strength * 0.7})`,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                >
                  {beat.frame}
                </div>
              ))}
              {beatMap.beats.length > 50 && (
                <div style={{ padding: '8px 12px', opacity: 0.5 }}>
                  +{beatMap.beats.length - 50} more
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
