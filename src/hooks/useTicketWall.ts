import { useState, useEffect, useCallback, useRef } from 'react';
import type { Ticket } from '../types/api';
import { getTickets, getTicketCount } from '../utils/api';

export function useTicketWall(roundId: string | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchTickets = useCallback(async (pageNum: number, append: boolean) => {
    if (!roundId) return;
    setIsLoading(true);
    setError(null);
    const result = await getTickets(roundId, pageNum, 50);
    if (result.ok) {
      setTickets((prev) => append ? [...prev, ...result.data.tickets] : result.data.tickets);
      setTotalCount(result.data.total);
      setHasMore(result.data.hasMore);
      setPage(pageNum);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [roundId]);

  // Initial load
  useEffect(() => {
    if (roundId) fetchTickets(1, false);
  }, [roundId, fetchTickets]);

  // Poll count every 30s
  useEffect(() => {
    if (!roundId) return;
    pollRef.current = setInterval(async () => {
      const result = await getTicketCount(roundId);
      if (result.ok) {
        setTotalCount(result.data.count);
      }
    }, 30000);
    return () => clearInterval(pollRef.current);
  }, [roundId]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTickets(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchTickets]);

  const refresh = useCallback(() => {
    fetchTickets(1, false);
  }, [fetchTickets]);

  return { tickets, totalCount, loadMore, isLoading, error, hasMore, refresh };
}
