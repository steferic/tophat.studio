import React from 'react';

interface ArenaLayoutProps {
  children: React.ReactNode;
}

export const ArenaLayout: React.FC<ArenaLayoutProps> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      width: '100%',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
      padding: '60px 24px 24px',
      boxSizing: 'border-box',
    }}
  >
    {children}
  </div>
);
