import { useRef, useState, useEffect } from 'react';
import type { Ticket } from '../types/api';
import { TicketCard } from './TicketCard';
import { getUserId } from '../utils/userId';

interface WallViewProps {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onTicketClick: (ticket: Ticket) => void;
}

const BATCH_SIZE = 40;

export function WallView({
  tickets,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onTicketClick,
}: WallViewProps) {
  const myUserId = getUserId();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Show more tickets as user scrolls
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (visibleCount < tickets.length) {
            // Show more from already-loaded tickets
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, tickets.length));
          } else if (hasMore && !isLoading) {
            // Fetch more from API
            onLoadMore();
          }
        }
      },
      { rootMargin: '500px' }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [visibleCount, tickets.length, hasMore, isLoading, onLoadMore]);

  // Reset visible count when tickets array changes (new round, refresh)
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [tickets.length === 0]);

  if (error) {
    return (
      <div className="wall-error">
        <p>벽면을 불러올 수 없습니다</p>
        <button onClick={onRetry}>다시 시도</button>
      </div>
    );
  }

  if (!isLoading && tickets.length === 0) {
    return (
      <div className="wall-empty">
        아직 아무도 로또를 붙이지 않았어요.<br />
        첫 번째 주인공이 되어보세요!
      </div>
    );
  }

  const displayed = tickets.slice(0, visibleCount);

  return (
    <div className="wall-container">
      <div className="wall-grid">
        {displayed.map((ticket) => (
          <div
            key={ticket.ticketId}
            className="wall-grid__cell"
            style={{ transform: `rotate(${ticket.rotation * 0.5}deg)` }}
          >
            <TicketCard
              ticket={ticket}
              isMine={ticket.userId === myUserId}
              onClick={() => onTicketClick(ticket)}
            />
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {isLoading && <div className="wall-loading">불러오는 중...</div>}

      {!isLoading && visibleCount < tickets.length && (
        <div className="wall-loading">스크롤하여 더 보기</div>
      )}
    </div>
  );
}
