import { Hono } from 'hono';
import type { Env } from '../index';
import {
  insertVote,
  checkVoteConfirmation,
  getVoteStatus,
  hasUserVoted,
  confirmRound,
  incrementVoteCount,
  getOrCreateRound,
} from '../utils/db';
import { getCurrentRoundId, getDrawTimeForRound, isWithinVoteWindow } from '../utils/round';

const votesRouter = new Hono<{ Bindings: Env }>();

// POST /api/votes
votesRouter.post('/', async (c) => {
  const body = await c.req.json<{
    numbers: number[];
    bonusNumber: number;
    userId: string;
    roundId: string;
  }>();

  // Validate numbers
  if (!Array.isArray(body.numbers) || body.numbers.length !== 6) {
    return c.json({ ok: false, error: '6개의 당첨 번호를 입력해주세요' }, 400);
  }
  if (body.numbers.some((n) => n < 1 || n > 45 || !Number.isInteger(n))) {
    return c.json({ ok: false, error: '번호는 1~45 사이여야 합니다' }, 400);
  }
  if (new Set(body.numbers).size !== 6) {
    return c.json({ ok: false, error: '중복 번호는 허용되지 않습니다' }, 400);
  }
  if (body.bonusNumber < 1 || body.bonusNumber > 45 || !Number.isInteger(body.bonusNumber)) {
    return c.json({ ok: false, error: '보너스 번호는 1~45 사이여야 합니다' }, 400);
  }
  if (body.numbers.includes(body.bonusNumber)) {
    return c.json({ ok: false, error: '보너스 번호는 당첨 번호와 달라야 합니다' }, 400);
  }

  // Check vote window
  const startHour = parseInt(c.env.VOTE_WINDOW_START_HOUR);
  const startMinute = parseInt(c.env.VOTE_WINDOW_START_MINUTE);
  const endHour = parseInt(c.env.VOTE_WINDOW_END_HOUR);
  const endMinute = parseInt(c.env.VOTE_WINDOW_END_MINUTE);

  if (!isWithinVoteWindow(startHour, startMinute, endHour, endMinute)) {
    return c.json({ ok: false, error: '투표는 토요일 20:45~23:59에만 가능합니다', code: 'OUTSIDE_WINDOW' }, 403);
  }

  const roundId = body.roundId || getCurrentRoundId();

  // Ensure round exists
  const drawTime = getDrawTimeForRound(roundId);
  await getOrCreateRound(c.env.DB, roundId, drawTime);

  // Check duplicate vote
  const alreadyVoted = await hasUserVoted(c.env.DB, body.userId, roundId);
  if (alreadyVoted) {
    return c.json({ ok: false, error: '이미 이번 회차에 투표하셨습니다', code: 'ALREADY_VOTED' }, 409);
  }

  // Insert vote
  const voteId = crypto.randomUUID();
  await insertVote(c.env.DB, {
    voteId,
    roundId,
    numbers: body.numbers.sort((a, b) => a - b),
    bonusNumber: body.bonusNumber,
    userId: body.userId,
    createdAt: new Date().toISOString(),
  });
  await incrementVoteCount(c.env.DB, roundId);

  // Check for confirmation
  const threshold = parseInt(c.env.VOTE_THRESHOLD) || 10;
  const confirmation = await checkVoteConfirmation(c.env.DB, roundId, threshold);

  if (confirmation.confirmed && confirmation.numbers && confirmation.bonus !== undefined) {
    await confirmRound(c.env.DB, roundId, confirmation.numbers, confirmation.bonus);
  }

  return c.json({ ok: true, data: { success: true } }, 201);
});

// GET /api/votes?roundId=X
votesRouter.get('/', async (c) => {
  const roundId = c.req.query('roundId') || getCurrentRoundId();

  // Check if round is confirmed
  const drawTime = getDrawTimeForRound(roundId);
  const round = await getOrCreateRound(c.env.DB, roundId, drawTime);
  const voteStatus = await getVoteStatus(c.env.DB, roundId);

  return c.json({
    ok: true,
    data: {
      confirmed: round.phase === 'confirmed',
      winningNumbers: round.winningNumbers,
      bonusNumber: round.bonusNumber,
      voteCount: voteStatus.voteCount,
      topVotes: voteStatus.topVotes,
    },
  });
});

export { votesRouter };
