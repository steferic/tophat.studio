import React, { useState, useEffect, useRef } from 'react';
import { CardFooter } from '../components';
import { energyEmoji } from '../styles/holo';
import type { CardData } from '../types';

/**
 * Sparkitty card — ported from the pizzarat repo's holographic card.
 * Uses the pizzarat holo style: purple/white overlays, pulsing border shine,
 * corner sparkles, and magenta glow — distinct from the existing remotion
 * rainbow-gradient holo system so they can be compared side by side.
 */

const SPARKITTY: CardData = {
  name: 'Sparkitty',
  stage: 'Basic',
  hp: 70,
  type: 'colorless',
  attacks: [
    {
      name: 'Static Shock',
      energyCost: ['colorless'],
      damage: 20,
      description:
        'Stun opponent for 2 turns. If opponent has a Water type active, deals double damage.',
    },
    {
      name: 'Thunder Fur',
      energyCost: ['colorless', 'colorless'],
      damage: 40,
      description:
        'The static electricity in its fur discharges in a blinding flash. Flip a coin — if heads, the Defending Pokémon is now Paralyzed.',
    },
  ],
  weakness: { type: 'fighting', modifier: '+10' },
  resistance: { type: 'water', modifier: '-20' },
  retreatCost: 1,
  flavorText:
    'The static electricity in its fur can light up a small town for days.',
  illustrator: 'PizzaRat Studios',
  cardNumber: '042/100',
};

const CARD_W = 350;
const CARD_H = 490;

function useAnimationFrame() {
  const [frame, setFrame] = useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    let id: number;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setFrame(Math.floor(elapsed * 60));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return { frame, fps: 60 };
}

/* ---------- pizzarat-style holo helpers ---------- */

/** Pulsing border shine opacity (pizzarat's borderPhase animation) */
const borderShineOpacity = (frame: number, fps: number): number => {
  const t = frame / fps;
  const cycle = (t % 2) / 2; // 0-1 over 2 seconds
  return 0.3 + 0.4 * Math.sin(cycle * Math.PI * 2); // 0.3 → 0.7 → 0.3
};

/** Corner sparkle opacity (pizzarat's rotation-based pulse) */
const sparkleOpacity = (frame: number, fps: number): number => {
  const t = frame / fps;
  const cycle = (t % 10) / 10; // maps to 0-360 rotation over 10s
  const deg = cycle * 360;
  // Original: inputRange [0, 90, 180, 270, 360] → outputRange [1, 0.7, 1, 0.7, 1]
  const norm = deg / 360;
  return 1 - 0.3 * Math.abs(Math.sin(norm * Math.PI * 2));
};

/** Magenta glow shadow (pizzarat's card border glow) */
const magentaGlow = (intensity: number): string => {
  return `0 0 ${15 * intensity}px rgba(255,0,255,${0.5 * intensity}), 0 0 ${30 * intensity}px rgba(255,0,255,${0.25 * intensity}), 0 16px 48px rgba(0,0,0,0.6)`;
};

const StatItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <span
      style={{
        fontSize: 6,
        textTransform: 'uppercase',
        color: '#888',
        letterSpacing: 0.5,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        marginTop: 1,
      }}
    >
      {children}
    </span>
  </div>
);

export const SparkittyCard: React.FC = () => {
  const { frame, fps } = useAnimationFrame();

  const shineOp = borderShineOpacity(frame, fps);
  const sparkleOp = sparkleOpacity(frame, fps);
  const glowPulse = 0.6 + 0.4 * Math.sin((frame / fps) * Math.PI);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
      }}
    >
      {/* Card outer — pizzarat purple border with magenta glow */}
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 12,
          padding: 6,
          flexShrink: 0,
          position: 'relative',
          background: 'rgba(192, 132, 252, 0.8)',
          border: '2px solid purple',
          boxShadow: magentaGlow(glowPulse),
          boxSizing: 'border-box',
        }}
      >
        {/* Border shine overlay (animated opacity) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.5)',
            opacity: shineOp,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* Card inner — pizzarat yellow-300 inner */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 7,
            background: '#fef08a',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 10px 8px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            zIndex: 2,
          }}
        >
          {/* Holo overlay 1: purple tint (pizzarat holoOverlay1) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(128, 0, 128, 0.3)',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 20,
              mixBlendMode: 'screen',
            }}
          />
          {/* Holo overlay 2: white sheen (pizzarat holoOverlay2) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.4)',
              opacity: 0.2,
              pointerEvents: 'none',
              zIndex: 21,
              mixBlendMode: 'soft-light',
            }}
          />

          {/* Header — pizzarat red header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: 4,
              background: '#ef4444',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header shimmer overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.3)',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {SPARKITTY.stage}
              </span>
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                {SPARKITTY.name}
              </span>
            </div>
            <span
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {SPARKITTY.hp}
              </span>
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                HP
              </span>
              <span style={{ fontSize: 12, marginLeft: 2 }}>
                {energyEmoji[SPARKITTY.type]}
              </span>
            </span>
          </div>

          {/* Art window — grey placeholder (pizzarat style) */}
          <div
            style={{
              width: '100%',
              height: 160,
              margin: '8px 0',
              borderRadius: 8,
              background: 'grey',
              boxShadow:
                'inset 0 1px 6px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Image overlay (pizzarat imageOverlay) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                opacity: 0.2,
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                fontSize: 48,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                position: 'relative',
                zIndex: 1,
              }}
            >
              ⚡🐱
            </span>
          </div>

          <p
            style={{
              fontSize: 7,
              color: '#555',
              textAlign: 'center',
              margin: '0 0 4px',
              fontStyle: 'italic',
              letterSpacing: 0.2,
            }}
          >
            Electric Kitten Pok&eacute;mon. Length: 1&apos;04&quot;, Weight: 8.5
            lbs.
          </p>

          {/* Attacks — pizzarat white description box style */}
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {SPARKITTY.attacks.map((atk, i) => (
              <div key={i}>
                {i > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: '#e5e7eb',
                      margin: '4px 0',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 10, letterSpacing: 1 }}>
                      {atk.energyCost.map((e) => energyEmoji[e]).join('')}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#111',
                      }}
                    >
                      {atk.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#111',
                    }}
                  >
                    {atk.damage}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 8,
                    color: '#555',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {atk.description}
                </p>
              </div>
            ))}

            {/* Flavor text divider + text (inside description box, pizzarat style) */}
            <div
              style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: 4,
                marginTop: 2,
              }}
            >
              <p
                style={{
                  fontStyle: 'italic',
                  fontSize: 8,
                  color: '#666',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                &ldquo;{SPARKITTY.flavorText}&rdquo;
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              padding: '5px 0 3px',
              marginTop: 4,
            }}
          >
            <StatItem label="weakness">
              <span style={{ fontSize: 11 }}>
                {energyEmoji[SPARKITTY.weakness.type]}
              </span>{' '}
              {SPARKITTY.weakness.modifier}
            </StatItem>
            <StatItem label="resistance">
              <span style={{ fontSize: 11 }}>
                {energyEmoji[SPARKITTY.resistance.type]}
              </span>{' '}
              {SPARKITTY.resistance.modifier}
            </StatItem>
            <StatItem label="retreat cost">
              {Array.from({ length: SPARKITTY.retreatCost }).map((_, j) => (
                <span key={j} style={{ fontSize: 11 }}>
                  {energyEmoji.colorless}
                </span>
              ))}
            </StatItem>
          </div>

          <CardFooter
            illustrator={SPARKITTY.illustrator}
            cardNumber={SPARKITTY.cardNumber}
          />
        </div>

        {/* Corner sparkles (pizzarat style) */}
        {[
          { top: -4, left: -4 },
          { top: -4, right: -4 },
          { bottom: -4, left: -4 },
          { bottom: -4, right: -4 },
        ].map((pos, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              ...pos,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: 'white',
              opacity: sparkleOp,
              zIndex: 20,
              boxShadow: '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,0,255,0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
