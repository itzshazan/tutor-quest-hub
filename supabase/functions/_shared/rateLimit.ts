/**
 * Simple in-memory rate limiter for edge functions.
 * Uses a sliding window approach per identifier (user ID or IP).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  limit: number;       // Max requests per window
  windowMs: number;    // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Check if an identifier is rate limited.
 * Returns { limited: false } if allowed, { limited: true, retryAfter } if blocked.
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; retryAfter?: number } {
  const { limit, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    rateLimitStore.delete(identifier);
    entry = undefined;
  }

  if (!entry) {
    // First request in this window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { limited: false, remaining: limit - 1 };
  }

  // Check if over limit
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, remaining: 0, retryAfter };
  }

  // Increment count
  entry.count++;
  return { limited: false, remaining: limit - entry.count };
}

/**
 * Create a rate limit response for blocked requests.
 */
export function rateLimitResponse(retryAfter: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
