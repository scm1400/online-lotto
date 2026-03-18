import { useState, useEffect } from 'react';
import type { Ticket } from '../types/api';
import { getMyTickets } from '../utils/api';
import { getUserId } from '../utils/userId';
import { ShareButton } from './ShareButton';

interface MyTicketsPanelProps {
  roundId: string;
  onClose: () => void;
}

export function MyTicketsPanel({ roundId, onClose }: MyTicketsPanelProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getMyTickets(roundId, getUserId());
      if (result.ok) {
        setTickets(result.data.tickets);
      }
      setLoading(false);
    }
    load();
  }, [roundId]);

  return (
    <div className="ticket-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="my-tickets-panel" role="dialog" aria-label="내 로또 번호">
        <button className="ticket-detail__close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="my-tickets-panel__title">내가 제출한 번호 ({tickets.length}장)</div>

        {loading && <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>불러오는 중...</div>}

        <div className="my-tickets-panel__list">
          {tickets.map((ticket, idx) => (
            <div key={ticket.ticketId} className="my-tickets-panel__item">
              <div className="my-tickets-panel__idx">{idx + 1}</div>
              {ticket.mode === 'ai' && <span className="my-tickets-panel__ai-tag">AI</span>}
              <div className="my-tickets-panel__numbers">
                {ticket.numbers.map((n, i) => (
                  <span key={i} className="my-tickets-panel__ball">{n}</span>
                ))}
              </div>
              <div className="my-tickets-panel__meta">
                {ticket.pickTag && <span className="my-tickets-panel__tag">"{ticket.pickTag}"</span>}
                <span className="my-tickets-panel__mode">
                  {ticket.mode === 'ai' ? 'AI 선택' : ticket.mode === 'auto' ? '자동' : ticket.mode === 'semi_auto' ? '반자동' : '수동'}
                </span>
              </div>
              <ShareButton ticketId={ticket.ticketId} />
            </div>
          ))}
        </div>

        {!loading && tickets.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            이번 회차에 제출한 번호가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
