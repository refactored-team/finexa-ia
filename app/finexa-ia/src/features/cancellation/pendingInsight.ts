import type { CancellationInsightPayload } from '@/src/features/cancellation/mapInsightToFinding';

let pending: CancellationInsightPayload | null = null;
let frozen: CancellationInsightPayload | null = null;

export function setPendingCancellationInsight(payload: CancellationInsightPayload): void {
  frozen = null;
  pending = { ...payload };
}

/**
 * Returns the pending insight once per navigation (handles React Strict Mode double mount).
 */
export function consumePendingCancellationInsight(): CancellationInsightPayload | null {
  if (frozen) return frozen;
  const next = pending;
  pending = null;
  frozen = next ? { ...next } : null;
  return frozen;
}

/** Call when leaving cancelling-process so the next visit does not reuse a stale snapshot. */
export function clearCancellationSnapshot(): void {
  frozen = null;
}
