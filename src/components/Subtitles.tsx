import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface SubtitlesProps {
  segments: SubtitleSegment[];
  /** Offset in seconds to sync with audio start */
  offsetSeconds?: number;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color (with alpha) */
  backgroundColor?: string;
  /** Position from bottom in pixels */
  bottomOffset?: number;
  /** Fade duration in frames */
  fadeDuration?: number;
}

export const Subtitles: React.FC<SubtitlesProps> = ({
  segments,
  offsetSeconds = 0,
  fontSize = 42,
  fontFamily = "system-ui, -apple-system, sans-serif",
  color = "#ffffff",
  backgroundColor = "rgba(0, 0, 0, 0.6)",
  bottomOffset = 80,
  fadeDuration = 8,
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

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor,
          padding: "12px 24px",
          borderRadius: 8,
          maxWidth: "80%",
        }}
      >
        <p
          style={{
            fontSize,
            fontFamily,
            color,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.4,
            fontWeight: 500,
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
          }}
        >
          {activeSegment.text}
        </p>
      </div>
    </div>
  );
};

export default Subtitles;
