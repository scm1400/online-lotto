import { useState, useCallback, useEffect } from 'react';
import { LottoWidget } from './components/LottoWidget';
import { WallView } from './components/WallView';
import { CountdownTimer } from './components/CountdownTimer';
import { WallCounter } from './components/WallCounter';
import { FloatingCTA } from './components/FloatingCTA';
import { TicketDetail } from './components/TicketDetail';
import { WinningNumberInput } from './components/WinningNumberInput';
import { WinCheckResult } from './components/WinCheckResult';
import { DEFAULT_PEN } from './types/lotto';
import type { LottoDraft } from './types/lotto';
import type { Ticket } from './types/api';
import { useRoundState } from './hooks/useRoundState';
import { useTicketWall } from './hooks/useTicketWall';
import { useWinningVotes } from './hooks/useWinningVotes';
import { useSound } from './hooks/useSound';
import { submitTicket, getTicketById } from './utils/api';
import { getUserId } from './utils/userId';

type AppView = 'ticket' | 'wall';

const TICKETS_STORAGE_KEY = 'lotto-my-tickets';

function getMyTicketIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTicketId(ticketId: string) {
  const ids = getMyTicketIds();
  if (!ids.includes(ticketId)) {
    ids.push(ticketId);
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(ids));
  }
}

export function App() {
  const [view, setView] = useState<AppView>('ticket');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSticking, setIsSticking] = useState(false);

  const { round, roundId, phase, isConfirmed } = useRoundState();
  const wall = useTicketWall(roundId);
  const votes = useWinningVotes(roundId);
  const { play: playStickSound } = useSound('/stick-sound.mp3');

  // Handle ?ticket= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticket');
    if (ticketId) {
      getTicketById(ticketId).then((result) => {
        if (result.ok) {
          setSelectedTicket(result.data);
          setView('wall');
        }
      });
    }
  }, []);

  const handleSubmitSuccess = useCallback(async (draft: LottoDraft) => {
    if (!roundId) return;

    const result = await submitTicket(draft, roundId);
    if (result.ok) {
      saveTicketId(result.data.ticketId);
      playStickSound();
      setIsSticking(true);

      // Sticking animation duration
      setTimeout(() => {
        setIsSticking(false);
        setView('wall');
        wall.refresh();
      }, 800);
    }
  }, [roundId, playStickSound, wall]);

  const handleGoToTicket = useCallback(() => {
    setView('ticket');
  }, []);

  return (
    <div className="app-container">
      <CountdownTimer
        round={round}
        phase={phase}
        isConfirmed={isConfirmed}
        winningNumbers={votes.winningNumbers}
        bonusNumber={votes.bonusNumber}
      />

      {view === 'ticket' && !isSticking && (
        <div className="app-ticket-view">
          <LottoWidget
            penSkin={DEFAULT_PEN}
            reducedAnimations={false}
            widgetMode="wall"
            onDraftComplete={async () => {}}
            onSubmitSuccess={handleSubmitSuccess}
            onWidgetClose={() => setView('wall')}
          />
        </div>
      )}

      {isSticking && (
        <div className="app-sticking-animation">
          <div className="sticking-ticket">
            <div className="sticking-ticket__inner">벽에 붙이는 중...</div>
          </div>
        </div>
      )}

      {view === 'wall' && !isSticking && (
        <>
          <WallCounter count={wall.totalCount} />

          <WallView
            tickets={wall.tickets}
            isLoading={wall.isLoading}
            error={wall.error}
            hasMore={wall.hasMore}
            onLoadMore={wall.loadMore}
            onRetry={wall.refresh}
            onTicketClick={setSelectedTicket}
            myTicketIds={getMyTicketIds()}
          />

          {phase === 'post-draw' && !isConfirmed && (
            <WinningNumberInput
              hasVoted={votes.hasVoted}
              voteCount={votes.voteCount}
              topVotes={votes.topVotes}
              isSubmitting={votes.isSubmitting}
              error={votes.error}
              onSubmit={votes.submitVote}
            />
          )}

          {isConfirmed && votes.winningNumbers && (
            <WinCheckResult
              winningNumbers={votes.winningNumbers}
              bonusNumber={votes.bonusNumber ?? 0}
              myTicketIds={getMyTicketIds()}
              roundId={roundId ?? ''}
            />
          )}

          <FloatingCTA onClick={handleGoToTicket} />
        </>
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
