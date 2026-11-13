/**
 * Reconnect timing for the device link.
 *
 * The link has two failure modes and they need different timing:
 *
 * - The link dropped while it worked. The broker answered a moment ago, so
 *   the retry starts fast and grows slowly.
 * - The broker never took the connection. The public broker rate limits a
 *   network that asks too often and answers with HTTP 429. This case waits
 *   much longer, so the app does not keep the limit alive.
 */

export interface BackoffPolicy {
  /** Delay of the first retry. */
  baseMs: number;
  /** Growth factor of every further retry. */
  factor: number;
  /** Longest delay between two retries. */
  maxMs: number;
}

/** A link that dropped while it was working. */
export const LINK_BACKOFF: BackoffPolicy = {
  baseMs: 2500,
  factor: 1.5,
  maxMs: 25000,
};

/** A broker that did not take the connection at all. */
export const BROKER_BACKOFF: BackoffPolicy = {
  baseMs: 15000,
  factor: 2,
  maxMs: 600000,
};

/** The wait before the next try, in milliseconds. */
export function backoffDelay(attempt: number, policy: BackoffPolicy): number {
  const safeAttempt = Math.max(0, attempt);
  const raw = policy.baseMs * Math.pow(policy.factor, safeAttempt);
  return Math.min(policy.maxMs, Math.round(raw));
}

/** The wait before the next try, picked by the kind of failure. */
export function reconnectDelay(attempt: number, brokerBlocked: boolean): number {
  return backoffDelay(attempt, brokerBlocked ? BROKER_BACKOFF : LINK_BACKOFF);
}
