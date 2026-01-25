import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface TypeWriterProps {
  text: string;
  delay?: number;
  charDuration?: number;
  showCursor?: boolean;
  cursorChar?: string;
  style?: React.CSSProperties;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

export const TypeWriter: React.FC<TypeWriterProps> = ({
  text,
  delay = 0,
  charDuration = 3,
  showCursor = true,
  cursorChar = '|',
  style = {},
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 400,
  fontFamily = 'monospace',
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - delay;

  if (relativeFrame < 0) return null;

  const charsToShow = Math.min(
    text.length,
    Math.floor(relativeFrame / charDuration)
  );
  const displayText = text.slice(0, charsToShow);
  const isComplete = charsToShow >= text.length;

  const cursorOpacity = interpolate(
    relativeFrame % 16,
    [0, 8, 16],
    [1, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <span
      style={{
        ...style,
        color,
        fontSize,
        fontWeight,
        fontFamily,
      }}
    >
      {displayText}
      {showCursor && (
        <span style={{ opacity: isComplete ? cursorOpacity : 1 }}>
          {cursorChar}
        </span>
      )}
    </span>
  );
};
