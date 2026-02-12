import React, { useState, useCallback } from 'react';
import { AttackRow, AttackDivider, CardFooter } from '../components';
import { SortingVisualizer } from '../effects';
import type { SortAlgorithm } from '../effects';
import { energyEmoji } from '../styles/holo';
import type { CardData } from '../types';

const SORTIMUS: CardData = {
  name: 'Sortimus',
  stage: 'Stage 2',
  hp: 256,
  type: 'colorless',
  attacks: [
    {
      name: 'Bubble Sort',
      energyCost: ['colorless', 'colorless'],
      damage: 40,
      description:
        'Slowly compare adjacent elements. O(n²) — deals 40 damage for each pass through the array.',
    },
    {
      name: 'Quick Sort',
      energyCost: ['colorless', 'colorless', 'colorless'],
      damage: 120,
      description:
        'Divide and conquer. O(n log n) — pick a pivot and partition the opponent into submission.',
    },
  ],
  weakness: { type: 'psychic', modifier: '+30' },
  resistance: { type: 'fighting', modifier: '-20' },
  retreatCost: 1,
  flavorText:
    'It compulsively rearranges everything it touches into perfect order. Researchers debate whether it dreams in ascending or descending.',
  illustrator: 'Donald Knuth',
  cardNumber: 'O(1)/∞',
};

const CARD_W = 350;
const CARD_H = 490;
const defaultShadow = '0 0 40px rgba(245,212,66,0.15), 0 16px 48px rgba(0,0,0,0.6)';

const ATTACK_KEYS: SortAlgorithm[] = ['bubble', 'quick'];

const StatItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ fontSize: 6, textTransform: 'uppercase', color: '#888', letterSpacing: 0.5, fontWeight: 600 }}>
      {label}
    </span>
    <span style={{ fontSize: 10, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
      {children}
    </span>
  </div>
);

export const SortingCard: React.FC = () => {
  const [activeAlgo, setActiveAlgo] = useState<SortAlgorithm | null>(null);

  const triggerAttack = useCallback((algo: SortAlgorithm) => {
    // Reset then set so the visualizer restarts even if same algo
    setActiveAlgo(null);
    requestAnimationFrame(() => setActiveAlgo(algo));
  }, []);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 12,
          padding: 6,
          flexShrink: 0,
          background: 'linear-gradient(160deg, #e8d44d 0%, #d4a017 100%)',
          boxShadow: defaultShadow,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 7,
            background: 'linear-gradient(180deg, #4a9ec9 0%, #3a82ad 6%, #e2ecf2 6%, #e2ecf2 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 10px 8px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {SORTIMUS.stage}
              </span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                {SORTIMUS.name}
              </span>
            </div>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#e02020' }}>{SORTIMUS.hp}</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 700, color: '#e02020' }}>HP</span>
              <span style={{ fontSize: 12, marginLeft: 2 }}>{energyEmoji[SORTIMUS.type]}</span>
            </span>
          </div>

          {/* Art window — sorting visualizer */}
          <div
            style={{
              width: '100%',
              height: 180,
              border: '2px solid rgba(180,155,60,0.5)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <SortingVisualizer algorithm={activeAlgo} barCount={20} seed={42} />
          </div>

          <p style={{ fontSize: 7, color: '#555', textAlign: 'center', margin: '3px 0 3px', fontStyle: 'italic', letterSpacing: 0.2 }}>
            Algorithm Pok&eacute;mon. Length: O(n), Weight: O(1) lbs.
          </p>

          {/* Attacks */}
          <div
            style={{
              background: 'rgba(245,242,230,0.7)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 3,
              padding: '4px 8px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0,
            }}
          >
            {SORTIMUS.attacks.map((atk, i) => (
              <React.Fragment key={i}>
                {i > 0 && <AttackDivider />}
                <div onClick={() => triggerAttack(ATTACK_KEYS[i])} style={{ cursor: 'pointer' }}>
                  <AttackRow attack={atk} isActive={activeAlgo === ATTACK_KEYS[i]} />
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(0,0,0,0.1)', padding: '5px 0 3px', marginTop: 3 }}>
            <StatItem label="weakness">
              <span style={{ fontSize: 11 }}>{energyEmoji[SORTIMUS.weakness.type]}</span> {SORTIMUS.weakness.modifier}
            </StatItem>
            <StatItem label="resistance">
              <span style={{ fontSize: 11 }}>{energyEmoji[SORTIMUS.resistance.type]}</span> {SORTIMUS.resistance.modifier}
            </StatItem>
            <StatItem label="retreat cost">
              {Array.from({ length: SORTIMUS.retreatCost }).map((_, j) => (
                <span key={j} style={{ fontSize: 11 }}>{energyEmoji.colorless}</span>
              ))}
            </StatItem>
          </div>

          {/* Flavor text */}
          <p style={{ fontSize: 7, fontStyle: 'italic', color: '#666', textAlign: 'center', margin: '0 6px', lineHeight: 1.4, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 3 }}>
            {SORTIMUS.flavorText}
          </p>

          <CardFooter illustrator={SORTIMUS.illustrator} cardNumber={SORTIMUS.cardNumber} />
        </div>
      </div>
    </div>
  );
};
