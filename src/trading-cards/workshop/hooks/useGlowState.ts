import { useState } from 'react';

export interface GlowState {
  glowEnabled: boolean;
  glowColor: string;
  glowRadius: number;
}

export interface GlowActions {
  setGlowEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setGlowColor: React.Dispatch<React.SetStateAction<string>>;
  setGlowRadius: React.Dispatch<React.SetStateAction<number>>;
}

export function useGlowState(): [GlowState, GlowActions] {
  const [glowEnabled, setGlowEnabled] = useState(false);
  const [glowColor, setGlowColor] = useState('#64b4ff');
  const [glowRadius, setGlowRadius] = useState(30);

  return [
    { glowEnabled, glowColor, glowRadius },
    { setGlowEnabled, setGlowColor, setGlowRadius },
  ];
}
