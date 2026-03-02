import { useEffect } from 'react';
import { PYTH_PRICE_FEEDS, type PythSymbol } from '@/constants/pythFeeds';
import { usePriceStore } from '@/store/priceStore';

const HERMES_WS_URL = 'wss://hermes.pyth.network/ws';
const MAX_RETRIES = 5;

interface PriceSample {
  id: string;
  price: number;
}

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let retryCount = 0;
let activeConsumers = 0;
let manualDisconnect = false;
let currentFeedIds: string[] = [];
const flashTimers = new Map<PythSymbol, number>();

const FEED_TO_SYMBOL = Object.entries(PYTH_PRICE_FEEDS).reduce<Record<string, PythSymbol>>(
  (accumulator, [symbol, feedId]) => {
    accumulator[normalizeFeedId(feedId)] = symbol as PythSymbol;
    return accumulator;
  },
  {},
);

/**
 * Singleton Pyth websocket driver for all price consumers.
 */
export function usePythPrices(enabled = true, chainId?: number) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    activeConsumers += 1;
    const nextIds = getSubscriptionIds(chainId);
    if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
      ensureConnected(nextIds);
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        shutdownConnection();
        return;
      }

      ensureConnected(getSubscriptionIds(chainId));
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      activeConsumers = Math.max(0, activeConsumers - 1);
      if (activeConsumers === 0) {
        shutdownConnection();
      }
    };
  }, [enabled, chainId]);
}

function ensureConnected(feedIds: string[]): void {
  currentFeedIds = feedIds;
  if (activeConsumers === 0) {
    return;
  }

  if (socket?.readyState === WebSocket.OPEN) {
    sendSubscription(currentFeedIds);
    return;
  }

  if (socket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  manualDisconnect = false;
  usePriceStore.getState().setConnectionStatus('connecting');
  socket = new WebSocket(HERMES_WS_URL);

  socket.addEventListener('open', () => {
    retryCount = 0;
    usePriceStore.getState().setConnectionStatus('online');
    sendSubscription(currentFeedIds);
  });

  socket.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') {
      return;
    }

    const payload = parsePayload(event.data);
    if (!payload) {
      return;
    }

    const samples = collectSamples(payload);
    for (const sample of samples) {
      const symbol = FEED_TO_SYMBOL[normalizeFeedId(sample.id)];
      if (!symbol) {
        continue;
      }

      const previousPrice = usePriceStore.getState().prices[symbol]?.price ?? sample.price;
      const delta = previousPrice > 0 ? ((sample.price - previousPrice) / previousPrice) * 100 : 0;
      const updatedAt = Date.now();
      usePriceStore.getState().setPrice(symbol, {
        price: sample.price,
        delta,
        updatedAt,
        flash: true,
      });

      const timer = flashTimers.get(symbol);
      if (timer) {
        window.clearTimeout(timer);
      }

      const nextTimer = window.setTimeout(() => {
        const current = usePriceStore.getState().prices[symbol];
        if (current && current.updatedAt === updatedAt) {
          usePriceStore.getState().setPrice(symbol, { ...current, flash: false });
        }
      }, 600);
      flashTimers.set(symbol, nextTimer);
    }
  });

  socket.addEventListener('error', () => {
    usePriceStore.getState().setConnectionStatus('error');
  });

  socket.addEventListener('close', () => {
    socket = null;
    if (manualDisconnect || activeConsumers === 0) {
      return;
    }

    retryCount += 1;
    if (retryCount > MAX_RETRIES) {
      usePriceStore.getState().setConnectionStatus('error');
      return;
    }

    usePriceStore.getState().setConnectionStatus('connecting');
    const delayMs = Math.min(3_000 * 2 ** (retryCount - 1), 30_000);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      ensureConnected(currentFeedIds);
    }, delayMs);
  });
}

function sendSubscription(feedIds: string[]): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: 'subscribe',
      ids: feedIds,
    }),
  );
}

function getSubscriptionIds(chainId?: number): string[] {
  const ids: string[] = [
    PYTH_PRICE_FEEDS.ETH,
    PYTH_PRICE_FEEDS.BTC,
    PYTH_PRICE_FEEDS.SOL,
    PYTH_PRICE_FEEDS.USDT,
  ];

  if (chainId === 137) {
    ids.push(PYTH_PRICE_FEEDS.POL);
  }

  return ids;
}

function shutdownConnection(): void {
  manualDisconnect = true;
  usePriceStore.getState().setConnectionStatus('idle');
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}

function parsePayload(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function collectSamples(payload: unknown): PriceSample[] {
  const samples: PriceSample[] = [];

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const value of node) {
        walk(value);
      }
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    const candidate = extractPriceSample(node as Record<string, unknown>);
    if (candidate) {
      samples.push(candidate);
    }

    for (const value of Object.values(node)) {
      walk(value);
    }
  };

  walk(payload);
  return dedupeByFeed(samples);
}

function extractPriceSample(candidate: Record<string, unknown>): PriceSample | null {
  const idValue = candidate['id'];
  const priceValue = candidate['price'];
  if (typeof idValue !== 'string' || !priceValue || typeof priceValue !== 'object') {
    return null;
  }

  const raw = (priceValue as Record<string, unknown>)['price'];
  const expo = (priceValue as Record<string, unknown>)['expo'];
  const rawPrice = toNumeric(raw);
  const exponent = toNumeric(expo);
  if (rawPrice === null || exponent === null) {
    return null;
  }

  const normalized = rawPrice * 10 ** exponent;
  if (!Number.isFinite(normalized)) {
    return null;
  }

  return {
    id: idValue,
    price: normalized,
  };
}

function toNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function dedupeByFeed(samples: PriceSample[]): PriceSample[] {
  const byId = new Map<string, PriceSample>();
  for (const sample of samples) {
    byId.set(normalizeFeedId(sample.id), sample);
  }
  return Array.from(byId.values());
}

function normalizeFeedId(feedId: string): string {
  return feedId.toLowerCase().replace(/^0x/, '');
}
