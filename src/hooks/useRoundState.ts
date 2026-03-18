import { useState, useEffect, useCallback } from 'react';
import type { Round } from '../types/api';
import { getCurrentRound } from '../utils/api';

export function useRoundState() {
  const [round, setRound] = useState<Round | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRound = useCallback(async () => {
    const result = await getCurrentRound();
    if (result.ok) {
      setRound(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    fetchRound();
    const id = setInterval(fetchRound, 60000); // Poll every 60s
    return () => clearInterval(id);
  }, [fetchRound]);

  return {
    round,
    roundId: round?.roundId ?? null,
    phase: round?.phase ?? 'pre-draw',
    isPostDraw: round?.phase === 'post-draw',
    isConfirmed: round?.phase === 'confirmed',
    error,
    refetch: fetchRound,
  };
}
