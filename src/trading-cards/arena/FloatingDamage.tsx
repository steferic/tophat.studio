import React, { useState, useEffect, useRef } from 'react';
import type { DamageEvent, Side } from './types';

interface FloatingDamageProps {
  damage: DamageEvent | null;
  target: Side | null;
  phase: string;
}

export const FloatingDamage: React.FC<FloatingDamageProps> = ({ damage, target, phase }) => {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (phase !== 'resolving' || !damage) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setOpacity(1);
    setOffsetY(0);
    startRef.current = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      // Float upward
      setOffsetY(-elapsed * 40);
      // Fade out after 0.7s
      if (elapsed > 0.7) {
        setOpacity(Math.max(0, 1 - (elapsed - 0.7) / 0.5));
      }
      if (elapsed < 1.2) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setVisible(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, damage]);

  if (!visible || !damage || !target) return null;

  // Position: left target → left side, right target → right side
  const horizontalOffset = target === 'left' ? 'calc(25% - 40px)' : 'calc(75% - 40px)';

  return (
    <div
      style={{
        position: 'fixed',
        left: horizontalOffset,
        top: '35%',
        transform: `translateY(${offsetY}px)`,
        opacity,
        zIndex: 200,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Damage number */}
      <span
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 20px rgba(255,50,50,0.8), 0 0 40px rgba(255,0,0,0.5), 2px 2px 0 rgba(0,0,0,0.5)',
          fontFamily: 'Georgia, serif',
        }}
      >
        -{damage.finalDamage}
      </span>

      {/* Effectiveness label */}
      {damage.superEffective && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#fbbf24',
            textShadow: '0 0 10px rgba(251,191,36,0.6), 1px 1px 0 rgba(0,0,0,0.5)',
            letterSpacing: 1,
          }}
        >
          Super Effective!
        </span>
      )}
      {damage.resisted && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#94a3b8',
            textShadow: '0 0 10px rgba(148,163,184,0.4), 1px 1px 0 rgba(0,0,0,0.5)',
            letterSpacing: 1,
          }}
        >
          Resisted
        </span>
      )}
    </div>
  );
};
