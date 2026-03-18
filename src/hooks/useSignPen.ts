import { useRef, useCallback, useEffect } from 'react';
import type { PenSkin } from '../types/lotto';
import { getAnimDuration, ANIM, MAX_SELECTION } from '../types/lotto';
import type { GridLayout, CellCoord } from '../utils/hitDetection';
import {
  getCellFromPoint,
  getNumberFromCell,
  getCellFromNumber,
  interpolateCells,
} from '../utils/hitDetection';
import { renderInkStroke, renderInkFill, renderInkFillComplete, type Point } from '../utils/inkRenderer';
import { renderEraserWipe } from '../utils/eraserRenderer';
import type { CanvasOverlayHandle } from '../components/CanvasOverlay';

interface UseSignPenOptions {
  canvasRef: React.RefObject<CanvasOverlayHandle | null>;
  gridLayout: GridLayout;
  penSkin: PenSkin;
  reducedAnimations: boolean;
  selectedSet: Set<number>;
  selectionCount: number;
  isAnimating: boolean;
  onSelect: (num: number) => void;
  onDeselect: (num: number) => void;
  onOverflow: () => void;
}

type DragMode = 'paint' | 'erase' | null;

export function useSignPen({
  canvasRef,
  gridLayout,
  penSkin,
  reducedAnimations,
  selectedSet,
  selectionCount,
  isAnimating,
  onSelect,
  onDeselect,
  onOverflow,
}: UseSignPenOptions) {
  const dragModeRef = useRef<DragMode>(null);
  const lastCellRef = useRef<string | null>(null);
  const strokePointsRef = useRef<Point[]>([]);
  const animFrameRef = useRef<number>(0);

  const getCellRect = useCallback(
    (row: number, col: number) => {
      const { gridOffsetX, gridOffsetY, cellWidth, cellHeight, gap } = gridLayout;
      return {
        x: gridOffsetX + col * (cellWidth + gap),
        y: gridOffsetY + row * (cellHeight + gap),
        width: cellWidth,
        height: cellHeight,
      };
    },
    [gridLayout],
  );

  const animateInkFill = useCallback(
    (num: number) => {
      const ctx = canvasRef.current?.getContext();
      if (!ctx) return;
      const { row, col } = getCellFromNumber(num);
      const rect = getCellRect(row, col);
      const duration = getAnimDuration(ANIM.INK_FILL, reducedAnimations);
      const start = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
        renderInkFill(ctx, rect, penSkin, progress);
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    },
    [canvasRef, getCellRect, penSkin, reducedAnimations],
  );

  const animateEraserWipe = useCallback(
    (num: number) => {
      const ctx = canvasRef.current?.getContext();
      if (!ctx) return;
      const { row, col } = getCellFromNumber(num);
      const rect = getCellRect(row, col);
      const duration = getAnimDuration(ANIM.ERASER_WIPE, reducedAnimations);
      const start = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        renderInkFillComplete(ctx, rect, penSkin);
        renderEraserWipe(ctx, rect, progress);
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    },
    [canvasRef, getCellRect, penSkin, reducedAnimations],
  );

  const redrawAll = useCallback(() => {
    const ctx = canvasRef.current?.getContext();
    if (!ctx) return;
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selectedSet.forEach((num) => {
      const { row, col } = getCellFromNumber(num);
      const rect = getCellRect(row, col);
      renderInkFillComplete(ctx, rect, penSkin);
    });
  }, [canvasRef, selectedSet, getCellRect, penSkin]);

  // Process a single cell during drag
  const processDragCell = useCallback(
    (cell: CellCoord) => {
      const cellKey = `${cell.row},${cell.col}`;
      if (cellKey === lastCellRef.current) return;
      lastCellRef.current = cellKey;

      const num = getNumberFromCell(cell.row, cell.col);
      if (num === null) return;

      const isSelected = selectedSet.has(num);

      if (dragModeRef.current === 'paint' && !isSelected) {
        if (selectionCount < MAX_SELECTION) {
          onSelect(num);
          animateInkFill(num);
        } else {
          onOverflow();
        }
      } else if (dragModeRef.current === 'erase' && isSelected) {
        onDeselect(num);
        animateEraserWipe(num);
      }
    },
    [selectedSet, selectionCount, onSelect, onDeselect, onOverflow, animateInkFill, animateEraserWipe],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (isAnimating) return;
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      const canvasRect = canvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      const cell = getCellFromPoint(x, y, gridLayout);
      if (!cell) return;

      const num = getNumberFromCell(cell.row, cell.col);
      if (num === null) return;

      const isSelected = selectedSet.has(num);
      dragModeRef.current = isSelected ? 'erase' : 'paint';
      lastCellRef.current = `${cell.row},${cell.col}`;
      strokePointsRef.current = [{ x, y }];

      if (isSelected) {
        onDeselect(num);
        animateEraserWipe(num);
      } else if (selectionCount < MAX_SELECTION) {
        onSelect(num);
        animateInkFill(num);
      } else {
        onOverflow();
      }
    },
    [
      isAnimating, canvasRef, gridLayout, selectedSet, selectionCount,
      onSelect, onDeselect, onOverflow, animateInkFill, animateEraserWipe,
    ],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragModeRef.current || isAnimating) return;
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      const ctx = canvasRef.current?.getContext();
      if (ctx) {
        strokePointsRef.current.push({ x, y });
        renderInkStroke(ctx, strokePointsRef.current.slice(-2), penSkin);
      }

      const cell = getCellFromPoint(x, y, gridLayout);
      if (!cell) return;

      // Interpolate intermediate cells for fast swipes
      if (lastCellRef.current) {
        const [prevRow, prevCol] = lastCellRef.current.split(',').map(Number);
        const intermediates = interpolateCells({ row: prevRow, col: prevCol }, cell);
        intermediates.forEach((c) => processDragCell(c));
      }

      processDragCell(cell);
    },
    [isAnimating, canvasRef, gridLayout, penSkin, processDragCell],
  );

  const handlePointerUp = useCallback(() => {
    dragModeRef.current = null;
    lastCellRef.current = null;
    strokePointsRef.current = [];
  }, []);

  const attachEvents = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return () => {};
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [canvasRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return { attachEvents, redrawAll, animateInkFill, animateEraserWipe };
}
