import { useState, useCallback, useEffect } from 'react';
import { LottoWidget } from './components/LottoWidget';
import { WallView } from './components/WallView';
import { CountdownTimer } from './components/CountdownTimer';
import { WallCounter } from './components/WallCounter';
import { FloatingCTA } from './components/FloatingCTA';
import { TicketDetail } from './components/TicketDetail';
import { WinningNumberInput } from './components/WinningNumberInput';
import { HeatmapOverlay } from './components/HeatmapOverlay';
import { WinCheckResult } from './components/WinCheckResult';
import { MyTicketsPanel } from './components/MyTicketsPanel';
import { AiPromptModal } from './components/AiPromptModal';
import { DEFAULT_PEN } from './types/lotto';
import type { LottoDraft } from './types/lotto';
import type { Ticket } from './types/api';
import { useRoundState } from './hooks/useRoundState';
import { useTicketWall } from './hooks/useTicketWall';
import { useWinningVotes } from './hooks/useWinningVotes';
import { useSound } from './hooks/useSound';
import { submitTicket, getTicketById, getRateLimit } from './utils/api';
import { getUserId } from './utils/userId';

type AppView = 'ticket' | 'wall';

const TICKETS_STORAGE_KEY = 'lotto-my-tickets';
const RATE_LIMIT_STORAGE_KEY = 'lotto-rate-limited-until';
const VISITED_STORAGE_KEY = 'lotto-has-visited';

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
  // First visit → ticket view, returning visitor → wall view
  const [view, setView] = useState<AppView>(() => {
    const hasVisited = localStorage.getItem(VISITED_STORAGE_KEY);
    const hasTickets = getMyTicketIds().length > 0;
    if (!hasVisited && !hasTickets) {
      localStorage.setItem(VISITED_STORAGE_KEY, '1');
      return 'ticket';
    }
    localStorage.setItem(VISITED_STORAGE_KEY, '1');
    return 'wall';
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSticking, setIsSticking] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(() => {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (stored) {
      const ts = Number(stored);
      if (ts > Date.now()) return ts;
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    }
    return 0;
  });
  const [hourlyRemaining, setHourlyRemaining] = useState<number | null>(null);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [rateLimitModal, setRateLimitModal] = useState<{ retryAfter: number } | null>(null);

  const { round, roundId, phase, isConfirmed } = useRoundState();
  const wall = useTicketWall(roundId);
  const votes = useWinningVotes(roundId);
  const { play: playStickSound } = useSound();

  // Check rate limit on page load
  useEffect(() => {
    getRateLimit().then((result) => {
      if (result.ok) {
        setHourlyRemaining(result.data.remaining);
        if (result.data.retryAfter > 0) {
          const until = Date.now() + result.data.retryAfter * 1000;
          setRateLimitedUntil(until);
          localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(until));
        }
      }
    });
  }, []);

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
      // Track remaining from server response
      if ('hourlyRemaining' in result.data && typeof result.data.hourlyRemaining === 'number') {
        setHourlyRemaining(result.data.hourlyRemaining);
      }

      // Sticking animation duration
      setTimeout(() => {
        setIsSticking(false);
        setView('wall');
        wall.refresh();
      }, 800);
    } else {
      // Rate limit — use server-provided retryAfter
      if (!result.ok && result.code === 'LIMIT_REACHED') {
        const retryAfter = result.retryAfter || 3600;
        const until = Date.now() + retryAfter * 1000;
        setRateLimitedUntil(until);
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(until));
        setHourlyRemaining(0);
        setRateLimitModal({ retryAfter });
      }
      setView('wall');
      wall.refresh();
    }
  }, [roundId, playStickSound, wall]);

  const handleGoToTicket = useCallback(async () => {
    const result = await getRateLimit();
    if (result.ok) {
      setHourlyRemaining(result.data.remaining);
      if (result.data.retryAfter > 0) {
        const until = Date.now() + result.data.retryAfter * 1000;
        setRateLimitedUntil(until);
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(until));
        setRateLimitModal({ retryAfter: result.data.retryAfter });
        return;
      }
    }
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
        onShowMyTickets={() => setShowMyTickets(true)}
      />

      {view === 'ticket' && !isSticking && (
        <div className="app-ticket-view">
          <div className="app-ticket-info">
            {hourlyRemaining !== null
              ? `1시간에 최대 10장 (남은 횟수: ${hourlyRemaining}장)`
              : '1시간에 최대 10장까지 제출할 수 있습니다'}
          </div>
          <LottoWidget
            penSkin={DEFAULT_PEN}
            reducedAnimations={false}
            widgetMode="wall"
            onDraftComplete={async () => {}}
            onSubmitSuccess={handleSubmitSuccess}
            onWidgetClose={() => setView('wall')}
            onAiSubmit={() => setShowAiPrompt(true)}
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
          <HeatmapOverlay tickets={wall.tickets} />

          <WallView
            tickets={wall.tickets}
            isLoading={wall.isLoading}
            error={wall.error}
            hasMore={wall.hasMore}
            onLoadMore={wall.loadMore}
            onRetry={wall.refresh}
            onTicketClick={setSelectedTicket}
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
              roundId={roundId ?? ''}
            />
          )}

          <FloatingCTA
            onClick={handleGoToTicket}
            rateLimitedUntil={rateLimitedUntil}
            hourlyRemaining={hourlyRemaining}
            onShowMyTickets={() => setShowMyTickets(true)}
          />
        </>
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {rateLimitModal && (
        <div className="ticket-detail-overlay" onClick={() => setRateLimitModal(null)}>
          <div className="rate-limit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rate-limit-modal__icon">&#9203;</div>
            <div className="rate-limit-modal__title">작성 제한</div>
            <div className="rate-limit-modal__message">
              1시간에 최대 10장까지 제출할 수 있습니다.
              <br />
              <strong>{Math.ceil(rateLimitModal.retryAfter / 60)}분 후</strong>에 다시 작성할 수 있어요.
            </div>
            <button className="rate-limit-modal__button" onClick={() => setRateLimitModal(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      {showMyTickets && roundId && (
        <MyTicketsPanel
          roundId={roundId}
          onClose={() => setShowMyTickets(false)}
        />
      )}

      {showAiPrompt && roundId && (
        <AiPromptModal
          userId={getUserId()}
          roundId={roundId}
          onClose={() => setShowAiPrompt(false)}
        />
      )}
    </div>
  );
}
