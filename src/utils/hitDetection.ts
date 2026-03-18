import { MAX_NUMBER, GRID_COLS } from '../types/lotto';

export interface GridLayout {
  gridOffsetX: number;
  gridOffsetY: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  cols: number;
}

export interface CellCoord {
  row: number;
  col: number;
}

export function getCellFromPoint(
  x: number,
  y: number,
  layout: GridLayout,
): CellCoord | null {
  const { gridOffsetX, gridOffsetY, cellWidth, cellHeight, gap, cols } = layout;
  const relX = x - gridOffsetX;
  const relY = y - gridOffsetY;
  if (relX < 0 || relY < 0) return null;

  const cellPlusGapW = cellWidth + gap;
  const cellPlusGapH = cellHeight + gap;
  const col = Math.floor(relX / cellPlusGapW);
  const row = Math.floor(relY / cellPlusGapH);
  if (col >= cols || col < 0) return null;

  const inCellX = relX - col * cellPlusGapW;
  const inCellY = relY - row * cellPlusGapH;
  if (inCellX > cellWidth || inCellY > cellHeight) return null;

  const num = getNumberFromCell(row, col);
  if (num === null) return null;
  return { row, col };
}

export function getNumberFromCell(row: number, col: number): number | null {
  const num = row * GRID_COLS + col + 1;
  if (num < 1 || num > MAX_NUMBER) return null;
  return num;
}

export function getCellCenter(
  row: number,
  col: number,
  layout: GridLayout,
): { x: number; y: number } {
  const { gridOffsetX, gridOffsetY, cellWidth, cellHeight, gap } = layout;
  return {
    x: gridOffsetX + col * (cellWidth + gap) + cellWidth / 2,
    y: gridOffsetY + row * (cellHeight + gap) + cellHeight / 2,
  };
}

export function getCellFromNumber(num: number): CellCoord {
  const index = num - 1;
  return {
    row: Math.floor(index / GRID_COLS),
    col: index % GRID_COLS,
  };
}

export function interpolateCells(from: CellCoord, to: CellCoord): CellCoord[] {
  const cells: CellCoord[] = [];
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) return [];

  for (let i = 1; i <= steps; i++) {
    const row = Math.round(from.row + (dr * i) / steps);
    const col = Math.round(from.col + (dc * i) / steps);
    const num = getNumberFromCell(row, col);
    if (num !== null) cells.push({ row, col });
  }
  return cells;
}
