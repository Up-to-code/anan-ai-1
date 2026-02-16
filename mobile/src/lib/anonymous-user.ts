/**
 * Shared anonymous user ID for unauthenticated chat usage.
 * Single module-level id so list/create/thread screens use the same user.
 */

export const ANON_PREFIX = "anon-";

let anonUserId: string | null = null;

export function getOrCreateAnonUserId(): string {
  if (!anonUserId)
    anonUserId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return anonUserId;
}
