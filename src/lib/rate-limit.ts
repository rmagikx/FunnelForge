/**
 * Simple in-memory rate limiter.
 *
 * On Vercel (serverless), each cold start gets a fresh map, so this acts
 * as a best-effort guard per instance. For stricter enforcement at scale,
 * swap this out for a Redis-backed limiter (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a user has exceeded the allowed number of requests.
 *
 * @param userId  - Unique identifier for the user
 * @param limit   - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 1 hour)
 * @returns `{ allowed: boolean; remaining: number; resetAt: number }`
 */
export function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(userId) ?? { timestamps: [] };

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  entry.timestamps.push(now);
  store.set(userId, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

// Periodically clean up stale entries (every 5 minutes)
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours

  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < MAX_AGE
      );
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    });
  }, CLEANUP_INTERVAL).unref?.();
}
