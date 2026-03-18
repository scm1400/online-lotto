import { Hono } from 'hono';
import type { Env } from '../index';
import { insertTicket, getTicketsByRound, getTicketCount, getTicketById, getTicketsByUserId, getUserHourlyTicketCount, incrementTicketCount } from '../utils/db';
import { getCurrentRoundId, getDrawTimeForRound } from '../utils/round';
import { getOrCreateRound } from '../utils/db';
import { withCache, invalidateCache } from '../utils/cache';

const ticketsRouter = new Hono<{ Bindings: Env }>();

// POST /api/tickets
ticketsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    numbers: number[];
    mode: string;
    pickTag?: string;
    userId: string;
    roundId: string;
  }>();

  // Validate numbers
  if (!Array.isArray(body.numbers) || body.numbers.length !== 6) {
    return c.json({ ok: false, error: '6개의 번호를 선택해주세요' }, 400);
  }
  const uniqueNums = new Set(body.numbers);
  if (uniqueNums.size !== 6) {
    return c.json({ ok: false, error: '중복 번호는 허용되지 않습니다' }, 400);
  }
  if (body.numbers.some((n) => n < 1 || n > 45 || !Number.isInteger(n))) {
    return c.json({ ok: false, error: '번호는 1~45 사이여야 합니다' }, 400);
  }

  // Ensure round exists
  const roundId = body.roundId || getCurrentRoundId();
  const drawTime = getDrawTimeForRound(roundId);
  await getOrCreateRound(c.env.DB, roundId, drawTime);

  // Check hourly ticket limit (10 per hour, no per-round limit)
  const maxPerHour = 10;
  const { count: hourlyCount, oldestInWindow } = await getUserHourlyTicketCount(c.env.DB, body.userId);
  if (hourlyCount >= maxPerHour) {
    const retryAfter = oldestInWindow
      ? Math.ceil((new Date(oldestInWindow).getTime() + 60 * 60 * 1000 - Date.now()) / 1000)
      : 3600;
    return c.json({
      ok: false,
      error: `1시간에 최대 ${maxPerHour}장까지 제출할 수 있습니다`,
      code: 'LIMIT_REACHED',
      retryAfter,
      hourlyUsed: hourlyCount,
      hourlyMax: maxPerHour,
    }, 429);
  }

  const ticketId = crypto.randomUUID();
  const ticket = {
    ticketId,
    roundId,
    numbers: body.numbers.sort((a, b) => a - b),
    mode: body.mode,
    pickTag: body.pickTag,
    userId: body.userId,
    rotation: (Math.random() - 0.5) * 10, // -5 to 5 degrees
    positionX: Math.random(),
    positionY: Math.random(),
    createdAt: new Date().toISOString(),
  };

  await insertTicket(c.env.DB, ticket);
  await incrementTicketCount(c.env.DB, roundId);
  await invalidateCache('/api/tickets');

  return c.json({
    ok: true,
    data: {
      ...ticket,
      position: { x: ticket.positionX, y: ticket.positionY },
      hourlyRemaining: maxPerHour - hourlyCount - 1,
    },
  }, 201);
});

// GET /api/tickets?roundId=X&page=1&limit=50
ticketsRouter.get('/', async (c) => {
  return withCache(c.req.raw, 10, async () => {
    const roundId = c.req.query('roundId') || getCurrentRoundId();
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    const { tickets, total } = await getTicketsByRound(c.env.DB, roundId, page, limit);

    return new Response(JSON.stringify({
      ok: true,
      data: { tickets, total, page, hasMore: page * limit < total },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

// GET /api/tickets/count?roundId=X
ticketsRouter.get('/count', async (c) => {
  return withCache(c.req.raw, 10, async () => {
    const roundId = c.req.query('roundId') || getCurrentRoundId();
    const count = await getTicketCount(c.env.DB, roundId);
    return new Response(JSON.stringify({ ok: true, data: { count } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

// GET /api/tickets/rate-limit?userId=X
ticketsRouter.get('/rate-limit', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ ok: false, error: 'userId is required' }, 400);
  }

  const maxPerHour = 10;
  const { count: hourlyCount, oldestInWindow } = await getUserHourlyTicketCount(c.env.DB, userId);
  const remaining = Math.max(0, maxPerHour - hourlyCount);

  let retryAfter = 0;
  if (hourlyCount >= maxPerHour && oldestInWindow) {
    retryAfter = Math.ceil((new Date(oldestInWindow).getTime() + 60 * 60 * 1000 - Date.now()) / 1000);
    retryAfter = Math.max(0, retryAfter);
  }

  return c.json({
    ok: true,
    data: { hourlyUsed: hourlyCount, hourlyMax: maxPerHour, remaining, retryAfter },
  });
});

// GET /api/tickets/mine?userId=X&roundId=X
ticketsRouter.get('/mine', async (c) => {
  const userId = c.req.query('userId');
  const roundId = c.req.query('roundId') || getCurrentRoundId();
  if (!userId) {
    return c.json({ ok: false, error: 'userId is required' }, 400);
  }
  const tickets = await getTicketsByUserId(c.env.DB, userId, roundId);
  return c.json({ ok: true, data: { tickets } });
});

// GET /api/tickets/:ticketId
ticketsRouter.get('/:ticketId', async (c) => {
  return withCache(c.req.raw, 3600, async () => {
    const ticketId = c.req.param('ticketId');
    const ticket = await getTicketById(c.env.DB, ticketId);

    if (!ticket) {
      return new Response(JSON.stringify({ ok: false, error: '용지를 찾을 수 없습니다' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data: ticket }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

export { ticketsRouter };
