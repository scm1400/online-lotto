import { useReducer, useMemo, useCallback } from 'react';
import { MAX_SELECTION, type SelectionMode } from '../types/lotto';

interface SelectionState {
  selected: number[];
  manualNums: Set<number>;
  autoNums: Set<number>;
}

type SelectionAction =
  | { type: 'SELECT'; num: number }
  | { type: 'DESELECT'; num: number }
  | { type: 'AUTO_SELECT'; nums: number[] }
  | { type: 'RESET' };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SELECT': {
      if (state.selected.length >= MAX_SELECTION) return state;
      if (state.manualNums.has(action.num) || state.autoNums.has(action.num)) return state;
      const nextManual = new Set(state.manualNums);
      nextManual.add(action.num);
      return { ...state, selected: [...state.selected, action.num], manualNums: nextManual };
    }
    case 'DESELECT': {
      const idx = state.selected.indexOf(action.num);
      if (idx === -1) return state;
      const next = [...state.selected];
      next.splice(idx, 1);
      const nextManual = new Set(state.manualNums);
      const nextAuto = new Set(state.autoNums);
      nextManual.delete(action.num);
      nextAuto.delete(action.num);
      return { ...state, selected: next, manualNums: nextManual, autoNums: nextAuto };
    }
    case 'AUTO_SELECT': {
      const remaining = MAX_SELECTION - state.selected.length;
      const existing = new Set([...state.manualNums, ...state.autoNums]);
      const toAdd = action.nums.slice(0, remaining).filter((n) => !existing.has(n));
      const nextAuto = new Set(state.autoNums);
      toAdd.forEach((n) => nextAuto.add(n));
      return { ...state, selected: [...state.selected, ...toAdd], autoNums: nextAuto };
    }
    case 'RESET':
      return { selected: [], manualNums: new Set(), autoNums: new Set() };
    default:
      return state;
  }
}

export function useLottoSelection(initialNumbers?: number[]) {
  const [state, dispatch] = useReducer(selectionReducer, {
    selected: initialNumbers ?? [],
    manualNums: new Set(initialNumbers ?? []),
    autoNums: new Set<number>(),
  });

  const selectedSet = useMemo(() => new Set(state.selected), [state.selected]);
  const count = state.selected.length;
  const isComplete = count === MAX_SELECTION;
  const manualCount = state.manualNums.size;
  const autoCount = state.autoNums.size;

  const mode: SelectionMode = useMemo(() => {
    if (state.autoNums.size === 0) return 'manual';
    if (state.manualNums.size === 0) return 'auto';
    return 'semi_auto';
  }, [state.manualNums, state.autoNums]);

  const sortedNumbers = useMemo(
    () => [...state.selected].sort((a, b) => a - b),
    [state.selected],
  );

  const select = useCallback((num: number) => dispatch({ type: 'SELECT', num }), []);
  const deselect = useCallback((num: number) => dispatch({ type: 'DESELECT', num }), []);
  const autoSelect = useCallback((nums: number[]) => dispatch({ type: 'AUTO_SELECT', nums }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    selected: state.selected,
    selectedSet,
    count,
    isComplete,
    manualCount,
    autoCount,
    mode,
    sortedNumbers,
    select,
    deselect,
    autoSelect,
    reset,
  };
}
