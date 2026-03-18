import type { SelectionMode, PickTag } from './lotto';

export interface Ticket {
  ticketId: string;
  numbers: number[];       // 6 numbers, ascending
  mode: SelectionMode;
  pickTag?: PickTag;
  userId: string;
  roundId: string;
  rotation: number;        // -5.0 to 5.0 degrees
  position: { x: number; y: number }; // 0.0 to 1.0 percentage
  createdAt: string;       // ISO 8601
}

export interface WinningVote {
  voteId: string;
  numbers: number[];       // 6 numbers
  bonusNumber: number;
  userId: string;
  roundId: string;
  createdAt: string;
}

export type RoundPhase = 'pre-draw' | 'post-draw' | 'confirmed';

export interface Round {
  roundId: string;
  drawTime: string;        // ISO 8601
  phase: RoundPhase;
  winningNumbers?: number[];
  bonusNumber?: number;
  ticketCount: number;
  voteCount: number;
  confirmedAt?: string;
}

export type WinRank = 1 | 2 | 3 | 4 | 5 | null;

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface VoteStatusResponse {
  confirmed: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
  voteCount: number;
  topVotes: Array<{ numbers: number[]; bonus: number; count: number }>;
}
