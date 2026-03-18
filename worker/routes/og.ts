import { Hono } from 'hono';
import type { Env } from '../index';
import { getTicketById } from '../utils/db';

const ogRouter = new Hono<{ Bindings: Env }>();

ogRouter.get('/:ticketId', async (c) => {
  const ticketId = c.req.param('ticketId');

  // Check R2 cache
  const cached = await c.env.OG_IMAGES.get(ticketId);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=604800',
      },
    });
  }

  const ticket = await getTicketById(c.env.DB, ticketId);
  if (!ticket) {
    return c.json({ ok: false, error: 'Ticket not found' }, 404);
  }

  const svg = generateOGImage(ticket.numbers, ticket.roundId, ticket.pickTag);
  const svgBuffer = new TextEncoder().encode(svg);

  await c.env.OG_IMAGES.put(ticketId, svgBuffer, {
    httpMetadata: { contentType: 'image/svg+xml' },
  });

  return new Response(svgBuffer, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=604800',
    },
  });
});

function generateOGImage(numbers: number[], roundId: string, pickTag?: string): string {
  const ballColors = ['#ff6b6b', '#ff922b', '#ffd43b', '#51cf66', '#339af0', '#cc5de8'];

  const balls = numbers.map((n, i) => {
    const cx = 240 + i * 120;
    const cy = 315;
    const color = ballColors[i % ballColors.length];
    return `
      <circle cx="${cx}" cy="${cy}" r="44" fill="${color}" />
      <circle cx="${cx}" cy="${cy}" r="44" fill="url(#ballGrad)" opacity="0.3" />
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="700" fill="white"
        stroke="rgba(0,0,0,0.15)" stroke-width="0.5">${n}</text>
    `;
  }).join('');

  const tag = pickTag ? `<text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#999">#${pickTag}</text>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#faf8f5"/>
      <stop offset="100%" style="stop-color:#f0ebe5"/>
    </linearGradient>
    <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e8696b"/>
      <stop offset="100%" style="stop-color:#dc5557"/>
    </linearGradient>
    <radialGradient id="ballGrad" cx="35%" cy="35%" r="60%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.4)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0)"/>
    </radialGradient>
    <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.1)"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Card -->
  <rect x="80" y="60" width="1040" height="510" rx="16" fill="white" filter="url(#shadow)"/>

  <!-- Header bar -->
  <rect x="80" y="60" width="1040" height="64" rx="16" fill="url(#header)"/>
  <rect x="80" y="100" width="1040" height="24" fill="url(#header)"/>

  <!-- Header text -->
  <rect x="80" y="60" width="64" height="64" rx="16" fill="white"/>
  <rect x="144" y="60" width="1" height="64" fill="rgba(0,0,0,0)"/>
  <text x="112" y="98" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#d44">A</text>
  <text x="600" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="white">온라인로또방</text>

  <!-- Round info -->
  <text x="600" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999">${roundId}</text>

  <!-- Decorative brackets -->
  ${numbers.map((_, i) => {
    const cx = 240 + i * 120;
    return `
      <rect x="${cx - 38}" y="${265}" width="76" height="2" rx="1" fill="#d9686a" opacity="0.3"/>
      <rect x="${cx - 38}" y="${365}" width="76" height="2" rx="1" fill="#d9686a" opacity="0.3"/>
    `;
  }).join('')}

  <!-- Number balls -->
  ${balls}

  <!-- Pick tag -->
  ${tag}

  <!-- CTA -->
  <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#aaa">나도 해보기 →</text>

  <!-- Bottom accent line -->
  <rect x="80" y="554" width="1040" height="16" rx="0" fill="url(#header)" opacity="0.1"/>
</svg>`;
}

export { ogRouter };
