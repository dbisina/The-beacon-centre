// backend/src/middleware/loginThrottle.ts
//
// Per-account lockout for the app's passcode sign-in.
//
// A member's passcode is 4-6 digits, so the whole space for a 4-digit one is
// 10,000 guesses. The only limit on POST /api/auth/login used to be the general
// API limiter (500 requests / 15 min per IP), which a single IP could use to walk
// most of that space for one account in a day, and a handful of IPs in an hour.
// Counting failures per *email* closes that regardless of how many IPs an
// attacker rotates through; the per-IP limiter in rateLimiter.ts covers the
// opposite shape (one passcode sprayed across many emails).
//
// In memory on purpose: the backend runs as a single Railway instance, and a
// restart clearing the counters is an acceptable trade for not needing a
// migration. If it ever scales out, move this to a shared store.
//
// Known trade-off: anyone who knows a member's email can lock that account for
// the window by failing on purpose. The window is short so that stays an
// annoyance, not a denial of service.

interface Entry {
  failures: number;
  /** When the current counting window started. */
  windowStart: number;
  /** Set once the limit is hit; sign-in is refused until then. */
  lockedUntil?: number;
}

export class FailureThrottle {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly lockMs: number = windowMs,
  ) {
    // Sweep expired entries so an attacker cycling through made-up emails
    // can't grow the map without bound. unref() keeps it from holding the
    // process open.
    setInterval(() => this.sweep(), Math.min(windowMs, 5 * 60 * 1000)).unref();
  }

  /** Seconds until the key may try again, or 0 if it isn't locked. */
  retryAfterSeconds(key: string, now = Date.now()): number {
    const entry = this.entries.get(key);
    if (!entry?.lockedUntil) return 0;
    if (entry.lockedUntil <= now) {
      this.entries.delete(key);
      return 0;
    }
    return Math.ceil((entry.lockedUntil - now) / 1000);
  }

  recordFailure(key: string, now = Date.now()): void {
    const entry = this.entries.get(key);
    if (!entry || now - entry.windowStart > this.windowMs) {
      this.entries.set(key, { failures: 1, windowStart: now });
      return;
    }
    entry.failures += 1;
    if (entry.failures >= this.maxFailures) {
      entry.lockedUntil = now + this.lockMs;
    }
  }

  /** A successful sign-in clears the slate for that account. */
  reset(key: string): void {
    this.entries.delete(key);
  }

  private sweep(now = Date.now()): void {
    for (const [key, entry] of this.entries) {
      const lockExpired = !entry.lockedUntil || entry.lockedUntil <= now;
      const windowExpired = now - entry.windowStart > this.windowMs;
      if (lockExpired && windowExpired) this.entries.delete(key);
    }
  }
}

/** Normalise the way the auth service does, so casing can't mint new keys. */
export const throttleKey = (email: string): string => email.trim().toLowerCase();

/**
 * 5 wrong passcodes within 15 minutes locks that email for 15 minutes.
 * Shared by the app's POST /api/auth/login and the public /delete-account page,
 * which accepts the same credentials and must not be a side door around this.
 */
export const passcodeThrottle = new FailureThrottle(5, 15 * 60 * 1000);
