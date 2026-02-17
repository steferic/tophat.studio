import React, { useMemo } from 'react';
import type { CardDefinition } from '../../arena/descriptorTypes';
import { Section } from '../ui/Section';
import { chipOn, chipAction } from '../ui/chipStyles';

export interface AttackPanelProps {
  definition: CardDefinition;
  activeAttackKey: string | null;
  attackMode: 'give' | 'take' | null;
  onGiveAttack: (attackKey: string) => void;
  onTakeAttack: (attackKey: string) => void;
  filterQuery: string;
}

export const AttackPanel: React.FC<AttackPanelProps> = ({
  definition,
  activeAttackKey,
  attackMode,
  onGiveAttack,
  onTakeAttack,
  filterQuery,
}) => {
  const q = filterQuery.toLowerCase();
  const attacks = useMemo(() => {
    return definition.cardData.attacks.map((atk, i) => ({
      key: definition.attackKeys[i],
      name: atk.name,
      damage: atk.damage,
    }));
  }, [definition]);

  const filteredAttacks = useMemo(
    () => (q ? attacks.filter((a) => a.name.toLowerCase().includes(q)) : attacks),
    [attacks, q],
  );

  if (filteredAttacks.length === 0) return null;

  return (
    <Section title="Attacks" count={filteredAttacks.length}>
      {filteredAttacks.map((atk) => {
        const isActiveGive = activeAttackKey === atk.key && attackMode === 'give';
        const isActiveTake = activeAttackKey === atk.key && attackMode === 'take';
        return (
          <div
            key={atk.key}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 11,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 500,
              }}
            >
              {atk.name}{' '}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {atk.damage} dmg
              </span>
            </span>
            <button
              onClick={() => onGiveAttack(atk.key)}
              style={isActiveGive ? chipOn : chipAction}
            >
              Give
            </button>
            <button
              onClick={() => onTakeAttack(atk.key)}
              style={isActiveTake ? chipOn : chipAction}
            >
              Take
            </button>
          </div>
        );
      })}
    </Section>
  );
};
