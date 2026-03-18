import { MAX_SELECTION } from '../types/lotto';

interface SelectionInfoProps {
  selected: number[];
  isComplete: boolean;
  onDeselect: (num: number) => void;
}

export function SelectionInfo({ selected, isComplete, onDeselect }: SelectionInfoProps) {
  const slots = [];
  for (let i = 0; i < MAX_SELECTION; i++) {
    if (i < selected.length) {
      slots.push(
        <button
          key={i}
          className="lotto-slot lotto-slot--filled"
          onClick={() => onDeselect(selected[i])}
          type="button"
        >
          {selected[i]}
        </button>,
      );
    } else {
      slots.push(
        <div key={i} className="lotto-slot lotto-slot--empty">__</div>,
      );
    }
  }

  return (
    <div className={`lotto-selection-info ${isComplete ? 'lotto-selection-info--complete' : ''}`}>
      <span className="lotto-selection-info__label">선택한 번호:</span>
      <div className="lotto-selection-info__slots">{slots}</div>
      <span className="lotto-selection-info__count">{selected.length}/{MAX_SELECTION}</span>
    </div>
  );
}
