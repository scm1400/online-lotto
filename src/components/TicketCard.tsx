import { memo } from 'react';
import type { Ticket } from '../types/api';

interface TicketCardProps {
  ticket: Ticket;
  isMine: boolean;
  onClick: () => void;
}

export const TicketCard = memo(function TicketCard({ ticket, isMine, onClick }: TicketCardProps) {
  return (
    <div
      className={`ticket-card ${isMine ? 'ticket-card--mine' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`로또 번호: ${ticket.numbers.join(', ')}`}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      <div className="ticket-card__tape" />
      <div className="ticket-card__numbers">
        {ticket.numbers.map((n, i) => (
          <span key={i} className="ticket-card__num">{n}</span>
        ))}
      </div>
      {ticket.pickTag && (
        <div className="ticket-card__tag">#{ticket.pickTag}</div>
      )}
    </div>
  );
});
