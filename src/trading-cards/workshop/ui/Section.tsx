import React, { useState } from 'react';

interface SectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  count,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        <span>
          {open ? '\u25BE' : '\u25B8'} {title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            paddingBottom: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
