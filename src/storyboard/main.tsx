/**
 * Storyboard Entry Point
 *
 * Standalone entry for the video storyboard application.
 * Run with: npm run storyboard
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { StoryboardApp } from './components/StoryboardApp';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <StoryboardApp />
  </React.StrictMode>
);
