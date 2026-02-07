import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
  words?: WordTiming[];
}

export interface SubtitlesProps {
  segments: SubtitleSegment[];
  /** Offset in seconds to sync with audio start */
  offsetSeconds?: number;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Color for words not yet spoken */
  unspokenColor?: string;
  /** Color for the currently spoken word */
  activeColor?: string;
  /** Color for words already spoken */
  spokenColor?: string;
  /** Position from bottom in pixels */
  bottomOffset?: number;
  /** Fade duration in frames */
  fadeDuration?: number;
  /** Maximum width as percentage of screen */
  maxWidthPercent?: number;
  /** Maximum words to display at once (rolling window). 0 = show all */
  maxWords?: number;
}

export const Subtitles: React.FC<SubtitlesProps> = ({
  segments,
  offsetSeconds = 0,
  fontSize = 42,
  fontFamily = '"Playfair Display", "Times New Roman", Georgia, serif',
  unspokenColor = "rgba(255, 255, 255, 0.4)",
  activeColor = "#ffffff",
  spokenColor = "rgba(255, 255, 255, 0.7)",
  bottomOffset = 80,
  fadeDuration = 8,
  maxWidthPercent = 70,
  maxWords = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps + offsetSeconds;

  // Find the active subtitle segment
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
  );

  if (!activeSegment) {
    return null;
  }

  // Calculate fade in/out
  const segmentStartFrame = (activeSegment.startTime - offsetSeconds) * fps;
  const segmentEndFrame = (activeSegment.endTime - offsetSeconds) * fps;

  const opacity = interpolate(
    frame,
    [
      segmentStartFrame,
      segmentStartFrame + fadeDuration,
      segmentEndFrame - fadeDuration,
      segmentEndFrame,
    ],
    [0, 1, 1, 0],
    {
      easing: Easing.ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Render words with highlighting if word timings are available
  const renderContent = () => {
    if (!activeSegment.words || activeSegment.words.length === 0) {
      // Fallback: no word-level timing, show full text
      return (
        <span style={{ color: activeColor }}>
          {activeSegment.text}
        </span>
      );
    }

    const words = activeSegment.words;

    // Find the current word index (the word being spoken or the next one)
    let currentWordIndex = 0;
    for (let i = 0; i < words.length; i++) {
      if (currentTime >= words[i].startTime) {
        currentWordIndex = i;
      }
    }

    // Determine which words to show
    let startIdx = 0;
    let endIdx = words.length;

    if (maxWords > 0 && words.length > maxWords) {
      // Show a window of words centered around the current word
      const halfWindow = Math.floor(maxWords / 2);
      startIdx = Math.max(0, currentWordIndex - halfWindow);
      endIdx = Math.min(words.length, startIdx + maxWords);

      // Adjust if we hit the end
      if (endIdx === words.length) {
        startIdx = Math.max(0, endIdx - maxWords);
      }
    }

    const elements: React.ReactNode[] = [];
    const visibleWords = words.slice(startIdx, endIdx);

    visibleWords.forEach((wordTiming, idx) => {
      const originalIndex = startIdx + idx;
      let color: string;
      let fontWeight: number = 400;
      let transform = "scale(1)";

      if (currentTime < wordTiming.startTime) {
        // Word not yet spoken
        color = unspokenColor;
      } else if (currentTime >= wordTiming.startTime && currentTime <= wordTiming.endTime) {
        // Currently being spoken
        color = activeColor;
        fontWeight = 600;
        // Subtle scale for active word
        const progress = interpolate(
          currentTime,
          [wordTiming.startTime, wordTiming.endTime],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const scale = interpolate(progress, [0, 0.5, 1], [1, 1.05, 1]);
        transform = `scale(${scale})`;
      } else {
        // Already spoken
        color = spokenColor;
      }

      // Add the word
      elements.push(
        <span
          key={`word-${originalIndex}`}
          style={{
            color,
            fontWeight,
            transform,
            display: "inline-block",
            transition: "color 0.1s ease",
          }}
        >
          {wordTiming.word}
        </span>
      );

      // Add space after word (except for last visible word)
      if (idx < visibleWords.length - 1) {
        elements.push(
          <span key={`space-${originalIndex}`} style={{ color: spokenColor }}>
            {" "}
          </span>
        );
      }
    });

    return elements;
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 5%",
        opacity,
      }}
    >
      <p
        style={{
          fontSize,
          fontFamily,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.6,
          fontWeight: 400,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.9), 0 4px 16px rgba(0, 0, 0, 0.7)",
          maxWidth: `${maxWidthPercent}%`,
          fontStyle: "normal",
          letterSpacing: "0.02em",
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {renderContent()}
      </p>
    </div>
  );
};

export default Subtitles;
