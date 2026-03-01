import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useStatusStore } from '@/stores/statusStore';
import { useTakerAddress } from '@/hooks/useTakerAddress';
import { useZeroxService } from '@/services/zerox/useZeroxService';
import type { SwapQuoteEnvelope } from '@/services/zerox/types';
import { getErrorMessage } from '@/utils/errors';

/**
 * Controller hook for quote tab data loading and compare mode.
 */
export function useQuotesTabController() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const draft = useAppStore((state) => state.quotesDraft);
  const updateDraft = useAppStore((state) => state.updateQuotesDraft);
  const setQuoteSnapshot = useAppStore((state) => state.setQuoteSnapshot);
  const pushOutputLog = useAppStore((state) => state.pushOutputLog);
  const setInFlight = useStatusStore((state) => state.setApiRequestInFlight);
  const taker = useTakerAddress();
  const service = useZeroxService();

  const [quote, setQuote] = useState<SwapQuoteEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareCsv, setCompareCsv] = useState('0.1,1,5');
  const [compareRows, setCompareRows] = useState<SwapQuoteEnvelope[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [deltaPct, setDeltaPct] = useState(0);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState<number | null>(null);

  const fetchQuote = useCallback(
    async (amountOverride?: string) => {
      setInFlight(true);
      setIsLoadingQuote(true);
      setError(null);
      try {
        const response = await service.getSwapQuote({
          chainId,
          sellToken: draft.sellToken,
          buyToken: draft.buyToken,
          amount: amountOverride ?? draft.amount,
          slippagePct: Number(draft.slippagePct),
          taker,
          executable: false,
        });

        setQuote((previous) => {
          if (!previous) {
            setDeltaPct(0);
            return response;
          }

          const prevBuy = Number(previous.response.buyAmount);
          const nextBuy = Number(response.response.buyAmount);
          setDeltaPct(prevBuy > 0 ? ((nextBuy - prevBuy) / prevBuy) * 100 : 0);
          return response;
        });
        setQuoteFetchedAt(Date.now());

        setQuoteSnapshot({
          id: crypto.randomUUID(),
          mode: 'quotes',
          pairLabel: `${response.resolvedSellToken.symbol}/${response.resolvedBuyToken.symbol}`,
          route: response.response.route,
          buyAmount: response.response.buyAmount,
          sellAmount: response.response.sellAmount,
          buySymbol: response.resolvedBuyToken.symbol,
          sellSymbol: response.resolvedSellToken.symbol,
          timestamp: Date.now(),
        });

        pushOutputLog(
          'info',
          `QUOTE refreshed ${response.resolvedSellToken.symbol} -> ${response.resolvedBuyToken.symbol}`,
        );
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        pushOutputLog('error', `QUOTE failed: ${message}`);
      } finally {
        setInFlight(false);
        setIsLoadingQuote(false);
      }
    },
    [
      chainId,
      draft.amount,
      draft.buyToken,
      draft.sellToken,
      draft.slippagePct,
      pushOutputLog,
      service,
      setInFlight,
      setQuoteSnapshot,
      taker,
    ],
  );

  const runCompare = useCallback(async () => {
    setIsCompareLoading(true);
    const values = compareCsv
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const rows = await Promise.all(
      values.map(async (amount) => {
        try {
          return await service.getSwapQuote({
            chainId,
            sellToken: draft.sellToken,
            buyToken: draft.buyToken,
            amount,
            slippagePct: Number(draft.slippagePct),
            taker,
            executable: false,
          });
        } catch {
          return null;
        }
      }),
    );

    setCompareRows(rows.filter((row): row is SwapQuoteEnvelope => row !== null));
    setIsCompareLoading(false);
  }, [chainId, compareCsv, draft.buyToken, draft.sellToken, draft.slippagePct, service, taker]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchQuote();
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, fetchQuote]);

  const sourceSummary = useMemo(() => {
    if (!quote) {
      return '-';
    }

    return quote.response.route.fills.map((fill) => `${fill.source} (${fill.proportionBps}bps)`).join(' · ');
  }, [quote]);

  return {
    draft,
    quote,
    error,
    compareCsv,
    compareRows,
    autoRefresh,
    deltaPct,
    sourceSummary,
    isLoadingQuote,
    isCompareLoading,
    quoteFetchedAt,
    updateDraft,
    setCompareCsv,
    setAutoRefresh,
    fetchQuote,
    runCompare,
  };
}
