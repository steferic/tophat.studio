import { useState, useCallback, useRef, useMemo } from 'react';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import type { WorkshopViewportRef } from '../WorkshopViewport';
import { RECORD_RESOLUTIONS } from '../WorkshopPanel';
import { CROSS_DISSOLVE_BLEND } from '../constants';

export interface RecordingState {
  recording: boolean;
  recordProgress: number;
  recordResIdx: number;
  recordFps: number;
  captureAspect: number;
  previewGif: { url: string; filename: string } | null;
  recordingLoop: { duration: number } | null;
  loopMode: 'loop' | 'pingpong';
  loopSync: boolean;
  trailEffect: boolean;
  trailDecay: number;
  paintMode: boolean;
  paintOpacity: number;
  recordingTimeRef: React.MutableRefObject<number | null>;
}

export interface RecordingActions {
  handleRecord: (durationSec: number, width: number, height: number, fps: number, bgColor: string) => void;
  setRecordResIdx: React.Dispatch<React.SetStateAction<number>>;
  setRecordFps: React.Dispatch<React.SetStateAction<number>>;
  setPreviewGif: React.Dispatch<React.SetStateAction<{ url: string; filename: string } | null>>;
  setLoopMode: React.Dispatch<React.SetStateAction<'loop' | 'pingpong'>>;
  setLoopSync: React.Dispatch<React.SetStateAction<boolean>>;
  setTrailEffect: React.Dispatch<React.SetStateAction<boolean>>;
  setTrailDecay: React.Dispatch<React.SetStateAction<number>>;
  setPaintMode: React.Dispatch<React.SetStateAction<boolean>>;
  setPaintOpacity: React.Dispatch<React.SetStateAction<number>>;
}

export function useRecordingState(
  viewportRef: React.RefObject<WorkshopViewportRef | null>,
): [RecordingState, RecordingActions] {
  const recordingTimeRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordResIdx, setRecordResIdx] = useState(0);
  const [recordFps, setRecordFps] = useState(60);
  const captureAspect = useMemo(
    () => RECORD_RESOLUTIONS[recordResIdx].w / RECORD_RESOLUTIONS[recordResIdx].h,
    [recordResIdx],
  );
  const [previewGif, setPreviewGif] = useState<{ url: string; filename: string } | null>(null);
  const [recordingLoop, setRecordingLoop] = useState<{ duration: number } | null>(null);
  const [loopMode, setLoopMode] = useState<'loop' | 'pingpong'>('loop');
  const [loopSync, setLoopSync] = useState(true);
  const [trailEffect, setTrailEffect] = useState(false);
  const [trailDecay, setTrailDecay] = useState(0.08);
  const [paintMode, setPaintMode] = useState(false);
  const [paintOpacity, setPaintOpacity] = useState(1.0);

  const handleRecord = useCallback(async (durationSec: number, width: number, height: number, fps: number, bgColor: string) => {
    const sourceCanvas = viewportRef.current?.getCanvas();
    if (!sourceCanvas || recording) return;

    setRecording(true);
    setRecordProgress(0);
    const isPingPong = loopMode === 'pingpong';

    const restoreDpr = viewportRef.current?.setCaptureDpr(width, height);

    // Paint mode: make WebGL background transparent so only opaque model pixels stamp
    if (paintMode) {
      viewportRef.current?.setClearAlpha(0);
    }

    try {
      const totalOutputFrames = durationSec * fps;
      const blendFrames = isPingPong ? 0 : Math.ceil(fps * CROSS_DISSOLVE_BLEND);
      const captureFrames = isPingPong
        ? Math.ceil((totalOutputFrames + 2) / 2)
        : totalOutputFrames + blendFrames;

      setRecordingLoop({ duration: durationSec });

      recordingTimeRef.current = null;
      await new Promise<void>((resolve) => {
        const warmupMs = durationSec * 1000;
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          setRecordProgress(Math.min(elapsed / warmupMs, 1) * 0.15);
          if (elapsed >= warmupMs) { resolve(); return; }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d')!;

      const srcW = sourceCanvas.width;
      const srcH = sourceCanvas.height;
      const targetAspect = width / height;
      const srcAspect = srcW / srcH;
      let sx: number, sy: number, sw: number, sh: number;
      if (srcAspect > targetAspect) {
        sh = srcH;
        sw = Math.round(srcH * targetAspect);
        sx = Math.round((srcW - sw) / 2);
        sy = 0;
      } else {
        sw = srcW;
        sh = Math.round(srcW / targetAspect);
        sx = 0;
        sy = Math.round((srcH - sh) / 2);
      }

      // Paint mode: pre-fill with bgColor, use source-over with controlled opacity
      // Trail mode: source-over (accumulate frames)
      // Default: copy (each frame replaces previous)
      if (paintMode) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = paintOpacity;
      } else {
        ctx.globalCompositeOperation = trailEffect ? 'source-over' : 'copy';
      }

      const progressBase = 0.15;
      const progressCapture = 0.35;
      const frameDataList: ImageData[] = [];
      for (let i = 0; i < captureFrames; i++) {
        const t = i / fps;
        recordingTimeRef.current = t;
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, width, height);
        frameDataList.push(ctx.getImageData(0, 0, width, height));
        setRecordProgress(progressBase + ((i + 1) / captureFrames) * progressCapture);
      }

      recordingTimeRef.current = null;
      setRecordingLoop(null);

      let outputFrames: ImageData[];
      if (isPingPong) {
        outputFrames = [...frameDataList, ...frameDataList.slice(1, -1).reverse()];
      } else {
        outputFrames = frameDataList.slice(0, totalOutputFrames);
        for (let i = 0; i < blendFrames; i++) {
          const t = i / blendFrames;
          const overlapData = frameDataList[totalOutputFrames + i].data;
          const startData = outputFrames[i].data;
          for (let p = 0; p < startData.length; p++) {
            startData[p] = Math.round(overlapData[p] * (1 - t) + startData[p] * t);
          }
        }
      }

      const encodeStart = progressBase + progressCapture;
      setRecordProgress(encodeStart);

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: 'V_VP9', width, height, frameRate: fps },
      });

      let encoderError: Error | null = null;
      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => { encoderError = e instanceof Error ? e : new Error(String(e)); },
      });

      encoder.configure({
        codec: 'vp09.00.10.08',
        width,
        height,
        bitrate: 20_000_000,
        bitrateMode: 'variable',
        latencyMode: 'quality',
      });

      const frameDurationUs = Math.round(1_000_000 / fps);
      for (let i = 0; i < outputFrames.length; i++) {
        const frame = new VideoFrame(outputFrames[i].data, {
          format: 'RGBA',
          codedWidth: width,
          codedHeight: height,
          timestamp: i * frameDurationUs,
          duration: frameDurationUs,
        });
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
        frame.close();
        setRecordProgress(encodeStart + ((i + 1) / outputFrames.length) * (1 - encodeStart));
        if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      await encoder.flush();
      encoder.close();

      if (encoderError) {
        throw new Error(`Video encoding failed: ${(encoderError as Error).message}`);
      }

      muxer.finalize();

      const blob = new Blob([target.buffer], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const modeLabel = isPingPong ? 'pingpong' : 'loop';
      setPreviewGif({ url, filename: `nft-${modeLabel}-${width}x${height}-${durationSec}s.webm` });
    } catch (err) {
      console.error('Recording failed:', err);
      alert(`Recording failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      restoreDpr?.();
      if (paintMode) {
        viewportRef.current?.setClearAlpha(1);
      }
      setRecording(false);
      setRecordProgress(0);
      setRecordingLoop(null);
    }
  }, [recording, loopMode, trailEffect, paintMode, paintOpacity, viewportRef]);

  return [
    {
      recording, recordProgress, recordResIdx, recordFps, captureAspect,
      previewGif, recordingLoop, loopMode, loopSync, trailEffect, trailDecay,
      paintMode, paintOpacity, recordingTimeRef,
    },
    {
      handleRecord, setRecordResIdx, setRecordFps, setPreviewGif,
      setLoopMode, setLoopSync, setTrailEffect, setTrailDecay,
      setPaintMode, setPaintOpacity,
    },
  ];
}
