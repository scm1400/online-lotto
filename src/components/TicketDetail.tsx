import { useEffect, useRef } from 'react';
import type { Ticket } from '../types/api';
import { ShareButton } from './ShareButton';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const date = new Date(ticket.createdAt);
  const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="ticket-detail-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ticket-detail" role="dialog" aria-label="로또 용지 상세">
        <button className="ticket-detail__close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <div className="ticket-detail__title">나의 로또 번호</div>

        <div className="ticket-detail__numbers">
          {ticket.numbers.map((n, i) => (
            <span key={i} className="ticket-detail__ball">{n}</span>
          ))}
        </div>

        <div className="ticket-detail__meta">
          {ticket.pickTag && <span>#{ticket.pickTag} · </span>}
          <span>{ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}</span>
          <span> · {dateStr}</span>
        </div>

        <div className="ticket-detail__actions">
          <ShareButton ticketId={ticket.ticketId} />
        </div>
      </div>
    </div>
  );
}
