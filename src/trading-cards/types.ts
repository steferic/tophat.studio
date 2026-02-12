export type Attack = 'idle' | 'ice-slide' | 'glacier-crush' | 'inferno';
export type EnergyType = 'water' | 'fire' | 'colorless' | 'psychic' | 'fighting' | 'grass';

export interface AttackData {
  name: string;
  energyCost: EnergyType[];
  damage: number;
  description: string;
}

export interface CardData {
  name: string;
  stage: string;
  hp: number;
  type: EnergyType;
  attacks: AttackData[];
  weakness: { type: EnergyType; modifier: string };
  resistance: { type: EnergyType; modifier: string };
  retreatCost: number;
  flavorText: string;
  illustrator: string;
  cardNumber: string;
}
