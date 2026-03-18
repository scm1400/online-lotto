import { useState, useCallback } from 'react';
import type { Round, RoundPhase } from '../types/api';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  round: Round | null;
  phase: RoundPhase;
  isConfirmed: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
  onShowMyTickets: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// 로또 회차 계산: 2002년 12월 7일 1회 시작
function getLottoRound(): { round: number; drawDate: string } {
  const firstDraw = new Date(Date.UTC(2002, 11, 7)); // 2002-12-07
  const now = new Date();
  const diff = now.getTime() - firstDraw.getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  const round = weeks + 2;
  // 이번 주 토요일 날짜 (다음 추첨일)
  const nextSat = new Date(firstDraw.getTime() + (weeks + 1) * 7 * 24 * 60 * 60 * 1000);
  const drawDate = `${nextSat.getUTCFullYear()}.${String(nextSat.getUTCMonth() + 1).padStart(2, '0')}.${String(nextSat.getUTCDate()).padStart(2, '0')}`;
  return { round, drawDate };
}

export function CountdownTimer({ round, phase, isConfirmed, winningNumbers, bonusNumber, onShowMyTickets }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isPastDraw } = useCountdown();
  const lotto = getLottoRound();

  return (
    <div className="countdown-bar">
      <div className="countdown-bar__top">
        <span className="countdown-bar__round">제 {lotto.round}회 · {lotto.drawDate}</span>
        <button className="countdown-bar__my-btn" onClick={onShowMyTickets} type="button">
          내 번호
        </button>
      </div>
      <div className="countdown-bar__bottom">
        {!isPastDraw && (
          <>
            <span className="countdown-bar__label">로또 발표까지</span>
            <span className="countdown-bar__time">
              {days > 0 ? `${days}일 ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </span>
          </>
        )}

        {isPastDraw && !isConfirmed && (
          <span className="countdown-bar__label">
            발표 완료 — 당첨번호 확인 중... ({round?.voteCount ?? 0}명 참여)
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
    </div>
  );
}
