import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MandelbrotCard, SortingCard, SparkittyCard, StandaloneCard } from './cards';
import { Arena } from './arena';
import { Workshop } from './workshop';
import { Environment } from './environment';
import { getAllCards } from './arena/cardRegistry';

// Static tabs that aren't driven by card definitions
const STATIC_TABS = ['Battle Arena', 'Mandelbrot', 'Sortimus', 'Sparkitty', 'Workshop', 'Environment'] as const;

// Card-based tabs auto-generated from registry
const cardEntries = getAllCards();

type TabId = (typeof STATIC_TABS)[number] | string;

const App: React.FC = () => {
  const [active, setActive] = useState<TabId>('Battle Arena');

  const allTabs: { id: TabId; label: string }[] = [
    ...STATIC_TABS.map((name) => ({ id: name as TabId, label: name })),
    ...cardEntries.map((entry) => ({
      id: entry.definition.id,
      label: entry.cardData.name,
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'rgba(10,10,20,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          zIndex: 100,
          padding: '0 16px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {allTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: active === id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
              color: active === id ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {active === 'Battle Arena' && <Arena />}
        {active === 'Mandelbrot' && <MandelbrotCard />}
        {active === 'Sortimus' && <SortingCard />}
        {active === 'Sparkitty' && <SparkittyCard />}
        {active === 'Workshop' && <Workshop />}
        {active === 'Environment' && <Environment />}
        {/* Card definition tabs rendered generically */}
        {cardEntries.map((entry) =>
          active === entry.definition.id ? (
            <StandaloneCard key={entry.definition.id} cardId={entry.definition.id} />
          ) : null,
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
