import React from 'react';
import type { ToggleGroupState, ToggleGroupActions } from '../hooks/useToggleGroup';
import { FilterParamControls } from '../FilterParamControls';
import { chipOn, chipOff } from './chipStyles';

interface ToggleChipListProps {
  allIds: string[];
  getDef: (id: string) => { displayName: string; params: { key: string; label: string; type: any; default: any; min?: number; max?: number; step?: number; options?: any[] }[] } | undefined;
  state: ToggleGroupState;
  actions: ToggleGroupActions;
  filterQuery?: string;
}

export const ToggleChipList: React.FC<ToggleChipListProps> = ({
  allIds,
  getDef,
  state,
  actions,
  filterQuery,
}) => {
  const q = filterQuery?.toLowerCase() ?? '';
  const visibleIds = q
    ? allIds.filter((id) => id.toLowerCase().includes(q))
    : allIds;

  return (
    <>
      {visibleIds.map((key) => {
        const def = getDef(key);
        return (
          <button
            key={key}
            onClick={() => actions.toggle(key)}
            style={state.active.includes(key) ? chipOn : chipOff}
          >
            {def?.displayName ?? key}
          </button>
        );
      })}
      {state.active.filter((id) => allIds.includes(id)).map((id) => {
        const def = getDef(id);
        if (!def || def.params.length === 0) return null;
        return (
          <div key={id} style={{ width: '100%' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(100,180,255,0.8)',
                padding: '6px 0 2px',
              }}
            >
              {def.displayName}
            </div>
            <FilterParamControls
              filterDef={def}
              values={state.params[id] ?? {}}
              onChange={(key, value) => actions.changeParam(id, key, value)}
            />
          </div>
        );
      })}
    </>
  );
};
