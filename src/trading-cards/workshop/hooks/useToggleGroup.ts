import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface ToggleGroupConfig {
  getDef: (id: string) => { params: { key: string; default: any }[] } | undefined;
  getDefaults: (id: string) => Record<string, any>;
}

export interface ToggleGroupState {
  active: string[];
  params: Record<string, Record<string, any>>;
}

export interface ToggleGroupActions {
  toggle: (id: string) => void;
  changeParam: (id: string, key: string, value: any) => void;
  setActive: Dispatch<SetStateAction<string[]>>;
  setParams: Dispatch<SetStateAction<Record<string, Record<string, any>>>>;
}

export function useToggleGroup(
  config: ToggleGroupConfig,
): [ToggleGroupState, ToggleGroupActions] {
  const [active, setActive] = useState<string[]>([]);
  const [params, setParams] = useState<Record<string, Record<string, any>>>({});

  const toggle = useCallback(
    (id: string) => {
      setActive((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
      setParams((prev) => {
        if (prev[id]) return prev;
        const def = config.getDef(id);
        if (!def) return prev;
        return { ...prev, [id]: config.getDefaults(id) };
      });
    },
    [config],
  );

  const changeParam = useCallback(
    (id: string, key: string, value: any) => {
      setParams((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), [key]: value },
      }));
    },
    [],
  );

  return [{ active, params }, { toggle, changeParam, setActive, setParams }];
}
