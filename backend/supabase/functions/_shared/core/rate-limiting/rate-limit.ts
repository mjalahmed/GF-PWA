import { RateLimitError } from "../errors/app-error.ts";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export interface RateLimiter {
  consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
}

/** In-memory only — not reliable across Edge Function instances. */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  async consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const fullKey = `${policy.keyPrefix}:${key}`;
    const now = Date.now();
    const current = this.buckets.get(fullKey);

    if (!current || current.resetAt <= now) {
      const resetAt = now + policy.windowMs;
      this.buckets.set(fullKey, { count: 1, resetAt });
      return { allowed: true, remaining: policy.limit - 1, resetAt };
    }

    if (current.count >= policy.limit) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    this.buckets.set(fullKey, current);
    return {
      allowed: true,
      remaining: policy.limit - current.count,
      resetAt: current.resetAt,
    };
  }
}

export const defaultRateLimiter: RateLimiter = new InMemoryRateLimiter();

export async function enforceRateLimit(
  key: string,
  policy: RateLimitPolicy,
  limiter: RateLimiter = defaultRateLimiter,
): Promise<void> {
  const result = await limiter.consume(key, policy);
  if (!result.allowed) throw new RateLimitError();
}
