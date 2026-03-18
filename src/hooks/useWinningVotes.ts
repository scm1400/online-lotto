import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoteStatusResponse } from '../types/api';
import { submitVote as apiSubmitVote, getVoteStatus } from '../utils/api';

const VOTE_STORAGE_KEY = 'lotto-vote-';

export function useWinningVotes(roundId: string | null) {
  const [status, setStatus] = useState<VoteStatusResponse | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Check localStorage for existing vote
  useEffect(() => {
    if (roundId) {
      const voted = localStorage.getItem(`${VOTE_STORAGE_KEY}${roundId}`);
      setHasVoted(!!voted);
    }
  }, [roundId]);

  // Poll vote status
  const fetchStatus = useCallback(async () => {
    if (!roundId) return;
    const result = await getVoteStatus(roundId);
    if (result.ok) {
      setStatus(result.data);
    }
  }, [roundId]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  const submitVote = useCallback(async (numbers: number[], bonusNumber: number) => {
    if (!roundId) return;
    setIsSubmitting(true);
    setError(null);
    const result = await apiSubmitVote(roundId, numbers, bonusNumber);
    if (result.ok) {
      localStorage.setItem(`${VOTE_STORAGE_KEY}${roundId}`, JSON.stringify({ numbers, bonusNumber }));
      setHasVoted(true);
      await fetchStatus(); // Refresh status after vote
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  }, [roundId, fetchStatus]);

  return {
    isConfirmed: status?.confirmed ?? false,
    winningNumbers: status?.winningNumbers,
    bonusNumber: status?.bonusNumber,
    voteCount: status?.voteCount ?? 0,
    topVotes: status?.topVotes ?? [],
    hasVoted,
    error,
    isSubmitting,
    submitVote,
  };
}
