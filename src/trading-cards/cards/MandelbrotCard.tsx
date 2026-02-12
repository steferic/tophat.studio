import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AttackRow, CardFooter } from '../components';
import { MandelbrotEffect } from '../effects';
import { energyEmoji } from '../styles/holo';
import type { CardData } from '../types';

const MANDELBROT: CardData = {
  name: 'Mandelbrot',
  stage: 'Stage 1',
  hp: 999,
  type: 'psychic',
  attacks: [
    {
      name: 'Infinite Recursion',
      energyCost: ['psychic', 'psychic', 'psychic'],
      damage: 999,
      description:
        'Descend into the fractal abyss. This attack repeats infinitely. The defending Pokémon is trapped between dimensions forever.',
    },
  ],
  weakness: { type: 'fighting', modifier: '+40' },
  resistance: { type: 'water', modifier: '-30' },
  retreatCost: 0,
  flavorText:
    'Born from the equation z = z² + c, its body contains infinite complexity at every scale. Those who stare too long never find their way back.',
  illustrator: 'Benoît B. Mandelbrot',
  cardNumber: '∞/∞ ★★★',
};

const defaultShadow = '0 0 40px rgba(245,212,66,0.15), 0 16px 48px rgba(0,0,0,0.6)';

const CARD_W = 350;
const CARD_H = 490;

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

const CardBack: React.FC = () => (
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
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 25%, #1565c0 50%, #283593 75%, #1a237e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '3px solid rgba(255,215,0,0.4)',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative border pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          border: '2px solid rgba(255,215,0,0.25)',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 14,
          border: '1px solid rgba(255,215,0,0.15)',
          borderRadius: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Center design */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Pokeball-ish circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '3px solid rgba(255,215,0,0.5)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '2px solid rgba(255,215,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.15) 60%, transparent 100%)',
                border: '2px solid rgba(255,215,0,0.5)',
              }}
            />
          </div>
        </div>

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255,215,0,0.6)',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          TopHat Software
        </div>
      </div>

      {/* Corner accents */}
      {[
        { top: 20, left: 20 },
        { top: 20, right: 20 },
        { bottom: 20, left: 20 },
        { bottom: 20, right: 20 },
      ].map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            ...pos,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)',
          } as React.CSSProperties}
        />
      ))}
    </div>
  </div>
);

export const MandelbrotCard: React.FC = () => {
  const [zooming, setZooming] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const glowRef = useRef(0);

  useEffect(() => {
    if (!zooming) {
      setGlowIntensity(0);
      return;
    }
    let id: number;
    const tick = () => {
      glowRef.current += 0.016;
      setGlowIntensity(0.5 + 0.5 * Math.sin(glowRef.current * 3));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [zooming]);

  const triggerAttack = useCallback(() => {
    setZooming((prev) => !prev);
    glowRef.current = 0;
  }, []);

  const i = glowIntensity;
  const cardShadow = zooming
    ? `0 0 ${60 * i}px rgba(180,80,255,${0.8 * i}), 0 0 ${120 * i}px rgba(120,0,255,${0.5 * i}), 0 0 ${180 * i}px rgba(200,100,255,${0.3 * i}), 0 16px 48px rgba(0,0,0,0.6)`
    : defaultShadow;

  const cardTransform = zooming
    ? `scale(${1 + Math.sin(glowRef.current * 2) * 0.008})`
    : undefined;

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
      {/* Flip button */}
      <button
        onClick={() => setFlipped((f) => !f)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 100,
          padding: '8px 20px',
          borderRadius: 20,
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
      >
        Flip Card
      </button>

      {/* 3D flip container */}
      <div style={{ perspective: 1200 }}>
        <div
          style={{
            width: CARD_W,
            height: CARD_H,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease-in-out',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
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
                boxShadow: cardShadow,
                transform: cardTransform,
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
                      {MANDELBROT.stage}
                    </span>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                      {MANDELBROT.name}
                    </span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#e02020' }}>{MANDELBROT.hp}</span>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 700, color: '#e02020' }}>HP</span>
                    <span style={{ fontSize: 12, marginLeft: 2 }}>{energyEmoji[MANDELBROT.type]}</span>
                  </span>
                </div>

                {/* Art window */}
                <div
                  style={{
                    width: '100%',
                    height: 180,
                    border: '2px solid rgba(180,155,60,0.5)',
                    borderRadius: 3,
                    background: '#000',
                    overflow: 'hidden',
                    boxShadow: zooming
                      ? `inset 0 0 ${40 * i}px rgba(180,80,255,${0.7 * i}), 0 1px 0 rgba(255,255,255,0.3)`
                      : 'inset 0 1px 6px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  <Canvas camera={{ position: [0, 0, 1], fov: 90 }} gl={{ antialias: false }}>
                    <MandelbrotEffect zooming={zooming} />
                  </Canvas>
                </div>

                <p style={{ fontSize: 7, color: '#555', textAlign: 'center', margin: '3px 0 3px', fontStyle: 'italic', letterSpacing: 0.2 }}>
                  Fractal Entity Pok&eacute;mon. Length: &infin;&apos;, Weight: 0.0 lbs.
                </p>

                {/* Attack */}
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
                  }}
                >
                  <div onClick={triggerAttack} style={{ cursor: 'pointer' }}>
                    <AttackRow attack={MANDELBROT.attacks[0]} isActive={zooming} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(0,0,0,0.1)', padding: '5px 0 3px', marginTop: 3 }}>
                  <StatItem label="weakness">
                    <span style={{ fontSize: 11 }}>{energyEmoji[MANDELBROT.weakness.type]}</span> {MANDELBROT.weakness.modifier}
                  </StatItem>
                  <StatItem label="resistance">
                    <span style={{ fontSize: 11 }}>{energyEmoji[MANDELBROT.resistance.type]}</span> {MANDELBROT.resistance.modifier}
                  </StatItem>
                  <StatItem label="retreat cost">
                    {MANDELBROT.retreatCost === 0 ? '—' : Array.from({ length: MANDELBROT.retreatCost }).map((_, j) => (
                      <span key={j} style={{ fontSize: 11 }}>{energyEmoji.colorless}</span>
                    ))}
                  </StatItem>
                </div>

                {/* Flavor text */}
                <p style={{ fontSize: 7, fontStyle: 'italic', color: '#666', textAlign: 'center', margin: '0 6px', lineHeight: 1.4, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 3 }}>
                  {MANDELBROT.flavorText}
                </p>

                <CardFooter illustrator={MANDELBROT.illustrator} cardNumber={MANDELBROT.cardNumber} />
              </div>
            </div>
          </div>

          {/* Back face */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardBack />
          </div>
        </div>
      </div>
    </div>
  );
};
