/**
 * Simple in-memory rate limiting using time windows
 * For production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request exceeds rate limit
 * @param identifier - IP address or user ID
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60000 // 1 minute default
): boolean {
  if (!identifier) return false;

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  // Exceeded limit
  return false;
}

/**
 * Increment counter without checking (helper)
 */
export function incrementRateLimit(identifier: string, windowMs: number = 60000): number {
  if (!identifier) return 0;

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return 1;
  }

  entry.count++;
  return entry.count;
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(identifier: string) {
  const entry = rateLimitStore.get(identifier);
  if (!entry) return { remaining: -1, resetTime: null };

  const now = Date.now();
  if (now > entry.resetTime) {
    return { remaining: -1, resetTime: null };
  }

  return {
    remaining: entry.count,
    resetTime: new Date(entry.resetTime),
    secondsUntilReset: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Reset specific identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      entriesToDelete.push(key);
    }
  });

  entriesToDelete.forEach(key => rateLimitStore.delete(key));
}

// Run cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
