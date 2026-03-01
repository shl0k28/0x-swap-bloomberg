import type { ZeroExRoute } from '@/types/zeroex';

/**
 * Route node used for visual hop diagrams.
 */
export interface RouteNode {
  from: string;
  to: string;
  source: string;
  proportion: number;
}

/**
 * Converts 0x route fills into normalized route nodes for rendering.
 */
export function toRouteNodes(route: ZeroExRoute): RouteNode[] {
  return route.fills.map((fill) => ({
    from: fill.from,
    to: fill.to,
    source: fill.source,
    proportion: Number(fill.proportionBps) / 100,
  }));
}

/**
 * Derives unique token trail from route fills for compact visual summaries.
 */
export function buildRouteTrail(route: ZeroExRoute): string[] {
  const entries: string[] = [];

  for (const fill of route.fills) {
    if (!entries.includes(fill.from)) {
      entries.push(fill.from);
    }

    if (!entries.includes(fill.to)) {
      entries.push(fill.to);
    }
  }

  return entries;
}
