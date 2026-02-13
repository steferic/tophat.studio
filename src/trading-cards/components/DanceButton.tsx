import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { DanceSongDescriptor } from '../arena/descriptorTypes';

const DANCE_DURATION = 30_000; // 30 seconds

interface DanceButtonProps {
  danceSong?: DanceSongDescriptor;
  isDancing: boolean;
  onToggle: (dancing: boolean) => void;
}

export const DanceButton: React.FC<DanceButtonProps> = ({ danceSong, isDancing, onToggle }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState(false);

  const stopDance = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onToggle(false);
  }, [onToggle]);

  const startDance = useCallback(() => {
    if (!danceSong) return;
    const audio = new Audio(danceSong.filePath);
    audio.volume = danceSong.volume ?? 0.8;
    audio.play().catch(() => {});
    audioRef.current = audio;

    // Auto-stop after 30 seconds
    timerRef.current = setTimeout(stopDance, DANCE_DURATION);
    onToggle(true);
  }, [danceSong, onToggle, stopDance]);

  const handleClick = useCallback(() => {
    if (isDancing) {
      stopDance();
    } else {
      startDance();
    }
  }, [isDancing, startDance, stopDance]);

  // Stop audio when isDancing is set to false externally (e.g. attack triggered)
  useEffect(() => {
    if (!isDancing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (!isDancing && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isDancing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!danceSong) return null;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isDancing ? 'Stop dancing' : 'Dance!'}
      style={{
        padding: '1px 5px',
        fontSize: 8,
        fontWeight: 700,
        border: 'none',
        borderRadius: 3,
        background: isDancing
          ? 'rgba(220,50,50,0.7)'
          : hovered
            ? 'rgba(0,0,0,0.25)'
            : 'rgba(0,0,0,0.12)',
        color: isDancing ? '#fff' : '#666',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        lineHeight: 1.6,
      }}
    >
      {isDancing ? '◼' : '♪'}
    </button>
  );
};
