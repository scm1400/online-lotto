// Cache responses at the edge using Workers Cache API
const CACHE_NAME = 'lotto-api-cache';

export async function withCache<T>(
  request: Request,
  ttlSeconds: number,
  handler: () => Promise<Response>
): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = new Request(request.url, { method: 'GET' });

  // Try cache first
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // Execute handler
  const response = await handler();

  // Only cache successful responses
  if (response.ok) {
    const cloned = response.clone();
    const headers = new Headers(cloned.headers);
    headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);
    headers.set('X-Cache', 'MISS');

    const cachedResponse = new Response(cloned.body, {
      status: cloned.status,
      headers,
    });

    // Don't await — cache in background
    cache.put(cacheKey, cachedResponse);
  }

  return response;
}

export async function invalidateCache(urlPattern: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  for (const key of keys) {
    if (key.url.includes(urlPattern)) {
      await cache.delete(key);
    }
  }
}
