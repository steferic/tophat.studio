/**
 * MobjectRenderer - Renders a VMobject as an SVG path
 */

import React from 'react';
import { VMobject } from '../core/VMobject';
import { useCoordinates } from '../hooks/useCoordinates';

export interface MobjectRendererProps {
  mobject: VMobject;
  opacity?: number;
  /** Override stroke opacity */
  strokeOpacity?: number;
  /** Override fill opacity */
  fillOpacity?: number;
  /** For Create animation - only show this portion of path (0-1) */
  pathProgress?: number;
  /** Additional transform to apply */
  transform?: string;
}

export const MobjectRenderer: React.FC<MobjectRendererProps> = ({
  mobject,
  opacity = 1,
  strokeOpacity,
  fillOpacity,
  pathProgress,
  transform,
}) => {
  const coords = useCoordinates();

  // Get the path in Manim coordinates
  const path = mobject.getTransformedPath();

  // Convert to screen coordinates
  const screenPath = {
    ...path,
    segments: path.segments.map((seg) => ({
      start: coords.toPixel(seg.start),
      control1: coords.toPixel(seg.control1),
      control2: coords.toPixel(seg.control2),
      end: coords.toPixel(seg.end),
    })),
  };

  // Generate SVG path data
  let pathData = '';
  if (screenPath.segments.length > 0) {
    const parts: string[] = [];
    let prevEnd: { x: number; y: number } | null = null;

    for (const seg of screenPath.segments) {
      // Move to start if needed
      if (!prevEnd || Math.abs(prevEnd.x - seg.start.x) > 0.001 || Math.abs(prevEnd.y - seg.start.y) > 0.001) {
        parts.push(`M ${seg.start.x.toFixed(2)} ${seg.start.y.toFixed(2)}`);
      }

      // Cubic bezier curve
      parts.push(
        `C ${seg.control1.x.toFixed(2)} ${seg.control1.y.toFixed(2)} ` +
        `${seg.control2.x.toFixed(2)} ${seg.control2.y.toFixed(2)} ` +
        `${seg.end.x.toFixed(2)} ${seg.end.y.toFixed(2)}`
      );

      prevEnd = seg.end;
    }

    if (screenPath.closed) {
      parts.push('Z');
    }

    pathData = parts.join(' ');
  }

  // Get styles
  const stroke = mobject.stroke;
  const fill = mobject.fill;

  // Calculate opacities
  const finalStrokeOpacity = (strokeOpacity ?? stroke.opacity ?? 1) * opacity;
  const finalFillOpacity = (fillOpacity ?? fill.opacity ?? 0) * opacity;

  // For path progress animation, we use stroke-dasharray/dashoffset
  // This requires knowing the path length, which we approximate
  let strokeDashArray: string | undefined;
  let strokeDashOffset: number | undefined;

  if (pathProgress !== undefined && pathProgress < 1) {
    // Approximate path length - in practice you might need to calculate this
    // For now we use a large number and adjust dasharray
    const estimatedLength = 10000;
    const drawnLength = estimatedLength * pathProgress;
    strokeDashArray = `${drawnLength} ${estimatedLength}`;
    strokeDashOffset = 0;
  }

  return (
    <path
      d={pathData}
      stroke={stroke.color}
      strokeWidth={coords.toPixelDistance(stroke.width / 100)} // Convert to screen pixels
      strokeOpacity={finalStrokeOpacity}
      strokeLinecap={stroke.lineCap}
      strokeLinejoin={stroke.lineJoin}
      strokeDasharray={strokeDashArray ?? (stroke.dashArray?.join(' '))}
      strokeDashoffset={strokeDashOffset ?? stroke.dashOffset}
      fill={finalFillOpacity > 0 ? fill.color : 'none'}
      fillOpacity={finalFillOpacity}
      transform={transform}
    />
  );
};

export default MobjectRenderer;
