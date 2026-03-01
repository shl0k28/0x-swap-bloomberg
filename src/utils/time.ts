/**
 * Returns short relative time text.
 */
export function toTimeAgo(timestamp: number): string {
  const delta = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}
