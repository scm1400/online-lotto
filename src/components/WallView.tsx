import { useRef, useCallback } from 'react';
import type { Ticket } from '../types/api';
import { TicketCard } from './TicketCard';

interface WallViewProps {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onTicketClick: (ticket: Ticket) => void;
  myTicketIds: string[];
}

export function WallView({
  tickets,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onTicketClick,
  myTicketIds,
}: WallViewProps) {
  const observerRef = useRef<IntersectionObserver>();

  const lastTicketRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, onLoadMore]);

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

  return (
    <div className="wall-container">
      <div className="wall-grid">
        {tickets.map((ticket, index) => (
          <div
            key={ticket.ticketId}
            ref={index === tickets.length - 1 ? lastTicketRef : undefined}
            style={{
              position: 'absolute',
              left: `${ticket.position.x * 85}%`,
              top: `${Math.floor(index / 3) * 130 + ticket.position.y * 40}px`,
              transform: `rotate(${ticket.rotation}deg)`,
              zIndex: index,
            }}
          >
            <TicketCard
              ticket={ticket}
              isMine={myTicketIds.includes(ticket.ticketId)}
              onClick={() => onTicketClick(ticket)}
            />
          </div>
        ))}
      </div>
      {isLoading && <div className="wall-loading">불러오는 중...</div>}
    </div>
  );
}
