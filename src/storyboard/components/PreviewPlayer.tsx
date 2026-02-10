/**
 * PreviewPlayer - Fullscreen overlay that plays all scenes in sequence.
 * Images display for their configured duration, videos play natively.
 * Press Escape or click the X to close.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Scene } from '../../types/project';
import type { AIImageScene, AIVideoScene } from '../../types/project';

const COLORS = {
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  bg: '#11111b',
};

interface PreviewPlayerProps {
  scenes: Scene[];
  onClose: () => void;
  startIndex?: number;
}

function getSceneSrc(scene: Scene): string | null {
  if (scene.type === 'ai-image' || scene.type === 'ai-video') {
    const assetPath = (scene as AIImageScene | AIVideoScene).assetPath;
    return assetPath ? `/${assetPath}` : null;
  }
  if (scene.type === 'image' || scene.type === 'video') {
    return `/${scene.src}`;
  }
  return null;
}

function isVideoScene(scene: Scene): boolean {
  return scene.type === 'ai-video' || scene.type === 'video';
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ scenes, onClose, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const scene = scenes[currentIndex];
  const src = scene ? getSceneSrc(scene) : null;
  const isVideo = scene ? isVideoScene(scene) : false;
  const totalScenes = scenes.length;

  const goToNext = useCallback(() => {
    if (currentIndex < totalScenes - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      // Reached the end
      setIsPlaying(false);
      setProgress(1);
    }
  }, [currentIndex, totalScenes]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Handle image scenes — auto-advance after duration
  useEffect(() => {
    if (!scene || !isPlaying) return;
    if (isVideo) return; // Video handles its own advancement

    if (!src) {
      // No asset — skip after 1s
      const t = window.setTimeout(goToNext, 1000);
      return () => clearTimeout(t);
    }

    const durationMs = scene.duration * 1000;
    startTimeRef.current = performance.now();

    // Progress animation
    const updateProgress = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setProgress(Math.min(1, elapsed / durationMs));
      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };
    rafRef.current = requestAnimationFrame(updateProgress);

    // Auto-advance
    timerRef.current = window.setTimeout(goToNext, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scene, currentIndex, isPlaying, isVideo, src, goToNext]);

  // Handle video playback
  useEffect(() => {
    if (!scene || !isVideo || !src || !isPlaying) return;
    const vid = videoRef.current;
    if (!vid) return;

    vid.currentTime = 0;
    vid.play().catch(() => {});

    const onTimeUpdate = () => {
      if (vid.duration) {
        setProgress(vid.currentTime / vid.duration);
      }
    };
    vid.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.pause();
    };
  }, [scene, currentIndex, isVideo, src, isPlaying]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goToNext, goToPrev]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (videoRef.current && isVideo) videoRef.current.pause();
    } else {
      // If at end, restart
      if (currentIndex >= totalScenes - 1 && progress >= 1) {
        setCurrentIndex(0);
        setProgress(0);
      }
      setIsPlaying(true);
      if (videoRef.current && isVideo) videoRef.current.play().catch(() => {});
    }
  };

  if (!scene) return null;

  const sceneLabel = (() => {
    switch (scene.type) {
      case 'ai-image':
      case 'ai-video':
        return scene.prompt.length > 60 ? scene.prompt.slice(0, 60) + '...' : scene.prompt;
      case 'composition':
        return scene.compositionId;
      case 'video':
      case 'image':
        return scene.src.split('/').pop() ?? scene.src;
      default:
        return '';
    }
  })();

  return (
    <div style={overlayStyle}>
      {/* Main content area */}
      <div style={contentStyle}>
        {!src ? (
          <div style={placeholderStyle}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>
              {scene.type === 'composition' ? '📐' : '⏳'}
            </div>
            <div style={{ fontSize: 14, color: COLORS.textDim }}>
              {scene.type === 'composition'
                ? `Composition: ${(scene as any).compositionId}`
                : 'Asset not yet generated'}
            </div>
          </div>
        ) : isVideo ? (
          <video
            ref={videoRef}
            src={src}
            onEnded={handleVideoEnded}
            style={mediaStyle}
            playsInline
          />
        ) : (
          <img src={src} alt="" style={mediaStyle} />
        )}
      </div>

      {/* Controls bar */}
      <div style={controlsBarStyle}>
        {/* Scene progress dots */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {scenes.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setProgress(0);
                setIsPlaying(true);
              }}
              style={{
                width: i === currentIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < currentIndex
                  ? COLORS.accent
                  : i === currentIndex
                    ? COLORS.accent
                    : `${COLORS.text}30`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {i === currentIndex && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${progress * 100}%`,
                    backgroundColor: '#fff',
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Center controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ControlBtn label="⏮" title="Previous (←)" onClick={goToPrev} disabled={currentIndex === 0} />
          <ControlBtn
            label={isPlaying ? '⏸' : '▶'}
            title={isPlaying ? 'Pause' : 'Play (Space)'}
            onClick={togglePlayPause}
            large
          />
          <ControlBtn label="⏭" title="Next (→)" onClick={goToNext} disabled={currentIndex >= totalScenes - 1 && progress >= 1} />
        </div>

        {/* Scene info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: 'monospace' }}>
            {currentIndex + 1}/{totalScenes}
          </span>
          <span
            style={{
              fontSize: 11,
              color: COLORS.text,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sceneLabel}
          </span>
        </div>
      </div>

      {/* Close button */}
      <button onClick={onClose} style={closeBtnStyle} title="Close (Esc)">
        ✕
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ControlBtn: React.FC<{
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  large?: boolean;
}> = ({ label, title, onClick, disabled, large }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      width: large ? 44 : 32,
      height: large ? 44 : 32,
      borderRadius: '50%',
      border: 'none',
      backgroundColor: large ? `${COLORS.accent}` : `${COLORS.text}15`,
      color: large ? '#11111b' : disabled ? `${COLORS.text}30` : COLORS.text,
      fontSize: large ? 18 : 14,
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.3 : 1,
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.95)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  padding: 24,
};

const mediaStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  borderRadius: 8,
};

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const controlsBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 24px',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
