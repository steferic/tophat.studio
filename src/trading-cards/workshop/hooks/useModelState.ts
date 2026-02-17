import { useState, useCallback } from 'react';
import { ALL_WORKSHOP_MODELS, getWorkshopModel } from '../modelRegistry';

export interface ModelState {
  selectedModelId: string;
  isDancing: boolean;
  isEvolving: boolean;
  isEvolved: boolean;
}

export interface ModelActions {
  selectModel: (id: string) => void;
  setIsDancing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEvolving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEvolved: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useModelState(): [ModelState, ModelActions] {
  const [selectedModelId, setSelectedModelId] = useState(ALL_WORKSHOP_MODELS[0].id);
  const [isDancing, setIsDancing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);

  const selectModel = useCallback((id: string) => {
    setSelectedModelId(id);
    setIsEvolving(false);
  }, []);

  return [
    { selectedModelId, isDancing, isEvolving, isEvolved },
    { selectModel, setIsDancing, setIsEvolving, setIsEvolved },
  ];
}

export { ALL_WORKSHOP_MODELS, getWorkshopModel };
