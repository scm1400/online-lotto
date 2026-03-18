import { Hono } from 'hono';
import type { Env } from '../index';
import { getOrCreateRound } from '../utils/db';
import { getCurrentRoundId, getDrawTimeForRound, getCurrentPhase } from '../utils/round';
import { withCache } from '../utils/cache';

const roundsRouter = new Hono<{ Bindings: Env }>();

// GET /api/round/current
roundsRouter.get('/current', async (c) => {
  return withCache(c.req.raw, 30, async () => {
    const roundId = getCurrentRoundId();
    const drawTime = getDrawTimeForRound(roundId);
    const round = await getOrCreateRound(c.env.DB, roundId, drawTime);

    // Update phase based on current time
    const phase = getCurrentPhase(drawTime, round.phase === 'confirmed');

    return new Response(JSON.stringify({
      ok: true,
      data: {
        ...round,
        phase,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

export { roundsRouter };
