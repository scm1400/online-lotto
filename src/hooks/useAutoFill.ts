import { useRef, useCallback } from 'react';
import { MAX_NUMBER, MAX_SELECTION, ANIM, getAnimDuration } from '../types/lotto';
import type { PenSkin } from '../types/lotto';
import type { GridLayout } from '../utils/hitDetection';
import { getCellFromNumber } from '../utils/hitDetection';
import { renderInkFill, renderInkFillComplete } from '../utils/inkRenderer';
import { clearAllInk } from '../utils/eraserRenderer';
import type { CanvasOverlayHandle } from '../components/CanvasOverlay';

export function generateAutoFillNumbers(
  selectedSet: Set<number>,
  maxSelection: number,
): number[] {
  const remaining = maxSelection - selectedSet.size;
  if (remaining <= 0) return [];

  const available: number[] = [];
  for (let i = 1; i <= MAX_NUMBER; i++) {
    if (!selectedSet.has(i)) available.push(i);
  }

  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, remaining);
}

interface UseAutoFillOptions {
  canvasRef: React.RefObject<CanvasOverlayHandle | null>;
  gridLayout: GridLayout;
  penSkin: PenSkin;
  reducedAnimations: boolean;
  selectedSet: Set<number>;
  onAutoSelect: (nums: number[]) => void;
  onAnimationStart: () => void;
  onAnimationEnd: () => void;
  redrawAll: () => void;
}

export function useAutoFill({
  canvasRef,
  gridLayout,
  penSkin,
  reducedAnimations,
  selectedSet,
  onAutoSelect,
  onAnimationStart,
  onAnimationEnd,
  redrawAll,
}: UseAutoFillOptions) {
  const animatingRef = useRef(false);
  const skipRef = useRef(false);

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

  const runAutoFill = useCallback(() => {
    const nums = generateAutoFillNumbers(selectedSet, MAX_SELECTION);
    if (nums.length === 0) return;

    onAnimationStart();
    animatingRef.current = true;
    skipRef.current = false;

    const ctx = canvasRef.current?.getContext();
    if (!ctx) {
      onAutoSelect(nums);
      onAnimationEnd();
      return;
    }

    const perCell = getAnimDuration(ANIM.AUTO_FILL_PER_CELL, reducedAnimations);
    let currentIndex = 0;

    const animateNext = () => {
      if (skipRef.current || currentIndex >= nums.length) {
        // Instantly fill remaining
        for (let i = currentIndex; i < nums.length; i++) {
          const { row, col } = getCellFromNumber(nums[i]);
          renderInkFillComplete(ctx, getCellRect(row, col), penSkin);
        }
        onAutoSelect(nums);
        animatingRef.current = false;
        onAnimationEnd();
        return;
      }

      const num = nums[currentIndex];
      const { row, col } = getCellFromNumber(num);
      const rect = getCellRect(row, col);
      const start = performance.now();

      const fillFrame = (now: number) => {
        if (skipRef.current) {
          animateNext();
          return;
        }
        const progress = Math.min((now - start) / perCell, 1);
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
        renderInkFill(ctx, rect, penSkin, progress);
        if (progress < 1) {
          requestAnimationFrame(fillFrame);
        } else {
          currentIndex++;
          animateNext();
        }
      };

      requestAnimationFrame(fillFrame);
    };

    animateNext();
  }, [
    canvasRef, penSkin, reducedAnimations, selectedSet,
    onAutoSelect, onAnimationStart, onAnimationEnd, getCellRect,
  ]);

  const runReset = useCallback(
    (onResetComplete: () => void) => {
      const ctx = canvasRef.current?.getContext();
      const canvas = canvasRef.current?.getCanvas();
      if (!ctx || !canvas) {
        onResetComplete();
        return;
      }

      onAnimationStart();
      const duration = getAnimDuration(ANIM.RESET_ALL, reducedAnimations);
      const start = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        ctx.globalAlpha = 1 - progress;
        redrawAll();
        ctx.globalAlpha = 1;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          clearAllInk(ctx, canvas.width, canvas.height);
          onResetComplete();
          onAnimationEnd();
        }
      };
      requestAnimationFrame(animate);
    },
    [canvasRef, reducedAnimations, onAnimationStart, onAnimationEnd, redrawAll],
  );

  const skip = useCallback(() => {
    if (animatingRef.current) {
      skipRef.current = true;
    }
  }, []);

  return { runAutoFill, runReset, skip };
}
