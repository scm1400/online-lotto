import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { LottoWidgetProps, LottoDraft, InventoryStatus } from '../types/lotto';
import { DEFAULT_PEN, MAX_INVENTORY } from '../types/lotto';
import { useLottoSelection } from '../hooks/useLottoSelection';
import { useAutoFill } from '../hooks/useAutoFill';
import { useSignPen } from '../hooks/useSignPen';
import { Header } from './Header';
import { NumberGrid } from './NumberGrid';
import { CanvasOverlay, type CanvasOverlayHandle } from './CanvasOverlay';
import { SelectionInfo } from './SelectionInfo';
import { ActionBar } from './ActionBar';
import { TagSelector } from './TagSelector';
import type { GridLayout } from '../utils/hitDetection';

type WidgetPhase = 'selecting' | 'saving' | 'save_failed' | 'done';

export function LottoWidget(props: LottoWidgetProps) {
  const {
    penSkin = DEFAULT_PEN,
    reducedAnimations = false,
    inventoryStatus = { count: 0, max: MAX_INVENTORY },
    initialDraft,
    onDraftComplete,
    onDraftUpdate,
    onRequestInventoryStatus,
    widgetMode = 'standalone',
    onSubmitSuccess,
    onWidgetClose,
    onAiSubmit,
  } = props;

  const isEditMode = !!initialDraft;
  const [currentInventory, setCurrentInventory] = useState<InventoryStatus>(inventoryStatus);
  const isInventoryFull = widgetMode === 'wall' ? false : currentInventory.count >= currentInventory.max;

  // Responsive cell size
  const [cellSize, setCellSize] = useState(48);
  const gap = 0;

  useEffect(() => {
    const updateSize = () => setCellSize(window.innerWidth < 480 ? 38 : 48);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const gridLayout: GridLayout = useMemo(
    () => ({ gridOffsetX: 0, gridOffsetY: 0, cellWidth: cellSize, cellHeight: cellSize, gap, cols: 7 }),
    [cellSize],
  );

  const gridWidth = 7 * cellSize + 6 * gap;
  const gridHeight = 7 * cellSize + 6 * gap;

  // Selection state
  const selection = useLottoSelection(initialDraft?.numbers);
  const canvasRef = useRef<CanvasOverlayHandle>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<WidgetPhase>('selecting');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(
    initialDraft?.pickTag,
  );
  const [pendingDraft, setPendingDraft] = useState<LottoDraft | null>(null);

  // Overflow tooltip
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleOverflow = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    setShowOverflow(true);
    clearTimeout(overflowTimer.current);
    overflowTimer.current = setTimeout(() => setShowOverflow(false), 1500);
  }, []);

  // Sign pen hook
  const { attachEvents, redrawAll } = useSignPen({
    canvasRef,
    gridLayout,
    penSkin,
    reducedAnimations,
    selectedSet: selection.selectedSet,
    selectionCount: selection.count,
    isAnimating,
    onSelect: selection.select,
    onDeselect: selection.deselect,
    onOverflow: handleOverflow,
  });

  // Auto fill hook
  const { runAutoFill, runReset, skip: skipAutoFill } = useAutoFill({
    canvasRef,
    gridLayout,
    penSkin,
    reducedAnimations,
    selectedSet: selection.selectedSet,
    onAutoSelect: selection.autoSelect,
    onAnimationStart: () => setIsAnimating(true),
    onAnimationEnd: () => setIsAnimating(false),
    redrawAll,
  });

  // Attach pointer events
  useEffect(() => attachEvents(), [attachEvents]);

  // Redraw on resize
  useEffect(() => { redrawAll(); }, [cellSize, redrawAll]);

  // Tap-to-skip
  const handleSkipTap = useCallback(() => {
    if (isAnimating) skipAutoFill();
  }, [isAnimating, skipAutoFill]);

  // Save (async with error handling)
  const handleComplete = useCallback(async () => {
    if (!selection.isComplete) return;

    const draft: LottoDraft = {
      draftId: initialDraft?.draftId ?? crypto.randomUUID(),
      numbers: selection.sortedNumbers,
      mode: selection.mode,
      pickTag: selectedTag,
      createdAt: initialDraft?.createdAt ?? new Date().toISOString(),
    };

    setPendingDraft(draft);
    setPhase('saving');

    try {
      if (isEditMode) {
        await onDraftUpdate?.(draft);
      } else {
        await onDraftComplete?.(draft);
      }
      setPhase('done');
      if (widgetMode === 'wall' && onSubmitSuccess) {
        onSubmitSuccess(draft);
      }
    } catch {
      setPhase('save_failed');
    }
  }, [selection, selectedTag, initialDraft, isEditMode, onDraftComplete, onDraftUpdate, widgetMode, onSubmitSuccess]);

  const handleRetry = useCallback(async () => {
    if (!pendingDraft) return;
    setPhase('saving');
    try {
      if (isEditMode) {
        await onDraftUpdate?.(pendingDraft);
      } else {
        await onDraftComplete?.(pendingDraft);
      }
      setPhase('done');
    } catch {
      setPhase('save_failed');
    }
  }, [pendingDraft, isEditMode, onDraftComplete, onDraftUpdate]);

  const handleReset = useCallback(() => {
    runReset(() => selection.reset());
  }, [runReset, selection]);

  const handleWriteAnother = useCallback(async () => {
    if (widgetMode !== 'wall' && onRequestInventoryStatus) {
      try {
        const status = await onRequestInventoryStatus();
        setCurrentInventory(status);
        if (status.count >= status.max) return;
      } catch { /* use current value */ }
    }

    selection.reset();
    const ctx = canvasRef.current?.getContext();
    const canvas = canvasRef.current?.getCanvas();
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPhase('selecting');
    setSelectedTag(undefined);
    setPendingDraft(null);
  }, [selection, onRequestInventoryStatus, widgetMode]);

  return (
    <div className="lotto-widget" onClick={handleSkipTap}>
      <Header isEditMode={isEditMode} />

      <div className="lotto-grid-container">
        <NumberGrid selectedSet={selection.selectedSet} cellSize={cellSize} gap={gap}>
          <CanvasOverlay ref={canvasRef} width={gridWidth} height={gridHeight} />
        </NumberGrid>
        {showOverflow && (
          <div className="lotto-overflow-tooltip">6개까지 선택 가능합니다</div>
        )}
      </div>

      <SelectionInfo
        selected={selection.selected}
        isComplete={selection.isComplete}
        onDeselect={selection.deselect}
      />

      {phase === 'selecting' && (
        <>
          {selection.isComplete && (
            <TagSelector selectedTag={selectedTag} onSelect={setSelectedTag} />
          )}
          <ActionBar
            selectionCount={selection.count}
            isComplete={selection.isComplete}
            isAnimating={isAnimating}
            isInventoryFull={isInventoryFull && !isEditMode}
            isEditMode={isEditMode}
            widgetMode={widgetMode}
            onAutoFill={runAutoFill}
            onReset={handleReset}
            onComplete={handleComplete}
            onAiSubmit={onAiSubmit}
          />
        </>
      )}

      {phase === 'saving' && (
        <div className="lotto-done-actions">
          <p className="lotto-toast">저장 중...</p>
        </div>
      )}

      {phase === 'save_failed' && (
        <div className="lotto-done-actions">
          <p className="lotto-error-toast">저장에 실패했습니다. 다시 시도해주세요</p>
          <button className="lotto-btn lotto-btn--primary" onClick={handleRetry} type="button">
            다시 시도
          </button>
          <button className="lotto-btn lotto-btn--secondary" onClick={onWidgetClose} type="button">
            닫기
          </button>
        </div>
      )}

      {phase === 'done' && widgetMode !== 'wall' && (
        <div className="lotto-done-actions">
          <p className="lotto-toast">
            {isEditMode ? '번호가 수정되었습니다' : '아이템창에 보관되었습니다'}
          </p>
          {!isEditMode && !isInventoryFull && (
            <button className="lotto-btn lotto-btn--secondary" onClick={handleWriteAnother} type="button">
              한 장 더 작성
            </button>
          )}
          {!isEditMode && isInventoryFull && (
            <p className="lotto-warning">아이템창이 가득 찼습니다</p>
          )}
          <button className="lotto-btn lotto-btn--secondary" onClick={onWidgetClose} type="button">
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
