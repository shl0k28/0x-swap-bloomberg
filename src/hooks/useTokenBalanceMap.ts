import { useEffect, useState } from 'react';
import { formatUnits, isAddress, parseAbi, type Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { getTokensForChain, NATIVE_TOKEN_SENTINEL } from '@/constants/tokens';

const erc20Abi = parseAbi(['function balanceOf(address owner) view returns (uint256)']);

/**
 * Balance map keyed by token symbol.
 */
export type TokenBalanceMap = Record<string, string>;

/**
 * Fetches wallet balances for curated tokens on selected chain.
 */
export function useTokenBalanceMap(chainId: number, address?: Address): TokenBalanceMap {
  const publicClient = usePublicClient({ chainId });
  const [balanceMap, setBalanceMap] = useState<TokenBalanceMap>({});

  useEffect(() => {
    let disposed = false;

    const fetchBalances = async () => {
      if (!address || !publicClient) {
        setBalanceMap({});
        return;
      }

      const tokens = getTokensForChain(chainId);
      const next: TokenBalanceMap = {};

      await Promise.all(
        tokens.map(async (token) => {
          try {
            if (token.address === NATIVE_TOKEN_SENTINEL) {
              const native = await publicClient.getBalance({ address });
              next[token.symbol] = Number(formatUnits(native, token.decimals)).toFixed(6);
              return;
            }

            if (!isAddress(token.address)) {
              return;
            }

            const raw = await publicClient.readContract({
              address: token.address,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address],
            });
            next[token.symbol] = Number(formatUnits(raw, token.decimals)).toFixed(6);
          } catch {
            next[token.symbol] = '0.000000';
          }
        }),
      );

      if (!disposed) {
        setBalanceMap(next);
      }
    };

    void fetchBalances();
  }, [address, chainId, publicClient]);

  return balanceMap;
}
