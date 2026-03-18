import { Hono } from 'hono';
import type { Env } from '../index';
import { insertTicket, getTicketsByRound, getTicketCount, getTicketById, getUserTicketCount, incrementTicketCount } from '../utils/db';
import { getCurrentRoundId, getDrawTimeForRound } from '../utils/round';
import { getOrCreateRound } from '../utils/db';

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

  // Check user ticket limit
  const maxTickets = parseInt(c.env.MAX_TICKETS_PER_USER) || 5;
  const userCount = await getUserTicketCount(c.env.DB, body.userId, roundId);
  if (userCount >= maxTickets) {
    return c.json({ ok: false, error: `회차당 최대 ${maxTickets}장까지 제출할 수 있습니다`, code: 'LIMIT_REACHED' }, 429);
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

  return c.json({
    ok: true,
    data: {
      ...ticket,
      position: { x: ticket.positionX, y: ticket.positionY },
    },
  }, 201);
});

// GET /api/tickets?roundId=X&page=1&limit=50
ticketsRouter.get('/', async (c) => {
  const roundId = c.req.query('roundId') || getCurrentRoundId();
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  const { tickets, total } = await getTicketsByRound(c.env.DB, roundId, page, limit);

  return c.json({
    ok: true,
    data: {
      tickets,
      total,
      page,
      hasMore: page * limit < total,
    },
  });
});

// GET /api/tickets/count?roundId=X
ticketsRouter.get('/count', async (c) => {
  const roundId = c.req.query('roundId') || getCurrentRoundId();
  const count = await getTicketCount(c.env.DB, roundId);
  return c.json({ ok: true, data: { count } });
});

// GET /api/tickets/:ticketId
ticketsRouter.get('/:ticketId', async (c) => {
  const ticketId = c.req.param('ticketId');
  const ticket = await getTicketById(c.env.DB, ticketId);

  if (!ticket) {
    return c.json({ ok: false, error: '용지를 찾을 수 없습니다' }, 404);
  }

  return c.json({ ok: true, data: ticket });
});

export { ticketsRouter };
