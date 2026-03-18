import { useMemo } from 'react';
import type { Ticket } from '../types/api';

interface HeatmapOverlayProps {
  tickets: Ticket[];
}

function getTopNumbers(tickets: Ticket[], limit = 10) {
  if (tickets.length === 0) return [];
  const counts = new Map<number, number>();
  for (const ticket of tickets) {
    for (const num of ticket.numbers) {
      counts.set(num, (counts.get(num) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([num, count]) => ({ num, count }));
}

function HeatmapBar({ label, items, variant }: { label: string; items: { num: number; count: number }[]; variant?: 'ai' }) {
  if (items.length === 0) return null;
  const maxCount = items[0].count;

  return (
    <div className={`heatmap-bar ${variant === 'ai' ? 'heatmap-bar--ai' : ''}`}>
      <span className="heatmap-bar__label">{label}</span>
      <div className="heatmap-bar__items">
        {items.map(({ num, count }) => (
          <div key={num} className="heatmap-bar__item">
            <div
              className="heatmap-bar__fill"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
            <span className="heatmap-bar__num">{num}</span>
            <span className="heatmap-bar__count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapOverlay({ tickets }: HeatmapOverlayProps) {
  const { humanTop, aiTop } = useMemo(() => {
    const humanTickets = tickets.filter((t) => t.mode !== 'ai');
    const aiTickets = tickets.filter((t) => t.mode === 'ai');
    return {
      humanTop: getTopNumbers(humanTickets),
      aiTop: getTopNumbers(aiTickets),
    };
  }, [tickets]);

  if (humanTop.length === 0 && aiTop.length === 0) return null;

  return (
    <div className="heatmap-overlay">
      <HeatmapBar label="사람 인기" items={humanTop} />
      <HeatmapBar label="AI 인기" items={aiTop} variant="ai" />
    </div>
  );
}
