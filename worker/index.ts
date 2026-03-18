import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ticketsRouter } from './routes/tickets';
import { votesRouter } from './routes/votes';
import { roundsRouter } from './routes/rounds';
import { ogRouter } from './routes/og';

export interface Env {
  DB: D1Database;
  OG_IMAGES: R2Bucket;
  ASSETS: Fetcher;
  VOTE_THRESHOLD: string;
  VOTE_WINDOW_START_HOUR: string;
  VOTE_WINDOW_START_MINUTE: string;
  VOTE_WINDOW_END_HOUR: string;
  VOTE_WINDOW_END_MINUTE: string;
  MAX_TICKETS_PER_USER: string;
  CORS_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/api/*', cors({
  origin: (origin, c) => c.env.CORS_ORIGIN === '*' ? origin : c.env.CORS_ORIGIN,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// API routes
app.route('/api/tickets', ticketsRouter);
app.route('/api/votes', votesRouter);
app.route('/api/round', roundsRouter);
app.route('/api/og', ogRouter);

// HTML requests: inject OG tags for shared ticket URLs
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const ticketId = url.searchParams.get('ticket');

  // Fetch the base HTML from assets
  const assetResponse = await c.env.ASSETS.fetch(
    new Request(new URL('/index.html', url.origin))
  );

  if (!ticketId) {
    return assetResponse;
  }

  // Inject dynamic OG tags for shared ticket URLs
  let html = await assetResponse.text();
  const ogImageUrl = `${url.origin}/api/og/${ticketId}`;

  // Replace default OG tags with dynamic ones
  html = html.replace(
    /<meta property="og:image"[^>]*>/,
    `<meta property="og:image" content="${ogImageUrl}">`
  );
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="온라인로또방 — 나의 로또 번호">`
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="이번 주 로또 번호를 확인해보세요!">`
  );

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});

// Scheduled event handler for low-participation voting fallback
// Runs Sunday 03:00 UTC (= Sunday 12:00 KST)
async function handleScheduled(event: ScheduledEvent, env: Env) {
  const { getCurrentRoundId, getDrawTimeForRound } = await import('./utils/round');
  const { getOrCreateRound, checkVoteConfirmation, confirmRound } = await import('./utils/db');

  const roundId = getCurrentRoundId();
  const drawTime = getDrawTimeForRound(roundId);
  const round = await getOrCreateRound(env.DB, roundId, drawTime);

  if (round.phase === 'confirmed') return; // Already confirmed

  // Try with lower threshold (3) for low participation
  const result = await checkVoteConfirmation(env.DB, roundId, 3);
  if (result.confirmed && result.numbers && result.bonus !== undefined) {
    await confirmRound(env.DB, roundId, result.numbers, result.bonus);
  }
  // If still not confirmed, the round stays as 'post-draw' (unconfirmed)
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
