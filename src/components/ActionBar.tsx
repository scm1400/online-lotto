interface ActionBarProps {
  selectionCount: number;
  isComplete: boolean;
  isAnimating: boolean;
  isInventoryFull: boolean;
  isEditMode: boolean;
  widgetMode?: 'standalone' | 'wall';
  onAutoFill: () => void;
  onReset: () => void;
  onComplete: () => void;
  onAiSubmit?: () => void;
}

export function ActionBar({
  selectionCount,
  isComplete,
  isAnimating,
  isInventoryFull,
  isEditMode,
  widgetMode,
  onAutoFill,
  onReset,
  onComplete,
  onAiSubmit,
}: ActionBarProps) {
  return (
    <div className="lotto-action-bar">
      <div className="lotto-action-bar__row">
        <button
          className="lotto-btn lotto-btn--secondary"
          onClick={onAutoFill}
          disabled={isComplete || isAnimating}
          type="button"
        >
          자동 채우기
        </button>
        <button
          className="lotto-btn lotto-btn--secondary"
          onClick={onReset}
          disabled={selectionCount === 0 || isAnimating}
          type="button"
        >
          초기화
        </button>
      </div>
      {onAiSubmit && (
        <button
          className="lotto-btn lotto-btn--ai"
          onClick={onAiSubmit}
          disabled={isAnimating}
          type="button"
        >
          AI에게 시키기
        </button>
      )}
      <button
        className="lotto-btn lotto-btn--primary"
        onClick={onComplete}
        disabled={!isComplete || isAnimating || isInventoryFull}
        type="button"
      >
        {isEditMode ? '수정 완료' : widgetMode === 'wall' ? '벽에 붙이기' : '용지 작성 완료'}
      </button>
      {widgetMode !== 'wall' && isInventoryFull && isComplete && (
        <p className="lotto-warning">아이템창이 가득 찼습니다</p>
      )}
    </div>
  );
}
