import React from 'react';
import { holoAngle, holoGradient } from '../styles/holo';
import { useCardTheme } from '../styles/CardThemeContext';

interface CardShellProps {
  frame: number;
  fps: number;
  boxShadow?: string;
  transform?: string;
  children: React.ReactNode;
}

export const CardShell: React.FC<CardShellProps> = ({
  frame,
  fps,
  boxShadow,
  transform,
  children,
}) => {
  const theme = useCardTheme();
  const angle = holoAngle(frame, fps);
  const borderShimmer = theme.holo?.border?.(angle) ?? holoGradient(angle);

  return (
    <div
      style={{
        width: theme.shell.width,
        height: theme.shell.height,
        borderRadius: theme.shell.borderRadius,
        padding: theme.shell.borderPadding,
        flexShrink: 0,
        position: 'relative',
        background: theme.shell.borderBackground,
        boxShadow: boxShadow ?? theme.shell.boxShadow,
        transform,
      }}
    >
      {/* Holographic shimmer overlay on card border */}
      {theme.holoEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: theme.shell.borderRadius,
            background: borderShimmer,
            pointerEvents: 'none',
            zIndex: 3,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {/* Card inner */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: theme.shell.innerBorderRadius,
          background: theme.shell.innerBackground,
          display: 'flex',
          flexDirection: 'column',
          padding: '6px 10px 8px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
};
