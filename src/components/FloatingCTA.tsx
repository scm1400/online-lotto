import { useState, useEffect, useCallback } from 'react';

interface FloatingCTAProps {
  onClick: () => void;
  rateLimitedUntil?: number; // timestamp ms when rate limit expires
  hourlyRemaining?: number | null;
  myTicketCount?: number;
  onShowMyTickets?: () => void;
}

export function FloatingCTA({ onClick, rateLimitedUntil, hourlyRemaining, myTicketCount, onShowMyTickets }: FloatingCTAProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!rateLimitedUntil) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitedUntil]);

  const isLimited = remaining > 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const handleClick = useCallback(() => {
    if (!isLimited) onClick();
  }, [isLimited, onClick]);

  return (
    <div className="floating-cta">
      {onShowMyTickets && (
        <button
          className="floating-cta__my-tickets"
          onClick={onShowMyTickets}
          type="button"
        >
          내 번호 {myTicketCount ? `(${myTicketCount})` : ''}
        </button>
      )}
      <button
        className={`floating-cta__button ${isLimited ? 'floating-cta__button--disabled' : ''}`}
        onClick={handleClick}
        disabled={isLimited}
      >
        {isLimited
          ? `${mins}분 ${String(secs).padStart(2, '0')}초 후 작성 가능`
          : hourlyRemaining !== null && hourlyRemaining !== undefined
            ? `로또 작성하기 (${hourlyRemaining}장 남음)`
            : '로또 작성하기'}
      </button>
    </div>
  );
}
