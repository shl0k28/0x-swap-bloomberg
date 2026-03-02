import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTokensForChain as getCuratedTokens } from '@/constants/tokens';
import type { TokenInfo, TokenListCache } from '@/services/tokenListService';
import { fetchTokenList, getCachedTokenList, getTokensForChain } from '@/services/tokenListService';

interface UseTokenListResult {
  tokens: TokenInfo[];
  isLoading: boolean;
  search: (query: string) => TokenInfo[];
  cache: TokenListCache | null;
}

/**
 * Loads and filters token lists for the active chain with cached startup fallback.
 */
export function useTokenList(chainId: number): UseTokenListResult {
  const [cache, setCache] = useState<TokenListCache | null>(() => getCachedTokenList());
  const [isLoading, setIsLoading] = useState(() => cache === null);

  useEffect(() => {
    let disposed = false;

    void fetchTokenList()
      .then((nextCache) => {
        if (disposed) {
          return;
        }
        setCache(nextCache);
        setIsLoading(false);
      })
      .catch(() => {
        if (disposed) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, []);

  const tokens = useMemo(() => {
    if (!cache) {
      return getCuratedTokens(chainId).map((token) => ({
        chainId,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        isNative: token.isNative,
      }));
    }

    return getTokensForChain(cache, chainId);
  }, [cache, chainId]);

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
    cache,
  };
}
