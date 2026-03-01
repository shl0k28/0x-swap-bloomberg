import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTakerAddress } from '@/hooks/useTakerAddress';
import { useZeroxService } from '@/services/zerox/useZeroxService';
import type { TickerRow } from '@/services/zerox/types';

const fallbackRows: TickerRow[] = [
  { symbol: 'ETH', quoteSymbol: 'USDC', price: 0, changePct: 0, isStale: true },
  { symbol: 'BTC', quoteSymbol: 'USDC', price: 0, changePct: 0, isStale: true },
  { symbol: 'SOL', quoteSymbol: 'USDC', price: 0, changePct: 0, isStale: true },
  { symbol: 'USDT', quoteSymbol: 'USDC', price: 0, changePct: 0, isStale: true },
];

/**
 * Polls ticker quotes every 30s and computes deltas while preserving last known values.
 */
export function useTickerRows() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const taker = useTakerAddress();
  const service = useZeroxService();
  const previousMapRef = useRef<Record<string, number>>({});
  const [rows, setRows] = useState<TickerRow[]>(fallbackRows);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const poll = async () => {
      try {
        const freshRows = await service.getTickerRows(chainId, taker);
        if (disposed) {
          return;
        }

        setRows((previousRows) => {
          const previousBySymbol = Object.fromEntries(
            previousRows.map((row) => [row.symbol, row]),
          ) as Record<string, TickerRow>;

          return fallbackRows.map((fallback) => {
            const fresh = freshRows.find((row) => row.symbol === fallback.symbol);
            const source = fresh ?? previousBySymbol[fallback.symbol] ?? fallback;
            const key = `${source.symbol}-${source.quoteSymbol}`;
            const previousPrice = previousMapRef.current[key] ?? source.price;
            const shouldUsePrevious = source.isStale || source.price === 0;
            const nextPrice = shouldUsePrevious ? previousPrice : source.price;
            const changePct =
              previousPrice > 0 && nextPrice > 0
                ? ((nextPrice - previousPrice) / previousPrice) * 100
                : 0;
            previousMapRef.current[key] = nextPrice;

            return {
              ...source,
              price: nextPrice,
              changePct,
              isStale: source.isStale,
            };
          });
        });
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 30_000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [chainId, service, taker]);

  return {
    rows,
    loading,
  };
}
