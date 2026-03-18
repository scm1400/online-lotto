import { useState, useEffect } from 'react';
import type { Ticket } from '../types/api';
import { getTicketById } from '../utils/api';
import { checkWin, getRankLabel, getRankEmoji } from '../utils/winCheck';
import { Confetti } from './Confetti';
import { ShareButton } from './ShareButton';

interface WinCheckResultProps {
  winningNumbers: number[];
  bonusNumber: number;
  myTicketIds: string[];
  roundId: string;
}

interface TicketResult {
  ticket: Ticket;
  rank: ReturnType<typeof checkWin>;
}

export function WinCheckResult({ winningNumbers, bonusNumber, myTicketIds, roundId }: WinCheckResultProps) {
  const [results, setResults] = useState<TicketResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const fetched = await Promise.all(myTicketIds.map((id) => getTicketById(id)));
      const loaded: TicketResult[] = fetched
        .filter((r): r is { ok: true; data: Ticket } => r.ok && r.data.roundId === roundId)
        .map((r) => ({
          ticket: r.data,
          rank: checkWin(r.data.numbers, winningNumbers, bonusNumber),
        }));
      setResults(loaded);
      if (loaded.some((r) => r.rank !== null)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
    loadResults();
  }, [myTicketIds, winningNumbers, bonusNumber, roundId]);

  if (results.length === 0) {
    return (
      <div className="win-check">
        <div className="win-check__title">당첨 확인</div>
        <div className="win-check__message">이번 회차에 제출한 용지가 없습니다</div>
      </div>
    );
  }

  return (
    <div className="win-check">
      {showConfetti && <Confetti />}

      <div className="win-check__title">당첨 확인</div>

      <div className="win-check__winning-numbers">
        {winningNumbers.map((n, i) => (
          <span key={i} className="countdown-bar__ball">{n}</span>
        ))}
        <span style={{ color: '#666', fontSize: 12 }}>+</span>
        <span className="countdown-bar__ball countdown-bar__ball--bonus">{bonusNumber}</span>
      </div>

      {results.map(({ ticket, rank }) => {
        const winSet = new Set(winningNumbers);
        const isWin = rank !== null;

        return (
          <div key={ticket.ticketId} className={`win-check__ticket ${isWin ? 'win-check__ticket--win' : ''}`}>
            <div className={`win-check__rank ${isWin ? 'win-check__rank--win' : ''}`}>
              {getRankEmoji(rank)} {getRankLabel(rank)}
            </div>
            <div className="win-check__numbers">
              {ticket.numbers.map((n, i) => (
                <span
                  key={i}
                  className={`win-check__num ${winSet.has(n) ? 'win-check__num--match' : ''}`}
                >
                  {n}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <ShareButton ticketId={ticket.ticketId} />
            </div>
          </div>
        );
      })}

      {results.every((r) => r.rank === null) && (
        <div className="win-check__message">아쉽지만 다음 기회에!</div>
      )}
    </div>
  );
}
