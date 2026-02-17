import type React from 'react';

// ── Animation durations (seconds) ───────────────────────────

export const SHAKE_DURATION = 1.0;
export const DECOMPOSITION_DURATION = 2.5;
export const CAMERA_CLEAR_TIMEOUT = 3.0;
export const HIT_DURATION = 1.0;
export const CROSS_DISSOLVE_BLEND = 1.0;

// ── CSS overlay filters ─────────────────────────────────────
// Filters rendered as DOM overlays instead of WebGL postprocessing.

export const CSS_OVERLAY_FILTERS: Record<string, React.CSSProperties> = {
  'blue-tint': { background: 'rgba(0,80,200,0.25)' },
};
