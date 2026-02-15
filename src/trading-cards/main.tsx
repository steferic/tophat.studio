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
    <div style={{ position: 'relative' }}>
      {/* Tab selector */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: 8,
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
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

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
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
