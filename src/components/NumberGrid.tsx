import { forwardRef } from 'react';
import { MAX_NUMBER, GRID_COLS } from '../types/lotto';

interface NumberGridProps {
  selectedSet: Set<number>;
  cellSize: number;
  gap: number;
  children?: React.ReactNode;
}

export const NumberGrid = forwardRef<HTMLDivElement, NumberGridProps>(
  function NumberGrid({ selectedSet, cellSize, gap, children }, ref) {
    const cells: React.ReactNode[] = [];

    for (let num = 1; num <= MAX_NUMBER; num++) {
      const isSelected = selectedSet.has(num);
      cells.push(
        <div
          key={num}
          className={`lotto-cell ${isSelected ? 'lotto-cell--selected' : ''}`}
          data-number={num}
          data-selected={String(isSelected)}
          style={{ width: cellSize, height: cellSize }}
        >
          <span className="lotto-cell__corners" />
          <span className="lotto-cell__number">{num}</span>
        </div>,
      );
    }

    // Fill remaining cells in last row
    const totalCells = Math.ceil(MAX_NUMBER / GRID_COLS) * GRID_COLS;
    for (let i = MAX_NUMBER; i < totalCells; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="lotto-cell--empty"
          style={{ width: cellSize, height: cellSize }}
        />,
      );
    }

    return (
      <div
        ref={ref}
        className="lotto-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
          gap: `${gap}px`,
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {cells}
        {children}
      </div>
    );
  },
);
