import { useState, useCallback } from 'react';

interface WinningNumberInputProps {
  hasVoted: boolean;
  voteCount: number;
  topVotes: Array<{ numbers: number[]; bonus: number; count: number }>;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (numbers: number[], bonus: number) => void;
}

export function WinningNumberInput({
  hasVoted,
  voteCount,
  topVotes,
  isSubmitting,
  error,
  onSubmit,
}: WinningNumberInputProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [bonus, setBonus] = useState<number | null>(null);
  const [step, setStep] = useState<'main' | 'bonus'>('main');

  const handleCellClick = useCallback((num: number) => {
    if (step === 'main') {
      setSelected((prev) => {
        if (prev.includes(num)) return prev.filter((n) => n !== num);
        if (prev.length >= 6) return prev;
        const next = [...prev, num];
        if (next.length === 6) {
          setTimeout(() => setStep('bonus'), 100);
        }
        return next;
      });
    } else {
      // Bonus step
      if (selected.includes(num)) return; // Can't use a main number as bonus
      setBonus((prev) => (prev === num ? null : num));
    }
  }, [step, selected]);

  const handleSubmit = useCallback(() => {
    if (selected.length === 6 && bonus !== null) {
      onSubmit(selected, bonus);
    }
  }, [selected, bonus, onSubmit]);

  const handleReset = useCallback(() => {
    setSelected([]);
    setBonus(null);
    setStep('main');
  }, []);

  if (hasVoted) {
    return (
      <div className="winning-input">
        <div className="winning-input__voted">
          투표 완료! 확인 중... ({voteCount}명 참여)
        </div>
        {topVotes.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#888', textAlign: 'center' }}>
            현재 1위: [{topVotes[0].numbers.join(', ')}] + {topVotes[0].bonus} ({topVotes[0].count}표)
          </div>
        )}
      </div>
    );
  }

  const numbers = Array.from({ length: 45 }, (_, i) => i + 1);

  return (
    <div className="winning-input">
      <div className="winning-input__title">당첨 번호 입력</div>
      <div className="winning-input__status">
        아직 확인 중... ({voteCount}명 참여)
      </div>

      <div className="winning-input__step">
        {step === 'main'
          ? `당첨 번호 6개를 선택하세요 (${selected.length}/6)`
          : '보너스 번호 1개를 선택하세요'}
      </div>

      <div className="winning-input__grid">
        {numbers.map((n) => {
          const isSelected = selected.includes(n);
          const isBonus = bonus === n;
          const isDisabledForBonus = step === 'bonus' && isSelected;

          return (
            <button
              key={n}
              className={`winning-input__cell${isSelected ? ' winning-input__cell--selected' : ''}${isBonus ? ' winning-input__cell--bonus' : ''}`}
              onClick={() => handleCellClick(n)}
              disabled={isDisabledForBonus || isSubmitting}
              type="button"
            >
              {n}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="winning-input__submit"
          onClick={handleSubmit}
          disabled={selected.length !== 6 || bonus === null || isSubmitting}
          type="button"
          style={{ flex: 1 }}
        >
          {isSubmitting ? '제출 중...' : '당첨 번호 제출'}
        </button>
        <button
          className="winning-input__submit"
          onClick={handleReset}
          type="button"
          style={{ flex: 0, padding: '12px 16px', background: '#eee', color: '#666' }}
        >
          초기화
        </button>
      </div>

      {error && <div className="winning-input__error">{error}</div>}
    </div>
  );
}
