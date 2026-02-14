export type SoundSlotId = 'battle-cry' | 'hit-react' | 'status-react';

export const SOUND_SLOTS = [
  { id: 'battle-cry' as const, label: 'Battle Cry', description: 'Plays when attacking', icon: '\u2694' },
  { id: 'hit-react' as const, label: 'Hit React', description: 'Plays when taking damage', icon: '\uD83D\uDCA5' },
  { id: 'status-react' as const, label: 'Status React', description: 'Plays when cursed or affected', icon: '\u2728' },
] as const;
