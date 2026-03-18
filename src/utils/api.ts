import type {
  ApiResult,
  Ticket,
  Round,
  TicketListResponse,
  VoteStatusResponse,
} from '../types/api';
import type { LottoDraft } from '../types/lotto';
import { getUserId } from './userId';

const API_BASE = '/api';

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText, code: data.code };
    }
    // Server returns { ok: true, data: T } — unwrap the nested data
    const body = data as { ok: boolean; data: T };
    return { ok: true, data: body.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// Tickets
export async function submitTicket(
  draft: LottoDraft,
  roundId: string
): Promise<ApiResult<Ticket>> {
  return apiFetch<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify({
      numbers: draft.numbers,
      mode: draft.mode,
      pickTag: draft.pickTag,
      userId: getUserId(),
      roundId,
    }),
  });
}

export async function getTickets(
  roundId: string,
  page = 1,
  limit = 50
): Promise<ApiResult<TicketListResponse>> {
  return apiFetch<TicketListResponse>(
    `/tickets?roundId=${roundId}&page=${page}&limit=${limit}`
  );
}

export async function getTicketCount(
  roundId: string
): Promise<ApiResult<{ count: number }>> {
  return apiFetch<{ count: number }>(`/tickets/count?roundId=${roundId}`);
}

export async function getTicketById(
  ticketId: string
): Promise<ApiResult<Ticket>> {
  return apiFetch<Ticket>(`/tickets/${ticketId}`);
}

// Votes
export async function submitVote(
  roundId: string,
  numbers: number[],
  bonusNumber: number
): Promise<ApiResult<{ success: boolean }>> {
  return apiFetch<{ success: boolean }>('/votes', {
    method: 'POST',
    body: JSON.stringify({
      numbers,
      bonusNumber,
      userId: getUserId(),
      roundId,
    }),
  });
}

export async function getVoteStatus(
  roundId: string
): Promise<ApiResult<VoteStatusResponse>> {
  return apiFetch<VoteStatusResponse>(`/votes?roundId=${roundId}`);
}

// Rounds
export async function getCurrentRound(): Promise<ApiResult<Round>> {
  return apiFetch<Round>('/round/current');
}
