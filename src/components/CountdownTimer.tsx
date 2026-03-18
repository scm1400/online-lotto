import type { Round, RoundPhase } from '../types/api';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  round: Round | null;
  phase: RoundPhase;
  isConfirmed: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function CountdownTimer({ round, phase, isConfirmed, winningNumbers, bonusNumber }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isPastDraw } = useCountdown();

  return (
    <div className="countdown-bar">
      {!isPastDraw && (
        <>
          <span className="countdown-bar__label">
            {round ? `${round.roundId} 추첨까지` : '추첨까지'}
          </span>
          <span className="countdown-bar__time">
            {days > 0 ? `${days}일 ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </span>
        </>
      )}

      {isPastDraw && !isConfirmed && (
        <span className="countdown-bar__label">
          추첨 완료 — 당첨번호 확인 중... ({round?.voteCount ?? 0}명 참여)
        </span>
      )}

      {isConfirmed && winningNumbers && (
        <>
          <span className="countdown-bar__confirmed">당첨번호 확정!</span>
          <div className="countdown-bar__numbers">
            {winningNumbers.map((n, i) => (
              <span key={i} className="countdown-bar__ball">{n}</span>
            ))}
            {bonusNumber !== undefined && (
              <>
                <span style={{ color: '#666', fontSize: 12 }}>+</span>
                <span className="countdown-bar__ball countdown-bar__ball--bonus">{bonusNumber}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
