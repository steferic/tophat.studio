import { useState, useCallback, useMemo } from 'react';
import type { StatusEffect } from '../../arena/types';

export interface StatusState {
  activeStatuses: string[];
  statusEffects: StatusEffect[];
}

export interface StatusActions {
  toggleStatus: (id: string) => void;
  setActiveStatuses: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useStatusState(): [StatusState, StatusActions] {
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);

  const toggleStatus = useCallback((id: string) => {
    setActiveStatuses((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const statusEffects = useMemo<StatusEffect[]>(
    () =>
      activeStatuses.map((id) => ({
        blueprintId: id,
        expiresAt: Date.now() + 60_000,
        appliedAt: Date.now() - 1_000,
        stacks: 1,
        lastTickAt: Date.now(),
      })),
    [activeStatuses],
  );

  return [
    { activeStatuses, statusEffects },
    { toggleStatus, setActiveStatuses },
  ];
}
