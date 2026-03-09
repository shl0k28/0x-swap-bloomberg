import { useCallback, useEffect, useState } from 'react';
import { getTokensForChain as getCuratedTokens } from '@/constants/tokens';
import type { TokenInfo } from '@/services/tokenListService';
import { fetchTokenListForChain, getCachedTokenListForChain } from '@/services/tokenListService';
import { logger } from '@/utils/logger';

interface UseTokenListResult {
  tokens: TokenInfo[];
  isLoading: boolean;
  search: (query: string) => TokenInfo[];
}

const MIN_EXPECTED_BY_CHAIN: Record<number, number> = {
  1: 500,
  137: 100,
  10: 80,
  42161: 100,
  8453: 80,
};

/**
 * Loads a chain-specific token list and refetches when chain changes.
 */
export function useTokenList(chainId: number): UseTokenListResult {
  const [tokens, setTokens] = useState<TokenInfo[]>(() => getCachedTokenListForChain(chainId) ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let disposed = false;

    setTokens([]);
    setIsLoading(true);

    void fetchTokenListForChain(chainId)
      .then((nextTokens) => {
        if (disposed) {
          return;
        }

        setTokens(nextTokens);
        setIsLoading(false);
        warnForSparseList(chainId, nextTokens.length);
      })
      .catch(() => {
        if (disposed) {
          return;
        }

        const fallback = getCuratedTokens(chainId).map((token) => ({
          chainId,
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          isNative: token.isNative,
        }));

        setTokens(fallback);
        setIsLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [chainId]);

  const search = useCallback(
    (query: string): TokenInfo[] => {
      const normalized = query.trim().toLowerCase();
      if (normalized.length === 0) {
        return tokens;
      }

      return tokens
        .filter((token) => {
          const symbol = token.symbol.toLowerCase();
          const name = token.name.toLowerCase();
          const address = token.address.toLowerCase();
          return (
            symbol.includes(normalized) ||
            name.includes(normalized) ||
            address.startsWith(normalized)
          );
        })
        .slice(0, 50);
    },
    [tokens],
  );

  return {
    tokens,
    isLoading,
    search,
  };
}

function warnForSparseList(chainId: number, count: number): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const threshold = MIN_EXPECTED_BY_CHAIN[chainId];
  if (!threshold) {
    return;
  }

  if (count >= threshold) {
    return;
  }

  logger.warn('token_list_sparse_for_chain', {
    chainId,
    count,
    threshold,
  });
}
