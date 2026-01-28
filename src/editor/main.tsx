/**
 * Editor Entry Point
 *
 * Standalone entry for the 3D Scene Editor application.
 * Run with: npm run editor
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from './EditorApp';

// Create root and render
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>
);
