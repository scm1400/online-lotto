import type { Ticket, Round, WinningVote } from '../../src/types/api';

// -- Init --
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  numbers TEXT NOT NULL,
  mode TEXT NOT NULL,
  pick_tag TEXT,
  user_id TEXT NOT NULL,
  rotation REAL NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_round ON tickets(round_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user_round ON tickets(user_id, round_id);

CREATE TABLE IF NOT EXISTS votes (
  vote_id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  numbers TEXT NOT NULL,
  bonus_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, round_id)
);
CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(round_id);

CREATE TABLE IF NOT EXISTS rounds (
  round_id TEXT PRIMARY KEY,
  draw_time TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'pre-draw',
  winning_numbers TEXT,
  bonus_number INTEGER,
  ticket_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  confirmed_at TEXT
);
`;

// -- Tickets --
export async function insertTicket(
  db: D1Database,
  ticket: Omit<Ticket, 'position'> & { positionX: number; positionY: number }
): Promise<void> {
  await db.prepare(`
    INSERT INTO tickets (ticket_id, round_id, numbers, mode, pick_tag, user_id, rotation, position_x, position_y, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ticket.ticketId,
    ticket.roundId,
    JSON.stringify(ticket.numbers),
    ticket.mode,
    ticket.pickTag || null,
    ticket.userId,
    ticket.rotation,
    ticket.positionX,
    ticket.positionY,
    ticket.createdAt
  ).run();
}

export async function getTicketsByRound(
  db: D1Database,
  roundId: string,
  page: number,
  limit: number
): Promise<{ tickets: Ticket[]; total: number }> {
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db.prepare(
      'SELECT * FROM tickets WHERE round_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(roundId, limit, offset).all(),
    db.prepare(
      'SELECT COUNT(*) as count FROM tickets WHERE round_id = ?'
    ).bind(roundId).first<{ count: number }>(),
  ]);

  const tickets: Ticket[] = (rows.results || []).map(rowToTicket);
  return { tickets, total: countResult?.count || 0 };
}

export async function getTicketCount(db: D1Database, roundId: string): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM tickets WHERE round_id = ?'
  ).bind(roundId).first<{ count: number }>();
  return result?.count || 0;
}

export async function getTicketById(db: D1Database, ticketId: string): Promise<Ticket | null> {
  const row = await db.prepare(
    'SELECT * FROM tickets WHERE ticket_id = ?'
  ).bind(ticketId).first();
  return row ? rowToTicket(row) : null;
}

export async function getUserTicketCount(db: D1Database, userId: string, roundId: string): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND round_id = ?'
  ).bind(userId, roundId).first<{ count: number }>();
  return result?.count || 0;
}

function rowToTicket(row: Record<string, unknown>): Ticket {
  return {
    ticketId: row.ticket_id as string,
    roundId: row.round_id as string,
    numbers: JSON.parse(row.numbers as string),
    mode: row.mode as Ticket['mode'],
    pickTag: row.pick_tag as Ticket['pickTag'],
    userId: row.user_id as string,
    rotation: row.rotation as number,
    position: { x: row.position_x as number, y: row.position_y as number },
    createdAt: row.created_at as string,
  };
}

// -- Votes --
export async function insertVote(
  db: D1Database,
  vote: Omit<WinningVote, 'voteId' | 'createdAt'> & { voteId: string; createdAt: string }
): Promise<void> {
  await db.prepare(`
    INSERT INTO votes (vote_id, round_id, numbers, bonus_number, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    vote.voteId,
    vote.roundId,
    JSON.stringify(vote.numbers),
    vote.bonusNumber,
    vote.userId,
    vote.createdAt
  ).run();
}

export async function checkVoteConfirmation(
  db: D1Database,
  roundId: string,
  threshold: number
): Promise<{ confirmed: boolean; numbers?: number[]; bonus?: number }> {
  const result = await db.prepare(`
    SELECT numbers, bonus_number, COUNT(*) as cnt
    FROM votes
    WHERE round_id = ?
    GROUP BY numbers, bonus_number
    HAVING cnt >= ?
    ORDER BY cnt DESC
    LIMIT 1
  `).bind(roundId, threshold).first<{ numbers: string; bonus_number: number; cnt: number }>();

  if (result) {
    return {
      confirmed: true,
      numbers: JSON.parse(result.numbers),
      bonus: result.bonus_number,
    };
  }
  return { confirmed: false };
}

export async function getVoteStatus(
  db: D1Database,
  roundId: string
): Promise<{
  voteCount: number;
  topVotes: Array<{ numbers: number[]; bonus: number; count: number }>;
}> {
  const [countResult, topResults] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM votes WHERE round_id = ?')
      .bind(roundId).first<{ count: number }>(),
    db.prepare(`
      SELECT numbers, bonus_number, COUNT(*) as cnt
      FROM votes WHERE round_id = ?
      GROUP BY numbers, bonus_number
      ORDER BY cnt DESC
      LIMIT 5
    `).bind(roundId).all(),
  ]);

  return {
    voteCount: countResult?.count || 0,
    topVotes: (topResults.results || []).map((r: Record<string, unknown>) => ({
      numbers: JSON.parse(r.numbers as string),
      bonus: r.bonus_number as number,
      count: r.cnt as number,
    })),
  };
}

export async function hasUserVoted(db: D1Database, userId: string, roundId: string): Promise<boolean> {
  const result = await db.prepare(
    'SELECT 1 FROM votes WHERE user_id = ? AND round_id = ? LIMIT 1'
  ).bind(userId, roundId).first();
  return !!result;
}

// -- Rounds --
export async function getOrCreateRound(
  db: D1Database,
  roundId: string,
  drawTime: string
): Promise<Round> {
  let round = await db.prepare(
    'SELECT * FROM rounds WHERE round_id = ?'
  ).bind(roundId).first();

  if (!round) {
    await db.prepare(`
      INSERT INTO rounds (round_id, draw_time, phase, ticket_count, vote_count)
      VALUES (?, ?, 'pre-draw', 0, 0)
    `).bind(roundId, drawTime).run();

    round = await db.prepare(
      'SELECT * FROM rounds WHERE round_id = ?'
    ).bind(roundId).first();
  }

  return rowToRound(round!);
}

export async function confirmRound(
  db: D1Database,
  roundId: string,
  winningNumbers: number[],
  bonusNumber: number
): Promise<void> {
  await db.prepare(`
    UPDATE rounds
    SET phase = 'confirmed', winning_numbers = ?, bonus_number = ?, confirmed_at = ?
    WHERE round_id = ?
  `).bind(
    JSON.stringify(winningNumbers),
    bonusNumber,
    new Date().toISOString(),
    roundId
  ).run();
}

export async function incrementTicketCount(db: D1Database, roundId: string): Promise<void> {
  await db.prepare(
    'UPDATE rounds SET ticket_count = ticket_count + 1 WHERE round_id = ?'
  ).bind(roundId).run();
}

export async function incrementVoteCount(db: D1Database, roundId: string): Promise<void> {
  await db.prepare(
    'UPDATE rounds SET vote_count = vote_count + 1 WHERE round_id = ?'
  ).bind(roundId).run();
}

function rowToRound(row: Record<string, unknown>): Round {
  return {
    roundId: row.round_id as string,
    drawTime: row.draw_time as string,
    phase: row.phase as Round['phase'],
    winningNumbers: row.winning_numbers ? JSON.parse(row.winning_numbers as string) : undefined,
    bonusNumber: row.bonus_number as number | undefined,
    ticketCount: row.ticket_count as number,
    voteCount: row.vote_count as number,
    confirmedAt: row.confirmed_at as string | undefined,
  };
}
