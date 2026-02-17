import { useState, useCallback, useEffect } from 'react';
import { getAllEnvironmentConfigs } from '../../environment/environmentStorage';
import type { EnvironmentConfig } from '../../environment/environmentTypes';

export interface EnvironmentState {
  envConfigs: EnvironmentConfig[];
  selectedEnvId: string | null;
  modelPosition: [number, number, number];
  modelRotationY: number;
  modelScale: number;
}

export interface EnvironmentActions {
  setSelectedEnvId: React.Dispatch<React.SetStateAction<string | null>>;
  changeModelPosition: (axis: 0 | 1 | 2, value: number) => void;
  setModelRotationY: React.Dispatch<React.SetStateAction<number>>;
  setModelScale: React.Dispatch<React.SetStateAction<number>>;
}

export function useEnvironmentState(): [EnvironmentState, EnvironmentActions] {
  const [envConfigs, setEnvConfigs] = useState<EnvironmentConfig[]>(() => getAllEnvironmentConfigs());
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [modelPosition, setModelPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [modelRotationY, setModelRotationY] = useState(0);
  const [modelScale, setModelScale] = useState(1);

  // Refresh env configs when tab mounts
  useEffect(() => {
    setEnvConfigs(getAllEnvironmentConfigs());
  }, []);

  const changeModelPosition = useCallback((axis: 0 | 1 | 2, value: number) => {
    setModelPosition((prev) => {
      const next = [...prev] as [number, number, number];
      next[axis] = value;
      return next;
    });
  }, []);

  return [
    { envConfigs, selectedEnvId, modelPosition, modelRotationY, modelScale },
    { setSelectedEnvId, changeModelPosition, setModelRotationY, setModelScale },
  ];
}
