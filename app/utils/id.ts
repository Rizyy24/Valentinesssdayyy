/**
 * Generates a unique identifier using crypto.randomUUID() if available,
 * otherwise falls back to a timestamp-based ID.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
