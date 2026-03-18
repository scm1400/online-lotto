import { memo, useState } from 'react';
import type { Ticket } from '../types/api';

interface TicketCardProps {
  ticket: Ticket;
  isMine: boolean;
  onClick: () => void;
}

export const TicketCard = memo(function TicketCard({ ticket, isMine, onClick }: TicketCardProps) {
  const [tagRevealed, setTagRevealed] = useState(false);

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTagRevealed(!tagRevealed);
  };

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
        <div
          className={`ticket-card__tag ${tagRevealed ? 'ticket-card__tag--revealed' : 'ticket-card__tag--graffiti'}`}
          onClick={handleTagClick}
          title={tagRevealed ? ticket.pickTag : '탭하면 보여요'}
        >
          {ticket.pickTag}
        </div>
      )}
    </div>
  );
});
