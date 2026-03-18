import { useMemo } from 'react';
import type { Ticket } from '../types/api';

interface HeatmapOverlayProps {
  tickets: Ticket[];
}

export function HeatmapOverlay({ tickets }: HeatmapOverlayProps) {
  const top5 = useMemo(() => {
    if (tickets.length === 0) return [];
    const counts = new Map<number, number>();
    for (const ticket of tickets) {
      for (const num of ticket.numbers) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([num, count]) => ({ num, count }));
  }, [tickets]);

  if (top5.length === 0) return null;

  const maxCount = top5[0].count;

  return (
    <div className="heatmap-bar">
      <span className="heatmap-bar__label">인기</span>
      <div className="heatmap-bar__items">
        {top5.map(({ num, count }) => (
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
